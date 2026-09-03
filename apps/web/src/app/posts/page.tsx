'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockStorage } from '../../lib/mock-storage';
import { Post, PostStatus } from '../../types/scheduler';
import StatusBadge from '../../components/StatusBadge';
import PlatformIcon from '../../components/PlatformIcon';
import { Plus, Search, Calendar, Eye, Image as ImageIcon } from 'lucide-react';

const TABS = [
  { id: 'ALL', label: 'All Posts' },
  { id: PostStatus.SCHEDULED, label: 'Scheduled' },
  { id: PostStatus.PUBLISHED, label: 'Published' },
  { id: PostStatus.FAILED, label: 'Failed' },
  { id: PostStatus.DRAFT, label: 'Drafts' },
  { id: PostStatus.CANCELLED, label: 'Cancelled' },
];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPosts(mockStorage.getPosts());
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === 'ALL' || post.status === activeTab;
    const caption = post.caption || post.draftContentJson?.caption || '';
    const matchesSearch =
      searchQuery.trim() === '' ||
      caption.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Post Inventory</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage scheduled, published, and drafted social publications.
          </p>
        </div>

        <Link
          href="/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Post</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const count =
              tab.id === 'ALL'
                ? posts.length
                : posts.filter((p) => p.status === tab.id).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/5">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Post Grid/List */}
      <div className="rounded-xl bg-zinc-950/80 border border-white/10 overflow-hidden divide-y divide-white/5">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No posts found in this view.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start md:items-center gap-4 min-w-0">
                {/* Media Thumbnail */}
                <div className="relative h-14 w-14 rounded-lg bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {post.mediaAssets[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.mediaAssets[0].previewUrl}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-zinc-600" />
                  )}
                </div>

                {/* Caption & Metadata */}
                <div className="min-w-0 space-y-1">
                  <p className="text-sm text-zinc-200 font-medium line-clamp-2 max-w-2xl">
                    {post.caption || post.draftContentJson?.caption || ''}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      {post.scheduledFor
                        ? new Date(post.scheduledFor).toLocaleString()
                        : 'Unscheduled Draft'}
                    </span>

                    <span>•</span>

                    {/* Targets */}
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Targets:</span>
                      {(post.publishTargets || post.targets || []).map((t: any) => (
                        <span
                          key={t.id}
                          className="flex items-center gap-1 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[10px]"
                        >
                          <PlatformIcon platform={t.platform} className="h-3 w-3" />
                          <span>{t.socialAccount?.displayName || t.platform}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                <StatusBadge status={post.status} />
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
