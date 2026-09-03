'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockStorage } from '../../lib/mock-storage';
import { Post, PostStatus } from '../../types/scheduler';
import StatusBadge from '../../components/StatusBadge';
import PlatformIcon from '../../components/PlatformIcon';
import { Clock, CheckCircle2, AlertTriangle, Calendar, Plus, ArrowRight, Eye } from 'lucide-react';

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(mockStorage.getPosts());
  }, []);

  const scheduledCount = posts.filter((p) => p.status === PostStatus.SCHEDULED).length;
  const publishedCount = posts.filter((p) => p.status === PostStatus.PUBLISHED).length;
  const failedCount = posts.filter((p) => p.status === PostStatus.FAILED).length;
  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Publisher Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitoring scheduled publish targets, B2 uploads, and platform adapter attempts.
          </p>
        </div>

        <Link
          href="/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Create Scheduled Post</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Scheduled Queue</span>
            <div className="text-3xl font-bold text-indigo-400 mt-1">{scheduledCount}</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Awaiting Railway worker trigger</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Published Posts</span>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{publishedCount}</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Live across verified accounts</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Failed / Reauth</span>
            <div className="text-3xl font-bold text-rose-400 mt-1">{failedCount}</div>
            <span className="text-[11px] text-zinc-500 mt-1 block">Attention or reauthorization needed</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="rounded-xl bg-zinc-950/80 border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold text-zinc-200">Recent Post Queue</span>
          </div>
          <Link
            href="/posts"
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({posts.length})</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No posts created yet. Click "Create Scheduled Post" to begin.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {post.mediaAssets[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.mediaAssets[0].previewUrl}
                      alt="Thumbnail"
                      className="h-12 w-12 rounded-lg object-cover bg-zinc-800 flex-shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center text-zinc-600 border border-white/5">
                      <Clock className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate max-w-lg">
                      {post.caption}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-zinc-500">
                      <span>{post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'Draft'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        {post.publishTargets.map((target) => (
                          <div key={target.id} className="flex items-center gap-1 text-zinc-400">
                            <PlatformIcon platform={target.platform} className="h-3.5 w-3.5" />
                            <span>{target.platform}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={post.status} />
                  <Link
                    href={`/posts/${post.id}`}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
