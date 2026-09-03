'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sprint1Storage } from '../../../../lib/mock-storage';
import { Sprint1ScheduledPost } from '../../../../types/scheduler';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Ban,
  ShieldCheck,
  Code2,
  Share2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Sprint1ScheduledPost | null>(null);
  const [showJsonPanel, setShowJsonPanel] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    const found = sprint1Storage.getPostById(resolvedParams.postId);
    if (found) {
      setPost(found);
    }
  }, [resolvedParams.postId]);

  const handleConfirmCancel = () => {
    if (!post) return;
    const updated = sprint1Storage.cancelPost(post.id);
    if (updated) {
      setPost({ ...updated });
    }
    setIsCancelModalOpen(false);
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

  const isCancellable = post.status === 'SCHEDULED' || post.status === 'DRAFT';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/app/social-scheduler"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">{post.title}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                  post.status === 'SCHEDULED'
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : post.status === 'DRAFT'
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    : post.status === 'CANCELLED'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-[#D6B46A]/10 text-[#D6B46A] border-[#D6B46A]/30'
                }`}
              >
                {post.status}
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">ID: {post.id}</span>
          </div>
        </div>

        {isCancellable && (
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>Cancel Scheduled Post</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Content & Media (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Caption Box */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Post Caption</span>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {post.draftContentJson.caption}
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

          {/* Media Assets (B2 Object Keys) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Media Storage (Backblaze B2)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Workspace-Scoped Object
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
                  alt={asset.originalFileName}
                  className="h-24 w-24 rounded-lg object-cover bg-zinc-800 border border-white/10 flex-shrink-0"
                />

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

          {/* Draft Composer JSONB Debug Panel (Section 17.4) */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <button
              type="button"
              onClick={() => setShowJsonPanel(!showJsonPanel)}
              className="w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#D6B46A]"
            >
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                <span>Draft Composer JSONB (Debug Panel)</span>
              </div>
              {showJsonPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showJsonPanel && (
              <pre className="p-4 rounded-xl bg-zinc-900 text-[11px] font-mono text-zinc-300 overflow-x-auto border border-white/5 max-h-72">
                {JSON.stringify(post.draftContentJson, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Platform Targets & Schedule (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Schedule Parameters */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Schedule Parameters</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  Scheduled For
                </span>
                <span className="font-mono text-zinc-200">
                  {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Not scheduled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Timezone
                </span>
                <span className="font-mono text-[#D6B46A]">{post.timezone || 'Asia/Kolkata'}</span>
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Publish Targets ({post.targets.length})
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Sprint 1 Mock Targets</span>
            </div>

            <div className="space-y-2.5">
              {post.targets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{t.platform}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">{t.mockAccountName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Timeline Placeholder for Sprint 2 */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Status Timeline</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Draft created &amp; media registered</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                <span>Publish targets assigned</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-600">
                <Clock className="h-4 w-4 text-zinc-600" />
                <span>Worker publish execution (Scheduled for Sprint 2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Confirmation Modal (Section 17) */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Cancel this scheduled post?</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              This will remove the post from the scheduled queue and mark all targets as CANCELLED.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
              >
                Keep Scheduled
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20"
              >
                Yes, Cancel Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
