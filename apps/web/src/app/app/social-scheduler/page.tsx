'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sprint1Storage } from '../../../lib/mock-storage';
import { Sprint1ScheduledPost, Workspace } from '../../../types/scheduler';
import { Plus, Search, Calendar, Eye, Ban, Sparkles, Building2, ExternalLink } from 'lucide-react';

const FILTER_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'MOCK_READY', label: 'Mock Ready' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function SocialSchedulerHomePage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [posts, setPosts] = useState<Sprint1ScheduledPost[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = () => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    setPosts(sprint1Storage.getPosts(ws.id, activeFilter, searchQuery));
  };

  useEffect(() => {
    loadPosts();

    const handleWsChange = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      setActiveWorkspace(customEvent.detail);
      setPosts(sprint1Storage.getPosts(customEvent.detail.id, activeFilter, searchQuery));
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, [activeFilter, searchQuery]);

  const handleCancelPost = (postId: string) => {
    sprint1Storage.cancelPost(postId);
    loadPosts();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Social Scheduler</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
              Sprint 1 MVP
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Plan approved media posts for each client workspace before they move into real platform publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/social-scheduler/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-lg shadow-[#D6B46A]/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Scheduled Post</span>
          </Link>
        </div>
      </div>

      {/* Active Workspace Banner */}
      {activeWorkspace && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-white/5 text-xs text-zinc-400">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-[#D6B46A]" />
            <span>
              Active client workspace: <strong className="text-white">{activeWorkspace.name}</strong> ({activeWorkspace.brandName})
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-emerald-400">Bucket: {activeWorkspace.storageBucket}</span>
            <span>•</span>
            <span className="text-[#D6B46A]">{activeWorkspace.permission}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-[#D6B46A]/15 text-[#D6B46A] border border-[#D6B46A]/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
          />
        </div>
      </div>

      {/* Posts Table / List */}
      <div className="rounded-2xl bg-zinc-950/80 border border-white/10 overflow-hidden divide-y divide-white/5 shadow-xl">
        {posts.length === 0 ? (
          /* Empty State per Section 6.2 */
          <div className="p-16 text-center max-w-md mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#D6B46A]/10 border border-[#D6B46A]/20 flex items-center justify-center text-[#D6B46A] mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Plan your first scheduled post</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Upload an approved image or video, prepare the caption, choose the client account, and save it as a
                scheduled post.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/app/social-scheduler/new"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide shadow-lg shadow-[#D6B46A]/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create Scheduled Post</span>
              </Link>
            </div>
          </div>
        ) : (
          posts.map((post) => {
            const hasMedia = post.mediaAssets && post.mediaAssets.length > 0;
            const previewImage = hasMedia ? post.mediaAssets[0].previewUrl : null;
            const isScheduled = post.status === 'SCHEDULED';

            return (
              <div
                key={post.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start md:items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt="Thumbnail" className="h-full w-full object-cover" />
                    ) : (
                      <Calendar className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-xl">{post.title}</h3>
                    <p className="text-xs text-zinc-400 truncate max-w-xl">{post.draftContentJson.caption}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500">
                      <span>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Unscheduled'}</span>
                      <span>•</span>
                      <span>{post.timezone || 'Asia/Kolkata'}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        {post.targets.map((t) => (
                          <span
                            key={t.id}
                            className="bg-zinc-900 border border-white/5 px-2 py-0.5 rounded text-[9px] text-zinc-300"
                          >
                            {t.platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
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

                  <Link
                    href={`/app/social-scheduler/${post.id}`}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 transition-all text-xs flex items-center gap-1"
                    title="View details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>

                  {isScheduled && (
                    <button
                      type="button"
                      onClick={() => handleCancelPost(post.id)}
                      className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all text-xs"
                      title="Cancel post"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
