/**
 * ShieldGuard Mobile Security - Documentation, Compatibility Matrix & Security Checklist
 * @license Apache-2.0
 */

export interface CompatibilityDoc {
  androidVersion: string;
  apiLevel: number;
  securityImpact: string;
  shieldGuardCompliance: string;
}

export const ANDROID_COMPATIBILITY_MATRIX: CompatibilityDoc[] = [
  {
    androidVersion: 'Android 10',
    apiLevel: 29,
    securityImpact: 'Scoped Storage introduced. App directories isolated.',
    shieldGuardCompliance: 'Uses Storage Access Framework (SAF) exclusively. Never requests dangerous legacy READ_EXTERNAL_STORAGE.'
  },
  {
    androidVersion: 'Android 11',
    apiLevel: 30,
    securityImpact: 'Package Visibility restrictions (<queries> tag required). Blocking arbitrary package listing.',
    shieldGuardCompliance: 'Complies with Google Play policy by using targeted <queries> for browsers, payment handlers, and share targets instead of high-risk QUERY_ALL_PACKAGES.'
  },
  {
    androidVersion: 'Android 12',
    apiLevel: 31,
    securityImpact: 'Notification trampolines blocked; exact alarm restrictions; component export safety.',
    shieldGuardCompliance: 'All activities and receivers declare explicit android:exported values; direct foreground alerts used.'
  },
  {
    androidVersion: 'Android 13',
    apiLevel: 33,
    securityImpact: 'POST_NOTIFICATIONS runtime permission required; Granular media permissions (READ_MEDIA_IMAGES).',
    shieldGuardCompliance: 'Requests POST_NOTIFICATIONS only when user activates live security alerts. Relies on SAF for single file inspections.'
  },
  {
    androidVersion: 'Android 14',
    apiLevel: 34,
    securityImpact: 'Enforced foreground service types; restricted screenshot detection; blocked installation of apps targeting SDK < 23.',
    shieldGuardCompliance: 'Declares appropriate foreground service type dataSync; alerts user if sideloaded APK targets obsolete SDK levels.'
  },
  {
    androidVersion: 'Android 15 (2025/2026)',
    apiLevel: 35,
    securityImpact: 'Private Space isolation; enhanced tapjacking protections; background activity launch tightening.',
    shieldGuardCompliance: 'Honors Private Space boundaries; verifies overlay indicators against SYSTEM_ALERT_WINDOW changes.'
  }
];

export const SECURITY_PRIVACY_CHECKLIST = [
  {
    category: 'Least-Privilege Android Permissions',
    rule: 'Never request QUERY_ALL_PACKAGES or legacy wide storage permissions.',
    status: 'COMPLIANT',
    detail: 'ShieldGuard uses targeted <queries> intent declarations and Android Storage Access Framework (SAF).'
  },
  {
    category: 'Zero Private Data Snooping',
    rule: 'Never attempt to read private app databases, SMS messages of unrelated apps, or keystrokes.',
    status: 'COMPLIANT',
    detail: 'ShieldGuard respects Linux UID / SELinux sandbox boundaries and never claims to scan other apps private internal storage.'
  },
  {
    category: 'Payment Safety Boundary',
    rule: 'Never collect, prompt for, or process UPI PINs, OTPs, CVVs, passwords, or netbanking credentials.',
    status: 'COMPLIANT',
    detail: 'ShieldGuard is an informational analysis filter; it explicitly educates the user that UPI PIN is never required to receive money.'
  },
  {
    category: 'Privacy-First Threat Intelligence',
    rule: 'Never upload user documents or files to backend servers without explicit, informed consent.',
    status: 'COMPLIANT',
    detail: 'Local WebCrypto/Java MessageDigest SHA-256 hash lookup is performed first; payload upload requires manual opt-in.'
  },
  {
    category: 'SSRF & Backend Hardening',
    rule: 'Prevent Server-Side Request Forgery against private IPs (RFC 1918) and cloud metadata services.',
    status: 'COMPLIANT',
    detail: 'FastAPI backend resolves DNS and drops requests targeting 127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, or 169.254.169.254.'
  },
  {
    category: 'Honest Threat Assessment',
    rule: 'Never invent fake virus detections or fabricate security scan percentages.',
    status: 'COMPLIANT',
    detail: 'Every finding contains tangible technical evidence, raw parsed payload, and actionable remediation instructions.'
  }
];

export const FEATURE_IMPLEMENTATION_MATRIX = [
  {
    feature: 'URL & Phishing Scanner',
    status: 'Fully Implemented',
    scope: 'Client & backend heuristic engine checking IDN homographs, deceptive subdomains, IP hosts, shorteners, and threat feeds.'
  },
  {
    feature: 'UPI & Payment Scam Analyzer',
    status: 'Fully Implemented',
    scope: 'Parses upi:// URI, extracts VPA, amount, notes, flags urgency/cashback/KYC keywords, and gives pre-dispatch safety warnings.'
  },
  {
    feature: 'File & Double-Extension Scanner',
    status: 'Fully Implemented',
    scope: 'Computes cryptographic SHA-256 in real time, verifies magic byte signatures, and detects disguised APK/executable masquerades.'
  },
  {
    feature: 'Device Security Audit',
    status: 'Fully Implemented',
    scope: 'Checks OS patch age, screen lock, unknown app installation permissions, accessibility abuse, overlay risks, and Play Integrity.'
  },
  {
    feature: 'Installed App Security Scanner',
    status: 'Fully Implemented',
    scope: 'Audits permissions combinations, identifies sideloaded installation sources, verifies certificate hashes, and flags adware.'
  },
  {
    feature: 'Cybercrime Fraud Reporting',
    status: 'Fully Implemented',
    scope: 'Structured reporting flow with local SQLite/Room record, backend sync, and direct links to Indian cybercrime helpline (1930) and portal.'
  },
  {
    feature: 'Live Full-OS RAM Inspection of Other Apps',
    status: 'Unavailable by Platform Design',
    scope: 'Android SELinux and Linux UID sandboxing strictly prevents third-party apps from reading other processes memory without rooting.'
  },
  {
    feature: 'Automatic Browser Download Sniffing',
    status: 'Partially Implemented (SAF / Share Target)',
    scope: 'Android Scoped Storage restricts background file monitoring. Supported via user-authorized file selection and Android Sharesheet.'
  }
];
