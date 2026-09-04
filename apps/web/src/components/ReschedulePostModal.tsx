'use client';

import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, X, Check } from 'lucide-react';

interface ReschedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    scheduledAt?: string | null;
    timezone?: string;
  } | null;
  workspaceId: string;
  onSuccess: () => void;
}

export default function ReschedulePostModal({
  isOpen,
  onClose,
  post,
  workspaceId,
  onSuccess,
}: ReschedulePostModalProps) {
  const [scheduledDate, setScheduledDate] = useState(() => {
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedIso = new Date(scheduledDate).toISOString();
      const res = await fetch(`/api/v0/social-scheduler/posts/${post.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          scheduledAt: selectedIso,
          reason,
          userId: 'usr_admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reschedule post');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while rescheduling.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Reschedule Post</h3>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">{post.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              New Publication Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D6B46A]/60 font-mono"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Must be at least 5 minutes in the future.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Reason for Rescheduling (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Asset review delay, client requested shift"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D6B46A]/60"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#D6B46A]/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
