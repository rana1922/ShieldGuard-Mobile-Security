/**
 * ShieldGuard Mobile Security - Main Application Entry
 * Production-Oriented Android Mobile Security Architecture & Interactive Simulation
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Smartphone,
  Code,
  Terminal,
  Columns,
  Layers,
  CheckCircle,
  AlertTriangle,
  Lock,
  PhoneCall,
  ExternalLink,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { AndroidDeviceSimulator } from './components/AndroidDeviceSimulator';
import { DeveloperStudioConsole } from './components/DeveloperStudioConsole';
import { MobileInstallModal } from './components/MobileInstallModal';
import { ScanHistoryRecord } from './types/security';

export default function App() {
  const [viewMode, setViewMode] = useState<'split' | 'phone' | 'console'>('split');
  const [globalHistory, setGlobalHistory] = useState<ScanHistoryRecord[]>([]);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const handleScanHistoryAdd = (rec: ScanHistoryRecord) => {
    setGlobalHistory(prev => [rec, ...prev]);
  };

  const appCurrentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-jijqizwtibmkhstceckylj-319163783336.asia-southeast1.run.app';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Mobile Install & APK Modal */}
      <MobileInstallModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        appUrl={appCurrentUrl}
      />

      {/* 
        Top Bar Contract:
        Zone 1: Single text element Brand wordmark
        Zone 2: 4-5 concise single-line nav links
        Zone 3: 1 primary action (View Mode Switcher + Install Button)
      */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <img
                src="/src/assets/images/shieldguard_logo_badge_1792644775428.jpg"
                alt="ShieldGuard Emblem"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to SVG icon if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Shield className="w-5 h-5 text-white absolute" style={{ pointerEvents: 'none' }} />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                ShieldGuard Mobile Security
              </span>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                Android 14+ Jetpack Compose & FastAPI Suite
              </span>
            </div>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-slate-400">
            <button
              onClick={() => setViewMode('split')}
              className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'split' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Dual Architecture View
            </button>
            <button
              onClick={() => setViewMode('phone')}
              className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'phone' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Mobile App Device
            </button>
            <button
              onClick={() => setViewMode('console')}
              className={`hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'console' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Backend & Test Console
            </button>
            <button
              onClick={() => setInstallModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install on Phone / APK</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action (Workspace View Selector + Install button) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setInstallModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-cyan-950/40 flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Run on Phone</span>
            </button>

            <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode('phone')}
                title="Mobile Phone Only"
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'phone'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Device</span>
              </button>

              <button
                onClick={() => setViewMode('split')}
                title="Split Side-by-Side View"
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Split View</span>
              </button>

              <button
                onClick={() => setViewMode('console')}
                title="Developer & Security Console Only"
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'console'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Code & Tests</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        
        {/* Editorial Subheader & Trust Signals */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-medium">Enterprise Mobile Security</span>
              <span aria-hidden="true">·</span>
              <span>Least-Privilege Android Architecture</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">OWASP MASVS Aligned</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              ShieldGuard Android Security & Threat Defense Platform
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Detects malicious applications, adware, phishing URLs, and payment scams through evidence-based analysis while strictly honoring Android OS sandbox isolation boundaries.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 px-4 py-3 rounded-2xl shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Target Framework</div>
              <div className="text-xs font-bold text-slate-200">Kotlin Jetpack Compose</div>
            </div>
            <div className="h-7 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">Backend API</div>
              <div className="text-xs font-bold text-slate-200">FastAPI & PostgreSQL</div>
            </div>
            <div className="h-7 w-px bg-slate-800"></div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400">SSRF Firewall</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Viewport Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 min-h-[880px]">
          
          {/* Left Pane: Interactive Android Device Simulator */}
          {(viewMode === 'split' || viewMode === 'phone') && (
            <div className={`${viewMode === 'split' ? 'w-full lg:w-[440px] shrink-0' : 'w-full flex justify-center'}`}>
              <AndroidDeviceSimulator
                onScanHistoryAdd={handleScanHistoryAdd}
                onOpenInstallModal={() => setInstallModalOpen(true)}
              />
            </div>
          )}

          {/* Right Pane: Developer & Security Operations Console */}
          {(viewMode === 'split' || viewMode === 'console') && (
            <div className="flex-1 flex flex-col min-w-0">
              <DeveloperStudioConsole />
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 sm:px-6 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">ShieldGuard Mobile Security</span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] text-slate-500">Evidence-based Android protection</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-500">
            <span>National Cybercrime Helpline: 1930</span>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
              cybercrime.gov.in
            </a>
            <span>Apache 2.0 License</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
