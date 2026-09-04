'use client';

import React, { useState } from 'react';
import { CalendarItem, SocialSchedulerPlatform } from '@/types/scheduler';

interface DragRescheduleConfirmModalProps {
  isOpen: boolean;
  item: CalendarItem | null;
  originalTime: string;
  newTime: string;
  onConfirm: (scheduledAt: string) => Promise<void>;
  onUndo: () => void;
  onClose: () => void;
}

export function DragRescheduleConfirmModal({
  isOpen,
  item,
  originalTime,
  newTime,
  onConfirm,
  onUndo,
  onClose,
}: DragRescheduleConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const newDateObj = new Date(newTime);
  const isPast = newDateObj.getTime() <= Date.now();
  const isTooSoon = newDateObj.getTime() < Date.now() + 5 * 60 * 1000;
  const hasYouTube = item.platforms.includes(SocialSchedulerPlatform.YOUTUBE);
  const hasX = item.platforms.includes(SocialSchedulerPlatform.X);

  const handleConfirm = async () => {
    if (isPast) {
      setError('Cannot reschedule to a past time.');
      return;
    }
    if (isTooSoon) {
      setError('Scheduled time must be at least 5 minutes in the future.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(newTime);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Reschedule this post?</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                You moved this post to a new time. Confirm before updating the schedule.
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

          <div className="space-y-2.5 bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-500">Post Title:</span>
              <span className="font-medium text-zinc-200 truncate max-w-[200px]">{item.title}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-500">Original Time:</span>
              <span className="text-zinc-400 line-through">
                {new Date(originalTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-500 font-semibold">New Time:</span>
              <span className="font-semibold text-emerald-400">
                {new Date(newTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-500">Platforms:</span>
              <div className="flex gap-1.5">
                {item.platforms.map((p) => (
                  <span key={p} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            {(hasYouTube || hasX) && (
              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                <span className="text-amber-400 font-medium">Impact Check: </span>
                {hasYouTube && 'YouTube daily upload quota will be relocated to the new date. '}
                {hasX && 'X API cost acknowledgement is preserved.'}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onUndo}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Undo move
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || isPast || isTooSoon}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isSubmitting ? 'Rescheduling...' : 'Confirm reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DragRescheduleConfirmModal;
