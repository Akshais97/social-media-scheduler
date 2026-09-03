'use client';

import React from 'react';
import {
  SocialPublishAttempt,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
} from '@/types/scheduler';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RotateCw,
  Cpu,
} from 'lucide-react';

interface AttemptTimelineProps {
  attempts: SocialPublishAttempt[];
  onRetryTarget?: (targetId: string) => void;
}

export const AttemptTimeline: React.FC<AttemptTimelineProps> = ({ attempts }) => {
  if (!attempts || attempts.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-950/80 border border-white/10 text-center space-y-2">
        <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
          <Clock className="w-5 h-5" />
        </div>
        <div className="text-sm font-medium text-zinc-300">No publishing attempts yet</div>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          This post will appear here once the worker processes its scheduled platform targets.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: SocialPublishAttemptStatus) => {
    switch (status) {
      case SocialPublishAttemptStatus.SUCCEEDED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            SUCCEEDED
          </span>
        );
      case SocialPublishAttemptStatus.FAILED_RETRYABLE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <RotateCw className="w-3 h-3 animate-spin" />
            RETRYING
          </span>
        );
      case SocialPublishAttemptStatus.TIMED_OUT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-orange-500/10 text-orange-300 border border-orange-500/20">
            <Clock className="w-3 h-3" />
            TIMED OUT
          </span>
        );
      case SocialPublishAttemptStatus.FAILED_PERMANENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      case SocialPublishAttemptStatus.STARTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-pulse">
            <Cpu className="w-3 h-3" />
            PROCESSING
          </span>
        );
      case SocialPublishAttemptStatus.SKIPPED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-white/5">
            SKIPPED
          </span>
        );
    }
  };

  const formatPlatform = (p: SocialSchedulerPlatform) => {
    switch (p) {
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
        return p;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Publishing Timeline</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Immutable attempt log captured by the execution engine ({attempts.length} attempts)
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {attempts.map((attempt) => {
          const startedDate = new Date(attempt.startedAt);
          const duration =
            attempt.finishedAt
              ? `${Math.max(1, Math.round((new Date(attempt.finishedAt).getTime() - startedDate.getTime()) / 1000))}s`
              : 'in progress';

          return (
            <div key={attempt.id} className="relative group">
              {/* Timeline marker node */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-bold ${
                  attempt.status === SocialPublishAttemptStatus.SUCCEEDED
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : attempt.status === SocialPublishAttemptStatus.FAILED_RETRYABLE
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : attempt.status === SocialPublishAttemptStatus.FAILED_PERMANENT
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-zinc-900 border-zinc-500 text-zinc-300'
                }`}
              >
                #{attempt.attemptNumber}
              </div>

              {/* Attempt card */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3 hover:border-white/15 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-200">
                      {formatPlatform(attempt.platform)}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Attempt #{attempt.attemptNumber}
                    </span>
                  </div>
                  {getStatusBadge(attempt.status)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-zinc-400 bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-zinc-600 block text-[10px]">TIME</span>
                    <span>{startedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">DURATION</span>
                    <span>{duration}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">WORKER RUN</span>
                    <span className="truncate block" title={attempt.workerRunId || 'system'}>
                      {attempt.workerRunId ? attempt.workerRunId.slice(0, 10) : 'system'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">RETRYABLE</span>
                    <span className={attempt.retryable ? 'text-amber-400' : 'text-zinc-500'}>
                      {attempt.retryable ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>

                {/* Success External Link */}
                {attempt.externalPostId && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                    <div className="font-mono text-emerald-300 truncate">
                      External ID: <span className="font-semibold">{attempt.externalPostId}</span>
                    </div>
                    {attempt.externalPostUrl && (
                      <a
                        href={attempt.externalPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-2 flex-shrink-0"
                      >
                        <span>Open Mock URL</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Error diagnostics */}
                {attempt.errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-rose-400 font-mono text-[11px] font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{attempt.errorCode || 'PUBLISH_ERROR'}</span>
                    </div>
                    <p className="text-rose-300 text-[11px] leading-relaxed">
                      {attempt.errorMessage}
                    </p>
                    {attempt.nextRetryAt && (
                      <div className="text-[10px] font-mono text-amber-400 pt-1">
                        Next automatic retry scheduled at:{' '}
                        {new Date(attempt.nextRetryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
