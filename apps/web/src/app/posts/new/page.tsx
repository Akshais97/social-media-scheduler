'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockStorage, MOCK_ACCOUNTS } from '../../../lib/mock-storage';
import { MediaAsset, SocialPlatform } from '../../../types/scheduler';
import MediaDropzone from '../../../components/MediaDropzone';
import SocialPreviewMockup from '../../../components/SocialPreviewMockup';
import PlatformIcon from '../../../components/PlatformIcon';
import { Calendar, Clock, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([MOCK_ACCOUNTS[0].id]);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleAccount = (id: string) => {
    if (selectedAccountIds.includes(id)) {
      if (selectedAccountIds.length > 1) {
        setSelectedAccountIds(selectedAccountIds.filter((a) => a !== id));
      }
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  const handleSave = (isScheduled: boolean) => {
    setError(null);

    if (!caption.trim()) {
      setError('Please provide a post caption.');
      return;
    }

    if (mediaAssets.length === 0) {
      setError('At least one media file (image/video) must be uploaded to Backblaze B2.');
      return;
    }

    if (selectedAccountIds.length === 0) {
      setError('Please select at least one target social account.');
      return;
    }

    let scheduleIso: string | undefined = undefined;
    if (isScheduled) {
      const scheduleTime = new Date(scheduledDate).getTime();
      if (isNaN(scheduleTime) || scheduleTime <= Date.now()) {
        setError('Scheduled date & time must be in the future.');
        return;
      }
      scheduleIso = new Date(scheduledDate).toISOString();
    }

    setSubmitting(true);

    const targetAccounts = selectedAccountIds.map((id) => {
      const acc = MOCK_ACCOUNTS.find((a) => a.id === id)!;
      return { accountId: id, platform: acc.platform as SocialPlatform };
    });

    setTimeout(() => {
      const newPost = mockStorage.createPost({
        caption,
        scheduledFor: scheduleIso,
        mediaAssets,
        targetAccounts,
      });

      router.push(`/posts/${newPost.id}`);
    }, 400);
  };

  const primaryAccount = MOCK_ACCOUNTS.find((a) => a.id === selectedAccountIds[0]) || MOCK_ACCOUNTS[0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/posts"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create & Schedule Post</h1>
          <p className="text-xs text-zinc-400">
            Configure caption, upload assets directly to B2, and select publishing destinations.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Composer Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl">
          {/* 1. Media Upload */}
          <MediaDropzone mediaAssets={mediaAssets} onChange={setMediaAssets} />

          {/* 2. Caption Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                Post Caption
              </label>
              <span className={`text-[11px] font-mono ${caption.length > 2200 ? 'text-rose-400' : 'text-zinc-500'}`}>
                {caption.length} / 2,200 chars
              </span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What would you like to share? Add hashtags, mentions, or announcements..."
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 3. Platform & Accounts Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Publish Destinations (Connected Accounts)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MOCK_ACCOUNTS.map((account) => {
                const isSelected = selectedAccountIds.includes(account.id);
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => toggleAccount(account.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                        : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlatformIcon platform={account.platform} className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{account.displayName}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{account.platform}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Scheduling Date & Time Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
              Scheduled Date & Time (UTC/Local)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Railway worker will poll and trigger publishing when due time arrives.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Schedule Post'}
            </button>
          </div>
        </div>

        {/* Right Preview Column: Live Mobile Feed Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full flex justify-center">
            <SocialPreviewMockup
              caption={caption}
              mediaAssets={mediaAssets}
              selectedAccount={primaryAccount}
              scheduledFor={scheduledDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
