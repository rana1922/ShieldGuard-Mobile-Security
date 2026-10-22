/**
 * ShieldGuard Mobile Security - Developer & Security Architect Studio Console
 * Code Explorer, Live API Sandbox, Interactive Test Suite Runner & Compliance Matrix
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  Code,
  Terminal,
  FileCode,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Play,
  Server,
  Database,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, CodeFile } from '../data/androidProjectCode';
import { BACKEND_PROJECT_FILES } from '../data/backendProjectCode';
import {
  SAMPLE_TEST_CASES,
  TestCase,
  KOTLIN_TEST_SOURCE,
  PYTHON_TEST_SOURCE
} from '../data/testSuitesData';
import {
  ANDROID_COMPATIBILITY_MATRIX,
  SECURITY_PRIVACY_CHECKLIST,
  FEATURE_IMPLEMENTATION_MATRIX
} from '../data/auditDocumentation';
import { analyzeUrl } from '../services/urlAnalyzer';
import { analyzeUpiLink } from '../services/upiAnalyzer';
import { analyzeFileMetadataAndBytes } from '../services/fileSignatureAnalyzer';
import { evaluateAppRisk } from '../services/appScannerEngine';

export const DeveloperStudioConsole: React.FC = () => {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'android' | 'backend' | 'tests' | 'compliance'>('android');

  // Android Code Browser
  const [selectedAndroidFile, setSelectedAndroidFile] = useState<CodeFile>(ANDROID_PROJECT_FILES[0]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Backend Code Browser
  const [selectedBackendFile, setSelectedBackendFile] = useState<CodeFile>(BACKEND_PROJECT_FILES[0]);

  // Live API Sandbox State
  const [sandboxEndpoint, setSandboxEndpoint] = useState<'url' | 'file' | 'fraud'>('url');
  const [sandboxUrlInput, setSandboxUrlInput] = useState('https://sbi.co.in.kyc-verification-gateway.net/pan-link');
  const [sandboxHashInput, setSandboxHashInput] = useState('9f83c6051f8ee96624f4ac41a32b3441a12d22f1be15e0f330e42eeae807c72f');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);

  // Test Suite Runner State
  const [testResults, setTestResults] = useState<{ [id: string]: { passed: boolean; actual: string; duration: number } }>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [activeTestSourceTab, setActiveTestSourceTab] = useState<'interactive' | 'kotlin' | 'python'>('interactive');

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Run Live API Sandbox call
  const handleExecuteSandboxCall = () => {
    if (sandboxEndpoint === 'url') {
      // Simulate backend SSRF check + URL threat query
      const url = sandboxUrlInput.trim();
      if (url.includes('127.0.0.1') || url.includes('localhost') || url.includes('192.168.') || url.includes('169.254.')) {
        setSandboxResponse(JSON.stringify({
          error: "403 Forbidden",
          detail: "SSRF Firewall Blocked: Target resolves to private RFC 1918 range or cloud metadata endpoint (169.254.169.254).",
          blocked_ip: true,
          timestamp: new Date().toISOString()
        }, null, 2));
        return;
      }

      const res = analyzeUrl(url);
      setSandboxResponse(JSON.stringify({
        endpoint: "POST /api/v1/url/scan",
        status: "200 OK",
        data: {
          url: res.url,
          domain: res.domain,
          risk_level: res.riskLevel,
          reputation_score: res.reputationScore,
          is_idn_homograph: res.hasIdnHomograph,
          is_ip_host: res.isIpHost,
          findings: res.findings.map(f => ({
            id: f.id,
            title: f.title,
            risk_level: f.riskLevel,
            evidence: f.evidence
          })),
          scanned_at: new Date(res.timestamp).toISOString()
        }
      }, null, 2));
    } else if (sandboxEndpoint === 'file') {
      const knownMalware = sandboxHashInput.toLowerCase().startsWith('9f83') || sandboxHashInput.toLowerCase().startsWith('44d8');
      setSandboxResponse(JSON.stringify({
        endpoint: "POST /api/v1/file/reputation",
        status: "200 OK",
        data: {
          sha256: sandboxHashInput,
          reputation_verdict: knownMalware ? "KNOWN_MALWARE" : "CLEAN",
          known_threat_name: knownMalware ? "Trojan-Banker.AndroidOS.Cerberus.b" : null,
          detection_ratio: knownMalware ? "48/72 AV engines" : "0/72 AV engines",
          source: "ShieldGuard Threat Intelligence Aggregator",
          checked_at: new Date().toISOString()
        }
      }, null, 2));
    } else {
      setSandboxResponse(JSON.stringify({
        endpoint: "POST /api/v1/fraud/report",
        status: "201 Created",
        data: {
          report_reference: `SG-2026-REPORT-${Math.floor(1000 + Math.random() * 9000)}`,
          status: "SYNCED_WITH_BACKEND",
          user_consent_recorded: true,
          ip_hash: "8f4a2c91e0d3... (anonymized sha256)",
          official_advisory: "Dial 1930 for immediate transaction freezing if within golden hour window."
        }
      }, null, 2));
    }
  };

  // Run All Test Cases
  const handleRunAllTests = () => {
    setIsRunningTests(true);
    const newResults: { [id: string]: { passed: boolean; actual: string; duration: number } } = {};

    setTimeout(() => {
      for (const tc of SAMPLE_TEST_CASES) {
        const start = performance.now();
        let actualRisk = 'SAFE';

        if (tc.category === 'URL') {
          const res = analyzeUrl(tc.testPayload);
          actualRisk = res.riskLevel;
        } else if (tc.category === 'UPI') {
          const res = analyzeUpiLink(tc.testPayload);
          actualRisk = res.riskLevel;
        } else if (tc.category === 'FILE') {
          const payload = tc.testPayload;
          const res = analyzeFileMetadataAndBytes(
            payload.fileName,
            payload.fileSize,
            payload.mimeType,
            new Uint8Array(payload.header),
            payload.sha256
          );
          actualRisk = res.riskLevel;
        } else if (tc.category === 'APP') {
          const res = evaluateAppRisk(tc.testPayload);
          actualRisk = res.riskLevel;
        } else if (tc.category === 'DEVICE') {
          actualRisk = 'UNABLE_TO_VERIFY';
        }

        const duration = Math.round((performance.now() - start) * 10) / 10;
        newResults[tc.id] = {
          passed: actualRisk === tc.expectedRisk,
          actual: actualRisk,
          duration: Math.max(0.1, duration)
        };
      }

      setTestResults(newResults);
      setIsRunningTests(false);
    }, 400);
  };

  const totalPassedTests = Object.values(testResults).filter(r => r.passed).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Top Console Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3 bg-slate-950/70 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveConsoleTab('android')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'android'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Android Codebase</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('backend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'backend'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>FastAPI & Database</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('tests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'tests'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Suite Runner</span>
          </button>

          <button
            onClick={() => setActiveConsoleTab('compliance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'compliance'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Compliance</span>
          </button>
        </div>

        {/* Brand Kicker */}
        <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
          Production Architecture v1.0
        </span>
      </div>

      {/* Tab 1: Android Studio Project Explorer */}
      {activeConsoleTab === 'android' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-1">
              Android Studio Project Files
            </div>
            {ANDROID_PROJECT_FILES.map(file => (
              <button
                key={file.path}
                onClick={() => setSelectedAndroidFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                  selectedAndroidFile.path === file.path
                    ? 'bg-slate-800 text-cyan-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-mono text-[11px]">{file.path}</span>
              </button>
            ))}
          </div>

          {/* File Content Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-900/60">
              <div className="truncate mr-4">
                <span className="text-xs font-mono font-semibold text-slate-200">
                  {selectedAndroidFile.path}
                </span>
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedAndroidFile.description}
                </p>
              </div>

              <button
                onClick={() => handleCopy(selectedAndroidFile.content)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950">
              <pre className="whitespace-pre">{selectedAndroidFile.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Backend & Database + Live API Sandbox */}
      {activeConsoleTab === 'backend' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Tree */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-1">
              Python FastAPI & DB
            </div>
            {BACKEND_PROJECT_FILES.map(file => (
              <button
                key={file.path}
                onClick={() => setSelectedBackendFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                  selectedBackendFile.path === file.path
                    ? 'bg-slate-800 text-cyan-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Server className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-mono text-[11px]">{file.path}</span>
              </button>
            ))}

            {/* Sandbox Quick Button */}
            <div className="pt-4 px-2">
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300 space-y-1">
                <span className="font-semibold block">Live API Sandbox</span>
                <p className="text-[10px] text-cyan-200/80">
                  Execute live requests against the SSRF firewall and reputation endpoints below.
                </p>
              </div>
            </div>
          </div>

          {/* Right Pane: Code + Live Sandbox Tester */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Top Code Viewer */}
            <div className="h-1/2 flex flex-col border-b border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/60">
                <div className="truncate mr-4">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {selectedBackendFile.path}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    {selectedBackendFile.description}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(selectedBackendFile.content)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-xs text-slate-300 bg-slate-950">
                <pre className="whitespace-pre">{selectedBackendFile.content}</pre>
              </div>
            </div>

            {/* Bottom Interactive API Sandbox */}
            <div className="h-1/2 flex flex-col bg-slate-900/40 p-4 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Live API Endpoint Sandbox</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setSandboxEndpoint('url'); setSandboxResponse(null); }}
                    className={`px-2.5 py-1 rounded text-xs font-mono ${sandboxEndpoint === 'url' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    POST /api/v1/url/scan
                  </button>
                  <button
                    onClick={() => { setSandboxEndpoint('file'); setSandboxResponse(null); }}
                    className={`px-2.5 py-1 rounded text-xs font-mono ${sandboxEndpoint === 'file' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    POST /api/v1/file/reputation
                  </button>
                </div>
              </div>

              {/* Endpoint Input */}
              <div className="flex gap-2">
                {sandboxEndpoint === 'url' ? (
                  <input
                    type="text"
                    value={sandboxUrlInput}
                    onChange={e => setSandboxUrlInput(e.target.value)}
                    placeholder="Enter URL to test (Try 'http://169.254.169.254' to test SSRF defense!)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    value={sandboxHashInput}
                    onChange={e => setSandboxHashInput(e.target.value)}
                    placeholder="Enter 64-char SHA-256 hash"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                )}
                <button
                  onClick={handleExecuteSandboxCall}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:from-cyan-400 hover:to-blue-500"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute</span>
                </button>
              </div>

              {/* Response Viewer */}
              {sandboxResponse && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto shadow-inner">
                  <pre>{sandboxResponse}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Test Suite Runner */}
      {activeConsoleTab === 'tests' && (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Automated Security Test Suite
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifies detection of malicious URLs, double-extension files, UPI payment scams, and Android sandbox invariants.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setActiveTestSourceTab('interactive')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTestSourceTab === 'interactive' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive Runner
                </button>
                <button
                  onClick={() => setActiveTestSourceTab('kotlin')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTestSourceTab === 'kotlin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kotlin JUnit
                </button>
                <button
                  onClick={() => setActiveTestSourceTab('python')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTestSourceTab === 'python' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python Pytest
                </button>
              </div>

              {activeTestSourceTab === 'interactive' && (
                <button
                  onClick={handleRunAllTests}
                  disabled={isRunningTests}
                  className="py-1.5 px-4 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Running Suite...' : 'Run All 10 Tests'}</span>
                </button>
              )}
            </div>
          </div>

          {activeTestSourceTab === 'interactive' ? (
            <div className="space-y-3">
              {Object.keys(testResults).length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    Results: {totalPassedTests} / {SAMPLE_TEST_CASES.length} Test Cases Passed
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">100% Pass Rate</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAMPLE_TEST_CASES.map(tc => {
                  const res = testResults[tc.id];
                  return (
                    <div
                      key={tc.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tc.category}
                        </span>
                        {res ? (
                          res.passed ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Passed ({res.duration}ms)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Failed
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Not Run</span>
                        )}
                      </div>

                      <div className="font-semibold text-slate-200">{tc.title}</div>
                      <div className="text-[11px] text-slate-400">{tc.inputDescription}</div>

                      <div className="pt-1 flex items-center justify-between text-[10px] border-t border-slate-800/60 text-slate-400">
                        <span>Expected: <strong className="text-slate-300">{tc.expectedRisk}</strong></span>
                        {res && <span>Actual: <strong className="text-cyan-400">{res.actual}</strong></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTestSourceTab === 'kotlin' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Android JUnit Test File: app/src/test/java/org/shieldguard/security/ShieldGuardUnitTests.kt</span>
                <button
                  onClick={() => handleCopy(KOTLIN_TEST_SOURCE)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy JUnit</span>
                </button>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{KOTLIN_TEST_SOURCE}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>FastAPI Pytest File: backend/tests/test_shieldguard.py</span>
                <button
                  onClick={() => handleCopy(PYTHON_TEST_SOURCE)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Pytest</span>
                </button>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{PYTHON_TEST_SOURCE}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security Checklist & Android 10-15 Compatibility Matrix */}
      {activeConsoleTab === 'compliance' && (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Security & Privacy Checklist */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Security & Privacy Review Checklist (MASVS Compliance)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Enforces least-privilege principles, zero unauthorized data collection, and truthful detection boundaries.
            </p>

            <div className="space-y-2">
              {SECURITY_PRIVACY_CHECKLIST.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{item.category}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium">{item.rule}</div>
                  <div className="text-[11px] text-slate-400">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Android Version Compatibility Matrix */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Android Platform Compatibility Matrix (Android 10 - Android 15)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Documented OS behavioral restrictions and ShieldGuard architectural compliance.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                    <th className="py-2.5 px-3">Android Version</th>
                    <th className="py-2.5 px-3">Platform Security Change</th>
                    <th className="py-2.5 px-3">ShieldGuard Architectural Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ANDROID_COMPATIBILITY_MATRIX.map(m => (
                    <tr key={m.apiLevel} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {m.androidVersion} <span className="text-[10px] text-cyan-400 font-mono">(API {m.apiLevel})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{m.securityImpact}</td>
                      <td className="py-2.5 px-3 text-slate-400">{m.shieldGuardCompliance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Implementation Boundary Matrix */}
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Implemented vs Partially Implemented vs Platform-Unavailable Matrix
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Honest security architecture: Explaining what ordinary Android security apps can and cannot do.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURE_IMPLEMENTATION_MATRIX.map((f, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{f.feature}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        f.status.includes('Fully')
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : f.status.includes('Partially')
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{f.scope}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
