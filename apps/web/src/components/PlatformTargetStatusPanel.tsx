'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sprint1PublishTarget,
  SocialSchedulerTargetStatus,
  SocialSchedulerPlatform,
} from '@/types/scheduler';
import {
  CheckCircle2,
  Clock,
  RotateCw,
  XCircle,
  AlertTriangle,
  Play,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface PlatformTargetStatusPanelProps {
  postId: string;
  targets: Sprint1PublishTarget[];
  onTargetRetried?: () => void;
}

export const PlatformTargetStatusPanel: React.FC<PlatformTargetStatusPanelProps> = ({
  postId,
  targets,
  onTargetRetried,
}) => {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetryTarget = async (targetId: string) => {
    setRetryingId(targetId);
    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${postId}/targets/${targetId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockMode: 'success' }),
      });
      if (res.ok && onTargetRetried) {
        onTargetRetried();
      }
    } catch (err) {
      console.error('Failed to retry target:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (target: Sprint1PublishTarget) => {
    const status = target.status;
    const isLive = target.publishMode === 'LIVE_META';

    switch (status) {
      case SocialSchedulerTargetStatus.PUBLISHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            LIVE PUBLISHED
          </span>
        );
      case SocialSchedulerTargetStatus.PUBLISHED_MOCK:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            PUBLISHED MOCK
          </span>
        );
      case SocialSchedulerTargetStatus.PROCESSING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-pulse">
            <RotateCw className="w-3 h-3 animate-spin" />
            PROCESSING
          </span>
        );
      case SocialSchedulerTargetStatus.RETRYING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <RotateCw className="w-3 h-3" />
            RETRY SCHEDULED
          </span>
        );
      case SocialSchedulerTargetStatus.PLATFORM_PROCESSING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 animate-pulse">
            <RotateCw className="w-3 h-3 animate-spin" />
            PLATFORM PROCESSING
          </span>
        );
      case SocialSchedulerTargetStatus.LIMIT_REACHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            LIMIT REACHED
          </span>
        );
      case SocialSchedulerTargetStatus.QUOTA_BLOCKED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            QUOTA BLOCKED
          </span>
        );
      case SocialSchedulerTargetStatus.COST_BLOCKED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            COST BLOCKED (PAID API)
          </span>
        );
      case SocialSchedulerTargetStatus.PRIVATE_RESTRICTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            PRIVATE (AUDIT RESTRICTED)
          </span>
        );
      case SocialSchedulerTargetStatus.REAUTH_REQUIRED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <Lock className="w-3 h-3" />
            REAUTH REQUIRED
          </span>
        );
      case SocialSchedulerTargetStatus.FAILED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case SocialSchedulerTargetStatus.SCHEDULED:
      case SocialSchedulerTargetStatus.MOCK_READY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Clock className="w-3 h-3" />
            {isLive ? 'SCHEDULED (LIVE)' : 'SCHEDULED'}
          </span>
        );
      case SocialSchedulerTargetStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-white/5">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-white/5">
            {status}
          </span>
        );
    }
  };

  const getPlatformLabel = (platform: SocialSchedulerPlatform) => {
    switch (platform) {
      case SocialSchedulerPlatform.FACEBOOK:
        return 'Facebook Page';
      case SocialSchedulerPlatform.INSTAGRAM:
        return 'Instagram Business';
      case SocialSchedulerPlatform.PINTEREST:
        return 'Pinterest Board';
      case SocialSchedulerPlatform.YOUTUBE:
        return 'YouTube Channel';
      case SocialSchedulerPlatform.X:
        return 'Twitter / X';
      default:
        return platform;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Platform Publish Targets</h3>
        <span className="text-xs font-mono text-zinc-500">{targets.length} targets configured</span>
      </div>

      <div className="space-y-3">
        {targets.map((target) => {
          const attemptCount = target.attemptCount || 0;
          const isRetrying = target.status === SocialSchedulerTargetStatus.RETRYING;
          const isFailed = target.status === SocialSchedulerTargetStatus.FAILED;
          const isReauth = target.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED;
          const externalUrl = target.externalPostUrl || target.mockExternalUrl;
          const externalId = target.externalPostId || target.mockExternalId;
          const isLiveFb = target.publishMode === 'LIVE_META' && target.platform === SocialSchedulerPlatform.FACEBOOK;
          const isLiveIg = target.publishMode === 'LIVE_META' && target.platform === SocialSchedulerPlatform.INSTAGRAM;
          const isLivePin = target.publishMode === 'LIVE_PINTEREST' && target.platform === SocialSchedulerPlatform.PINTEREST;
          const isLiveYt = target.publishMode === 'LIVE_GOOGLE' && target.platform === SocialSchedulerPlatform.YOUTUBE;

          return (
            <div
              key={target.id}
              className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/15 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-100">
                      {getPlatformLabel(target.platform)}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      • {target.mockAccountName || target.accountName || 'Primary Account'}
                    </span>
                    {target.publishMode === 'LIVE_META' && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                        Meta Live
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Attempts: {attemptCount}/3
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(target)}
                  {(isRetrying || isFailed) && (
                    <button
                      onClick={() => handleRetryTarget(target.id)}
                      disabled={retryingId === target.id}
                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Trigger immediate retry"
                    >
                      <Play className="w-3 h-3 fill-amber-300" />
                      <span>{retryingId === target.id ? 'Retrying...' : 'Retry Now'}</span>
                    </button>
                  )}
                  {isReauth && (
                    <Link
                      href="/app/social-accounts"
                      className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      <span>Reconnect</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Retry timer if scheduled */}
              {isRetrying && target.nextRetryAt && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] font-mono text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Next automatic retry: {new Date(target.nextRetryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Error message */}
              {target.lastErrorMessage && (
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[11px] font-mono text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-semibold text-rose-400">{target.lastErrorCode || 'ERROR'}: </span>
                    <span>{target.lastErrorMessage}</span>
                  </div>
                </div>
              )}

              {/* Instagram container info if present */}
              {target.instagramContainerId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-pink-500/5 border border-pink-500/20 text-[11px] font-mono text-pink-300">
                  <span>Container ID: {target.instagramContainerId}</span>
                  <span className="text-[10px] text-zinc-400">Meta Video/Media Container</span>
                </div>
              )}

              {/* Pinterest board info if present */}
              {target.pinterestBoardId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] font-mono text-red-300">
                  <span>Board: {target.pinterestBoardId}</span>
                  <span className="text-[10px] text-zinc-400">Pinterest Board</span>
                </div>
              )}

              {/* X Paid API Cost info if present */}
              {target.platform === SocialSchedulerPlatform.X && (target.platformOptionsJson as any)?.estimatedCostUsd && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-sky-500/5 border border-sky-500/20 text-[11px] font-mono text-sky-300">
                  <span>Est. API Cost: ${(target.platformOptionsJson as any).estimatedCostUsd}</span>
                  <span className="text-[10px] text-zinc-400">Paid API Action</span>
                </div>
              )}

              {/* Published external link */}
              {externalUrl && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                  <span>External ID: {externalId}</span>
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-emerald-200 text-blue-400 hover:underline"
                  >
                    <span>
                      {isLiveFb
                        ? 'View Facebook Post'
                        : isLiveIg
                        ? 'View Instagram Post'
                        : isLivePin
                        ? 'View Pin'
                        : target.platform === SocialSchedulerPlatform.YOUTUBE
                        ? 'Watch on YouTube'
                        : target.platform === SocialSchedulerPlatform.X
                        ? 'View on X'
                        : 'View Published Post'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
