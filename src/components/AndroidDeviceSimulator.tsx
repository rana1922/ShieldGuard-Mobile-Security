/**
 * ShieldGuard Mobile Security - Interactive Android 14/15 Device Simulator
 * Emulates the Jetpack Compose Material 3 Mobile Experience
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Globe,
  CreditCard,
  Smartphone,
  ExternalLink,
  Search,
  CheckCircle,
  Copy,
  Upload,
  RefreshCw,
  PhoneCall,
  History,
  Info,
  ChevronRight,
  Lock,
  Unlock,
  AlertOctagon,
  FileText
} from 'lucide-react';
import {
  RiskLevel,
  InstalledApp,
  DeviceAuditItem,
  UrlScanResult,
  UpiAnalysisResult,
  FileScanResult,
  FraudReport,
  ScanHistoryRecord
} from '../types/security';
import { analyzeUrl } from '../services/urlAnalyzer';
import { analyzeUpiLink } from '../services/upiAnalyzer';
import { analyzeFileMetadataAndBytes, computeSha256 } from '../services/fileSignatureAnalyzer';
import { evaluateDeviceSecurity, DeviceConfigState, DEFAULT_DEVICE_STATE } from '../services/deviceAuditEngine';
import { INITIAL_INSTALLED_APPS } from '../services/appScannerEngine';

interface Props {
  onScanHistoryAdd?: (record: ScanHistoryRecord) => void;
}

export const AndroidDeviceSimulator: React.FC<Props> = ({ onScanHistoryAdd }) => {
  // Navigation inside the Android App
  const [activeTab, setActiveTab] = useState<'dashboard' | 'apps' | 'links' | 'upi' | 'files' | 'audit' | 'reports'>('dashboard');

  // Device Audit state (toggleable in simulator)
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfigState>(DEFAULT_DEVICE_STATE);
  const auditItems = evaluateDeviceSecurity(deviceConfig);

  // App Scanner State
  const [appsList, setAppsList] = useState<InstalledApp[]>(INITIAL_INSTALLED_APPS);
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [appInfoModalOpen, setAppInfoModalOpen] = useState(false);

  // Dashboard Scanning Animation State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhaseText, setScanPhaseText] = useState('Idle');

  // URL Scanner State
  const [urlInput, setUrlInput] = useState('https://sbi.co.in.kyc-verification-gateway.net/pan-link');
  const [urlScanResult, setUrlScanResult] = useState<UrlScanResult | null>(() =>
    analyzeUrl('https://sbi.co.in.kyc-verification-gateway.net/pan-link')
  );

  // UPI Guard State
  const [upiInput, setUpiInput] = useState('upi://pay?pa=cashback.claim@oksbi&pn=Discom+Refund+Service&am=2500&cu=INR&tn=Electricity+Bill+Refund+KYC');
  const [upiResult, setUpiResult] = useState<UpiAnalysisResult | null>(() =>
    analyzeUpiLink('upi://pay?pa=cashback.claim@oksbi&pn=Discom+Refund+Service&am=2500&cu=INR&tn=Electricity+Bill+Refund+KYC')
  );
  const [upiWarningModalOpen, setUpiWarningModalOpen] = useState(false);

  // File Scanner State
  const [fileScanResult, setFileScanResult] = useState<FileScanResult | null>(() => {
    const dummyHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
    return analyzeFileMetadataAndBytes(
      'salary_slip_october.pdf.apk',
      4210000,
      'application/vnd.android.package-archive',
      dummyHeader,
      '9f83c6051f8ee96624f4ac41a32b3441a12d22f1be15e0f330e42eeae807c72f'
    );
  });
  const [isFileAnalyzing, setIsFileAnalyzing] = useState(false);

  // Fraud Report State
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([
    {
      id: 'rep-1',
      referenceNumber: 'SG-2026-REPORT-8491',
      category: 'UPI_SCAM',
      targetIdentifier: 'refundservice2026@oksbi',
      amountLost: '₹4,500',
      description: 'Scammer sent SMS claiming electricity connection would be disconnected unless KYC was updated via link.',
      userConsent: true,
      reportedAt: Date.now() - 3600000 * 4,
      status: 'SYNCED_WITH_BACKEND',
      officialHelplineContact: 'National Cybercrime Helpline: 1930'
    }
  ]);
  const [reportCategory, setReportCategory] = useState<FraudReport['category']>('UPI_SCAM');
  const [reportTarget, setReportTarget] = useState('');
  const [reportAmount, setReportAmount] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportConsent, setReportConsent] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>([
    {
      id: 'hist-1',
      timestamp: Date.now() - 3600000 * 2,
      type: 'URL_SCAN',
      target: 'sbi.co.in.kyc-gateway.net',
      riskLevel: 'HIGH_RISK',
      findingsCount: 2,
      summary: 'Brand Impersonation & Phishing Keywords detected'
    },
    {
      id: 'hist-2',
      timestamp: Date.now() - 3600000 * 5,
      type: 'FILE_SCAN',
      target: 'salary_slip_october.pdf.apk',
      riskLevel: 'HIGH_RISK',
      findingsCount: 2,
      summary: 'Double extension masquerade (APK disguised as PDF)'
    },
    {
      id: 'hist-3',
      timestamp: Date.now() - 3600000 * 8,
      type: 'DEVICE_AUDIT',
      target: 'Android 14 Security Baseline',
      riskLevel: 'SAFE',
      findingsCount: 0,
      summary: 'Firmware patch and hardware attestation passed'
    }
  ]);

  // Overall posture calculation
  const hasHighRiskThreats = appsList.some(a => a.riskLevel === 'HIGH_RISK') ||
    auditItems.some(i => i.riskLevel === 'HIGH_RISK');
  const hasSuspiciousThreats = appsList.some(a => a.riskLevel === 'SUSPICIOUS') ||
    auditItems.some(i => i.riskLevel === 'SUSPICIOUS');

  const overallStatusText = hasHighRiskThreats ? 'High Risk' : (hasSuspiciousThreats ? 'Action Recommended' : 'Device Protected');
  const overallRiskColor = hasHighRiskThreats ? 'text-rose-400' : (hasSuspiciousThreats ? 'text-amber-400' : 'text-emerald-400');
  const overallBadgeBg = hasHighRiskThreats ? 'bg-rose-500/10 border-rose-500/30' : (hasSuspiciousThreats ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30');

  // Trigger Device Scan Handler
  const handleTriggerDeviceScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0.1);
    setScanPhaseText('Enumerating installed packages (<queries>)...');

    setTimeout(() => {
      setScanProgress(0.35);
      setScanPhaseText('Inspecting APK signing certificates & sideload origin...');
    }, 500);

    setTimeout(() => {
      setScanProgress(0.65);
      setScanPhaseText('Analyzing dangerous permission combinations & overlays...');
    }, 1100);

    setTimeout(() => {
      setScanProgress(0.85);
      setScanPhaseText('Auditing Android OS patch level & keyguard state...');
    }, 1700);

    setTimeout(() => {
      setScanProgress(1.0);
      setScanPhaseText('Scan Complete');
      setIsScanning(false);

      const newRec: ScanHistoryRecord = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        type: 'FULL_SCAN',
        target: 'Full Device Hygiene Audit',
        riskLevel: hasHighRiskThreats ? 'HIGH_RISK' : 'SAFE',
        findingsCount: hasHighRiskThreats ? 2 : 0,
        summary: `Inspected ${appsList.length} packages and system hygiene flags.`
      };
      setScanHistory(prev => [newRec, ...prev]);
      if (onScanHistoryAdd) onScanHistoryAdd(newRec);
    }, 2300);
  };

  // URL Scan Trigger
  const handleScanUrl = (targetUrl: string) => {
    const res = analyzeUrl(targetUrl);
    setUrlScanResult(res);
    const newRec: ScanHistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      type: 'URL_SCAN',
      target: res.domain,
      riskLevel: res.riskLevel,
      findingsCount: res.findings.length,
      summary: res.findings[0]?.title || 'URL scanned'
    };
    setScanHistory(prev => [newRec, ...prev]);
    if (onScanHistoryAdd) onScanHistoryAdd(newRec);
  };

  // UPI Scan Trigger
  const handleScanUpi = (targetUpi: string) => {
    const res = analyzeUpiLink(targetUpi);
    setUpiResult(res);
    const newRec: ScanHistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: Date.now(),
      type: 'UPI_SCAN',
      target: res.payeeVpa,
      riskLevel: res.riskLevel,
      findingsCount: res.warnings.length,
      summary: res.isActionRecommended
    };
    setScanHistory(prev => [newRec, ...prev]);
    if (onScanHistoryAdd) onScanHistoryAdd(newRec);
  };

  // File Upload Handler (Computes real SHA-256)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const sha256 = await computeSha256(arrayBuffer);
      const headerBytes = new Uint8Array(arrayBuffer.slice(0, 16));

      const res = analyzeFileMetadataAndBytes(
        file.name,
        file.size,
        file.type,
        headerBytes,
        sha256
      );
      setFileScanResult(res);

      const newRec: ScanHistoryRecord = {
        id: `hist-${Date.now()}`,
        timestamp: Date.now(),
        type: 'FILE_SCAN',
        target: file.name,
        riskLevel: res.riskLevel,
        findingsCount: res.findings.length,
        summary: res.findings[0]?.title || 'File signature inspected'
      };
      setScanHistory(prev => [newRec, ...prev]);
      if (onScanHistoryAdd) onScanHistoryAdd(newRec);
    } catch {
      // fallback
    } finally {
      setIsFileAnalyzing(false);
    }
  };

  // Fraud Report Submit
  const handleSubmitFraudReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportConsent || !reportTarget || !reportDescription) return;

    const refNo = `SG-2026-REPORT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: FraudReport = {
      id: `rep-${Date.now()}`,
      referenceNumber: refNo,
      category: reportCategory,
      targetIdentifier: reportTarget,
      amountLost: reportAmount || undefined,
      description: reportDescription,
      userConsent: true,
      reportedAt: Date.now(),
      status: 'SYNCED_WITH_BACKEND',
      officialHelplineContact: 'National Cybercrime Helpline: 1930 (Toll Free)'
    };

    setFraudReports(prev => [newReport, ...prev]);
    setReportSuccessMsg(`Report ${refNo} successfully recorded and synced.`);
    setReportTarget('');
    setReportAmount('');
    setReportDescription('');
    setReportConsent(false);
    setTimeout(() => setReportSuccessMsg(''), 5000);
  };

  const filteredApps = appsList.filter(a =>
    a.appName.toLowerCase().includes(appSearch.toLowerCase()) ||
    a.packageName.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Smartphone Outer Chassis */}
      <div className="relative w-full max-w-[412px] h-[860px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col overflow-hidden">
        
        {/* Hardware Bezel Notch / Punch-hole Speaker Slit */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 px-3 py-1 bg-slate-950 rounded-full w-28 h-5 border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-500/50"></div>
          </div>
          <div className="w-10 h-1 bg-slate-800 rounded-full"></div>
        </div>

        {/* Android Screen Container */}
        <div className="relative w-full h-full bg-slate-950 rounded-[38px] flex flex-col overflow-hidden text-slate-100 font-sans border border-slate-800/80 select-none">
          
          {/* Android Status Bar */}
          <div className="h-10 pt-2 px-6 flex items-center justify-between text-xs font-medium text-slate-400 shrink-0 z-40 bg-slate-950">
            <span>21:52</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">5G</span>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3C7.5 3 3.7 4.9 1 8l11 13L23 8C20.3 4.9 16.5 3 12 3z"/>
              </svg>
              <div className="w-5 h-2.5 rounded-sm border border-slate-400 p-0.5 flex items-center">
                <div className="h-full bg-emerald-400 w-4/5 rounded-2xs"></div>
              </div>
            </div>
          </div>

          {/* Android App Header */}
          <header className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 p-1 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  ShieldGuard
                  <span className="text-[10px] font-normal text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">Android 14</span>
                </h1>
                <p className="text-[10px] text-slate-400">Threat Defense & Sandbox Monitor</p>
              </div>
            </div>

            {/* Quick Audit / Info Trigger */}
            <button
              onClick={() => setActiveTab(activeTab === 'audit' ? 'dashboard' : 'audit')}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                activeTab === 'audit' 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Device Security Audit"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium hidden sm:inline">Audit</span>
            </button>
          </header>

          {/* Scrollable Screen Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            
            {/* 1. DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                {/* Security Posture Card */}
                <div className={`p-4 rounded-2xl border ${overallBadgeBg} flex flex-col items-center text-center relative overflow-hidden`}>
                  <div className="w-16 h-16 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center my-1 relative shadow-inner">
                    {hasHighRiskThreats ? (
                      <AlertOctagon className="w-8 h-8 text-rose-400" />
                    ) : hasSuspiciousThreats ? (
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>

                  <h2 className={`text-base font-bold mt-2 ${overallRiskColor}`}>
                    {overallStatusText}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                    {hasHighRiskThreats
                      ? 'Detected 1 high-risk trojanized app and dangerous SMS overlay permissions.'
                      : 'Android sandbox intact. No active overlay tapjacking or phishing detected.'}
                  </p>

                  {/* Scan Progress Bar if running */}
                  {isScanning && (
                    <div className="w-full mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span className="truncate max-w-[220px]">{scanPhaseText}</span>
                        <span className="font-mono">{Math.round(scanProgress * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                          style={{ width: `${scanProgress * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Primary Scan Button */}
                  <button
                    onClick={handleTriggerDeviceScan}
                    disabled={isScanning}
                    className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanning System...' : 'Scan Device Now'}</span>
                  </button>
                </div>

                {/* Quick Security Modules Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setActiveTab('apps')}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-left hover:border-slate-700 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-bold">1 Threat</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">App Scanner</div>
                    <div className="text-[10px] text-slate-400">{appsList.length} packages visible</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('links')}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-left hover:border-slate-700 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-medium">Active</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">Phishing Scanner</div>
                    <div className="text-[10px] text-slate-400">IDN & brand check</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('upi')}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-left hover:border-slate-700 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-medium">Strict</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">Payment & UPI</div>
                    <div className="text-[10px] text-slate-400">Scam keyword filter</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('files')}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-left hover:border-slate-700 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 font-medium">SAF</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">File Scanner</div>
                    <div className="text-[10px] text-slate-400">Double ext detection</div>
                  </button>
                </div>

                {/* Android Security Model Honest Disclaimer */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Android Sandbox Compliance</span>
                  </div>
                  <p>
                    ShieldGuard operates within official Android platform security boundaries. Ordinary apps cannot inspect the private RAM or internal storage of other applications. Findings are strictly evidence-based.
                  </p>
                </div>

                {/* Recent Scan History Feed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      Recent Activity
                    </span>
                    <span className="text-[10px]">{scanHistory.length} events logged</span>
                  </div>

                  <div className="space-y-1.5">
                    {scanHistory.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <div className="font-medium text-slate-200 truncate">{item.target}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.summary}</div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                            item.riskLevel === 'HIGH_RISK'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : item.riskLevel === 'SUSPICIOUS'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}
                        >
                          {item.riskLevel.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. APP SCANNER VIEW */}
            {activeTab === 'apps' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-200">Installed App Analysis</h2>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {filteredApps.length} apps inspected
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={e => setAppSearch(e.target.value)}
                    placeholder="Search package name or app..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* App List */}
                <div className="space-y-2">
                  {filteredApps.map(app => (
                    <div
                      key={app.packageName}
                      onClick={() => {
                        setSelectedApp(app);
                        setAppInfoModalOpen(true);
                      }}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 truncate">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            app.riskLevel === 'HIGH_RISK'
                              ? 'bg-rose-500/20 text-rose-400'
                              : app.riskLevel === 'SUSPICIOUS'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {app.riskLevel === 'HIGH_RISK' ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                            {app.appName}
                            {app.isSideloaded && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Sideload
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {app.packageName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                            {app.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            app.riskLevel === 'HIGH_RISK'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                              : app.riskLevel === 'SUSPICIOUS'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          }`}
                        >
                          {app.riskLevel.replace('_', ' ')}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. URL PHISHING SCANNER VIEW */}
            {activeTab === 'links' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200">Suspicious Link & Phishing Guard</h2>
                  <p className="text-[10px] text-slate-400">
                    Inspects IDN homoglyphs, brand spoofing subdomains, and IP hosts without loading malicious JavaScript.
                  </p>
                </div>

                {/* Input Area */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="Paste link: https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScanUrl(urlInput)}
                      className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Analyze URL</span>
                    </button>
                  </div>

                  {/* Preset Test Links */}
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-400 mb-1.5">Try sample test payloads:</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          const u = 'https://xn--aypal-1qa.com/login-verification';
                          setUrlInput(u);
                          handleScanUrl(u);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Cyrillic Homoglyph (рaypal)
                      </button>
                      <button
                        onClick={() => {
                          const u = 'https://sbi.co.in.kyc-verification-gateway.net/pan-link';
                          setUrlInput(u);
                          handleScanUrl(u);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Subdomain Bank Spoof
                      </button>
                      <button
                        onClick={() => {
                          const u = 'http://185.220.101.5/auth/secure.php';
                          setUrlInput(u);
                          handleScanUrl(u);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Raw IP Host
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scan Results Card */}
                {urlScanResult && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        {urlScanResult.riskLevel === 'HIGH_RISK' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-xs font-bold text-slate-200">
                          {urlScanResult.riskLevel.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Reputation: {urlScanResult.reputationScore}/100
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800/80">
                      Host: {urlScanResult.domain}
                    </div>

                    {/* Findings list */}
                    <div className="space-y-1.5">
                      {urlScanResult.findings.map(finding => (
                        <div
                          key={finding.id}
                          className="p-2 rounded bg-slate-950/70 border border-slate-800 text-[11px] space-y-1"
                        >
                          <div className="font-semibold text-slate-200">{finding.title}</div>
                          <div className="text-slate-400 text-[10px]">{finding.description}</div>
                          <div className="text-[10px] text-cyan-400 font-medium">
                            Action: {finding.recommendedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. PAYMENT & UPI GUARD VIEW */}
            {activeTab === 'upi' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200">Payment & UPI Fraud Protection</h2>
                  <p className="text-[10px] text-slate-400">
                    Parses upi:// payment links and QR payloads. Educates users before dispatching funds.
                  </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={upiInput}
                    onChange={e => setUpiInput(e.target.value)}
                    placeholder="upi://pay?pa=... or merchant@upi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />

                  <button
                    onClick={() => handleScanUpi(upiInput)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Inspect Payment Link</span>
                  </button>

                  {/* Preset UPI Scams */}
                  <div className="pt-1">
                    <div className="text-[10px] text-slate-400 mb-1.5">Test scam presets:</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          const s = 'upi://pay?pa=cashback.claim@oksbi&pn=Discom+Refund+Service&am=2500&cu=INR&tn=Electricity+Bill+Refund+KYC';
                          setUpiInput(s);
                          handleScanUpi(s);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Refund / KYC Scam
                      </button>
                      <button
                        onClick={() => {
                          const s = 'upi://pay?pa=support.service99@upi&pn=Customer+Support&am=0.0&cu=INR';
                          setUpiInput(s);
                          handleScanUpi(s);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Zero Amount Collect Trap
                      </button>
                      <button
                        onClick={() => {
                          const s = 'upi://pay?pa=swiggy.orders@icici&pn=Swiggy+Delivery&mc=5812&am=420.00&cu=INR&tn=Dinner+Order';
                          setUpiInput(s);
                          handleScanUpi(s);
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                      >
                        Valid Merchant (Swiggy)
                      </button>
                    </div>
                  </div>
                </div>

                {/* UPI Result Details */}
                {upiResult && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-slate-200">UPI Analysis Result</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          upiResult.riskLevel === 'HIGH_RISK'
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : upiResult.riskLevel === 'SUSPICIOUS'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        {upiResult.riskLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <div className="text-[10px] text-slate-400">Payee VPA:</div>
                        <div className="font-mono text-slate-200 truncate">{upiResult.payeeVpa}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                        <div className="text-[10px] text-slate-400">Amount:</div>
                        <div className="font-semibold text-slate-200">
                          {upiResult.amount ? `₹${upiResult.amount}` : 'Open / Unspecified'}
                        </div>
                      </div>
                    </div>

                    {upiResult.transactionNote && (
                      <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]">
                        <div className="text-[10px] text-slate-400">Transaction Note:</div>
                        <div className="text-slate-300 font-medium">{upiResult.transactionNote}</div>
                      </div>
                    )}

                    {/* Warnings */}
                    {upiResult.warnings.map((warn, i) => (
                      <div key={i} className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300">
                        {warn}
                      </div>
                    ))}

                    {/* Critical Golden Rule Notice */}
                    <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Golden UPI Rule:</span>
                      </div>
                      <p className="text-[10px] text-amber-200/90 leading-relaxed">
                        Entering your UPI PIN always DEDUCTS money from your bank account. You NEVER need to enter a UPI PIN or scan a QR code to RECEIVE money.
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setUpiWarningModalOpen(true)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Simulate Payment Dispatch</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. DOWNLOAD & FILE SCANNER VIEW */}
            {activeTab === 'files' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200">Download & File Scanner (SAF)</h2>
                  <p className="text-[10px] text-slate-400">
                    Uses Android Storage Access Framework. Computes cryptographic SHA-256 and detects disguised executables.
                  </p>
                </div>

                {/* Upload or Drop */}
                <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="cursor-pointer text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                      <span>Choose file from device</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      PDF, APK, images, or archives (Local SHA-256 computed in browser)
                    </p>
                  </div>
                </div>

                {/* Preset Suspicious Files */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1.5">Load test files:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        const dummyHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
                        const res = analyzeFileMetadataAndBytes(
                          'invoice_salary.pdf.apk',
                          3850000,
                          'application/vnd.android.package-archive',
                          dummyHeader,
                          '9f83c6051f8ee96624f4ac41a32b3441a12d22f1be15e0f330e42eeae807c72f'
                        );
                        setFileScanResult(res);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                    >
                      invoice.pdf.apk (Double Ext)
                    </button>
                    <button
                      onClick={() => {
                        const dummyHeader = new Uint8Array([0x4D, 0x5A]);
                        const res = analyzeFileMetadataAndBytes(
                          'id_photo.jpg',
                          720000,
                          'image/jpeg',
                          dummyHeader,
                          '44d88612fea8a8f36de82e1278abb02f3e9924b3a82f32f71672aba40d1f7312'
                        );
                        setFileScanResult(res);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                    >
                      photo.jpg (Disguised MZ Exe)
                    </button>
                    <button
                      onClick={() => {
                        const dummyHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
                        const res = analyzeFileMetadataAndBytes(
                          'annual_report.pdf',
                          1420000,
                          'application/pdf',
                          dummyHeader,
                          'e1b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b111'
                        );
                        setFileScanResult(res);
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                    >
                      annual_report.pdf (Clean)
                    </button>
                  </div>
                </div>

                {/* File Inspection Card */}
                {fileScanResult && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                        {fileScanResult.fileName}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          fileScanResult.riskLevel === 'HIGH_RISK'
                            ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : fileScanResult.riskLevel === 'SUSPICIOUS'
                            ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        {fileScanResult.riskLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-slate-400">
                      <div>Format: <span className="text-slate-200">{fileScanResult.detectedSignature}</span></div>
                      <div className="truncate">SHA-256: <span className="text-slate-300">{fileScanResult.sha256}</span></div>
                      <div>Size: <span className="text-slate-300">{(fileScanResult.fileSize / 1024).toFixed(1)} KB</span></div>
                    </div>

                    {fileScanResult.findings.map(finding => (
                      <div
                        key={finding.id}
                        className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="font-semibold text-slate-200">{finding.title}</div>
                        <div className="text-slate-400 text-[10px]">{finding.description}</div>
                        <div className="text-[10px] text-cyan-400 font-medium">
                          Remediation: {finding.recommendedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. DEVICE SECURITY AUDIT VIEW */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-slate-200">Device Security Hygiene</h2>
                    <p className="text-[10px] text-slate-400">Accessible Android OS signals & boundaries</p>
                  </div>
                  <button
                    onClick={() => {
                      // Toggle a sample state to test posture changes
                      setDeviceConfig(prev => ({
                        ...prev,
                        isScreenLockEnabled: !prev.isScreenLockEnabled,
                        hasUnknownSourceApps: !prev.hasUnknownSourceApps
                      }));
                    }}
                    className="text-[9px] px-2 py-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700"
                  >
                    Toggle Flags
                  </button>
                </div>

                {/* Audit Items */}
                <div className="space-y-2">
                  {auditItems.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            item.status === 'PASSED'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : item.status === 'FAILED'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : item.status === 'WARNING'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                              : 'text-slate-400 bg-slate-800/50 border-slate-700'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300">{item.value}</div>
                      <div className="text-[10px] text-slate-400">{item.explanation}</div>
                      {item.platformConstraint && (
                        <div className="text-[9px] text-slate-500 italic">
                          Platform boundary: {item.platformConstraint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. FRAUD REPORTING VIEW */}
            {activeTab === 'reports' && (
              <div className="space-y-3.5">
                <div>
                  <h2 className="text-xs font-bold text-slate-200">Report Cybercrime & Scam</h2>
                  <p className="text-[10px] text-slate-400">
                    File local evidence and connect with official Indian National Cybercrime resources.
                  </p>
                </div>

                {/* Official Helpline Notice */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5" />
                      Cyber Helpline 1930
                    </span>
                    <a
                      href="https://cybercrime.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-cyan-400 underline flex items-center gap-0.5"
                    >
                      cybercrime.gov.in
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    For ongoing financial fraud, dial <strong>1930</strong> immediately to request transaction freezing by the Citizen Financial Cyber Fraud Reporting System.
                  </p>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleSubmitFraudReport} className="space-y-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400">Fraud Category</label>
                    <select
                      value={reportCategory}
                      onChange={e => setReportCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 mt-1"
                    >
                      <option value="UPI_SCAM">UPI / QR Payment Scam</option>
                      <option value="PHISHING_URL">Phishing URL / Bank Login Impersonation</option>
                      <option value="MALICIOUS_APP">Sideloaded Malicious APK / Spyware</option>
                      <option value="SUSPICIOUS_DOWNLOAD">Deceptive File / Double Extension</option>
                      <option value="IMPERSONATION">Brand / Officer Impersonation</option>
                      <option value="OTHER">Other Fraud</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Target VPA, URL, or Package Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. scammer@okaxis or https://..."
                      value={reportTarget}
                      onChange={e => setReportTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Amount Lost (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹5,000"
                      value={reportAmount}
                      onChange={e => setReportAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Incident Description</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Describe what occurred, SMS received, or instructions given..."
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 mt-1"
                    ></textarea>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={reportConsent}
                      onChange={e => setReportConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="consent" className="text-[10px] text-slate-400 leading-tight">
                      I consent to submitting this technical threat telemetry for fraud analysis. No banking passwords or PINs are included.
                    </label>
                  </div>

                  {reportSuccessMsg && (
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-[10px] text-emerald-300">
                      {reportSuccessMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!reportConsent}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors mt-2"
                  >
                    Submit Fraud Incident Report
                  </button>
                </form>

                {/* Submitted Reports History */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold">Your Local Incident Records</div>
                  {fraudReports.map(rep => (
                    <div key={rep.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-cyan-400 font-bold">{rep.referenceNumber}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {rep.status}
                        </span>
                      </div>
                      <div className="text-slate-300 font-medium truncate">{rep.targetIdentifier}</div>
                      <div className="text-[10px] text-slate-400">{rep.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Android Bottom Navigation Bar (5 Destinations) */}
          <nav className="h-14 bg-slate-950 border-t border-slate-800/80 px-2 grid grid-cols-5 items-center shrink-0 z-40">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('apps')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'apps' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">Apps</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'links' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">Links</span>
            </button>

            <button
              onClick={() => setActiveTab('upi')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'upi' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">UPI</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'reports' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">Report</span>
            </button>
          </nav>

          {/* Android Gesture Navigation Bar pill */}
          <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* App Details & Android App Info Modal */}
      {appInfoModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{selectedApp.appName}</h3>
                <p className="text-[11px] font-mono text-slate-400">{selectedApp.packageName}</p>
              </div>
              <button
                onClick={() => setAppInfoModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Installation Source:</span>
                <span className="font-semibold text-slate-200">{selectedApp.installSource}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target SDK:</span>
                <span className="font-mono text-slate-200">{selectedApp.targetSdk} (API {selectedApp.targetSdk})</span>
              </div>
              <div className="py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Signing Certificate SHA-256:</span>
                <div className="font-mono text-[9px] text-slate-300 break-all bg-slate-950 p-1.5 rounded mt-1 border border-slate-800">
                  {selectedApp.certificateFingerprint}
                </div>
              </div>
              <div className="py-1">
                <span className="text-slate-400">Requested Dangerous Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedApp.dangerousPermissions.map(p => (
                    <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                      {p.replace('android.permission.', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  alert(`[Android Intent Triggered]\nAction: android.settings.APPLICATION_DETAILS_SETTINGS\nPackage: ${selectedApp.packageName}\n\nNavigating to Android System Settings for user-controlled review or uninstallation.`);
                  setAppInfoModalOpen(false);
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Android App Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Security Warning Modal */}
      {upiWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-100">External Payment Warning</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ShieldGuard does not handle funds or initiate financial transactions. You are about to be redirected to your external banking application.
            </p>

            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-200 space-y-1">
              <span className="font-bold">Important Scam Defense:</span>
              <p>
                If anyone instructed you that entering a PIN will give you a cashback or prize, CANCEL immediately.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUpiWarningModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Cancel Transfer
              </button>
              <button
                onClick={() => {
                  alert('[Android Payment Intent Triggered]\nIntent: android.intent.action.VIEW\nData: upi://pay?...\n\nDispatched safely to system package manager.');
                  setUpiWarningModalOpen(false);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
