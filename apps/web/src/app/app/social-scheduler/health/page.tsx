'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Key,
  Clock,
  Layers,
} from 'lucide-react';
import Header from '../../../../components/Header';
import SchedulerSubNav from '../../../../components/SchedulerSubNav';
import { sprint1Storage } from '../../../../lib/mock-storage';
import {
  SocialAccountHealthSnapshot,
  AccountHealthStatus,
  Workspace,
} from '../../../../types/scheduler';

export default function AccountHealthPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [snapshots, setSnapshots] = useState<SocialAccountHealthSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadHealth = async () => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    setLoading(true);
    try {
      const res = await fetch(`/api/v0/social-scheduler/health?workspaceId=${ws.id}`);
      const data = await res.json();
      setSnapshots(data.accounts || []);
    } catch {
      // fallback
      const fallback = sprint1Storage.getAccountHealth(ws.id);
      setSnapshots(fallback.accounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();

    const handleWsChange = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      setActiveWorkspace(customEvent.detail);
      loadHealth();
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, []);

  const handleRunHealthCheck = async () => {
    if (!activeWorkspace) return;
    setChecking(true);
    try {
      await fetch('/api/v0/social-scheduler/health/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace.id }),
      });
      await loadHealth();
    } finally {
      setChecking(false);
    }
  };

  const healthyCount = snapshots.filter((s) => s.status === AccountHealthStatus.HEALTHY).length;
  const warningCount = snapshots.filter((s) => s.status === AccountHealthStatus.WARNING).length;
  const reconnectCount = snapshots.filter(
    (s) =>
      s.status === AccountHealthStatus.RECONNECT_REQUIRED ||
      s.status === AccountHealthStatus.DISCONNECTED ||
      s.status === AccountHealthStatus.PERMISSION_MISSING
  ).length;

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[#D6B46A]/20 selection:text-[#D6B46A]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <SchedulerSubNav />

        {/* Header & Triggers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Account Health & Diagnostics
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Status
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Verify platform credentials, token decryptability, scope permissions, and rate limits across connected channels.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={checking}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#D6B46A]/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Accounts...' : 'Run Workspace Health Check'}</span>
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
              Connected Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">{snapshots.length}</span>
              <span className="text-[11px] text-zinc-400 font-mono">channels</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-emerald-500/20 bg-emerald-950/5">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
              Healthy
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-400">{healthyCount}</span>
              <span className="text-[11px] text-zinc-400 font-mono">publishing ready</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-amber-500/20 bg-amber-950/5">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
              Warnings
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-400">{warningCount}</span>
              <span className="text-[11px] text-zinc-400 font-mono">action advised</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-red-500/20 bg-red-950/5">
            <span className="text-xs font-mono text-red-400 uppercase tracking-wider block">
              Reconnect Required
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-red-400">{reconnectCount}</span>
              <span className="text-[11px] text-zinc-400 font-mono">publishing blocked</span>
            </div>
          </div>
        </div>

        {/* Account Cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Channel Audit Details</h2>

          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-500">Loading channel health...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 rounded-xl border border-white/5 bg-zinc-950/40">
              No connected social accounts found for this workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {snapshots.map((acc) => {
                const isHealthy = acc.status === AccountHealthStatus.HEALTHY;
                const isWarning = acc.status === AccountHealthStatus.WARNING;
                const isBlocked = !isHealthy && !isWarning;

                return (
                  <div
                    key={acc.id}
                    className="p-5 rounded-xl border border-white/10 bg-zinc-950/60 flex flex-col justify-between hover:border-white/20 transition-all"
                  >
                    <div>
                      {/* Top Row: Channel & Status Badge */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-[#D6B46A]">
                            {acc.platform.slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{acc.displayName}</h3>
                            <p className="text-xs text-zinc-400 font-mono">
                              @{acc.username || 'unnamed'} • {acc.platform}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                            isHealthy
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>

                      {/* Health diagnostics */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 text-zinc-500" />
                            Token Decryptability:
                          </span>
                          <span className={acc.tokenValid ? 'text-emerald-400 font-mono' : 'text-red-400 font-mono'}>
                            {acc.tokenValid ? 'VALID (AES-256-GCM)' : 'CORRUPTED / MISSING'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-500" />
                            Last Checked:
                          </span>
                          <span className="font-mono text-zinc-300">
                            {new Date(acc.checkedAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {acc.warnings.length > 0 && (
                          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-300 text-[11px] space-y-1">
                            {acc.warnings.map((w, idx) => (
                              <p key={idx} className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>{w}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {acc.missingPermissions.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-red-950/20 border border-red-800/30 text-red-300 text-[11px] space-y-1">
                            <p className="font-semibold">Missing Scopes:</p>
                            <p className="font-mono">{acc.missingPermissions.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                      <Link
                        href="/app/social-accounts"
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        Manage Account
                      </Link>
                      {isBlocked && (
                        <Link
                          href="/app/social-accounts"
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-sm"
                        >
                          Reconnect Now
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
