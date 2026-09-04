'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SchedulerSubNav from '@/components/SchedulerSubNav';
import {
  SocialSchedulerPlatform,
  BulkDraftItem,
  Sprint1MediaAsset,
  DraftContentJson,
} from '@/types/scheduler';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Calendar,
  Share2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';

const STAGES = [
  { id: 1, label: 'Workspace', icon: Layers },
  { id: 2, label: 'Upload', icon: UploadCloud },
  { id: 3, label: 'Drafts', icon: FileText },
  { id: 4, label: 'Platforms', icon: Share2 },
  { id: 5, label: 'Schedule', icon: Calendar },
  { id: 6, label: 'Review', icon: CheckCircle2 },
  { id: 7, label: 'Create', icon: Sparkles },
];

export default function BulkDraftsPage() {
  const router = useRouter();
  const [stage, setStage] = useState(1);
  const [workspaceId, setWorkspaceId] = useState('ws_mantri');

  // Stage 2 state: Upload
  const [uploadedFiles, setUploadedFiles] = useState<Sprint1MediaAsset[]>([]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stage 3 state: Drafts
  const [batchName, setBatchName] = useState('Real Estate Campaign Batch');
  const [draftItems, setDraftItems] = useState<BulkDraftItem[]>([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [bulkCaption, setBulkCaption] = useState('');
  const [bulkHashtags, setBulkHashtags] = useState('');
  const [bulkCta, setBulkCta] = useState('');
  const [applyOnlyEmpty, setApplyOnlyEmpty] = useState(false);

  // Stage 4 state: Platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialSchedulerPlatform[]>([
    SocialSchedulerPlatform.FACEBOOK,
    SocialSchedulerPlatform.INSTAGRAM,
  ]);

  // Stage 5 state: Schedule
  const [scheduleMode, setScheduleMode] = useState<'DRAFTS_ONLY' | 'AUTO_SPREAD'>('DRAFTS_ONLY');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [skipWeekends, setSkipWeekends] = useState(true);

  // Stage 6 & 7 state: Batch result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBatchId, setCreatedBatchId] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Initialize draft items when files change
  useEffect(() => {
    if (uploadedFiles.length > 0 && draftItems.length === 0) {
      const items: BulkDraftItem[] = uploadedFiles.map((file, idx) => ({
        mediaAssetId: file.id,
        title: `Draft Post ${idx + 1}: ${file.originalFileName.replace(/\.[^/.]+$/, '')}`,
        draftContentJson: {
          version: '1.0',
          source: 'manual_upload',
          postTitle: `Draft Post ${idx + 1}`,
          caption: '',
          hashtags: [],
        },
        targets: selectedPlatforms.map((p) => ({
          platform: p,
          mockAccountName: `${p} Mock Account`,
          publishMode: 'MOCK',
        })),
        scheduledAt: null,
        timezone: 'Asia/Kolkata',
      }));
      setDraftItems(items);
    }
  }, [uploadedFiles]);

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 50) {
      setUploadError('Maximum 50 files allowed per bulk action.');
      return;
    }

    setUploadError(null);
    const newAssets: Sprint1MediaAsset[] = Array.from(files).map((f, i) => ({
      id: `asset_bulk_${Date.now()}_${i}`,
      workspaceId,
      uploadedByUserId: 'usr_admin',
      originalFileName: f.name,
      safeFileName: f.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
      mimeType: f.type || 'image/jpeg',
      byteSize: f.size,
      bucket: 'sakhaa-forge-clean-media',
      objectKey: `${workspaceId}/raw/${Date.now()}_${f.name}`,
      status: 'UPLOADED' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setUploadedFiles((prev) => [...prev, ...newAssets]);
  };

  const handleApplyToAll = () => {
    const tags = bulkHashtags
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

    setDraftItems((prev) =>
      prev.map((item) => {
        const baseDraft: DraftContentJson = item.draftContentJson || {
          version: '1.0',
          source: 'manual_upload',
          caption: '',
          hashtags: [],
        };
        const currentCaption = baseDraft.caption || item.caption || '';
        const shouldReplace = !applyOnlyEmpty || !currentCaption.trim();

        const updatedDraft: DraftContentJson = {
          ...baseDraft,
          version: '1.0',
          source: 'manual_upload',
          caption: shouldReplace ? bulkCaption : currentCaption,
          cta: shouldReplace && bulkCta ? bulkCta : baseDraft.cta,
          hashtags: tags.length > 0 ? Array.from(new Set([...(baseDraft.hashtags || []), ...tags])) : (baseDraft.hashtags || []),
        };

        return {
          ...item,
          caption: updatedDraft.caption,
          draftContentJson: updatedDraft,
        };
      })
    );
    setApplyModalOpen(false);
  };

  const handleAutoSpread = () => {
    if (scheduleMode === 'DRAFTS_ONLY') {
      setDraftItems((prev) =>
        prev.map((item) => ({
          ...item,
          scheduledAt: null,
        }))
      );
      return;
    }

    let currentDate = new Date(`${startDate}T10:00:00.000Z`);
    let dailyAssigned = 0;

    const updated = draftItems.map((item) => {
      while (skipWeekends && (currentDate.getUTCDay() === 0 || currentDate.getUTCDay() === 6)) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      const scheduledAt = new Date(currentDate).toISOString();
      dailyAssigned++;

      if (dailyAssigned >= postsPerDay) {
        dailyAssigned = 0;
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(10, 0, 0, 0);
      } else {
        currentDate.setUTCHours(currentDate.getUTCHours() + 4);
      }

      return {
        ...item,
        scheduledAt,
      };
    });

    setDraftItems(updated);
  };

  const handleCreateBatch = async (sendForReview: boolean = false) => {
    setIsSubmitting(true);
    try {
      // 1. Initialize batch
      const batchRes = await fetch('/api/v0/social-scheduler/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: batchName,
          settingsJson: {
            mode: scheduleMode,
            sendForReview,
          },
        }),
      });

      const batchData = await batchRes.json();
      if (!batchRes.ok) throw new Error(batchData.error || 'Failed to create batch');

      // 2. Create posts from batch
      const postsRes = await fetch(`/api/v0/social-scheduler/batches/${batchData.batchId}/create-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          batchId: batchData.batchId,
          items: draftItems,
        }),
      });

      const postsData = await postsRes.json();
      if (!postsRes.ok) throw new Error(postsData.error || 'Failed to populate posts in batch');

      setCreatedBatchId(batchData.batchId);
      setCreatedCount(postsData.createdPosts);
      setFailedCount(postsData.failedPosts);
      setStage(7); // Create success stage
    } catch (err: any) {
      alert(err.message || 'Error executing batch creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <SchedulerSubNav />

        {/* Stage Rail */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 overflow-x-auto">
            {STAGES.map((s) => {
              const Icon = s.icon;
              const isActive = stage === s.id;
              const isPast = stage > s.id;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30'
                      : isPast
                      ? 'text-emerald-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isPast
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage 1: Workspace */}
        {stage === 1 && (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Choose workspace</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Bulk drafts and creatives are strictly isolated to one client workspace.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Client Workspace</label>
                <select
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ws_mantri">Mantri Developers (ws_mantri)</option>
                  <option value="ws_sobha">Sobha Realty (ws_sobha)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-4 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-xs space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Tenant Isolation:</span>
                  <span className="text-emerald-400 font-medium">Enforced</span>
                </div>
                <div className="flex justify-between">
                  <span>Media Bucket:</span>
                  <span className="text-zinc-300 font-mono text-[11px]">sakhaa-forge-clean-media</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 2: Upload */}
        {stage === 2 && (
          <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Upload approved media</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Upload up to 50 approved images or videos for this client workspace.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-8 text-center transition-colors bg-zinc-950/40">
              <UploadCloud className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-xs font-medium text-zinc-200">Drag and drop approved media files here</p>
              <p className="text-[11px] text-zinc-500 mt-1">Images up to 10 MB, MP4 videos up to 200 MB</p>
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer transition-colors">
                <span>Browse files</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,video/mp4"
                  onChange={handleSimulatedUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Uploaded Files ({uploadedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove all
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {uploadedFiles.map((f, i) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs"
                    >
                      <span className="font-medium text-zinc-300 truncate max-w-sm">{f.originalFileName}</span>
                      <span className="text-[11px] text-zinc-500">{(f.byteSize / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(e) => setRightsConfirmed(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>I confirm these media files are approved for use by this client.</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={uploadedFiles.length === 0 || !rightsConfirmed}
                onClick={() => setStage(3)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-medium text-white transition-colors"
              >
                <span>Continue to Drafts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: Draft Details */}
        {stage === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Create draft details</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Refine titles, captions, and tags for each creative.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D6B46A]" />
                <span>Apply to all</span>
              </button>
            </div>

            <div className="space-y-4">
              {draftItems.map((item, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">Post #{idx + 1}</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...draftItems];
                        updated[idx].title = e.target.value;
                        setDraftItems(updated);
                      }}
                      className="w-1/2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Caption</label>
                    <textarea
                      rows={2}
                      value={item.draftContentJson?.caption || item.caption || ''}
                      onChange={(e) => {
                        const updated = [...draftItems];
                        if (!updated[idx].draftContentJson) {
                          updated[idx].draftContentJson = {
                            version: '1.0',
                            source: 'manual_upload',
                            caption: e.target.value,
                            hashtags: [],
                          };
                        } else {
                          updated[idx].draftContentJson!.caption = e.target.value;
                        }
                        updated[idx].caption = e.target.value;
                        setDraftItems(updated);
                      }}
                      placeholder="Write caption for this post..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStage(4)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
              >
                <span>Continue to Platforms</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: Platforms */}
        {stage === 4 && (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Assign platforms</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Select the target platforms for this batch.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: SocialSchedulerPlatform.FACEBOOK, label: 'Facebook Page' },
                { id: SocialSchedulerPlatform.INSTAGRAM, label: 'Instagram Business' },
                { id: SocialSchedulerPlatform.PINTEREST, label: 'Pinterest' },
                { id: SocialSchedulerPlatform.X, label: 'X (Twitter)' },
                { id: SocialSchedulerPlatform.YOUTUBE, label: 'YouTube (Video Only)' },
              ].map((p) => {
                const isChecked = selectedPlatforms.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, p.id]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p.id));
                        }
                      }}
                      className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-zinc-200">{p.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(3)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  // Apply selected platforms to all items
                  setDraftItems((prev) =>
                    prev.map((item) => ({
                      ...item,
                      targets: selectedPlatforms.map((p) => ({
                        platform: p,
                        mockAccountName: `${p} Mock Account`,
                        publishMode: 'MOCK',
                      })),
                    }))
                  );
                  setStage(5);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
              >
                <span>Continue to Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 5: Schedule */}
        {stage === 5 && (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Assign schedule times</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose when each draft should publish, or save all as unscheduled drafts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleMode('DRAFTS_ONLY')}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    scheduleMode === 'DRAFTS_ONLY'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-semibold block text-zinc-200">Save all as drafts</span>
                  <span className="text-[11px] block mt-1">No publish times assigned. Edit or schedule anytime.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('AUTO_SPREAD')}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    scheduleMode === 'AUTO_SPREAD'
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-semibold block text-zinc-200">Auto-spread dates</span>
                  <span className="text-[11px] block mt-1">Evenly distribute posts across upcoming days.</span>
                </button>
              </div>

              {scheduleMode === 'AUTO_SPREAD' && (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-lg space-y-4">
                  <div>
                    <label className="text-xs text-zinc-300 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-300">Posts per Day</label>
                    <select
                      value={postsPerDay}
                      onChange={(e) => setPostsPerDay(Number(e.target.value))}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    >
                      <option value={1}>1 post/day</option>
                      <option value={2}>2 posts/day</option>
                      <option value={3}>3 posts/day</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={skipWeekends}
                        onChange={(e) => setSkipWeekends(e.target.checked)}
                        className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Skip weekends (Saturday & Sunday)</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoSpread}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors"
                  >
                    Generate Schedule Dates
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(4)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStage(6)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
              >
                <span>Review Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Stage 6: Review */}
        {stage === 6 && (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Review batch</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Verify summary counts before creating batch posts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500">Total Drafts</span>
                <p className="text-2xl font-bold text-zinc-100 mt-1">{draftItems.length}</p>
              </div>
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <span className="text-xs text-zinc-500">Scheduled Mode</span>
                <p className="text-sm font-semibold text-emerald-400 mt-1">
                  {scheduleMode === 'DRAFTS_ONLY' ? 'Unscheduled Drafts' : 'Scheduled Spread'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Workspace:</span>
                <span className="font-mono text-[11px] text-zinc-200">{workspaceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected Platforms:</span>
                <span>{selectedPlatforms.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Media Assets:</span>
                <span>{uploadedFiles.length} files attached</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStage(5)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateBatch(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                >
                  Create as drafts
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleCreateBatch(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Send for Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage 7: Create Success */}
        {stage === 7 && (
          <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Bulk drafts created</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Your batch has been successfully saved to {workspaceId}.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 inline-flex gap-8 text-xs">
              <div>
                <span className="text-zinc-500 block">Created</span>
                <span className="text-lg font-bold text-emerald-400">{createdCount}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Failed</span>
                <span className="text-lg font-bold text-zinc-400">{failedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/app/social-scheduler/calendar"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                Open calendar
              </Link>
              <Link
                href="/app/social-scheduler/review"
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                Review queue
              </Link>
              <Link
                href="/app/social-scheduler"
                className="px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
              >
                Back to scheduler
              </Link>
            </div>
          </div>
        )}

        {/* Apply To All Modal */}
        {applyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-semibold text-zinc-100">Apply to all drafts</h3>
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-300 block mb-1">Common Caption</label>
                  <textarea
                    rows={3}
                    value={bulkCaption}
                    onChange={(e) => setBulkCaption(e.target.value)}
                    placeholder="Enter caption to apply across all rows..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 block mb-1">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={bulkCta}
                    onChange={(e) => setBulkCta(e.target.value)}
                    placeholder="e.g. Visit our website for more details"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-300 block mb-1">Hashtags</label>
                  <input
                    type="text"
                    value={bulkHashtags}
                    onChange={(e) => setBulkHashtags(e.target.value)}
                    placeholder="#RealEstate #LuxuryHomes"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={applyOnlyEmpty}
                      onChange={(e) => setApplyOnlyEmpty(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Only fill empty captions (don't overwrite existing)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                >
                  Apply to all
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
