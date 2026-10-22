# ShieldGuard Mobile Security — Project Description & Technical Specification

## 1. Executive Summary

**ShieldGuard** is a production-oriented Android mobile security application and threat defense suite designed to protect end-users against mobile threat vectors without violating the foundational security invariants of the Android operating system. 

Mobile malware on Android has evolved from crude root exploits into sophisticated social-engineering payloads: banking trojans employing accessibility service abuse and transparent window overlays, sideloaded fake KYC applications mimicking government and financial institutions, deceptive double-extension files hiding executable bytecode behind innocuous document icons, and UPI payment traps tricking users into entering UPI PINs to "claim refunds".

ShieldGuard addresses these real-world threats by combining:
1. **On-device package and permission auditing** respecting Android 11+ `<queries>` package visibility rules.
2. **Deterministic file signature verification** and cryptographic SHA-256 computation via the Android Storage Access Framework (SAF).
3. **Deep-link heuristics** analyzing UPI payment payloads and phishing URLs before dispatch.
4. **Device security hygiene audits** measuring firmware patch levels, keyguard readiness, and overlay attack surfaces.
5. **A hardened Python FastAPI backend** with SSRF protection, threat intelligence feeds, and cybercrime reporting.

---

## 2. Core Architectural Philosophy & Sandbox Compliance

Unlike outdated antivirus tools on desktop platforms, **Android applications run inside isolated Linux UIDs with SELinux enforcing mandatory access controls (MAC)**. An ordinary third-party Android application:
- Cannot inspect the private memory (`/proc/<pid>/mem`) or heap of other applications.
- Cannot read other applications' private internal storage (`/data/data/<package_name>/`).
- Cannot terminate arbitrary background processes of other applications without device administrator or root privileges.

**ShieldGuard embraces these platform realities:**
- It never promises impossible "full-memory live virus scanning" of other applications.
- It never fabricates simulated progress animations or pseudo-technical percentages.
- It evaluates publicly declared manifests, cryptographic signing certificates, installation sources (`getInstallSourceInfo()`), accessible system settings, and user-provided inputs (URLs, payment payloads, and files).
- Unavailable checks are explicitly reported as **`Unable to Verify`** or **`Not Supported by Android Platform Sandbox`**.

---

## 3. Detailed Component Architecture

### A. Mobile Client Architecture (Kotlin / Jetpack Compose)
- **MVVM Pattern**: Separation of UI layer (Jetpack Compose Composables), Presentation State (`StateFlow` and Compose `State`), and Data Layer (Repositories & Room DAOs).
- **Coroutines & Asynchronous Flows**: All cryptographic operations, database queries, and network lookups are dispatched on `Dispatchers.IO` or `Dispatchers.Default` to prevent frame drops.
- **Room SQLite Local Database**: Scans and incident reports are stored locally in encrypted Room SQLite storage (`ScanHistoryEntity`, `FraudReportEntity`).
- **Storage Access Framework (SAF)**: Inspects files solely via user-consented content URIs (`android.intent.action.OPEN_DOCUMENT` and `ACTION_SEND`), guaranteeing zero arbitrary wide storage access.

### B. Threat Intelligence & Backend Architecture (FastAPI + PostgreSQL)
- **FastAPI Async Engine**: High-throughput REST API with Pydantic request validation and automated OpenAPI specification.
- **SSRF Defense Firewall (`security.py`)**: Resolves target hostnames and drops requests targeting RFC 1918 private IPv4 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), link-local (`169.254.0.0/16`), and cloud metadata services (`169.254.169.254`).
- **PostgreSQL Database**: Stores user fraud incident reports, threat hash caches, and rate-limiting audit logs.

---

## 4. Threat Detection Engines

### A. URL & Phishing Scanner
1. **IDN Homograph Deception**: Flags confusable Unicode characters (e.g. Cyrillic `р` in `xn--aypal-1qa.com`) that deceive human visual inspection.
2. **Brand Impersonation**: Identifies when a trusted brand name (e.g. `sbi`, `hdfc`, `paypal`) appears in a subdomain prefix of an attacker-controlled root domain.
3. **Direct Numeric IP Hosts**: Identifies URLs pointing directly to bare IP addresses, a hallmark of evasion in phishing campaigns.
4. **URL Shorteners**: Flags obfuscated redirects (`bit.ly`, `tinyurl.com`, `is.gd`) concealing final destinations.

### B. Payment & UPI Fraud Protection (`upi://pay`)
1. **URI Decomposition**: Extracts Payee Virtual Payment Address (`pa`), Payee Name (`pn`), Amount (`am`), Currency (`cu`), Transaction Note (`tn`), and Merchant Code (`mc`).
2. **Social-Engineering Triggers**: Scans notes and payee names for urgent fraud keywords (`cashback`, `refund`, `electricity bill`, `lottery`, `KYC update`).
3. **Collect Request Defenses**: Warns against zero-amount or unverified recipient links designed to prompt open-ended authorization.
4. **Educational Advisory**: Enforces the golden rule before continuing to an external payment app: **Entering a UPI PIN always deducts funds; receiving money never requires a PIN.**

### C. File & Double-Extension Analyzer
1. **Cryptographic SHA-256 Digest**: Computes SHA-256 on the local client using WebCrypto / Java `MessageDigest`.
2. **Double Extension Masquerade**: Detects executable payloads disguised with decoy document extensions (e.g., `invoice.pdf.apk`, `statement.docx.exe`, `receipt.png.vbs`).
3. **Magic Byte Signature Validation**: Reads raw file headers to verify binary identity:
   - `50 4B 03 04` $\to$ ZIP / Android APK Archive
   - `4D 5A` $\to$ Windows PE Executable
   - `7F 45 4C 46` $\to$ Linux / Android Native ELF
   - `25 50 44 46` $\to$ Adobe Portable Document Format (PDF)

### D. Installed App Security Scanner
1. **Package Visibility Compliance**: Declares specific `<queries>` for browser and payment intents instead of requesting the dangerous `QUERY_ALL_PACKAGES` permission.
2. **Installation Source Auditing**: Detects packages sideloaded via web browsers or file managers (`getInstallSourceInfo()`).
3. **Dangerous Permission Clusters**:
   - Banking Trojan Signature: `READ_SMS` / `RECEIVE_SMS` + `SYSTEM_ALERT_WINDOW`.
   - Spyware Signature: `RECORD_AUDIO` + `CAMERA` + `ACCESS_FINE_LOCATION` + `RECEIVE_BOOT_COMPLETED`.
   - Deceptive Adware: Fake cleaners requesting `SYSTEM_ALERT_WINDOW` and battery optimization bypass.
4. **Signing Certificate Fingerprints**: Computes SHA-256 certificate fingerprints, clearly distinguishing developer signatures from easily spoofed application display names.

### E. Device Security Audit
1. **Security Patch Level**: Compares device patch dates against current Google Android Security Bulletins.
2. **Keyguard & Biometrics**: Evaluates Hardware Keystore / StrongBox availability.
3. **Special App Access**: Checks `REQUEST_INSTALL_PACKAGES`, Accessibility Services, and `SYSTEM_ALERT_WINDOW` grants.
4. **Google Play Integrity**: Evaluates cryptographic hardware attestation verdicts.

### F. Cybercrime Fraud Reporting
1. **Official Indian Cybercrime Resources**: Integrated referral to the National Cybercrime Reporting Portal (`https://cybercrime.gov.in`) and the Toll-Free Helpline **1930** (Citizen Financial Cyber Fraud Reporting System).
2. **Privacy Protection**: Generates local reference tracking IDs (`SG-2026-REPORT-XXXX`) with explicit user consent before submitting technical telemetry.

---

## 5. Complete Guide: How to Download and Run on Mobile Devices

Users have five distinct methods to run ShieldGuard on physical mobile hardware:

### Method 1: Instant PWA Direct Install (No Computer Required)
1. Open Google Chrome on your Android mobile device.
2. Navigate to the deployed URL:
   `https://ais-pre-jijqizwtibmkhstceckylj-319163783336.asia-southeast1.run.app`
3. Tap Chrome's **three dots menu (`⋮`)** in the top right.
4. Select **"Install app"** or **"Add to Home screen"**.
5. Launch ShieldGuard from your mobile app drawer. It operates as a full-screen standalone application with offline support and local WebCrypto SHA-256 analysis.

### Method 2: Running on Mobile from a Cloned GitHub Repository (Local Wi-Fi)
1. Clone the project onto your development computer:
   ```bash
   git clone <repo-url>
   cd shieldguard
   npm install
   npm run dev
   ```
2. Vite starts with `--host 0.0.0.0` and displays your local network address in the terminal:
   ```text
   ➜  Network: http://192.168.1.45:3000/
   ```
3. Ensure your mobile phone and computer are on the **same Wi-Fi router**.
4. On your computer, open `http://localhost:3000` $\to$ click **"Run on Phone"** $\to$ enter `http://192.168.1.45:3000`.
5. Point your mobile phone camera at the screen to scan the QR code and tap **"Install app"**.

### Method 3: Mobile Testing via Free Tunnel (Cellular 4G/5G)
If your phone is on cellular data rather than local Wi-Fi:
```bash
npx localtunnel --port 3000
```
Paste the generated public URL into the QR Code modal on your computer and scan it with any phone anywhere in the world.

### Method 4: Compiling the Native Android Debug APK (`.apk`) via Android Studio
1. Launch **Android Studio** $\to$ select **Open** $\to$ choose the `android` folder.
2. Enable **USB Debugging** on your phone (**Settings $\to$ About Phone $\to$ tap Build Number 7 times $\to$ Settings $\to$ Developer Options $\to$ USB Debugging**).
3. Connect your phone via USB cable.
4. Open the Android Studio terminal and run:
   ```bash
   ./gradlew assembleDebug
   ```
5. Install the generated APK directly onto your device:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 5: Generating a Signed Release APK / AAB for App Stores
1. Create a production signing keystore:
   ```bash
   keytool -genkey -v -keystore shieldguard-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias shieldguard
   ```
2. Build the optimized release bundle:
   ```bash
   ./gradlew bundleRelease    # Produces Play Store .aab bundle
   ./gradlew assembleRelease  # Produces release .apk
   ```

---

## 6. Forward Compatibility: Android 16 & Android 17 Specifications

ShieldGuard was designed to ensure seamless operation on future Android releases:

1. **16KB Memory Page Size Alignment (Android 16)**: Android 16 requires all native code to support 16KB memory page alignment. ShieldGuard is implemented in **100% pure Kotlin/JVM** and utilizes standard AndroidX libraries, eliminating the risk of native crashes on 16KB kernels.
2. **Private Space Isolation (Android 15+)**: ShieldGuard adheres to Google Play package visibility rules using explicit `<queries>` intent filters, gracefully respecting Private Space isolation without throwing exceptions.
3. **Mandatory Edge-to-Edge Rendering**: Implemented using Jetpack Compose Material 3 and `enableEdgeToEdge()`, ensuring UI elements automatically adapt to system insets, gesture navigation bars, display cutouts, and folding screens.
4. **Storage Access Framework Exclusivity**: ShieldGuard completely avoids deprecated legacy storage permissions, strictly using SAF document pickers and share targets.
5. **Defensive Overlay Handling (Android 17)**: Android 17 tightens background launch and overlay rules. ShieldGuard avoids intrusive overlay dispatch; instead, its security engine flags third-party applications abusing overlay rights.

---

## 7. Security and Privacy Review Checklist (OWASP MASVS Aligned)

- **Least Privilege**: ShieldGuard does not request `QUERY_ALL_PACKAGES` or legacy wide external storage permissions.
- **Zero Private Data Snooping**: It never attempts to read private app databases or SMS of unrelated apps, honoring Linux UID isolation.
- **Payment Safety**: ShieldGuard never collects, prompts for, or logs UPI PINs, OTPs, CVVs, or bank credentials.
- **Privacy-First Threat Intel**: No user documents or personal files are uploaded to backend servers without explicit, informed consent.
- **SSRF Defense**: The backend firewall drops requests directed at RFC 1918 private IP ranges and cloud metadata endpoints.
- **Honest Detection**: Every threat report contains tangible technical evidence and actionable remediation advice.
