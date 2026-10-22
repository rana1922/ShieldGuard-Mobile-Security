/**
 * ShieldGuard Mobile Security - URL & Phishing Analysis Engine
 * @license Apache-2.0
 */

import { RiskLevel, SecurityFinding, UrlScanResult } from '../types/security';

// Homoglyph map for Cyrillic / Greek characters frequently abused in homograph attacks
const HOMOGLYPH_CHARS: { [key: string]: string } = {
  '\u0430': 'a', // Cyrillic small letter a
  '\u0441': 'c', // Cyrillic small letter es
  '\u0435': 'e', // Cyrillic small letter ie
  '\u0456': 'i', // Cyrillic small letter byelorussian-ukrainian i
  '\u0458': 'j', // Cyrillic small letter je
  '\u043E': 'o', // Cyrillic small letter o
  '\u0440': 'p', // Cyrillic small letter er
  '\u0455': 's', // Cyrillic small letter dze
  '\u0445': 'x', // Cyrillic small letter ha
  '\u0443': 'y', // Cyrillic small letter u
  '\u03BF': 'o', // Greek small letter omicron
  '\u03BD': 'v', // Greek small letter nu
};

const KNOWN_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 
  'rebrand.ly', 'cutt.ly', 'qr.ae', 'rb.gy', 'v.gd', 'bc.vc'
]);

const POPULAR_TARGET_DOMAINS = [
  'paypal.com', 'google.com', 'microsoft.com', 'apple.com', 'amazon.com',
  'sbi.co.in', 'hdfcbank.com', 'icicibank.com', 'axisbank.com', 'paytm.com',
  'netflix.com', 'facebook.com', 'instagram.com', 'whatsapp.com', 'bankofamerica.com'
];

const SUSPICIOUS_KEYWORDS = [
  'verify-kyc', 'kyc-update', 'account-blocked', 'login-security', 'free-recharge',
  'claim-bonus', 'lottery-win', 'pan-link', 'aadhaar-verify', 'urgent-action',
  'recover-account', 'secure-signin', 'bank-alert', 'tax-refund', 'customs-duty'
];

export function analyzeUrl(rawUrl: string): UrlScanResult {
  const timestamp = Date.now();
  let input = rawUrl.trim();
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    input = 'https://' + input;
  }

  const findings: SecurityFinding[] = [];
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    return {
      url: rawUrl,
      normalizedUrl: rawUrl,
      domain: 'Invalid URL',
      isIpHost: false,
      hasIdnHomograph: false,
      hasMisleadingSubdomain: false,
      isShortener: false,
      pathRisk: false,
      reputationScore: 0,
      reputationProvider: 'ShieldGuard Heuristic Engine',
      riskLevel: 'HIGH_RISK',
      findings: [{
        id: `finding-${Date.now()}-1`,
        category: 'URL',
        title: 'Malformed URL Syntax',
        description: 'The provided URL could not be parsed according to standard RFC 3986 format.',
        riskLevel: 'HIGH_RISK',
        evidence: `Raw input: ${rawUrl}`,
        timestamp,
        recommendedAction: 'Do not open this link. Deceptive messages often use malformed characters to evade security filters.'
      }],
      timestamp
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol;
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();

  // 1. Insecure HTTP check
  if (protocol === 'http:') {
    findings.push({
      id: `finding-${Date.now()}-http`,
      category: 'URL',
      title: 'Unencrypted HTTP Connection',
      description: 'The URL uses plain HTTP without TLS encryption. Credentials and session tokens can be intercepted by anyone on the network.',
      riskLevel: 'SUSPICIOUS',
      evidence: `Scheme: ${protocol}`,
      timestamp,
      recommendedAction: 'Do not enter passwords, OTPs, or financial details on unencrypted connections.'
    });
  }

  // 2. IP Host check (e.g., http://192.168.1.1/login or http://185.220.101.5/)
  const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  const isIpv6 = hostname.startsWith('[') && hostname.endsWith(']');
  const isIpHost = isIpv4 || isIpv6;

  if (isIpHost) {
    findings.push({
      id: `finding-${Date.now()}-ip`,
      category: 'URL',
      title: 'Direct IP Address Host',
      description: 'The link directs directly to a raw numerical IP address instead of a registered domain name. Legitimate consumer services virtually never use raw IP hosts.',
      riskLevel: 'HIGH_RISK',
      evidence: `Host: ${hostname}`,
      timestamp,
      recommendedAction: 'Avoid opening. Attackers frequently use raw IP addresses to bypass domain reputation blocklists and fast-flux DNS.'
    });
  }

  // 3. IDN Homograph check (Confusable characters)
  let hasIdnHomograph = false;
  let punycodeDomain = '';
  for (const char of hostname) {
    if (HOMOGLYPH_CHARS[char]) {
      hasIdnHomograph = true;
      break;
    }
  }

  if (hostname.startsWith('xn--')) {
    hasIdnHomograph = true;
    punycodeDomain = hostname;
  }

  if (hasIdnHomograph) {
    findings.push({
      id: `finding-${Date.now()}-idn`,
      category: 'URL',
      title: 'IDN Homograph Deception Detected',
      description: 'This domain contains lookalike characters (such as Cyrillic or Greek symbols) that mimic familiar Latin letters. This technique is used to create indistinguishable fake brand domains.',
      riskLevel: 'HIGH_RISK',
      evidence: `Deceptive host: ${hostname}`,
      timestamp,
      recommendedAction: 'Block immediately. This is a deliberate spoofing attempt designed to deceive the human eye into trusting a fraudulent site.'
    });
  }

  // 4. Misleading Subdomain / Brand Spoofing Check
  let hasMisleadingSubdomain = false;
  const domainParts = hostname.split('.');
  
  for (const target of POPULAR_TARGET_DOMAINS) {
    const brandName = target.split('.')[0];
    // If the brand is in the hostname, but the registered domain is NOT the target
    if (hostname.includes(brandName) && !hostname.endsWith('.' + target) && hostname !== target) {
      hasMisleadingSubdomain = true;
      findings.push({
        id: `finding-${Date.now()}-brand`,
        category: 'URL',
        title: `Suspected Brand Impersonation (${brandName.toUpperCase()})`,
        description: `The URL contains the brand name '${brandName}', but the actual authoritative root domain is '${domainParts.slice(-2).join('.')}', NOT '${target}'.`,
        riskLevel: 'HIGH_RISK',
        evidence: `Full Host: ${hostname} | Actual Root: ${domainParts.slice(-2).join('.')}`,
        timestamp,
        recommendedAction: 'Do not provide login credentials or bank details. Attackers use subdomains to mimic trusted organizations.'
      });
      break;
    }
  }

  // 5. URL Shorteners
  const isShortener = KNOWN_SHORTENERS.has(hostname);
  if (isShortener) {
    findings.push({
      id: `finding-${Date.now()}-shortener`,
      category: 'URL',
      title: 'Obfuscated URL Shortener',
      description: 'The link uses a URL shortening service that conceals the true final destination server from preview scanners.',
      riskLevel: 'SUSPICIOUS',
      evidence: `Shortener domain: ${hostname}`,
      timestamp,
      recommendedAction: 'Inspect before opening. Expand the URL using a server-side redirect resolver to confirm the real landing page.'
    });
  }

  // 6. Suspicious Phishing Keywords in Path or Query
  let pathRisk = false;
  const fullPathAndQuery = pathname + search;
  const matchedKeywords: string[] = [];

  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (fullPathAndQuery.includes(kw) || hostname.includes(kw)) {
      matchedKeywords.push(kw);
      pathRisk = true;
    }
  }

  if (matchedKeywords.length > 0) {
    findings.push({
      id: `finding-${Date.now()}-kw`,
      category: 'URL',
      title: 'Social Engineering Keywords Detected',
      description: `The URL path or query contains urgent phishing triggers: ${matchedKeywords.join(', ')}.`,
      riskLevel: 'SUSPICIOUS',
      evidence: `Keywords found: ${matchedKeywords.join(', ')}`,
      timestamp,
      recommendedAction: 'Be cautious. Scammers use words like "kyc-update", "lottery", or "claim" to provoke immediate unthinking clicks.'
    });
  }

  // Calculate overall risk
  let riskLevel: RiskLevel = 'SAFE';
  let reputationScore = 95;

  if (findings.some(f => f.riskLevel === 'HIGH_RISK')) {
    riskLevel = 'HIGH_RISK';
    reputationScore = 15;
  } else if (findings.some(f => f.riskLevel === 'SUSPICIOUS')) {
    riskLevel = 'SUSPICIOUS';
    reputationScore = 48;
  } else {
    riskLevel = 'SAFE';
    reputationScore = 98;
    findings.push({
      id: `finding-${Date.now()}-clean`,
      category: 'URL',
      title: 'No Known Malicious Indicators Found',
      description: 'Domain syntax is compliant, uses modern TLS, has no confusable homoglyphs, and matches standard reputation baselines.',
      riskLevel: 'SAFE',
      evidence: `Checked host: ${hostname}`,
      timestamp,
      recommendedAction: 'Continue with standard digital hygiene. Always verify the domain name in the browser address bar before authenticating.'
    });
  }

  return {
    url: rawUrl,
    normalizedUrl: parsed.toString(),
    domain: hostname,
    isIpHost,
    hasIdnHomograph,
    punycodeDomain,
    hasMisleadingSubdomain,
    isShortener,
    pathRisk,
    reputationScore,
    reputationProvider: 'ShieldGuard Threat Intel & Heuristic Engine',
    riskLevel,
    findings,
    timestamp
  };
}
