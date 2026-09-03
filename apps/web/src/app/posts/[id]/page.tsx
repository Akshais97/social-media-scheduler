'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockStorage } from '../../../lib/mock-storage';
import { Post, PostStatus, PublishTargetStatus } from '../../../types/scheduler';
import StatusBadge from '../../../components/StatusBadge';
import PlatformIcon from '../../../components/PlatformIcon';
import { ArrowLeft, Calendar, Clock, Database, AlertCircle, Ban, ExternalLink, ShieldCheck } from 'lucide-react';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const found = mockStorage.getPostById(resolvedParams.id);
    if (found) {
      setPost(found);
    }
  }, [resolvedParams.id]);

  const handleCancel = () => {
    if (!post) return;
    setCancelling(true);
    const updated = mockStorage.cancelPost(post.id);
    if (updated) {
      setPost({ ...updated });
    }
    setCancelling(false);
  };

  if (!post) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-zinc-400 text-sm">Post not found in scheduler queue.</p>
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to posts</span>
        </Link>
      </div>
    );
  }

  const isCancellable = post.status === PostStatus.SCHEDULED || post.status === PostStatus.DRAFT;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/posts"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">Post Details</h1>
              <StatusBadge status={post.status} />
            </div>
            <span className="text-[11px] font-mono text-zinc-500">ID: {post.id}</span>
          </div>
        </div>

        {isCancellable && (
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{cancelling ? 'Cancelling...' : 'Cancel Schedule'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Details & Media (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Caption Box */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Post Caption</span>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {post.caption}
            </p>
          </div>

          {/* Media Assets Information */}
          <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Media Storage (Backblaze B2)
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Presigned S3 API
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
                  alt={asset.originalFilename}
                  className="h-24 w-24 rounded-lg object-cover bg-zinc-800 border border-white/10 flex-shrink-0"
                />

                <div className="min-w-0 space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-100 truncate">{asset.originalFilename || asset.originalFileName}</div>
                  <div className="text-zinc-400 font-mono text-[11px]">
                    Bucket: <span className="text-zinc-200">{asset.b2Bucket || asset.bucket}</span>
                  </div>
                  <div className="text-zinc-400 font-mono text-[11px] break-all">
                    Key: <span className="text-indigo-300">{asset.b2Key || asset.objectKey}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    MIME: {asset.mimeType} • Size: {(((asset.sizeBytes ?? asset.byteSize) || 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Publishing Targets & Attempt History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scheduling Details */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Schedule Parameters</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  Scheduled For
                </span>
                <span className="font-mono text-zinc-200">
                  {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'Not scheduled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-white/5">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  Created At
                </span>
                <span className="font-mono text-zinc-200">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Publish Targets */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Publish Targets ({(post.publishTargets || post.targets || []).length})
            </span>

            <div className="space-y-3">
              {(post.publishTargets || post.targets || []).map((target) => (
                <div
                  key={target.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={target.platform} className="h-4 w-4" />
                      <span className="text-xs font-semibold text-zinc-200">
                        {target.socialAccount?.displayName || target.platform}
                      </span>
                    </div>
                    <StatusBadge status={target.status} size="sm" />
                  </div>

                  {target.platformPostUrl && (
                    <a
                      href={target.platformPostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:underline"
                    >
                      <span>View live platform post</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {target.lastErrorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <div className="font-mono text-[10px] font-bold text-rose-400 uppercase">
                        {target.lastErrorCode || 'ERROR'}
                      </div>
                      <p className="mt-0.5 text-[11px]">{target.lastErrorMessage}</p>
                    </div>
                  )}

                  <div className="pt-1 text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>Retry Count: {target.retryCount ?? 0}</span>
                    <span className="truncate max-w-[160px]" title={target.idempotencyKey || target.id}>
                      Key: {(target.idempotencyKey || target.id).slice(0, 15)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
