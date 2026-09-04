'use client';

import React from 'react';
import { SocialSchedulerPostStatus } from '@/types/scheduler';
import { Cpu, RotateCw, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface SchedulerBannerProps {
  status: SocialSchedulerPostStatus;
  onRefresh?: () => void;
}

export const SchedulerStatusBanner: React.FC<SchedulerBannerProps> = ({ status, onRefresh }) => {
  switch (status) {
    case SocialSchedulerPostStatus.PROCESSING:
      return (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-indigo-200">
                Publishing worker is processing this scheduled post
              </h4>
              <p className="text-[11px] text-indigo-300/80">
                The post is locked while publishing is in progress across assigned targets.
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          )}
        </div>
      );

    case SocialSchedulerPostStatus.RETRYING:
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <RotateCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-200">
                Some targets will retry automatically
              </h4>
              <p className="text-[11px] text-amber-300/80">
                Temporary mock platform failures are scheduled with exponential backoff.
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Attempts</span>
            </button>
          )}
        </div>
      );

    case SocialSchedulerPostStatus.PUBLISHED_MOCK:
      return (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-200">
              Mock publishing completed successfully
            </h4>
            <p className="text-[11px] text-emerald-300/80">
              The scheduler execution flow is verified. Real platform API publishing will connect in Sprint 3.
            </p>
          </div>
        </div>
      );

    case SocialSchedulerPostStatus.FAILED:
    case SocialSchedulerPostStatus.PARTIALLY_FAILED:
      return (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-rose-200">
              {status === SocialSchedulerPostStatus.PARTIALLY_FAILED
                ? 'Publishing partially failed for some targets'
                : 'Publishing failed across all platform targets'}
            </h4>
            <p className="text-[11px] text-rose-300/80">
              Review the publishing timeline below for the exact error diagnostic codes.
            </p>
          </div>
        </div>
      );

    case SocialSchedulerPostStatus.PUBLISHED:
      return (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-blue-200">
              Live publishing completed successfully
            </h4>
            <p className="text-[11px] text-blue-300/80">
              This post was published directly to your connected social channels via provider APIs.
            </p>
          </div>
        </div>
      );

    case SocialSchedulerPostStatus.REAUTH_REQUIRED:
      return (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-rose-200">
                Action Required: Social account re-authorization needed
              </h4>
              <p className="text-[11px] text-rose-300/80">
                Meta access tokens have expired or permissions were revoked. Please reconnect the Facebook Page.
              </p>
            </div>
          </div>
          <a
            href="/app/social-accounts"
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-mono transition-colors whitespace-nowrap"
          >
            Reconnect Account
          </a>
        </div>
      );

    default:
      return null;
  }
};
