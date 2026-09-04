'use client';

import React, { useState } from 'react';
import { Sprint1ScheduledPost } from '@/types/scheduler';

interface DuplicatePostModalProps {
  isOpen: boolean;
  post: Sprint1ScheduledPost | null;
  onClose: () => void;
  onSuccess?: (newPostId: string) => void;
}

export function DuplicatePostModal({
  isOpen,
  post,
  onClose,
  onSuccess,
}: DuplicatePostModalProps) {
  const [mode, setMode] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT');
  const [copyTargets, setCopyTargets] = useState(true);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${post.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: post.workspaceId,
          mode,
          copyTargets,
          copySchedule: mode === 'SCHEDULED',
          newScheduledAt: mode === 'SCHEDULED' ? new Date(newDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to duplicate post');
      }

      if (onSuccess) {
        onSuccess(data.newPostId);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating duplicate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Duplicate scheduled post</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create a new draft using this post's media, caption, and composer data.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-300">Duplication Mode</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="DRAFT"
                    checked={mode === 'DRAFT'}
                    onChange={() => setMode('DRAFT')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">Duplicate as draft</span>
                    <span className="text-[11px] text-zinc-500 block">Saves as an unscheduled draft in this workspace.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="SCHEDULED"
                    checked={mode === 'SCHEDULED'}
                    onChange={() => setMode('SCHEDULED')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-zinc-200 block">Duplicate with schedule</span>
                    <span className="text-[11px] text-zinc-500 block">Assigns a new future schedule slot immediately.</span>
                  </div>
                </label>
              </div>
            </div>

            {mode === 'SCHEDULED' && (
              <div className="space-y-1.5 animate-in fade-in duration-100">
                <label className="text-xs font-medium text-zinc-300">New Schedule Time</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyTargets}
                  onChange={(e) => setCopyTargets(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-zinc-300">Copy destination platform targets</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DuplicatePostModal;
