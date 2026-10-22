# ShieldGuard Mobile Security 🛡️
> Production-Oriented Android Mobile Security Architecture & Cyber Threat Defense Suite

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Android](https://img.shields.io/badge/Android-10%20to%2017+-3DDC84?logo=android&logoColor=white)](https://developer.android.com)
[![Jetpack Compose](https://img.shields.io/badge/UI-Jetpack%20Compose%20M3-4285F4?logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20PostgreSQL-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![OWASP MASVS](https://img.shields.io/badge/Security-OWASP%20MASVS%20Aligned-FF6F00)](https://mas.owasp.org)

ShieldGuard is an evidence-based mobile security suite engineered to detect potentially malicious applications, intrusive adware, phishing URLs, UPI/payment scams, disguised executable downloads, and unsafe Android device configurations. 

ShieldGuard operates **strictly within official Android platform security boundaries**, providing transparent risk assessments without claiming impossible cross-app memory or internal storage snooping.

---

## 📱 How to Download and Run ShieldGuard on Your Mobile Phone

You can run ShieldGuard on your mobile phone using **five different methods**, depending on whether you want instant browser-based execution, local network testing from a cloned repository, or a compiled native Android `.apk`.

---

### Method 1: Instant Direct Install (No Computer or Build Tools Required)
*Recommended for quick testing in under 10 seconds.*

ShieldGuard is built with standalone Progressive Web App (PWA) capabilities. It runs locally on your phone with offline support, client-side WebCrypto SHA-256 calculation, and heuristic link scanning.

1. **Open the live application on your mobile phone:**
   - Scan the QR code displayed in the app header, or open this URL directly in **Google Chrome on your Android phone**:
     ```text
     https://ais-pre-jijqizwtibmkhstceckylj-319163783336.asia-southeast1.run.app
     ```
2. **Install to Home Screen:**
   - In Chrome, tap the **three dots menu (`⋮`)** in the top-right corner.
   - Tap **"Install app"** (or **"Add to Home screen"**).
3. **Launch:**
   - An app icon will appear in your Android app drawer. When launched, ShieldGuard opens in full-screen standalone mode without any browser URL bars.

---

### Method 2: Running on Mobile from a Cloned GitHub Repository (Local Wi-Fi)
*Use this if you downloaded or cloned the project files from GitHub as a different user.*

1. **Clone and start the project on your computer:**
   ```bash
   git clone <your-github-repo-url>
   cd shieldguard
   npm install
   npm run dev
   ```
2. **Note your Local Network IP:**
   Vite is pre-configured with `--host 0.0.0.0`. When the server starts, it prints your local Wi-Fi address in the terminal:
   ```text
   VITE v8.3.0  ready in 250 ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.45:3000/   <--- (Your Wi-Fi IP address)
   ```
3. **Connect your phone:**
   - Ensure your mobile phone is connected to the **same Wi-Fi router** as your computer.
   - In your computer's browser, open `http://localhost:3000` and click the **"Run on Phone"** button.
   - In the QR modal, enter your local address (`http://192.168.1.45:3000`). The QR code updates automatically.
   - Scan the QR code with your phone camera, tap the three dots in Chrome, and select **"Install app"**.

---

### Method 3: Testing on Mobile Over Cellular Data (4G/5G) via Free Tunnel
*Use this if your phone is not on the same Wi-Fi router as your computer.*

Expose your local development port to a secure temporary public URL using `localtunnel` or Cloudflare:

```bash
# Option A: localtunnel (zero setup)
npx localtunnel --port 3000

# Option B: Cloudflare Quick Tunnel
npx cloudflared tunnel --url http://localhost:3000
```

1. Copy the generated HTTPS URL (e.g., `https://shieldguard-demo.loca.lt`).
2. Open the URL in Google Chrome on your phone or paste it into the app's QR code modal to scan.
3. Tap **"Install app"** to install.

---

### Method 4: Compiling the Native Android Debug APK (`.apk`) via Android Studio
*Use this to build the native Kotlin Jetpack Compose Android application binary.*

#### Prerequisites
- [Android Studio Hedgehog / Iguana / Jellyfish (2024+)](https://developer.android.com/studio)
- JDK 17+
- Android SDK 34 (Android 14) and Android Build Tools

#### Compilation Steps
1. **Open the Project in Android Studio:**
   - Launch Android Studio $\to$ click **Open** $\to$ select the `android` project folder.
   - Allow Gradle to sync dependencies (`Jetpack Compose BOM`, `Room KSP`, `Coroutines`, `OkHttp`).
2. **Enable USB Debugging on Your Android Phone:**
   - On your phone: Go to **Settings $\to$ About Phone $\to$ tap "Build Number" 7 times** to enable Developer Options.
   - Go to **Settings $\to$ System $\to$ Developer Options $\to$ turn ON "USB Debugging"**.
   - Plug your phone into your computer via a USB cable (or pair via Wireless Debugging).
3. **Compile the APK:**
   In the Android Studio terminal or system command prompt:
   ```bash
   # Linux / macOS:
   ./gradlew assembleDebug

   # Windows:
   gradlew.bat assembleDebug
   ```
4. **Locate the Output APK:**
   The compiled debug APK is generated at:
   ```text
   app/build/outputs/apk/debug/app-debug.apk
   ```
5. **Install on Your Phone via ADB:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```
   *(Or copy `app-debug.apk` directly to your phone storage and tap to install).*

---

### Method 5: Generating a Signed Release APK / AAB for Distribution
*Use this to generate an optimized, obfuscated APK or Play Store App Bundle (`.aab`).*

1. **Generate a Keystore:**
   ```bash
   keytool -genkey -v -keystore shieldguard-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias shieldguard
   ```
2. **Build the Release Bundle / APK:**
   ```bash
   ./gradlew bundleRelease    # Produces .aab for Google Play Store
   ./gradlew assembleRelease  # Produces standalone release .apk
   ```
   R8 code shrinking and ProGuard obfuscation rules in `proguard-rules.pro` will automatically strip unused code, inline functions, and protect security scanning algorithms.

---

## ⚡ Android 16 & Android 17 Forward Compatibility

ShieldGuard has been architected from the ground up to comply with **Android 16 (API 36 / Baklava)** and **Android 17**:

| OS Feature | Platform Security Rule | ShieldGuard Architecture Compliance |
| :--- | :--- | :--- |
| **16KB Memory Page Sizes** | Android 16 requires native binaries to support 16KB memory page alignment. Legacy unaligned C/C++ `.so` libraries crash on boot. | **100% Pure Kotlin / AndroidX JVM**: ShieldGuard avoids unaligned C/C++ shared objects, ensuring zero native segmentation faults on 16KB kernels (Pixel 8/9/10+). |
| **Private Space Profile Isolation** | Android 15/16 introduces Private Spaces where hidden apps run in an isolated user profile. Traditional `PackageManager` package dumps throw exceptions. | **Targeted `<queries>` declarations**: Complies with Google Play policy by declaring explicit browser (`https`) and payment (`upi`) intent filters instead of illegal system-wide package scraping. |
| **Mandatory Edge-to-Edge** | Android 15+ deprecates legacy system window insets, enforcing full edge-to-edge drawing across cutouts, gesture bars, and foldables. | **Jetpack Compose Material 3 with `enableEdgeToEdge()`**: Native insets handling prevents UI clipping across curved screens and foldables. |
| **Strict Storage Access & Photo Picker** | Legacy wide storage permissions (`READ_EXTERNAL_STORAGE`) are completely blocked. | **Storage Access Framework (SAF)**: Inspects files solely via user-authorized content URIs (`android.intent.action.OPEN_DOCUMENT` and `ACTION_SEND`). |
| **Overlay & Tapjacking Tightening (Android 17)** | Android 17 introduces mandatory system-rendered indicators and background launch limits for apps requesting `SYSTEM_ALERT_WINDOW`. | **Defensive Architecture**: ShieldGuard does not render persistent intrusive overlays; instead, its engine detects and flags other apps that abuse overlay permissions. |

---

## 🔒 Security Capabilities & Architecture

### 1. Main Security Dashboard & Device Posture
- Evidence-based risk indicators: `Safe`, `Suspicious`, `High Risk`, and `Unable to Verify`.
- Every finding includes a timestamp, tangible technical evidence, and concrete remediation steps.
- Staged security scan pipeline: Package enumeration $\to$ Signing certificate verification $\to$ Dangerous permission analysis $\to$ System keyguard & overlay check.

### 2. Installed App Security Scanner
- Audits installation sources via `getInstallSourceInfo()` to detect sideloaded APKs distributed via browsers versus official Google Play packages.
- Flags dangerous permission combinations:
  - **Banking Trojan Pattern**: `READ_SMS` / `RECEIVE_SMS` + `SYSTEM_ALERT_WINDOW` overlay.
  - **Surveillance Spyware Pattern**: `RECORD_AUDIO` + `CAMERA` + `ACCESS_FINE_LOCATION` + `RECEIVE_BOOT_COMPLETED`.
  - **Aggressive Adware**: Misleading device "cleaner" or "booster" utilities that request battery optimization bypass and overlay rights.
- Computes SHA-256 signing certificate fingerprints to distinguish developer signatures from easily spoofed application display names.
- Dispatches intents directly to Android System App Info (`android.settings.APPLICATION_DETAILS_SETTINGS`) for user-controlled permission revocation or uninstallation.

### 3. URL & Phishing Scanner
- **IDN Homograph Deception Detection**: Detects confusable Unicode homoglyphs (e.g. Cyrillic `р` in `xn--aypal-1qa.com`) that deceive human eyes.
- **Brand Spoofing Subdomain Filter**: Identifies deceptive subdomains mimicking banks and institutions (e.g., `sbi.co.in.kyc-verification-gateway.net`).
- **Direct IP Hosts & URL Shorteners**: Flags raw numerical IP hosts and URL shorteners (`bit.ly`, `tinyurl.com`, `is.gd`) concealing final destinations.
- **Android Sharesheet Receiver**: Receives text and links directly from WhatsApp, SMS, or mobile browsers via `android.intent.action.SEND`.

### 4. Payment & UPI Fraud Protection (`upi://pay`)
- Parses payment scheme, payee identifier (`pa`), payee name (`pn`), merchant code (`mc`), amount (`am`), and transaction note (`tn`).
- Flags urgent social-engineering keywords (`"cashback"`, `"electricity bill pending"`, `"refund"`, `"KYC update"`).
- Warns against zero-amount collect request authorization traps.
- Displays a mandatory warning modal before dispatching to an external payment app, reiterating the **Golden UPI Rule**: *Entering your UPI PIN always deducts money; a PIN is never required to receive money.*
- **Zero Credential Capture**: Never collects, prompts for, or logs UPI PINs, OTPs, CVVs, or passwords.

### 5. Download & File Scanner (Storage Access Framework)
- Real-time client-side cryptographic SHA-256 computation via WebCrypto / Java `MessageDigest`.
- Detects dangerous double extensions masquerading as documents (e.g. `invoice.pdf.apk`, `salary.xlsx.vbs`, `photo.jpg.exe`).
- Binary magic byte inspection (ZIP/APK `50 4B 03 04`, PE Executable `4D 5A`, Linux ELF `7F 45 4C 46`, and PDF `%PDF-`).
- Privacy-first design: Never uploads personal documents without explicit consent.

### 6. Device Security Audit
- Evaluates Android OS patch freshness against monthly Google Android Security Bulletins.
- Keyguard & Biometric hardware Keystore / StrongBox attestation.
- Audits `REQUEST_INSTALL_PACKAGES` (sideloading gates), active Accessibility services (keylogging risk), and `SYSTEM_ALERT_WINDOW` overlays (tapjacking risk).
- Google Play Integrity hardware attestation with honest `Unable to Verify` reporting when offline.

### 7. Cybercrime Fraud Reporting
- Integrates direct references to the Indian National Cybercrime Reporting Portal (`cybercrime.gov.in`) and the National Cybercrime Helpline **1930** (Citizen Financial Cyber Fraud Reporting System).
- Local incident persistence in Room SQLite and backend synchronization with PostgreSQL.

---

## 🛠️ Technology Stack

```text
├── Mobile Client (Android)
│   ├── Language: Kotlin 1.9+
│   ├── UI Framework: Jetpack Compose (Material 3)
│   ├── Architecture: MVVM + Repository Pattern + Kotlin Coroutines & Flow
│   ├── Local Database: Room SQLite Database with KSP
│   ├── Cryptography: AndroidX Security Crypto & Biometrics
│   ├── Networking: OkHttp 4 + Retrofit 2 (TLS 1.3 & Certificate Pinning)
│   └── Min SDK: Android 10+ (API 29); Target SDK: Android 14+ (API 34/35/36)
│
├── Web Simulation & Inspection Console
│   ├── Framework: React 19 + TypeScript + Vite
│   ├── Styling: Tailwind CSS
│   └── Cryptography: Browser WebCrypto SubtleCrypto (SHA-256)
│
└── Backend Threat Intelligence Service
    ├── Framework: Python 3.11+ FastAPI (Async)
    ├── Database: PostgreSQL with asyncpg & SQLAlchemy 2.0
    ├── Migrations: Alembic
    ├── Security: SSRF DNS Firewall (RFC 1918 & Cloud Metadata Blocker)
    └── Rate Limiting: SlowAPI (Token bucket algorithm)
```

---

## 💻 Backend Quickstart (FastAPI + PostgreSQL)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env

# 5. Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 📄 License

ShieldGuard is open-source software licensed under the **Apache License 2.0**.
