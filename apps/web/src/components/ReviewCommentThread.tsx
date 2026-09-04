'use client';

import React, { useState, useEffect } from 'react';
import { SocialSchedulerReviewComment, SocialSchedulerReviewCommentType } from '@/types/scheduler';

interface ReviewCommentThreadProps {
  postId: string;
  workspaceId: string;
}

export function ReviewCommentThread({ postId, workspaceId }: ReviewCommentThreadProps) {
  const [comments, setComments] = useState<SocialSchedulerReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${postId}/comments?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, workspaceId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v0/social-scheduler/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          body: newComment.trim(),
          commentType: SocialSchedulerReviewCommentType.GENERAL,
        }),
      });

      if (res.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentBadge = (type: string) => {
    switch (type) {
      case SocialSchedulerReviewCommentType.APPROVAL:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case SocialSchedulerReviewCommentType.CHANGE_REQUEST:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Changes Requested</span>;
      case SocialSchedulerReviewCommentType.REJECTION:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      case SocialSchedulerReviewCommentType.REVIEW_REQUEST:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Review Request</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <span>Review Discussion</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
            {comments.length}
          </span>
        </h4>
      </div>

      <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-zinc-500 text-center py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-zinc-500 text-center py-6">
            No comments yet. Leave a note for your team or reviewers below.
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-3.5 bg-zinc-950/60 rounded-lg border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300">
                    {c.authorUserId === 'usr_admin' ? 'Admin' : c.authorUserId}
                  </span>
                  {getCommentBadge(c.commentType)}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {new Date(c.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddComment} className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex gap-2">
        <input
          type="text"
          placeholder="Add a comment or note..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
        >
          {isSubmitting ? 'Posting...' : 'Comment'}
        </button>
      </form>
    </div>
  );
}

export default ReviewCommentThread;
