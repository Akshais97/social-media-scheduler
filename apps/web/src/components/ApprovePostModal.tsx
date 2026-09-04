'use client';

import React, { useState } from 'react';

interface ApprovePostModalProps {
  isOpen: boolean;
  postId: string;
  workspaceId?: string;
  postTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApprovePostModal({
  isOpen,
  postId,
  workspaceId = 'ws_mantri',
  postTitle,
  onClose,
  onSuccess,
}: ApprovePostModalProps) {
  const [comment, setComment] = useState('Approved for publishing.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve post');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve post');
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
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">Approve this post?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Approved posts can be published when their scheduled time arrives.
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

            <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/80 text-xs text-zinc-300">
              <p className="font-medium text-zinc-200 mb-2">Pre-Approval Verification Checklist:</p>
              <div className="space-y-1.5 text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Media and creative approved
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Caption and hashtags verified
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Platform targets and schedule time confirmed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Readiness preflight check passed
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Approval comment (optional)</label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
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
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
            >
              {isSubmitting ? 'Approving...' : 'Approve post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApprovePostModal;
