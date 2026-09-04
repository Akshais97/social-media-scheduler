'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sprint1Storage } from '../../../lib/mock-storage';
import {
  Sprint1ScheduledPost,
  Workspace,
  SocialSchedulerPostStatus,
  SocialSchedulerTargetStatus,
  SchedulerOverviewSummary,
} from '../../../types/scheduler';
import StatusBadge from '../../../components/StatusBadge';
import SchedulerSubNav from '../../../components/SchedulerSubNav';
import ReschedulePostModal from '../../../components/ReschedulePostModal';
import { WorkerDiagnosticsPanel } from '../../../components/WorkerDiagnosticsPanel';
import {
  Plus,
  Search,
  Calendar,
  Eye,
  Ban,
  Building2,
  Play,
  RotateCw,
  Cpu,
  Clock,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

const FILTER_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'DUE', label: 'Due' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'PUBLISHED_MOCK', label: 'Published Mock' },
  { id: 'RETRYING', label: 'Retrying' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function SocialSchedulerHomePage() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [posts, setPosts] = useState<Sprint1ScheduledPost[]>([]);
  const [overview, setOverview] = useState<SchedulerOverviewSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [triggeringPostId, setTriggeringPostId] = useState<string | null>(null);
  const [rescheduleTargetPost, setRescheduleTargetPost] = useState<Sprint1ScheduledPost | null>(null);

  const loadPosts = () => {
    const ws = sprint1Storage.getActiveWorkspace();
    setActiveWorkspace(ws);
    const now = Date.now();
    let allPosts = sprint1Storage.getPosts(ws.id);
    const ov = sprint1Storage.getSchedulerOverview(ws.id);
    setOverview(ov);

    // Custom filtering for Sprint 2 statuses
    if (activeFilter === 'DUE') {
      allPosts = allPosts.filter((p) => {
        if (p.status === SocialSchedulerPostStatus.CANCELLED || p.status === SocialSchedulerPostStatus.DRAFT) return false;
        const isPostDue = p.scheduledAt ? new Date(p.scheduledAt).getTime() <= now : false;
        const hasDueTarget = p.targets.some((t) => {
          if (t.status === SocialSchedulerTargetStatus.RETRYING) {
            return t.nextRetryAt ? new Date(t.nextRetryAt).getTime() <= now : true;
          }
          return t.status === SocialSchedulerTargetStatus.SCHEDULED && isPostDue;
        });
        return hasDueTarget;
      });
    } else if (activeFilter !== 'ALL') {
      allPosts = allPosts.filter((p) => p.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allPosts = allPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.draftContentJson?.caption?.toLowerCase().includes(q)
      );
    }

    setPosts(allPosts);
  };

  useEffect(() => {
    loadPosts();

    const handleWsChange = (e: Event) => {
      const customEvent = e as CustomEvent<Workspace>;
      setActiveWorkspace(customEvent.detail);
      loadPosts();
    };

    window.addEventListener('workspace-changed', handleWsChange);
    return () => window.removeEventListener('workspace-changed', handleWsChange);
  }, [activeFilter, searchQuery]);

  const handleCancelPost = (postId: string) => {
    sprint1Storage.cancelPost(postId, activeWorkspace?.id);
    loadPosts();
  };

  const handleRunMockPublishForPost = async (postId: string) => {
    setTriggeringPostId(postId);
    try {
      await fetch('/api/v0/social-scheduler/worker/process-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 10,
          mockMode: 'success',
          workspaceId: activeWorkspace?.id,
        }),
      });
      loadPosts();
    } catch (err) {
      console.error('Failed to trigger mock publish', err);
    } finally {
      setTriggeringPostId(null);
    }
  };

  const getTargetSummary = (post: Sprint1ScheduledPost) => {
    const total = post.targets?.length || 0;
    const published = post.targets?.filter(
      (t) =>
        t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK ||
        t.status === SocialSchedulerTargetStatus.PUBLISHED ||
        t.status === SocialSchedulerTargetStatus.PRIVATE_RESTRICTED
    ).length || 0;
    const failed = post.targets?.filter((t) => t.status === SocialSchedulerTargetStatus.FAILED).length || 0;
    const retrying = post.targets?.filter((t) => t.status === SocialSchedulerTargetStatus.RETRYING).length || 0;

    if (total === 0) return 'No platform targets';
    if (published === total) return `All ${total} published`;
    if (retrying > 0) return `${retrying} retrying · ${published} published`;
    if (failed > 0) return `${failed} failed · ${published} published`;
    return `${total} platform targets scheduled`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SchedulerSubNav />

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">Social Scheduler</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20">
              Sprint 8 Production Ready
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Plan, publish, and monitor approved client media across connected social platforms with hardened preflights and calendar visualization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/app/social-scheduler/calendar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-medium transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D6B46A]" />
            <span>Open Calendar</span>
          </Link>

          <Link
            href="/app/social-scheduler/health"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Account Health</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium border transition-colors ${
              showDiagnostics
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-white/10'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Worker Controls</span>
          </button>

          <Link
            href="/app/social-scheduler/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-lg shadow-[#D6B46A]/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create Scheduled Post</span>
          </Link>
        </div>
      </div>

      {/* Diagnostics Panel (if toggled) */}
      {showDiagnostics && (
        <WorkerDiagnosticsPanel
          workspaceId={activeWorkspace?.id}
          onExecutionComplete={loadPosts}
        />
      )}

      {/* Overview Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Scheduled Today</span>
            <span className="text-xl font-bold text-white mt-1 block">{overview.scheduledToday}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Publishing Soon</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">{overview.publishingSoon}</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${overview.needsAttention > 0 ? 'bg-amber-950/10 border-amber-500/30 text-amber-300' : 'bg-zinc-950/60 border-white/5 text-zinc-400'}`}>
            <span className="text-[11px] font-mono uppercase block">Needs Attention</span>
            <span className="text-xl font-bold mt-1 block">{overview.needsAttention}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Published This Week</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{overview.publishedThisWeek}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Failed Targets</span>
            <span className="text-xl font-bold text-red-400 mt-1 block">{overview.failedTargets}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase block">Reauth Required</span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">{overview.reauthRequired}</span>
          </div>
        </div>
      )}

      {/* Attention Required Banner */}
      {overview && overview.attentionItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-amber-300">
              {overview.attentionItems.length} post(s) require operator review
            </h4>
            <p className="text-amber-200/80 text-[11px]">
              Issues detected: {overview.attentionItems.map((i) => `${i.postTitle} (${i.reason})`).slice(0, 2).join('; ')}
            </p>
          </div>
          <Link
            href={`/app/social-scheduler/${overview.attentionItems[0].postId}`}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Review Issues
          </Link>
        </div>
      )}

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
            <span className="text-emerald-400">B2 Bucket: {activeWorkspace.storageBucket}</span>
            <span>•</span>
            <span className="text-[#D6B46A]">{activeWorkspace.permission}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div id="posts" className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search posts or captions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]/50 font-sans"
          />
        </div>
      </div>

      {/* Post Table / Cards List */}
      {posts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950/40 border border-white/5 space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-zinc-200">No posts found in this queue</h3>
            <p className="text-xs text-zinc-500">
              {activeFilter !== 'ALL'
                ? `There are currently no posts matching the "${activeFilter}" filter.`
                : 'Get started by creating your first scheduled post in this workspace.'}
            </p>
          </div>
          {activeFilter === 'ALL' && (
            <Link
              href="/app/social-scheduler/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Post</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {posts.map((post) => {
            const isTerminal =
              post.status === SocialSchedulerPostStatus.CANCELLED ||
              post.status === SocialSchedulerPostStatus.PUBLISHED_MOCK ||
              post.status === SocialSchedulerPostStatus.PUBLISHED;
            const isProcessing = post.status === SocialSchedulerPostStatus.PROCESSING;

            return (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-zinc-950/80 border border-white/5 hover:border-white/15 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info & Thumbnail */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {post.mediaAssets && post.mediaAssets[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.mediaAssets[0].previewUrl}
                      alt={post.title}
                      className="h-14 w-14 rounded-lg object-cover bg-zinc-900 border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 text-[10px] font-mono flex-shrink-0">
                      NO MEDIA
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/app/social-scheduler/${post.id}`}
                        className="text-sm font-semibold text-zinc-100 hover:text-[#D6B46A] transition-colors truncate max-w-md block"
                      >
                        {post.title}
                      </Link>
                      <StatusBadge status={post.status} size="sm" />
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {post.draftContentJson.caption || 'No caption entered'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.scheduledAt
                          ? new Date(post.scheduledAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Unscheduled'}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-400">{getTargetSummary(post)}</span>
                      {post.lastProcessedAt && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400">
                            Worker: {new Date(post.lastProcessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  {!isTerminal && !isProcessing && (
                    <button
                      onClick={() => handleRunMockPublishForPost(post.id)}
                      disabled={triggeringPostId === post.id}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-mono flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Run mock publisher on this post"
                    >
                      <Play className="w-3 h-3 fill-indigo-300" />
                      <span>{triggeringPostId === post.id ? 'Running...' : 'Process Due'}</span>
                    </button>
                  )}

                  {!isTerminal && !isProcessing && (
                    <button
                      onClick={() => setRescheduleTargetPost(post)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#D6B46A]/10 hover:bg-[#D6B46A]/20 text-[#D6B46A] border border-[#D6B46A]/20 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Reschedule post"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  )}

                  <Link
                    href={`/app/social-scheduler/${post.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/5 flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Link>

                  {!isTerminal && !isProcessing && (
                    <button
                      onClick={() => handleCancelPost(post.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 flex items-center gap-1.5 transition-colors"
                      title="Cancel post"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTargetPost && (
        <ReschedulePostModal
          isOpen={!!rescheduleTargetPost}
          onClose={() => setRescheduleTargetPost(null)}
          post={{
            id: rescheduleTargetPost.id,
            title: rescheduleTargetPost.title,
            scheduledAt: rescheduleTargetPost.scheduledAt,
            timezone: rescheduleTargetPost.timezone,
          }}
          workspaceId={activeWorkspace?.id || 'ws_mantri'}
          onSuccess={() => {
            loadPosts();
            setRescheduleTargetPost(null);
          }}
        />
      )}
    </div>
  );
}
