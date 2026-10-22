/**
 * ShieldGuard Mobile Security - Test Suites & Interactive Test Cases
 * @license Apache-2.0
 */

export interface TestCase {
  id: string;
  category: 'URL' | 'FILE' | 'UPI' | 'APP' | 'DEVICE';
  title: string;
  inputDescription: string;
  expectedRisk: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNABLE_TO_VERIFY';
  testPayload: any;
  explanation: string;
}

export const SAMPLE_TEST_CASES: TestCase[] = [
  {
    id: 'tc-url-1',
    category: 'URL',
    title: 'IDN Homograph Domain Spoofing',
    inputDescription: 'URL using Cyrillic "р" (U+0440) instead of Latin "p" in paypal.com',
    expectedRisk: 'HIGH_RISK',
    testPayload: 'https://xn--aypal-1qa.com/login-verify-account',
    explanation: 'Detects Punycode and internationalized confusable characters designed to fool user eyes.'
  },
  {
    id: 'tc-url-2',
    category: 'URL',
    title: 'Misleading Banking Subdomain Impersonation',
    inputDescription: 'Host has "sbi.co.in" in subdomain prefix on attacker-controlled root',
    expectedRisk: 'HIGH_RISK',
    testPayload: 'https://sbi.co.in.kyc-verification-gateway.net/pan-link',
    explanation: 'Detects that the root authoritative domain is not the genuine bank domain.'
  },
  {
    id: 'tc-url-3',
    category: 'URL',
    title: 'Raw IP Address Host',
    inputDescription: 'Numerical IPv4 address used directly in place of registered DNS domain',
    expectedRisk: 'HIGH_RISK',
    testPayload: 'http://185.220.101.5/banking/update.php',
    explanation: 'Legitimate consumer web services do not host authentication endpoints on bare IP numbers.'
  },
  {
    id: 'tc-url-4',
    category: 'URL',
    title: 'Obfuscated URL Shortener',
    inputDescription: 'bit.ly shortened URL hiding destination',
    expectedRisk: 'SUSPICIOUS',
    testPayload: 'https://bit.ly/3xBankRewardClaim',
    explanation: 'Flags shorteners that obscure final destination.'
  },
  {
    id: 'tc-file-1',
    category: 'FILE',
    title: 'Double Extension Trojan Masquerade',
    inputDescription: 'File named "invoice_october.pdf.apk" with Android APK header',
    expectedRisk: 'HIGH_RISK',
    testPayload: {
      fileName: 'invoice_october.pdf.apk',
      fileSize: 4210000,
      mimeType: 'application/vnd.android.package-archive',
      header: [0x50, 0x4B, 0x03, 0x04],
      sha256: '9f83c6051f8ee96624f4ac41a32b3441a12d22f1be15e0f330e42eeae807c72f'
    },
    explanation: 'Catches malicious packages disguised as innocuous PDF documents.'
  },
  {
    id: 'tc-file-2',
    category: 'FILE',
    title: 'MIME/Header Signature Mismatch',
    inputDescription: 'Named "photo_id.jpg" but header starts with Windows PE executable "MZ" (0x4D 0x5A)',
    expectedRisk: 'HIGH_RISK',
    testPayload: {
      fileName: 'photo_id.jpg',
      fileSize: 850000,
      mimeType: 'image/jpeg',
      header: [0x4D, 0x5A, 0x90, 0x00],
      sha256: '44d88612fea8a8f36de82e1278abb02f3e9924b3a82f32f71672aba40d1f7312'
    },
    explanation: 'Detects executable binary bytecode disguised under a harmless JPEG file extension.'
  },
  {
    id: 'tc-upi-1',
    category: 'UPI',
    title: 'Urgent KYC Cashback Scam Payload',
    inputDescription: 'UPI payment link with note "Electricity Bill Refund 2500 KYC"',
    expectedRisk: 'HIGH_RISK',
    testPayload: 'upi://pay?pa=refundservice2026@oksbi&pn=Discom+Cashback+Office&am=2500&cu=INR&tn=Electricity+Bill+Refund+KYC',
    explanation: 'Flags deceptive social-engineering keywords commonly used to trick victims into paying.'
  },
  {
    id: 'tc-upi-2',
    category: 'UPI',
    title: 'Zero Amount Collect Request Trap',
    inputDescription: 'UPI collect payload with 0.0 amount to trigger user authorization',
    expectedRisk: 'SUSPICIOUS',
    testPayload: 'upi://pay?pa=unknown.agent99@upi&pn=Customer+Care&am=0.0&cu=INR',
    explanation: 'Warns that zero-amount or unverified recipient links can prompt user for open-ended funds authorization.'
  },
  {
    id: 'tc-app-1',
    category: 'APP',
    title: 'Banking Trojan Permission Cluster',
    inputDescription: 'Sideloaded app requesting READ_SMS + RECEIVE_SMS + SYSTEM_ALERT_WINDOW',
    expectedRisk: 'HIGH_RISK',
    testPayload: {
      packageName: 'com.fake.sbi.banking',
      appName: 'SBI Yono Quick KYC Update',
      targetSdk: 29,
      isSideloaded: true,
      permissions: ['android.permission.READ_SMS', 'android.permission.SYSTEM_ALERT_WINDOW']
    },
    explanation: 'Detects the classic banking trojan overlay and OTP interception signature.'
  },
  {
    id: 'tc-device-1',
    category: 'DEVICE',
    title: 'Unsupported Deep Memory Inspection',
    inputDescription: 'Query for cross-app RAM reading / private /data directory inspection',
    expectedRisk: 'UNABLE_TO_VERIFY',
    testPayload: { check: 'audit-memory-inspection' },
    explanation: 'Transparently labels Android SELinux sandbox boundary as Not Supported / Unable to Verify instead of fabricating results.'
  }
];

export const KOTLIN_TEST_SOURCE = `package org.shieldguard.security

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.shieldguard.security.data.local.RiskLevel
import org.shieldguard.security.util.UpiParser
import org.shieldguard.security.util.FileSignatureChecker
import java.io.ByteArrayInputStream

class ShieldGuardUnitTests {

    @Test
    fun upiParser_detectsRefundScamKeywords() {
        val scamLink = "upi://pay?pa=scammer@okaxis&pn=Customer+Support&am=5000&tn=Lottery+Cashback+KYC"
        val result = UpiParser.parseAndInspect(scamLink)
        
        assertEquals(RiskLevel.HIGH_RISK, result.riskLevel)
        assertTrue(result.fraudKeywords.contains("cashback"))
        assertTrue(result.fraudKeywords.contains("lottery"))
    }

    @Test
    fun fileChecker_detectsDoubleExtensionMasquerade() {
        val fakeBytes = byteArrayOf(0x50, 0x4B, 0x03, 0x04) // ZIP/APK header
        val stream = ByteArrayInputStream(fakeBytes)
        
        val result = FileSignatureChecker.inspectStream("salary_statement.pdf.apk", stream, 4)
        assertEquals(RiskLevel.HIGH_RISK, result.riskLevel)
        assertTrue(result.isDoubleExtension)
    }

    @Test
    fun fileChecker_detectsExecutableDisguisedAsJpeg() {
        val peHeader = byteArrayOf(0x4D, 0x5A, 0x90.toByte(), 0x00) // MZ header
        val stream = ByteArrayInputStream(peHeader)
        
        val result = FileSignatureChecker.inspectStream("family_vacation.jpg", stream, 4)
        assertEquals(RiskLevel.HIGH_RISK, result.riskLevel)
        assertTrue(result.isDisguisedExecutable)
    }
}
`;

export const PYTHON_TEST_SOURCE = `import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security import validate_safe_url
from fastapi import HTTPException

client = TestClient(app)

def test_ssrf_rejects_localhost_and_private_ips():
    with pytest.raises(HTTPException) as exc:
        validate_safe_url("http://127.0.0.1:8000/internal-secrets")
    assert exc.value.status_code == 403

def test_ssrf_rejects_cloud_metadata_service():
    with pytest.raises(HTTPException) as exc:
        validate_safe_url("http://169.254.169.254/latest/meta-data/")
    assert exc.value.status_code == 403

def test_fraud_report_submission_requires_explicit_consent():
    payload = {
        "category": "UPI_SCAM",
        "target_identifier": "fake_merchant@okaxis",
        "description": "Received fake electricity bill refund SMS",
        "user_consent": False
    }
    response = client.post("/api/v1/fraud/report", json=payload)
    assert response.status_code == 422  # Pydantic validation rejected
`;
