/**
 * ShieldGuard Mobile Security - Device Security Audit Engine
 * Evaluates device hygiene while respecting Android sandbox boundaries
 * @license Apache-2.0
 */

import { DeviceAuditItem, RiskLevel } from '../types/security';

export interface DeviceConfigState {
  osVersion: string;
  apiLevel: number;
  securityPatchDate: string; // e.g. "2026-09-01"
  isScreenLockEnabled: boolean;
  isBiometricEnrolled: boolean;
  hasUnknownSourceApps: boolean;
  activeAccessibilityServicesCount: number;
  appsWithOverlayPermissionCount: number;
  activeDeviceAdminAppsCount: number;
  playIntegrityVerdict: 'MEETS_DEVICE_INTEGRITY' | 'MEETS_BASIC_INTEGRITY' | 'FAILED_INTEGRITY' | 'UNABLE_TO_VERIFY';
  isUsbDebuggingEnabled: boolean;
}

export const DEFAULT_DEVICE_STATE: DeviceConfigState = {
  osVersion: 'Android 14',
  apiLevel: 34,
  securityPatchDate: '2026-08-05',
  isScreenLockEnabled: true,
  isBiometricEnrolled: true,
  hasUnknownSourceApps: false,
  activeAccessibilityServicesCount: 1, // e.g. TalkBack / Password Manager
  appsWithOverlayPermissionCount: 2,   // e.g. Messenger chat heads
  activeDeviceAdminAppsCount: 0,
  playIntegrityVerdict: 'MEETS_DEVICE_INTEGRITY',
  isUsbDebuggingEnabled: false
};

export function evaluateDeviceSecurity(state: DeviceConfigState = DEFAULT_DEVICE_STATE): DeviceAuditItem[] {
  const items: DeviceAuditItem[] = [];

  // 1. OS & Security Patch Level
  // Calculate months since patch
  const patchTime = new Date(state.securityPatchDate).getTime();
  const now = new Date('2026-10-21').getTime();
  const monthsOutdated = Math.floor((now - patchTime) / (1000 * 60 * 60 * 24 * 30));

  let patchStatus: DeviceAuditItem['status'] = 'PASSED';
  let patchRisk: RiskLevel = 'SAFE';
  let patchExpl = `Security patch date: ${state.securityPatchDate} on ${state.osVersion} (API ${state.apiLevel}). Device firmware is up-to-date with recent Google Android Bulletins.`;
  let patchRec = 'Keep automatic system updates enabled.';

  if (monthsOutdated >= 6) {
    patchStatus = 'FAILED';
    patchRisk = 'HIGH_RISK';
    patchExpl = `Security patch level is ${monthsOutdated} months outdated (${state.securityPatchDate}). The kernel and vendor HAL may be vulnerable to unpatched privilege escalation exploits.`;
    patchRec = 'Check System Settings > System > System Update to install vendor security patches immediately.';
  } else if (monthsOutdated >= 2) {
    patchStatus = 'WARNING';
    patchRisk = 'SUSPICIOUS';
    patchExpl = `Security patch is ${monthsOutdated} months old (${state.securityPatchDate}). Newer monthly security fixes are likely available.`;
    patchRec = 'Check manufacturer system settings for available OTA security updates.';
  }

  items.push({
    id: 'audit-patch-level',
    title: 'OS & Security Patch Level',
    category: 'OS_PATCH',
    status: patchStatus,
    riskLevel: patchRisk,
    value: `${state.osVersion} (${state.securityPatchDate})`,
    explanation: patchExpl,
    recommendation: patchRec,
    canVerifyOnPlatform: true
  });

  // 2. Lock Screen & Biometric Security
  if (state.isScreenLockEnabled) {
    items.push({
      id: 'audit-lock-screen',
      title: 'Device Lock Screen Protection',
      category: 'LOCK_SCREEN',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: state.isBiometricEnrolled ? 'Secure PIN + Biometrics Active' : 'PIN / Password Active',
      explanation: 'Android Keyguard is active and cryptographic keys stored in Hardware Keystore / StrongBox are protected against unauthorized physical device access.',
      recommendation: 'Maintain a secure alphanumeric PIN or passphrase; avoid easily guessed patterns (e.g., L-shapes).',
      canVerifyOnPlatform: true
    });
  } else {
    items.push({
      id: 'audit-lock-screen',
      title: 'Device Lock Screen Protection',
      category: 'LOCK_SCREEN',
      status: 'FAILED',
      riskLevel: 'HIGH_RISK',
      value: 'No Screen Lock Configured',
      explanation: 'Device lacks screen lock protection. Anyone with physical access can read SMS OTPs, launch banking applications, and access stored app credentials.',
      recommendation: 'Enable a secure screen lock immediately in Android Settings > Security > Screen Lock.',
      canVerifyOnPlatform: true
    });
  }

  // 3. Unknown App Installation Permissions (Sideloading Gates)
  if (state.hasUnknownSourceApps) {
    items.push({
      id: 'audit-unknown-sources',
      title: 'Unknown App Sources Allowed',
      category: 'UNKNOWN_SOURCES',
      status: 'WARNING',
      riskLevel: 'SUSPICIOUS',
      value: 'Active on 1 or more apps (e.g. Browser / File Manager)',
      explanation: 'Certain applications have the "Install Unknown Apps" (REQUEST_INSTALL_PACKAGES) permission. Attackers can trigger deceptive downloads that install trojanized APKs.',
      recommendation: 'Revoke unknown app installation permission in Settings > Apps > Special app access > Install unknown apps.',
      platformConstraint: 'Accessible via PackageManager.canRequestPackageInstalls() for calling package context.',
      canVerifyOnPlatform: true
    });
  } else {
    items.push({
      id: 'audit-unknown-sources',
      title: 'Unknown App Sources Restricted',
      category: 'UNKNOWN_SOURCES',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: 'Restricted / Not Granted',
      explanation: 'Third-party applications are blocked from silently triggering APK installations outside of authorized app distribution channels.',
      recommendation: 'Only grant install permissions temporarily when installing verified open-source utilities.',
      canVerifyOnPlatform: true
    });
  }

  // 4. Accessibility Services Threat Review
  if (state.activeAccessibilityServicesCount > 2) {
    items.push({
      id: 'audit-accessibility',
      title: 'High Accessibility Service Grants',
      category: 'ACCESSIBILITY',
      status: 'WARNING',
      riskLevel: 'HIGH_RISK',
      value: `${state.activeAccessibilityServicesCount} Active Services`,
      explanation: 'Multiple non-system applications have Accessibility access. Android Accessibility grants screen reading (keylogging) and simulated touch dispatch, a common vector for banking trojans.',
      recommendation: 'Review active Accessibility services in Settings > Accessibility. Disable any service you do not specifically recognize or trust.',
      canVerifyOnPlatform: true
    });
  } else {
    items.push({
      id: 'audit-accessibility',
      title: 'Accessibility Services Audit',
      category: 'ACCESSIBILITY',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: `${state.activeAccessibilityServicesCount} Monitored Service(s)`,
      explanation: 'Accessibility service configuration is within normal bounds. Legitimate accessibility tools (e.g., TalkBack or password managers) are functioning.',
      recommendation: 'Never grant Accessibility permission to apps claiming to be cleaning utilities, battery savers, or video players.',
      canVerifyOnPlatform: true
    });
  }

  // 5. System Overlay (Draw Over Other Apps) Risks
  if (state.appsWithOverlayPermissionCount >= 4) {
    items.push({
      id: 'audit-system-overlay',
      title: 'Multiple System Overlays Detected',
      category: 'SYSTEM_OVERLAY',
      status: 'WARNING',
      riskLevel: 'SUSPICIOUS',
      value: `${state.appsWithOverlayPermissionCount} Apps with Overlay Rights`,
      explanation: 'Several apps have SYSTEM_ALERT_WINDOW permission. Malicious apps use transparent overlays (tapjacking/clickjacking) to steal login credentials and intercept OTP inputs.',
      recommendation: 'Audit apps in Settings > Apps > Special app access > Display over other apps.',
      canVerifyOnPlatform: true
    });
  } else {
    items.push({
      id: 'audit-system-overlay',
      title: 'System Overlay Review',
      category: 'SYSTEM_OVERLAY',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: `${state.appsWithOverlayPermissionCount} Overlay App(s)`,
      explanation: 'Overlay permissions are constrained. No anomalous fullscreen tapjacking overlays detected.',
      recommendation: 'Only grant overlay permissions to trusted communication apps (e.g., chat heads) or navigation apps.',
      canVerifyOnPlatform: true
    });
  }

  // 6. Play Protect & Play Integrity Signals
  if (state.playIntegrityVerdict === 'MEETS_DEVICE_INTEGRITY') {
    items.push({
      id: 'audit-device-integrity',
      title: 'Hardware Attestation & Play Integrity',
      category: 'DEVICE_INTEGRITY',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: 'Meets Device Integrity (Official Android Build)',
      explanation: 'Cryptographic attestation confirms the device runs an unmodified, Google-certified Android build with locked bootloader and hardware-enforced Keystore.',
      recommendation: 'Maintain official stock firmware to preserve safety attestations required by banking and enterprise applications.',
      canVerifyOnPlatform: true
    });
  } else if (state.playIntegrityVerdict === 'UNABLE_TO_VERIFY') {
    items.push({
      id: 'audit-device-integrity',
      title: 'Play Integrity Hardware Attestation',
      category: 'DEVICE_INTEGRITY',
      status: 'UNABLE_TO_VERIFY',
      riskLevel: 'UNABLE_TO_VERIFY',
      value: 'Unable to Verify (Network / GMS Attestation Timeout)',
      explanation: 'ShieldGuard could not contact Google Play Services attestation servers to obtain a cryptographically signed integrity token.',
      recommendation: 'Ensure Google Play Services is updated and active network connectivity is present.',
      platformConstraint: 'Requires Google Play Services Play Integrity API token exchange with trusted app backend.',
      canVerifyOnPlatform: false
    });
  } else {
    items.push({
      id: 'audit-device-integrity',
      title: 'Play Integrity Hardware Attestation',
      category: 'DEVICE_INTEGRITY',
      status: 'FAILED',
      riskLevel: 'HIGH_RISK',
      value: 'Basic / Failed Integrity (Rooted or Uncertified OS)',
      explanation: 'The device failed hardware-backed integrity validation. Device may have unlocked bootloader, custom ROM, or active Magisk/KernelSU root access.',
      recommendation: 'Avoid conducting sensitive financial transactions or banking operations on rooted devices.',
      canVerifyOnPlatform: true
    });
  }

  // 7. Device Admin Permissions (Privilege Escalation Gate)
  if (state.activeDeviceAdminAppsCount > 0) {
    items.push({
      id: 'audit-device-admin',
      title: 'Active Device Administrator Applications',
      category: 'DEVICE_ADMIN',
      status: 'WARNING',
      riskLevel: 'SUSPICIOUS',
      value: `${state.activeDeviceAdminAppsCount} App(s) with Device Admin Rights`,
      explanation: 'Device Admin privileges grant high-level controls such as remote wipe, password reset, and uninstall prevention. Common in MDM enterprise tools, but abused by ransomware.',
      recommendation: 'Check Settings > Security > Device admin apps. Verify all listed administrators are authorized by your enterprise or organization.',
      canVerifyOnPlatform: true
    });
  } else {
    items.push({
      id: 'audit-device-admin',
      title: 'Device Administrator Apps',
      category: 'DEVICE_ADMIN',
      status: 'PASSED',
      riskLevel: 'SAFE',
      value: '0 Third-Party Admins',
      explanation: 'No unauthorized third-party apps possess administrative lock or wipe privileges on this device.',
      recommendation: 'Never grant Device Admin privileges to consumer games, media players, or battery optimizers.',
      canVerifyOnPlatform: true
    });
  }

  // 8. Platform Restriction Transparency: Deep Memory Inspection
  items.push({
    id: 'audit-memory-inspection',
    title: 'Cross-App Memory & Sandbox Inspection',
    category: 'DEVICE_INTEGRITY',
    status: 'NOT_SUPPORTED',
    riskLevel: 'UNABLE_TO_VERIFY',
    value: 'Platform Sandbox Enforced (SELinux & UID Isolation)',
    explanation: 'Android application sandbox architecture (Linux UID separation, isolated cgroups, and strict SELinux policies) intentionally prevents third-party apps from reading other apps\' private /data directories or RAM.',
    recommendation: 'ShieldGuard honors Android platform boundaries by not pretending to perform impossible live RAM inspection of other apps.',
    platformConstraint: 'Enforced by Android OS Kernel SELinux since Android 4.3; root privilege would be required to bypass.',
    canVerifyOnPlatform: false
  });

  return items;
}
