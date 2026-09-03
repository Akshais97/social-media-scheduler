'use client';

import React, { useState } from 'react';
import { Play, RotateCw, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { MockAdapterMode } from '@/lib/mock-publisher-adapter';

interface WorkerDiagnosticsPanelProps {
  postId?: string;
  workspaceId?: string;
  onExecutionComplete?: () => void;
}

export const WorkerDiagnosticsPanel: React.FC<WorkerDiagnosticsPanelProps> = ({
  postId,
  workspaceId,
  onExecutionComplete,
}) => {
  const [mockMode, setMockMode] = useState<MockAdapterMode>('success');
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunWorker = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/v0/social-scheduler/worker/process-due', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-Secret': 'sakhaa_worker_secret_sprint2',
        },
        body: JSON.stringify({
          limit: 10,
          mockMode,
          workspaceId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to process due targets');
      }

      const data = await res.json();
      setLastResult(data);
      if (onExecutionComplete) {
        onExecutionComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Worker execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/90 border border-indigo-500/20 shadow-2xl shadow-indigo-950/20 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>Worker Diagnostics & Mock Engine</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ADMIN / DEV
              </span>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              Simulate worker execution, atomic claiming, and failure states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-400">Mode:</label>
          <select
            value={mockMode}
            onChange={(e) => setMockMode(e.target.value as MockAdapterMode)}
            className="bg-zinc-900 border border-white/10 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-[#D6B46A]"
          >
            <option value="success">Success</option>
            <option value="retryable_failure">Retryable Failure (Timeout)</option>
            <option value="permanent_failure">Permanent Failure (Invalid Media)</option>
            <option value="timeout">Gateway Timeout</option>
            <option value="mixed">Mixed Platforms</option>
            <option value="random">Random Simulation</option>
          </select>

          <button
            onClick={handleRunWorker}
            disabled={running}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D6B46A] to-[#B3934B] text-black font-semibold text-xs flex items-center gap-1.5 hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-black ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Processing...' : 'Run Due Worker'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {lastResult && (
        <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Run Completed: {lastResult.workerRunId}
            </span>
            <span>Claimed: {lastResult.claimedTargets}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <span className="block text-[10px] text-zinc-500">SUCCEEDED</span>
              <span className="font-bold text-sm">{lastResult.succeeded}</span>
            </div>
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="block text-[10px] text-zinc-500">RETRYING</span>
              <span className="font-bold text-sm">{lastResult.retrying}</span>
            </div>
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <span className="block text-[10px] text-zinc-500">FAILED</span>
              <span className="font-bold text-sm">{lastResult.failed}</span>
            </div>
            <div className="p-2 rounded bg-zinc-800 border border-white/5 text-zinc-400">
              <span className="block text-[10px] text-zinc-500">SKIPPED</span>
              <span className="font-bold text-sm">{lastResult.skipped}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
