'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  ShieldAlert,
  Save,
  CheckCircle2,
  DollarSign,
  Share2,
  AlertTriangle,
  RotateCcw,
  FileCheck2,
  GripVertical,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Header from '../../../../components/Header';
import SchedulerSubNav from '../../../../components/SchedulerSubNav';
import { sprint1Storage } from '../../../../lib/mock-storage';
import { PlatformQuotaSummary, Workspace, WorkflowSettings } from '../../../../types/scheduler';

export default function SchedulerSettingsPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [quotas, setQuotas] = useState<PlatformQuotaSummary | null>(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [scheduleBufferMinutes, setScheduleBufferMinutes] = useState(5);
  const [defaultView, setDefaultView] = useState('week');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sprint 9: Workflow settings
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [dragRescheduleEnabled, setDragRescheduleEnabled] = useState(true);
  const [dragRescheduleRequiresConfirmation, setDragRescheduleRequiresConfirmation] = useState(true);
  const [bulkDraftsEnabled, setBulkDraftsEnabled] = useState(true);
  const [maxBulkUploadFiles, setMaxBulkUploadFiles] = useState(50);
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkflowSettings = async (wsId: string) => {
    try {
      const res = await fetch(`/api/v0/social-scheduler/settings/workflow?workspaceId=${wsId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setApprovalRequired(!!data.settings.socialSchedulerApprovalRequired);
          setDragRescheduleEnabled(data.settings.dragRescheduleEnabled !== false);
          setDragRescheduleRequiresConfirmation(
            data.settings.dragRescheduleRequiresConfirmation !== false
          );
          setBulkDraftsEnabled(data.settings.bulkDraftsEnabled !== false);
          setMaxBulkUploadFiles(data.settings.maxBulkUploadFiles || 50);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    const q = sprint1Storage.getPlatformQuotas(ws.id);
    setQuotas(q);
    loadWorkflowSettings(ws.id);

    const handleWsChange = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      const newWs = customEvent.detail;
      setActiveWorkspace(newWs);
      setQuotas(sprint1Storage.getPlatformQuotas(newWs.id));
      loadWorkflowSettings(newWs.id);
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const wsId = activeWorkspace?.id || 'ws_mantri';
      await fetch('/api/v0/social-scheduler/settings/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: wsId,
          socialSchedulerApprovalRequired: approvalRequired,
          dragRescheduleEnabled,
          dragRescheduleRequiresConfirmation,
          bulkDraftsEnabled,
          maxBulkUploadFiles,
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save workflow settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetQueue = () => {
    if (confirm('Are you sure you want to reset all test post queues and quota ledgers to initial state?')) {
      sprint1Storage.resetForTest();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-[#D6B46A]/20 selection:text-[#D6B46A]">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8 pb-16">
        <SchedulerSubNav />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Scheduler Configuration & Platform Limits
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Configure publication timezones, approval workflows, drag-and-drop safeguards, and inspect platform API quotas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Sprint 9: Publishing Governance & Workflow Settings */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-indigo-400" />
                Publishing Governance & Workflow Controls
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Agency Workflows
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Approval gate toggle */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Require approval before publishing</span>
                    {approvalRequired && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        Enforced
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    When enabled, the automated background worker will refuse to publish posts unless explicitly marked as
                    <code className="text-indigo-300 font-mono text-[10px] ml-1">APPROVED</code> or
                    <code className="text-indigo-300 font-mono text-[10px] ml-1">AUTO_APPROVED</code>.
                    Unapproved scheduled posts entering publication will transition to
                    <code className="text-amber-300 font-mono text-[10px] ml-1">APPROVAL_BLOCKED</code> without consuming API quota.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={approvalRequired}
                  onChange={(e) => setApprovalRequired(e.target.checked)}
                  className="h-4 w-4 mt-1 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                />
              </div>

              {/* Drag reschedule safeguards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
                      Allow drag-to-reschedule
                    </span>
                    <input
                      type="checkbox"
                      checked={dragRescheduleEnabled}
                      onChange={(e) => setDragRescheduleEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                    />
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Allows team members to drag scheduled cards across days in the week/calendar view.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Require confirmation after drag
                    </span>
                    <input
                      type="checkbox"
                      checked={dragRescheduleRequiresConfirmation}
                      onChange={(e) => setDragRescheduleRequiresConfirmation(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer"
                    />
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Opens a modal showing original time, new time, quota recalculation, and undo button before committing.
                  </p>
                </div>
              </div>

              {/* Bulk upload settings */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Bulk Draft Builder Intake Cap
                  </span>
                  <p className="text-zinc-400 text-[11px]">
                    Maximum media files allowed in a single multi-post ingestion batch (up to 50 assets).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxBulkUploadFiles}
                    onChange={(e) => setMaxBulkUploadFiles(Number(e.target.value))}
                    className="w-20 rounded-lg bg-zinc-800 border border-white/10 px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-zinc-500">files max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling Preferences */}
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D6B46A]" />
              Scheduling Defaults
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Default Workspace Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D6B46A]/60"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Default Calendar Mode</label>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-white capitalize focus:outline-none focus:border-[#D6B46A]/60"
                >
                  <option value="week">Week View</option>
                  <option value="month">Month View</option>
                  <option value="day">Day View</option>
                  <option value="list">List View</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">
                  Minimum Schedule Buffer (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={scheduleBufferMinutes}
                  onChange={(e) => setScheduleBufferMinutes(Number(e.target.value))}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-white font-mono focus:outline-none focus:border-[#D6B46A]/60"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Enforces &ge; 5 min future publication buffer.
                </span>
              </div>
            </div>
          </div>

          {/* Platform Limits & Quotas Dashboard */}
          {quotas && (
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#D6B46A]" />
                Platform Limits & Quota Balances
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram Quota */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Instagram Graph API</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {quotas.instagram.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    24-Hour Rolling Publishing Limit: <strong>50 posts</strong> per connected account.
                  </p>
                  <div className="flex justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                    <span className="text-zinc-500">Remaining Today:</span>
                    <span className="text-white font-bold">{quotas.instagram.remaining} / {quotas.instagram.limit}</span>
                  </div>
                </div>

                {/* YouTube Quota */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">YouTube Data API v3</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                      {quotas.youtube.auditStatus}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Project Daily Upload Cap: <strong>100 videos / day</strong> (16,000 units quota budget).
                  </p>
                  <div className="flex justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                    <span className="text-zinc-500">Available Today:</span>
                    <span className="text-white font-bold">{quotas.youtube.remainingUploadsToday} / {quotas.youtube.dailyLimit}</span>
                  </div>
                </div>

                {/* X API Cost Cap */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Twitter / X Paid Publishing</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Standard Tier Pricing: <strong>$0.0150</strong> base / <strong>$0.2000</strong> with link.
                  </p>
                  <div className="flex justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                    <span className="text-zinc-500">Estimated Monthly Cost:</span>
                    <span className="text-[#D6B46A] font-bold">${quotas.x.estimatedMonthCostUsd} USD</span>
                  </div>
                </div>

                {/* Pinterest Limits */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Pinterest REST API v5</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {quotas.pinterest.tier}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Rate-limit: 1,000 calls / 60 mins • Boards cached: <strong>{quotas.pinterest.boardsSynced} boards</strong>
                  </p>
                  <div className="flex justify-between pt-2 border-t border-white/5 font-mono text-[11px]">
                    <span className="text-zinc-500">Rate Limit Remaining:</span>
                    <span className="text-white font-bold">{quotas.pinterest.rateLimitRemaining} reqs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  Configuration saved successfully
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D6B46A] hover:bg-[#c4a259] disabled:opacity-50 text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#D6B46A]/20"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-12 p-6 rounded-2xl bg-red-950/10 border border-red-900/30 space-y-3">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Development Danger Zone
            </h3>
            <p className="text-xs text-zinc-400">
              Reset in-memory publish queues, YouTube quota reservations, and X cost ledgers to clean initial mock state.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetQueue}
                className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 text-red-300 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset In-Memory Test Queue</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
