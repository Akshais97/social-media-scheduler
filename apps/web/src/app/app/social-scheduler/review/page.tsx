'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Filter,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Edit,
  Send,
  ThumbsUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import ApprovalStatusChip from '@/components/ApprovalStatusChip';
import SendForReviewModal from '@/components/SendForReviewModal';
import ApprovePostModal from '@/components/ApprovePostModal';
import RequestChangesModal from '@/components/RequestChangesModal';
import RejectPostModal from '@/components/RejectPostModal';
import { SocialSchedulerApprovalStatus, Sprint1ScheduledPost } from '@/types/scheduler';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'in_review', label: 'In Review' },
  { id: 'changes_requested', label: 'Changes Requested' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ReviewQueuePage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [posts, setPosts] = useState<Sprint1ScheduledPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [workspaceId, setWorkspaceId] = useState<string>('ws_mantri');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'none' | 'send_for_review' | 'approve' | 'request_changes' | 'reject'
  >('none');
  const [selectedPost, setSelectedPost] = useState<Sprint1ScheduledPost | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v0/social-scheduler/review/queue?workspaceId=${workspaceId}&tab=${activeTab}`
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {
      console.error('Failed to fetch review queue posts', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, activeTab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleActionSuccess = () => {
    setActiveModal('none');
    setSelectedPost(null);
    fetchPosts();
  };

  const getPostCaption = (p: Sprint1ScheduledPost) => {
    const raw = (p as any).draftContentJson;
    if (!raw) return 'Untitled Post';
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return parsed.caption || parsed.title || 'Untitled Post';
      } catch {
        return raw;
      }
    }
    return raw.caption || raw.title || 'Untitled Post';
  };

  const getPlatforms = (p: Sprint1ScheduledPost): string[] => {
    const targets = (p as any).targets || [];
    if (targets.length > 0) {
      return targets.map((t: any) => t.platform);
    }
    return ['INSTAGRAM', 'LINKEDIN'];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Review Queue</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Track posts waiting for review, approval, or changes before publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPosts}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg border border-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/app/social-scheduler/bulk"
            className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg border border-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Bulk Drafts
          </Link>
          <Link
            href="/app/social-scheduler/calendar"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            View Calendar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {tab.label}
              {isActive && posts.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-semibold">
                  {posts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-sm">Loading review items...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center border border-gray-800 rounded-xl bg-gray-900/50 p-8">
          <FileCheck2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-300">No posts in this queue</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            There are currently no scheduled posts matching the "{activeTab}" filter.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/app/social-scheduler/bulk"
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-medium rounded-lg text-gray-300 border border-gray-700"
            >
              Create Bulk Posts
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => {
            const caption = getPostCaption(post);
            const platforms = getPlatforms(post);
            const mediaAssets = (post as any).mediaAssets || [];
            const hasMedia = mediaAssets.length > 0;
            const rawDate = post.scheduledFor || post.scheduledAt;
            const scheduledDate = rawDate
              ? new Date(rawDate).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Not scheduled';

            return (
              <div
                key={post.id}
                className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 sm:p-5 hover:border-gray-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left side: Media preview & Post Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {hasMedia ? (
                      <img
                        src={mediaAssets[0].publicUrl || `https://picsum.photos/seed/${post.id}/200/200`}
                        alt="Media Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback icon on broken image
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Sparkles className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  {/* Text & Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/app/social-scheduler/${post.id}`}
                        className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors line-clamp-1"
                      >
                        {caption}
                      </Link>
                      <ApprovalStatusChip status={status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1 text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {scheduledDate}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        ID: {post.id.slice(0, 10)}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {platforms.map((plat) => (
                          <span
                            key={plat}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300 border border-gray-700"
                          >
                            {plat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Review Note / Readiness Note */}
                    {(post as any).rejectionReason && (
                      <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 px-2 py-1 rounded border border-rose-800/40">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Changes/Rejection note: {(post as any).rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  <Link
                    href={`/app/social-scheduler/${post.id}`}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg border border-gray-700 transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Detail
                  </Link>

                  {/* Send for Review (Available for DRAFT or CHANGES_REQUESTED) */}
                  {['DRAFT', 'CHANGES_REQUESTED', 'NOT_REQUIRED'].includes(status) && (
                    <button
                      onClick={() => {
                        setSelectedPost(post);
                        setActiveModal('send_for_review');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Send for Review
                    </button>
                  )}

                  {/* Approve / Request Changes / Reject (Available for IN_REVIEW) */}
                  {status === 'IN_REVIEW' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          setActiveModal('approve');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Approve
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          setActiveModal('request_changes');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Request Changes
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          setActiveModal('reject');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'send_for_review' && selectedPost && (
        <SendForReviewModal
          isOpen={true}
          postId={selectedPost.id}
          postTitle={getPostCaption(selectedPost)}
          onClose={() => {
            setActiveModal('none');
            setSelectedPost(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}

      {activeModal === 'approve' && selectedPost && (
        <ApprovePostModal
          isOpen={true}
          postId={selectedPost.id}
          postTitle={getPostCaption(selectedPost)}
          onClose={() => {
            setActiveModal('none');
            setSelectedPost(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}

      {activeModal === 'request_changes' && selectedPost && (
        <RequestChangesModal
          isOpen={true}
          postId={selectedPost.id}
          postTitle={getPostCaption(selectedPost)}
          onClose={() => {
            setActiveModal('none');
            setSelectedPost(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}

      {activeModal === 'reject' && selectedPost && (
        <RejectPostModal
          isOpen={true}
          postId={selectedPost.id}
          postTitle={getPostCaption(selectedPost)}
          onClose={() => {
            setActiveModal('none');
            setSelectedPost(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
