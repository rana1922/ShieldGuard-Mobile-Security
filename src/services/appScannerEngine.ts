/**
 * ShieldGuard Mobile Security - App Scanner & Package Visibility Engine
 * Complies with Android 11+ Package Visibility (<queries>) restrictions
 * @license Apache-2.0
 */

import { InstalledApp, RiskLevel } from '../types/security';

export const INITIAL_INSTALLED_APPS: InstalledApp[] = [
  {
    packageName: 'com.google.android.apps.nbu.paisa.user',
    appName: 'Google Pay',
    versionName: '185.1.3',
    versionCode: 1850103,
    targetSdk: 34,
    minSdk: 26,
    installSource: 'GOOGLE_PLAY',
    isSystemApp: false,
    isSideloaded: false,
    certificateFingerprint: 'SHA256:32:A2:3C:D2:E5:F8:71:09:90:BA:43:12:87:65:43:21:FE:DC:BA:98:76:54:32:10:AB:CD:EF:01:23:45:67:89',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.CAMERA'
    ],
    dangerousPermissions: ['android.permission.CAMERA'],
    adwareIndicators: [],
    riskScore: 5,
    riskLevel: 'SAFE',
    reason: 'Official release from Google LLC distributed through Google Play with verified Google release key.',
    verificationStatus: 'VERIFIED_DEVELOPER',
    iconType: 'payment'
  },
  {
    packageName: 'org.thoughtcrime.securesms',
    appName: 'Signal Private Messenger',
    versionName: '7.15.2',
    versionCode: 1250,
    targetSdk: 34,
    minSdk: 26,
    installSource: 'GOOGLE_PLAY',
    isSystemApp: false,
    isSideloaded: false,
    certificateFingerprint: 'SHA256:45:12:89:BC:DE:F0:23:45:67:89:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:01:23:45:67:89:AB:CD:EF:01',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_CONTACTS',
      'android.permission.POST_NOTIFICATIONS'
    ],
    dangerousPermissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_CONTACTS'
    ],
    adwareIndicators: [],
    riskScore: 8,
    riskLevel: 'SAFE',
    reason: 'Verified publisher Signal Foundation. Permissions are strictly functional for secure end-to-end messaging and encrypted calling.',
    verificationStatus: 'VERIFIED_DEVELOPER',
    iconType: 'chat'
  },
  {
    packageName: 'com.sbi.kyc.verification.urgent',
    appName: 'SBI Yono Quick KYC Update',
    versionName: '1.0.4',
    versionCode: 4,
    targetSdk: 29, // Outdated target SDK intentionally chosen to evade Android runtime permission gates
    minSdk: 21,
    installSource: 'SIDELOAD_BROWSER',
    isSystemApp: false,
    isSideloaded: true,
    certificateFingerprint: 'SHA256:FF:EE:DD:CC:BB:AA:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.REQUEST_INSTALL_PACKAGES'
    ],
    dangerousPermissions: [
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.SYSTEM_ALERT_WINDOW'
    ],
    adwareIndicators: ['Sideloaded APK claiming official banking identity without authentic state bank signing certificate.'],
    riskScore: 96,
    riskLevel: 'HIGH_RISK',
    reason: 'CRITICAL THREAT: Impersonates State Bank of India. Sideloaded via browser with self-signed certificate, targets outdated Android SDK 29, and requests SMS OTP interception and overlay permissions (Banking Trojan signature).',
    verificationStatus: 'POTENTIAL_IMPERSONATION',
    iconType: 'warning'
  },
  {
    packageName: 'com.torchlight.superbright.pro.ads',
    appName: 'Flashlight Ultra Bright HD',
    versionName: '4.2.1',
    versionCode: 42,
    targetSdk: 33,
    minSdk: 23,
    installSource: 'UNKNOWN',
    isSystemApp: false,
    isSideloaded: true,
    certificateFingerprint: 'SHA256:77:66:55:44:33:22:11:00:FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00:FF:EE:DD:CC:BB:AA:99:88',
    permissions: [
      'android.permission.CAMERA', // legitimate for flash hardware
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.POST_NOTIFICATIONS'
    ],
    dangerousPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.SYSTEM_ALERT_WINDOW'
    ],
    adwareIndicators: [
      'Aggressive full-screen interstitial ad dispatch on boot',
      'SYSTEM_ALERT_WINDOW overlay permission requested for a basic utility app',
      'Persistent background service registered to harvest location coordinates'
    ],
    riskScore: 78,
    riskLevel: 'HIGH_RISK',
    reason: 'INTRUSIVE ADWARE & PRIVACY RISK: A simple torch tool requests microphone recording, precise GPS tracking, and system overlay rights to display disruptive popup advertisements over other apps.',
    verificationStatus: 'UNKNOWN_DEVELOPER',
    iconType: 'utility'
  },
  {
    packageName: 'com.android.chrome',
    appName: 'Google Chrome',
    versionName: '128.0.6613.88',
    versionCode: 661308833,
    targetSdk: 34,
    minSdk: 26,
    installSource: 'GOOGLE_PLAY',
    isSystemApp: true,
    isSideloaded: false,
    certificateFingerprint: 'SHA256:38:91:8A:45:3D:07:19:93:54:F8:B1:9A:F0:5E:C3:7C:3D:B5:E8:4F:19:42:F2:70:E0:41:09:64:25:7A:48:9A',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.POST_NOTIFICATIONS'
    ],
    dangerousPermissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION'
    ],
    adwareIndicators: [],
    riskScore: 10,
    riskLevel: 'SAFE',
    reason: 'System-preinstalled trusted web browser from Google with valid platform certificate.',
    verificationStatus: 'VERIFIED_DEVELOPER',
    iconType: 'system'
  },
  {
    packageName: 'com.battery.booster.fastcleaner.free',
    appName: 'Battery Saver & Turbo RAM Cleaner',
    versionName: '2.1.0',
    versionCode: 21,
    targetSdk: 31,
    minSdk: 21,
    installSource: 'FILE_MANAGER',
    isSystemApp: false,
    isSideloaded: true,
    certificateFingerprint: 'SHA256:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.KILL_BACKGROUND_PROCESSES',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
    ],
    dangerousPermissions: ['android.permission.SYSTEM_ALERT_WINDOW'],
    adwareIndicators: [
      'Promotes deceptive system "cleaning" actions to generate ad impressions',
      'Requests battery optimization bypass to keep background adware alive'
    ],
    riskScore: 62,
    riskLevel: 'SUSPICIOUS',
    reason: 'DECEPTIVE ADWARE PATTERN: Utility relies on pseudo-technical optimization claims to display lockscreen ads and bypass modern Android Doze power management.',
    verificationStatus: 'UNKNOWN_DEVELOPER',
    iconType: 'utility'
  }
];

export function evaluateAppRisk(app: Partial<InstalledApp>): {
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // 1. Sideloading penalty
  if (app.isSideloaded) {
    score += 25;
    reasons.push('App was sideloaded outside the Google Play Store.');
  }

  // 2. Outdated Target SDK (often used to evade newer Android permission restrictions)
  if (app.targetSdk && app.targetSdk < 31) {
    score += 25;
    reasons.push(`Targets obsolete Android SDK ${app.targetSdk} (< 31), bypassing modern runtime permission and background execution restrictions.`);
  }

  // 3. Dangerous Permission Combinations
  const perms = new Set(app.permissions || []);
  
  // Banking Trojan combo: SMS + Overlay
  if ((perms.has('android.permission.READ_SMS') || perms.has('android.permission.RECEIVE_SMS')) &&
      perms.has('android.permission.SYSTEM_ALERT_WINDOW')) {
    score += 45;
    reasons.push('CRITICAL RISK: Combination of SMS read/receive with SYSTEM_ALERT_WINDOW allows transparent overlay phishing and OTP interception.');
  }

  // Spyware combo: Audio + Camera + Location + Boot completed
  if (perms.has('android.permission.RECORD_AUDIO') && 
      perms.has('android.permission.ACCESS_FINE_LOCATION') && 
      perms.has('android.permission.RECEIVE_BOOT_COMPLETED')) {
    score += 35;
    reasons.push('SURVEILLANCE RISK: App requests background audio recording, fine GPS location, and automatic launch at boot.');
  }

  // Adware combo: Overlay on simple utility
  if ((app.adwareIndicators && app.adwareIndicators.length > 0) || 
      (perms.has('android.permission.SYSTEM_ALERT_WINDOW') && app.appName?.toLowerCase().includes('cleaner'))) {
    score += 25;
    reasons.push('ADWARE RISK: Detected indicators of aggressive popups or misleading device optimization alerts.');
  }

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  let riskLevel: RiskLevel = 'SAFE';
  if (score >= 70) {
    riskLevel = 'HIGH_RISK';
  } else if (score >= 35) {
    riskLevel = 'SUSPICIOUS';
  }

  return { riskScore: score, riskLevel, reasons };
}
