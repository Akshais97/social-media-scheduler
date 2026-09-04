'use client';

import { useState } from 'react';
import { RotateCw, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface RetryTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    targets: Array<{ id: string; platform: string; status: string }>;
  } | null;
  workspaceId: string;
  onSuccess: () => void;
}

export default function RetryTargetsModal({
  isOpen,
  onClose,
  post,
  workspaceId,
  onSuccess,
}: RetryTargetsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const retryableTargets = post.targets.filter(
    (t) => t.status !== 'PUBLISHED' && t.status !== 'PUBLISHED_MOCK'
  );
  const publishedTargets = post.targets.filter(
    (t) => t.status === 'PUBLISHED' || t.status === 'PUBLISHED_MOCK'
  );

  const handleRetry = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${post.id}/retry-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          userId: 'usr_admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger retry');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while retrying targets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <RotateCw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Retry Incomplete Targets</h3>
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

        <div className="mt-4 space-y-4">
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-200">Safe Target Isolation</p>
              <p className="text-emerald-300/80 mt-0.5">
                {publishedTargets.length > 0 ? (
                  <>
                    <strong className="text-white">{publishedTargets.length}</strong> already published platform(s) will be protected and untouched. Only the {retryableTargets.length} pending/failed platform(s) will be retried.
                  </>
                ) : (
                  <>All {retryableTargets.length} pending/failed targets will be scheduled for a new publish attempt.</>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400">Targets to be retried:</p>
            <div className="divide-y divide-white/5 rounded-lg border border-white/5 bg-zinc-900/50 p-2 text-xs">
              {retryableTargets.map((t) => (
                <div key={t.id} className="py-1.5 flex items-center justify-between">
                  <span className="font-medium text-zinc-200">{t.platform}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
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
              type="button"
              disabled={loading}
              onClick={handleRetry}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Queueing...</span>
              ) : (
                <>
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Retry Targets Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
