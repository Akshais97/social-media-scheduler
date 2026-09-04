'use client';

import React, { useState } from 'react';
import { Sprint1ScheduledPost } from '@/types/scheduler';

interface CopyToDatesModalProps {
  isOpen: boolean;
  post: Sprint1ScheduledPost | null;
  onClose: () => void;
  onSuccess?: (createdCount: number) => void;
}

export function CopyToDatesModal({
  isOpen,
  post,
  onClose,
  onSuccess,
}: CopyToDatesModalProps) {
  const [dates, setDates] = useState<string[]>(() => [
    (() => {
      const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    })(),
  ]);
  const [mode, setMode] = useState<'SCHEDULED' | 'DRAFT'>('SCHEDULED');
  const [captionSuffix, setCaptionSuffix] = useState('');
  const [copyTargets, setCopyTargets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleAddDate = () => {
    if (dates.length >= 30) {
      setError('Maximum 30 dates allowed per copy action.');
      return;
    }
    const lastDate = dates[dates.length - 1];
    const nextDate = new Date(new Date(lastDate || Date.now()).getTime() + 24 * 60 * 60 * 1000);
    nextDate.setMinutes(nextDate.getMinutes() - nextDate.getTimezoneOffset());
    setDates([...dates, nextDate.toISOString().slice(0, 16)]);
  };

  const handleRemoveDate = (index: number) => {
    if (dates.length <= 1) return;
    setDates(dates.filter((_, i) => i !== index));
  };

  const handleDateChange = (index: number, val: string) => {
    const updated = [...dates];
    updated[index] = val;
    setDates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const isoDates = dates.map((d) => new Date(d).toISOString());
      const res = await fetch(`/api/v0/social-scheduler/posts/${post.id}/copy-to-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: post.workspaceId,
          dates: isoDates,
          mode,
          captionSuffix: captionSuffix.trim() || undefined,
          copyTargets,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to copy post to dates');
      }

      if (onSuccess) {
        onSuccess(data.createdCount);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating copies');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Copy post to multiple dates</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Create multiple copies of this post for different publish times (up to 30).
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Target Publish Dates ({dates.length}/30)
                </label>
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add date
                </button>
              </div>
              <div className="space-y-2">
                {dates.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={d}
                      onChange={(e) => handleDateChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                    {dates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(idx)}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Caption Suffix (Optional)</label>
              <input
                type="text"
                placeholder="e.g. (Part 2) or #WeekendSpecial"
                value={captionSuffix}
                onChange={(e) => setCaptionSuffix(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Copy Mode</label>
              <div className="flex gap-4 text-xs text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copyMode"
                    value="SCHEDULED"
                    checked={mode === 'SCHEDULED'}
                    onChange={() => setMode('SCHEDULED')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Copy as Scheduled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copyMode"
                    value="DRAFT"
                    checked={mode === 'DRAFT'}
                    onChange={() => setMode('DRAFT')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Copy as Drafts</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={copyTargets}
                  onChange={(e) => setCopyTargets(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Copy linked platform targets to all posts</span>
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
              disabled={isSubmitting || dates.length === 0}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isSubmitting ? 'Creating...' : `Create ${dates.length} Copies`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CopyToDatesModal;
