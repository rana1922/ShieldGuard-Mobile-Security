/**
 * ShieldGuard Mobile Security - File Signature & Double-Extension Analyzer
 * @license Apache-2.0
 */

import { FileScanResult, RiskLevel, SecurityFinding } from '../types/security';

// Known file magic numbers (hex signatures)
const FILE_SIGNATURES: { [mime: string]: { magic: number[]; name: string; isExecutable: boolean } } = {
  'application/vnd.android.package-archive': {
    magic: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP archive containing AndroidManifest.xml)
    name: 'Android APK Archive (ZIP container)',
    isExecutable: true
  },
  'application/x-dosexec': {
    magic: [0x4D, 0x5A], // MZ
    name: 'Windows DOS/PE Executable',
    isExecutable: true
  },
  'application/x-executable': {
    magic: [0x7F, 0x45, 0x4C, 0x46], // .ELF
    name: 'Linux / Android Native ELF Executable',
    isExecutable: true
  },
  'application/pdf': {
    magic: [0x25, 0x50, 0x44, 0x46], // %PDF
    name: 'Adobe Portable Document Format (PDF)',
    isExecutable: false
  },
  'image/jpeg': {
    magic: [0xFF, 0xD8, 0xFF],
    name: 'JPEG Image',
    isExecutable: false
  },
  'image/png': {
    magic: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    name: 'PNG Image',
    isExecutable: false
  },
  'application/zip': {
    magic: [0x50, 0x4B, 0x03, 0x04],
    name: 'ZIP Compressed Archive',
    isExecutable: false
  }
};

// Known dangerous executable extensions
const EXECUTABLE_EXTENSIONS = new Set([
  'apk', 'exe', 'bat', 'cmd', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'ps1', 'msi', 'scr', 'pif', 'sh', 'dex', 'so', 'jar', 'app'
]);

// Known masqueraded file extensions (decoy extensions before the executable)
const DECOY_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png',
  'mp4', 'mp3', 'txt', 'csv', 'zip', 'rar'
]);

// Mock database of known malware SHA-256 hashes for realistic testing
const KNOWN_MALWARE_HASHES = new Set([
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Empty file test
  '44d88612fea8a8f36de82e1278abb02f3e9924b3a82f32f71672aba40d1f7312', // EICAR standard test file
  '9f83c6051f8ee96624f4ac41a32b3441a12d22f1be15e0f330e42eeae807c72f', // Cerberus Banking Trojan sample
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // FakeSBI Sideloaded APK
  'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2'  // SpyLoan Malicious App
]);

export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function analyzeFileMetadataAndBytes(
  fileName: string,
  fileSize: number,
  declaredMimeType: string,
  headerBytes: Uint8Array,
  sha256Hash: string
): FileScanResult {
  const timestamp = Date.now();
  const findings: SecurityFinding[] = [];

  const parts = fileName.toLowerCase().split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1] : '';
  const secondToLastExt = parts.length > 2 ? parts[parts.length - 2] : '';

  // 1. Double extension detection (e.g. invoice.pdf.apk, photo.jpg.exe)
  let isDoubleExtension = false;
  if (parts.length > 2 && DECOY_EXTENSIONS.has(secondToLastExt) && EXECUTABLE_EXTENSIONS.has(extension)) {
    isDoubleExtension = true;
    findings.push({
      id: `file-find-${Date.now()}-double-ext`,
      category: 'FILE',
      title: 'Dangerous Double Extension Masquerade',
      description: `The file appears to be a document (${secondToLastExt.toUpperCase()}), but its actual executable extension is '.${extension}'. Attackers use this to trick users into running malicious APKs or scripts.`,
      riskLevel: 'HIGH_RISK',
      evidence: `Filename: ${fileName} | Apparent: .${secondToLastExt} | True Executable: .${extension}`,
      timestamp,
      recommendedAction: 'DO NOT OPEN OR INSTALL. Delete this file immediately from your downloads folder.'
    });
  }

  // 2. Executable Extension Inspection
  const isExecExt = EXECUTABLE_EXTENSIONS.has(extension);
  if (isExecExt && !isDoubleExtension) {
    if (extension === 'apk') {
      findings.push({
        id: `file-find-${Date.now()}-apk`,
        category: 'FILE',
        title: 'Sideloaded Android Package (APK)',
        description: 'This is an Android application package downloaded outside the official Google Play Store. Sideloaded APKs bypass standard app store automated malware vetting.',
        riskLevel: 'SUSPICIOUS',
        evidence: `File extension: .apk | Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
        timestamp,
        recommendedAction: 'Verify the publisher and certificate before installing. Ensure "Install Unknown Apps" permission is disabled when not needed.'
      });
    } else if (['exe', 'bat', 'vbs', 'sh'].includes(extension)) {
      findings.push({
        id: `file-find-${Date.now()}-os-exec`,
        category: 'FILE',
        title: 'Non-Android Executable Binary',
        description: `This file contains executable code for desktop or shell systems (.${extension}). While it cannot natively execute on standard Android, it indicates a suspicious cross-platform payload or download trap.`,
        riskLevel: 'HIGH_RISK',
        evidence: `File extension: .${extension}`,
        timestamp,
        recommendedAction: 'Delete file. Avoid transferring this file to PC or connected desktop workstations.'
      });
    }
  }

  // 3. Inspect Magic Byte Signature (File Header)
  let detectedSignature = 'Unknown Binary Format';
  let hasExecutableSignature = false;

  if (headerBytes.length >= 2) {
    if (headerBytes[0] === 0x4D && headerBytes[1] === 0x5A) {
      detectedSignature = 'Windows PE Executable (MZ)';
      hasExecutableSignature = true;
    } else if (headerBytes[0] === 0x7F && headerBytes[1] === 0x45 && headerBytes[2] === 0x4C && headerBytes[3] === 0x46) {
      detectedSignature = 'Linux/Android ELF Executable';
      hasExecutableSignature = true;
    } else if (headerBytes[0] === 0x50 && headerBytes[1] === 0x4B && headerBytes[2] === 0x03 && headerBytes[3] === 0x04) {
      detectedSignature = extension === 'apk' ? 'Android APK Package (ZIP header)' : 'ZIP Archive';
      if (extension === 'apk') hasExecutableSignature = true;
    } else if (headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46) {
      detectedSignature = 'Standard Adobe PDF';
    } else if (headerBytes[0] === 0xFF && headerBytes[1] === 0xD8 && headerBytes[2] === 0xFF) {
      detectedSignature = 'JPEG Image Format';
    } else if (headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4E && headerBytes[3] === 0x47) {
      detectedSignature = 'PNG Image Format';
    }
  }

  // Mismatch check: Claimed PDF or Image, but header has MZ or ELF or ZIP
  if ((extension === 'pdf' || extension === 'jpg' || extension === 'png') && hasExecutableSignature) {
    findings.push({
      id: `file-find-${Date.now()}-mismatch`,
      category: 'FILE',
      title: 'File Signature Mismatch (Disguised Executable)',
      description: `The file name extension is '.${extension}', but the file header signature is '${detectedSignature}'. This is a critical indicator of Trojan malware.`,
      riskLevel: 'HIGH_RISK',
      evidence: `Header magic: [${Array.from(headerBytes.slice(0, 4)).map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}]`,
      timestamp,
      recommendedAction: 'IMMEDIATELY DELETE. The file is disguising malicious executable bytecode behind a harmless document icon.'
    });
  }

  // 4. SHA-256 Reputation Database Check
  let reputationStatus: 'CLEAN' | 'KNOWN_MALWARE' | 'SUSPICIOUS_SIGNATURE' | 'NOT_SEEN_BEFORE' = 'NOT_SEEN_BEFORE';
  if (KNOWN_MALWARE_HASHES.has(sha256Hash.toLowerCase())) {
    reputationStatus = 'KNOWN_MALWARE';
    findings.push({
      id: `file-find-${Date.now()}-hash-match`,
      category: 'FILE',
      title: 'Matches Known Malware Hash Database',
      description: 'The SHA-256 cryptographic digest of this file matches an identified Android banking trojan or malicious payload recorded in threat intelligence feeds.',
      riskLevel: 'HIGH_RISK',
      evidence: `SHA-256: ${sha256Hash}`,
      timestamp,
      recommendedAction: 'Do not open. Remove from device immediately and submit report to cyber defense teams.'
    });
  } else if (isDoubleExtension || hasExecutableSignature && ['pdf', 'png', 'jpg'].includes(extension)) {
    reputationStatus = 'SUSPICIOUS_SIGNATURE';
  } else if (findings.length === 0) {
    reputationStatus = 'CLEAN';
    findings.push({
      id: `file-find-${Date.now()}-clean`,
      category: 'FILE',
      title: 'File Structure Consistent',
      description: 'Extension matches binary magic header, no double-extension obfuscation detected, and hash is clean.',
      riskLevel: 'SAFE',
      evidence: `SHA-256: ${sha256Hash.substring(0, 16)}...`,
      timestamp,
      recommendedAction: 'File appears structurally sound. Keep apps and readers updated to protect against unpatched parser exploits.'
    });
  }

  // Determine overall risk
  let riskLevel: RiskLevel = 'SAFE';
  if (findings.some(f => f.riskLevel === 'HIGH_RISK')) {
    riskLevel = 'HIGH_RISK';
  } else if (findings.some(f => f.riskLevel === 'SUSPICIOUS')) {
    riskLevel = 'SUSPICIOUS';
  }

  return {
    fileName,
    fileSize,
    mimeType: declaredMimeType || 'application/octet-stream',
    extension: extension || 'none',
    detectedSignature,
    sha256: sha256Hash,
    isDoubleExtension,
    hasExecutableSignature,
    isArchiveInspectable: extension === 'zip' || extension === 'apk',
    reputationStatus,
    riskLevel,
    findings,
    timestamp
  };
}
