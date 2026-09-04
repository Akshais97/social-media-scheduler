'use client';

import { useState } from 'react';
import { Ban, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface CancelPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
  } | null;
  workspaceId: string;
  onSuccess: () => void;
}

export default function CancelPostModal({
  isOpen,
  onClose,
  post,
  workspaceId,
  onSuccess,
}: CancelPostModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${post.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          reason,
          userId: 'usr_admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel post');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while cancelling the post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cancel Scheduled Post</h3>
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

        <form onSubmit={handleCancel} className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-200">Safe Cancellation Guard</p>
              <p className="text-amber-300/80 mt-0.5">
                Unpublished targets will be cancelled and unconsumed YouTube upload quotas or X cost reservations will be automatically released.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Reason for Cancellation (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Client requested hold, revised campaign strategy"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60"
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
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
