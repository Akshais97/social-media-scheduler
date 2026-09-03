'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sprint1Storage } from '../../../../lib/mock-storage';
import { Sprint1ScheduledPost, SocialPublishAttempt, SocialSchedulerPostStatus } from '../../../../types/scheduler';
import StatusBadge from '../../../../components/StatusBadge';
import { AttemptTimeline } from '../../../../components/AttemptTimeline';
import { PlatformTargetStatusPanel } from '../../../../components/PlatformTargetStatusPanel';
import { WorkerDiagnosticsPanel } from '../../../../components/WorkerDiagnosticsPanel';
import { SchedulerStatusBanner } from '../../../../components/SchedulerBanners';
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
} from 'lucide-react';

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Sprint1ScheduledPost | null>(null);
  const [attempts, setAttempts] = useState<SocialPublishAttempt[]>([]);
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPostAndAttempts = () => {
    setRefreshing(true);
    const found = sprint1Storage.getPostById(resolvedParams.postId);
    if (found) {
      setPost({ ...found });
      const atts = sprint1Storage.getAttempts(found.id);
      setAttempts([...atts]);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadPostAndAttempts();
  }, [resolvedParams.postId]);

  const handleConfirmCancel = () => {
    if (!post) return;
    const updated = sprint1Storage.cancelPost(post.id);
    if (updated) {
      setPost({ ...updated });
    }
    setIsCancelModalOpen(false);
    loadPostAndAttempts();
  };

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
    post.status === SocialSchedulerPostStatus.PUBLISHED_MOCK;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
          </div>
          <p className="text-xs font-mono text-zinc-500">
            Workspace: <span className="text-zinc-300 font-medium">{post.workspaceId}</span> • Post ID: {post.id}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadPostAndAttempts}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {!isTerminal && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Status Banner */}
      <SchedulerStatusBanner status={post.status} onRefresh={loadPostAndAttempts} />

      {/* Worker Diagnostics Simulator (Admin/Dev) */}
      <WorkerDiagnosticsPanel
        postId={post.id}
        workspaceId={post.workspaceId}
        onExecutionComplete={loadPostAndAttempts}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Content, Media & Timeline (7 cols) */}
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
                {asset.mimeType.startsWith('video/') ? (
                  <video
                    src={asset.previewUrl || `/api/v0/social-scheduler/media/preview?key=${encodeURIComponent(asset.objectKey)}&bucket=${encodeURIComponent(asset.bucket)}`}
                    controls
                    className="h-28 w-36 rounded-lg object-cover bg-zinc-800 border border-white/10 flex-shrink-0"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.previewUrl || `/api/v0/social-scheduler/media/preview?key=${encodeURIComponent(asset.objectKey)}&bucket=${encodeURIComponent(asset.bucket)}`}
                    alt={asset.originalFileName}
                    className="h-24 w-24 rounded-lg object-cover bg-zinc-800 border border-white/10 flex-shrink-0"
                  />
                )}

                <div className="min-w-0 space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-100 truncate">{asset.originalFileName}</div>
                  <div className="text-zinc-400 font-mono text-[11px]">
                    Bucket: <span className="text-zinc-200">{asset.bucket}</span>
                  </div>
                  <div className="text-zinc-400 font-mono text-[11px] break-all">
                    Key: <span className="text-indigo-300">{asset.objectKey}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    MIME: {asset.mimeType} • Size: {(asset.byteSize / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Attempt Timeline (Section 9.4) */}
          <AttemptTimeline attempts={attempts} />

          {/* Draft Composer JSONB Debug Panel (Section 17.4) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <button
              onClick={() => setShowJsonPanel(!showJsonPanel)}
              className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#D6B46A]" />
                <span>Draft Composer JSONB (Debug Panel)</span>
              </div>
              {showJsonPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showJsonPanel && (
              <div className="pt-2">
                <pre className="p-4 rounded-xl bg-black/80 border border-white/5 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-72">
                  {JSON.stringify(post.draftContentJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Targets & Schedule (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Schedule Parameters Card */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Schedule Parameters
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Calendar className="h-4 w-4 text-[#D6B46A]" />
                  <span>Scheduled Date</span>
                </div>
                <span className="font-mono text-zinc-200">
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'Unscheduled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock className="h-4 w-4 text-[#D6B46A]" />
                  <span>Publish Time</span>
                </div>
                <span className="font-mono text-zinc-200">
                  {post.scheduledAt
                    ? new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 font-mono">
                <span className="text-zinc-400">Target Timezone</span>
                <span className="text-zinc-200">{post.timezone || 'Asia/Kolkata'}</span>
              </div>

              {post.lastProcessedAt && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-white/5 font-mono text-[11px]">
                  <span className="text-zinc-400">Last Worker Run</span>
                  <span className="text-indigo-400">
                    {new Date(post.lastProcessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Target Status Panel (Sprint 2 Upgraded) */}
          <PlatformTargetStatusPanel
            postId={post.id}
            targets={post.targets}
            onTargetRetried={loadPostAndAttempts}
          />
        </div>
      </div>

      {/* Danger Modal for Post Cancellation */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-rose-500/30 space-y-4 shadow-2xl shadow-rose-950/40">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-semibold text-white">Cancel Scheduled Post?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to cancel <strong className="text-white">&quot;{post.title}&quot;</strong>? The worker will immediately skip processing and all targets will transition to CANCELLED.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Keep Post
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-rose-600/30"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
