/**
 * ShieldGuard Mobile Security - UPI & Payment Scam Analyzer
 * @license Apache-2.0
 */

import { RiskLevel, UpiAnalysisResult } from '../types/security';

// High-risk scam trigger keywords often embedded in UPI transaction notes ('tn') or payee names ('pn')
const SCAM_TRIGGERS = [
  'cashback', 'refund', 'lottery', 'winner', 'prize', 'reward', 'bonus',
  'kyc', 'pan update', 'electricity', 'bill pending', 'customs', 'courier delivery',
  'part time job', 'telegram task', 'work from home', 'crypto profit', 'free gift'
];

// Well-known verified merchant handles and aggregators (examples for pattern validation)
const VERIFIED_MERCHANT_HANDLES = [
  '@icici', '@hdfcbank', '@okhdfcbank', '@okaxis', '@okicici', '@oksbi',
  '@paytm', '@ybl', '@ibl', '@axl', '@airtel', '@apl'
];

export function analyzeUpiLink(rawInput: string): UpiAnalysisResult {
  const timestamp = Date.now();
  const trimmed = rawInput.trim();

  let scheme: 'upi' | 'other' | 'invalid' = 'invalid';
  let payeeVpa = '';
  let payeeName = '';
  let amount: string | undefined;
  let currency: string | undefined;
  let transactionNote: string | undefined;
  let merchantCode: string | undefined;
  let referenceUrl: string | undefined;

  const warnings: string[] = [];
  const socialEngineeringTriggers: string[] = [];

  if (trimmed.startsWith('upi://pay') || trimmed.startsWith('upi://mandate')) {
    scheme = 'upi';
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    scheme = 'other';
    warnings.push('The provided link is an HTTP/HTTPS web URL rather than a native upi:// deep link. Web payment redirect links can conceal malicious payment gateways.');
  } else if (trimmed.includes('@')) {
    // Plain VPA entered (e.g. merchant@upi)
    scheme = 'upi';
    payeeVpa = trimmed;
  } else {
    scheme = 'invalid';
    return {
      rawPayload: rawInput,
      scheme: 'invalid',
      payeeVpa: 'Unknown',
      payeeName: 'Unknown',
      isVerifiedMerchantPattern: false,
      socialEngineeringTriggers: [],
      riskLevel: 'HIGH_RISK',
      warnings: ['Invalid payment payload. Payload does not conform to NPCI UPI specifications.'],
      isActionRecommended: 'Do not proceed with this payment payload. The link format is malformed or invalid.',
      timestamp
    };
  }

  if (scheme === 'upi' && trimmed.startsWith('upi://')) {
    try {
      // In URL format: upi://pay?pa=...&pn=...
      const url = new URL(trimmed);
      const params = url.searchParams;

      payeeVpa = params.get('pa') || '';
      payeeName = params.get('pn') || '';
      amount = params.get('am') || undefined;
      currency = params.get('cu') || 'INR';
      transactionNote = params.get('tn') || undefined;
      merchantCode = params.get('mc') || undefined;
      referenceUrl = params.get('url') || undefined;
    } catch {
      // Fallback manual regex parser if URL constructor chokes on custom scheme
      const queryPart = trimmed.split('?')[1] || '';
      const params = new URLSearchParams(queryPart);
      payeeVpa = params.get('pa') || '';
      payeeName = params.get('pn') || '';
      amount = params.get('am') || undefined;
      currency = params.get('cu') || 'INR';
      transactionNote = params.get('tn') || undefined;
      merchantCode = params.get('mc') || undefined;
      referenceUrl = params.get('url') || undefined;
    }
  }

  // 1. Validate Payee VPA format
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!payeeVpa || !vpaRegex.test(payeeVpa)) {
    warnings.push('The Virtual Payment Address (VPA) is missing or syntactically invalid.');
  }

  // 2. Check for Social Engineering Triggers in Transaction Note (tn) or Payee Name (pn)
  const textToCheck = `${payeeName} ${transactionNote || ''}`.toLowerCase();
  for (const trigger of SCAM_TRIGGERS) {
    if (textToCheck.includes(trigger)) {
      socialEngineeringTriggers.push(trigger);
    }
  }

  if (socialEngineeringTriggers.length > 0) {
    warnings.push(`Suspicious social-engineering keywords detected: "${socialEngineeringTriggers.join('", "')}". Scammers frequently label payment requests as 'cashback', 'refund', or 'KYC' to trick victims.`);
  }

  // 3. Amount checks (Collect Request / Zero Amount traps)
  if (amount !== undefined) {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      warnings.push('The link specifies an amount of 0 or invalid currency format, which is often used in Collect Request autorization traps.');
    } else if (num >= 50000) {
      warnings.push(`High payment value (₹${num.toLocaleString('en-IN')}). Ensure the recipient identity is independently verified before entering your PIN.`);
    }
  } else {
    warnings.push('No fixed amount is specified in the link. The recipient or payment app will prompt you for an arbitrary transfer amount.');
  }

  // 4. Reference URL check
  if (referenceUrl) {
    warnings.push(`Link includes an external reference redirect URL: ${referenceUrl}. Ensure this does not redirect to an unverified payment proxy.`);
  }

  // 5. Merchant verification check
  const isVerifiedMerchantPattern = Boolean(
    merchantCode && 
    merchantCode.length === 4 && 
    VERIFIED_MERCHANT_HANDLES.some(handle => payeeVpa.endsWith(handle))
  );

  // 6. Determine Risk Level
  let riskLevel: RiskLevel = 'SAFE';
  let isActionRecommended = '';

  if (socialEngineeringTriggers.length > 0 || !payeeVpa) {
    riskLevel = 'HIGH_RISK';
    isActionRecommended = 'HIGH FRAUD RISK: Do NOT enter your UPI PIN. Remember: You NEVER need to enter a UPI PIN or scan a QR code to RECEIVE money!';
  } else if (warnings.length > 0 && !isVerifiedMerchantPattern) {
    riskLevel = 'SUSPICIOUS';
    isActionRecommended = 'SUSPICIOUS: Recipient is an unverified individual or non-standard merchant. Verify the exact name in your UPI app before authorising.';
  } else {
    // Even if valid, never claim 100% safe
    riskLevel = 'SAFE';
    isActionRecommended = 'SYNTACTICALLY VALID: Recipient pattern appears valid, but always confirm the recipient account name in your bank application before confirming transaction.';
  }

  return {
    rawPayload: rawInput,
    scheme,
    payeeVpa: payeeVpa || 'Not provided',
    payeeName: payeeName || 'Not specified',
    amount,
    currency,
    transactionNote,
    merchantCode,
    referenceUrl,
    isVerifiedMerchantPattern,
    socialEngineeringTriggers,
    riskLevel,
    warnings,
    isActionRecommended,
    timestamp
  };
}
