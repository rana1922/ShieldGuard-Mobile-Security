/**
 * ShieldGuard Mobile Security - Data Types & Models
 * @license Apache-2.0
 */

export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNABLE_TO_VERIFY';

export interface SecurityFinding {
  id: string;
  category: 'APP' | 'URL' | 'PAYMENT' | 'FILE' | 'DEVICE' | 'PRIVACY';
  title: string;
  description: string;
  riskLevel: RiskLevel;
  evidence: string;
  timestamp: number;
  recommendedAction: string;
  technicalDetails?: string;
  source?: string;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  targetSdk: number;
  minSdk: number;
  installSource: 'GOOGLE_PLAY' | 'SIDELOAD_BROWSER' | 'FILE_MANAGER' | 'UNKNOWN' | 'SYSTEM_PREINSTALLED';
  isSystemApp: boolean;
  isSideloaded: boolean;
  certificateFingerprint: string;
  permissions: string[];
  dangerousPermissions: string[];
  adwareIndicators: string[];
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  reason: string;
  verificationStatus: 'VERIFIED_DEVELOPER' | 'UNKNOWN_DEVELOPER' | 'POTENTIAL_IMPERSONATION';
  iconType: 'shield' | 'chat' | 'payment' | 'game' | 'utility' | 'system' | 'warning';
}

export interface DeviceAuditItem {
  id: string;
  title: string;
  category: 'OS_PATCH' | 'LOCK_SCREEN' | 'UNKNOWN_SOURCES' | 'ACCESSIBILITY' | 'SYSTEM_OVERLAY' | 'DEVICE_INTEGRITY' | 'DEVICE_ADMIN';
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'UNABLE_TO_VERIFY' | 'NOT_SUPPORTED';
  riskLevel: RiskLevel;
  value: string;
  explanation: string;
  recommendation: string;
  platformConstraint?: string;
  canVerifyOnPlatform: boolean;
}

export interface UrlScanResult {
  url: string;
  normalizedUrl: string;
  domain: string;
  isIpHost: boolean;
  hasIdnHomograph: boolean;
  punycodeDomain?: string;
  hasMisleadingSubdomain: boolean;
  isShortener: boolean;
  pathRisk: boolean;
  reputationScore: number; // 0 - 100 (higher = safer)
  reputationProvider: string;
  riskLevel: RiskLevel;
  findings: SecurityFinding[];
  timestamp: number;
}

export interface UpiAnalysisResult {
  rawPayload: string;
  scheme: 'upi' | 'other' | 'invalid';
  payeeVpa: string;
  payeeName: string;
  amount?: string;
  currency?: string;
  transactionNote?: string;
  merchantCode?: string;
  referenceUrl?: string;
  isVerifiedMerchantPattern: boolean;
  socialEngineeringTriggers: string[];
  riskLevel: RiskLevel;
  warnings: string[];
  isActionRecommended: string;
  timestamp: number;
}

export interface FileScanResult {
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  extension: string;
  detectedSignature: string;
  sha256: string;
  isDoubleExtension: boolean;
  hasExecutableSignature: boolean;
  isArchiveInspectable: boolean;
  reputationStatus: 'CLEAN' | 'KNOWN_MALWARE' | 'SUSPICIOUS_SIGNATURE' | 'NOT_SEEN_BEFORE';
  riskLevel: RiskLevel;
  findings: SecurityFinding[];
  timestamp: number;
}

export interface FraudReport {
  id: string;
  referenceNumber: string;
  category: 'PHISHING_URL' | 'UPI_SCAM' | 'MALICIOUS_APP' | 'SUSPICIOUS_DOWNLOAD' | 'IMPERSONATION' | 'OTHER';
  targetIdentifier: string; // URL, VPA, Package name, or Phone
  transactionRef?: string;
  amountLost?: string;
  description: string;
  userConsent: boolean;
  reportedAt: number;
  status: 'SUBMITTED_LOCALLY' | 'SYNCED_WITH_BACKEND' | 'FORWARDED_CYBERCRIME';
  officialHelplineContact: string;
}

export interface ScanHistoryRecord {
  id: string;
  timestamp: number;
  type: 'QUICK_SCAN' | 'FULL_SCAN' | 'URL_SCAN' | 'UPI_SCAN' | 'FILE_SCAN' | 'DEVICE_AUDIT';
  target: string;
  riskLevel: RiskLevel;
  findingsCount: number;
  summary: string;
}
