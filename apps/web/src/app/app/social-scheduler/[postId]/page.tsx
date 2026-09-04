'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sprint1Storage } from '../../../../lib/mock-storage';
import {
  Sprint1ScheduledPost,
  SocialPublishAttempt,
  SocialSchedulerPostStatus,
  SocialSchedulerApprovalStatus,
  SocialSchedulerReadinessCheck,
  ReadinessStatus,
} from '../../../../types/scheduler';
import StatusBadge from '../../../../components/StatusBadge';
import ApprovalStatusChip from '../../../../components/ApprovalStatusChip';
import { AttemptTimeline } from '../../../../components/AttemptTimeline';
import { PlatformTargetStatusPanel } from '../../../../components/PlatformTargetStatusPanel';
import { WorkerDiagnosticsPanel } from '../../../../components/WorkerDiagnosticsPanel';
import { SchedulerStatusBanner } from '../../../../components/SchedulerBanners';
import ReschedulePostModal from '../../../../components/ReschedulePostModal';
import CancelPostModal from '../../../../components/CancelPostModal';
import RetryTargetsModal from '../../../../components/RetryTargetsModal';
import DuplicatePostModal from '../../../../components/DuplicatePostModal';
import CopyToDatesModal from '../../../../components/CopyToDatesModal';
import SendForReviewModal from '../../../../components/SendForReviewModal';
import ApprovePostModal from '../../../../components/ApprovePostModal';
import RequestChangesModal from '../../../../components/RequestChangesModal';
import RejectPostModal from '../../../../components/RejectPostModal';
import ReviewCommentThread from '../../../../components/ReviewCommentThread';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Code2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Layers,
  Send,
  ThumbsUp,
  RotateCcw,
  XCircle,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Sprint1ScheduledPost | null>(null);
  const [attempts, setAttempts] = useState<SocialPublishAttempt[]>([]);
  const [readiness, setReadiness] = useState<SocialSchedulerReadinessCheck | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRetryOpen, setIsRetryOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [isCopyToDatesOpen, setIsCopyToDatesOpen] = useState(false);
  const [isSendForReviewOpen, setIsSendForReviewOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const loadPostAndAttempts = () => {
    setRefreshing(true);
    const found = sprint1Storage.getPostById(resolvedParams.postId);
    if (found) {
      setPost({ ...found });
      const atts = sprint1Storage.getAttempts(found.id);
      setAttempts([...atts]);
      const check = sprint1Storage.runReadinessCheck(found.workspaceId, found.id, 'DETAIL_VIEW');
      setReadiness(check);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadPostAndAttempts();
  }, [resolvedParams.postId]);

  if (!post) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-zinc-400 text-sm">Post not found in scheduler queue.</p>
        <Link
          href="/app/social-scheduler"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#D6B46A] hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to scheduler</span>
        </Link>
      </div>
    );
  }

  const isTerminal =
    post.status === SocialSchedulerPostStatus.CANCELLED ||
    post.status === SocialSchedulerPostStatus.PUBLISHED_MOCK ||
    post.status === SocialSchedulerPostStatus.PUBLISHED;

  const hasFailedTargets = post.targets.some(
    (t) =>
      t.status === 'FAILED' ||
      t.status === 'RETRYING' ||
      t.status === 'COST_BLOCKED' ||
      t.status === 'QUOTA_BLOCKED'
  );

  const approvalStatus =
    (post.approvalStatus as SocialSchedulerApprovalStatus) ||
    SocialSchedulerApprovalStatus.NOT_REQUIRED;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <Link
            href="/app/social-scheduler"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to queue</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">{post.title}</h1>
            <StatusBadge status={post.status} />
            <ApprovalStatusChip status={approvalStatus} />
          </div>
          <p className="text-xs font-mono text-zinc-500">
            Workspace: <span className="text-zinc-300 font-medium">{post.workspaceId}</span> • Post ID: {post.id}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadPostAndAttempts}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Duplicate Button (Sprint 9) */}
          <button
            type="button"
            onClick={() => setIsDuplicateOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-indigo-400" />
            <span>Duplicate</span>
          </button>

          {/* Copy to Dates (Sprint 9) */}
          <button
            type="button"
            onClick={() => setIsCopyToDatesOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-purple-400" />
            <span>Copy to Dates</span>
          </button>

          {!isTerminal && hasFailedTargets && (
            <button
              type="button"
              onClick={() => setIsRetryOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Retry Targets</span>
            </button>
          )}

          {!isTerminal && (
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#D6B46A]/10 hover:bg-[#D6B46A]/20 text-[#D6B46A] border border-[#D6B46A]/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Reschedule</span>
            </button>
          )}

          {!isTerminal && (
            <button
              type="button"
              onClick={() => setIsCancelOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Approval Governance Panel (Sprint 9) */}
      <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Approval Governance & Review
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ApprovalStatusChip status={approvalStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Approval Status</span>
            <p className="font-semibold text-white">{approvalStatus}</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Review Requested</span>
            <p className="text-zinc-300">
              {post.reviewRequestedAt
                ? new Date(post.reviewRequestedAt).toLocaleString()
                : 'Not requested'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Approved By</span>
            <p className="text-zinc-300">{post.approvedByUserId || 'Pending approval'}</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Approved At</span>
            <p className="text-zinc-300">
              {post.approvedAt ? new Date(post.approvedAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {post.rejectionReason && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Rejection or Change Request Reason:</p>
              <p className="mt-0.5 text-rose-300/90">{post.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Approval Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 flex-wrap">
          {['DRAFT', 'CHANGES_REQUESTED', 'NOT_REQUIRED'].includes(approvalStatus) && (
            <button
              type="button"
              onClick={() => setIsSendForReviewOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send for Review</span>
            </button>
          )}

          {approvalStatus === 'IN_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => setIsApproveOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Approve Post</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRequestChangesOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Request Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRejectOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preflight Readiness Banner */}
      {readiness && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            readiness.status === ReadinessStatus.READY
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              : readiness.status === ReadinessStatus.READY_WITH_WARNINGS
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-red-950/20 border-red-500/30 text-red-200'
          }`}
        >
          {readiness.status === ReadinessStatus.READY ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                readiness.status === ReadinessStatus.READY_WITH_WARNINGS ? 'text-amber-400' : 'text-red-400'
              }`}
            />
          )}

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs uppercase tracking-wider">
                Preflight Check: {readiness.status.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-mono opacity-60">
                Source: {readiness.source}
              </span>
            </div>

            {readiness.blockingIssues.length > 0 && (
              <div className="space-y-0.5 text-xs text-red-300">
                {readiness.blockingIssues.map((b, idx) => (
                  <p key={idx} className="font-medium">• {b.message}</p>
                ))}
              </div>
            )}

            {readiness.warnings.length > 0 && (
              <div className="space-y-0.5 text-xs text-amber-300">
                {readiness.warnings.map((w, idx) => (
                  <p key={idx}>• {w.message}</p>
                ))}
              </div>
            )}

            {readiness.status === ReadinessStatus.READY && (
              <p className="text-xs text-emerald-300/90">
                All media files, connected accounts, and platform quota requirements are verified and ready for publishing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lifecycle Status Banner */}
      <SchedulerStatusBanner status={post.status} onRefresh={loadPostAndAttempts} />

      {/* Worker Diagnostics Simulator (Admin/Dev) */}
      <WorkerDiagnosticsPanel
        postId={post.id}
        workspaceId={post.workspaceId}
        onExecutionComplete={loadPostAndAttempts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Content, Media, Timeline & Comments (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Caption Box */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Post Caption</span>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {post.draftContentJson.caption || '(No caption)'}
            </p>
            {post.draftContentJson.cta && (
              <div className="text-[11px] font-mono text-[#D6B46A] bg-[#D6B46A]/10 px-2.5 py-1 rounded inline-block">
                CTA: {post.draftContentJson.cta}
              </div>
            )}
            {post.draftContentJson.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {post.draftContentJson.hashtags.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono text-indigo-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media Assets (B2 Object Storage) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Media Storage (Backblaze B2)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                S3 Presigned Direct
              </span>
            </div>

            {post.mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col sm:flex-row gap-4 items-start"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.previewUrl}
                  alt={asset.originalFileName || asset.safeFileName || 'Media'}
                  className="h-20 w-20 rounded-lg object-cover bg-zinc-950 border border-white/10 shrink-0"
                />
                <div className="space-y-1 text-xs min-w-0 flex-1">
                  <p className="font-medium text-white truncate">
                    {asset.originalFileName || asset.safeFileName || 'Media file'}
                  </p>
                  <p className="font-mono text-zinc-500 text-[11px]">
                    {asset.mimeType} • {(asset.byteSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="font-mono text-zinc-600 text-[10px] truncate">
                    B2 Key: {asset.objectKey}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Attempt Timeline */}
          <AttemptTimeline attempts={attempts} />

          {/* Review Comments Thread (Sprint 9) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Review Discussion & Notes
              </h3>
            </div>
            <ReviewCommentThread postId={post.id} workspaceId={post.workspaceId} />
          </div>
        </div>

        {/* Right Column: Platform Targets & Schedule (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scheduling Metadata */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Schedule Details
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#D6B46A]" />
                  Scheduled For
                </span>
                <span className="font-mono font-medium text-white">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Unscheduled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Timezone
                </span>
                <span className="font-mono text-zinc-300">{post.timezone}</span>
              </div>
            </div>
          </div>

          {/* Platform Target Status Panel */}
          <PlatformTargetStatusPanel
            postId={post.id}
            targets={post.targets}
            onTargetRetried={loadPostAndAttempts}
          />
        </div>
      </div>

      {/* Modals */}
      <DuplicatePostModal
        isOpen={isDuplicateOpen}
        post={post}
        onClose={() => setIsDuplicateOpen(false)}
        onSuccess={(newId) => {
          setIsDuplicateOpen(false);
          router.push(`/app/social-scheduler/${newId}`);
        }}
      />

      <CopyToDatesModal
        isOpen={isCopyToDatesOpen}
        post={post}
        onClose={() => setIsCopyToDatesOpen(false)}
        onSuccess={() => {
          setIsCopyToDatesOpen(false);
          router.push('/app/social-scheduler/calendar');
        }}
      />

      <SendForReviewModal
        isOpen={isSendForReviewOpen}
        postId={post.id}
        workspaceId={post.workspaceId}
        postTitle={post.title}
        onClose={() => setIsSendForReviewOpen(false)}
        onSuccess={() => {
          setIsSendForReviewOpen(false);
          loadPostAndAttempts();
        }}
      />

      <ApprovePostModal
        isOpen={isApproveOpen}
        postId={post.id}
        workspaceId={post.workspaceId}
        postTitle={post.title}
        onClose={() => setIsApproveOpen(false)}
        onSuccess={() => {
          setIsApproveOpen(false);
          loadPostAndAttempts();
        }}
      />

      <RequestChangesModal
        isOpen={isRequestChangesOpen}
        postId={post.id}
        workspaceId={post.workspaceId}
        postTitle={post.title}
        onClose={() => setIsRequestChangesOpen(false)}
        onSuccess={() => {
          setIsRequestChangesOpen(false);
          loadPostAndAttempts();
        }}
      />

      <RejectPostModal
        isOpen={isRejectOpen}
        postId={post.id}
        workspaceId={post.workspaceId}
        postTitle={post.title}
        onClose={() => setIsRejectOpen(false)}
        onSuccess={() => {
          setIsRejectOpen(false);
          loadPostAndAttempts();
        }}
      />

      <ReschedulePostModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        post={{
          id: post.id,
          title: post.title,
          scheduledAt: post.scheduledAt,
          timezone: post.timezone,
        }}
        workspaceId={post.workspaceId}
        onSuccess={loadPostAndAttempts}
      />

      <CancelPostModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        post={{
          id: post.id,
          title: post.title,
        }}
        workspaceId={post.workspaceId}
        onSuccess={loadPostAndAttempts}
      />

      <RetryTargetsModal
        isOpen={isRetryOpen}
        onClose={() => setIsRetryOpen(false)}
        post={{
          id: post.id,
          title: post.title,
          targets: post.targets.map((t) => ({ id: t.id, platform: t.platform, status: t.status })),
        }}
        workspaceId={post.workspaceId}
        onSuccess={loadPostAndAttempts}
      />
    </div>
  );
}
