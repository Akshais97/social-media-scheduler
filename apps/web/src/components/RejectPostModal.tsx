'use client';

import React, { useState } from 'react';

interface RejectPostModalProps {
  isOpen: boolean;
  postId: string;
  workspaceId?: string;
  postTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RejectPostModal({
  isOpen,
  postId,
  workspaceId = 'ws_mantri',
  postTitle,
  onClose,
  onSuccess,
}: RejectPostModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for rejecting this post.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject post');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject post');
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
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Reject this post?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rejected posts will not be published unless edited and sent for review again.
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Creative not approved by client leadership. Campaign cancelled."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500 resize-none"
              />
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
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isSubmitting ? 'Rejecting...' : 'Reject post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RejectPostModal;
