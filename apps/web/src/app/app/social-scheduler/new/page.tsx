'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sprint1Storage, DEFAULT_WORKSPACES } from '../../../../lib/mock-storage';
import {
  Workspace,
  SocialSchedulerPlatform,
  SocialSchedulerMediaStatus,
  SocialSchedulerTargetStatus,
  SocialSchedulerPostStatus,
  DraftContentJson,
  Sprint1MediaAsset,
  Sprint1PublishTarget,
} from '../../../../types/scheduler';
import {
  Building2,
  UploadCloud,
  FileText,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

const STAGES = [
  { id: 1, label: 'Client', icon: Building2 },
  { id: 2, label: 'Upload', icon: UploadCloud },
  { id: 3, label: 'Compose', icon: FileText },
  { id: 4, label: 'Targets', icon: Share2 },
  { id: 5, label: 'Schedule', icon: Calendar },
  { id: 6, label: 'Review', icon: CheckCircle2 },
];

const CONTENT_CATEGORIES = [
  'Brand creative',
  'Property showcase',
  'Offer creative',
  'Testimonial',
  'Event',
  'Educational',
  'Other',
];

const PLATFORMS_CONFIG = [
  {
    platform: SocialSchedulerPlatform.FACEBOOK,
    name: 'Facebook Page',
    mockAccount: 'Facebook Page · Demo Page',
    supports: 'Image, Video',
    supportsImages: true,
    supportsVideo: true,
  },
  {
    platform: SocialSchedulerPlatform.INSTAGRAM,
    name: 'Instagram Business',
    mockAccount: 'Instagram Business · Demo IG',
    supports: 'Image, Video, Carousel',
    supportsImages: true,
    supportsVideo: true,
  },
  {
    platform: SocialSchedulerPlatform.PINTEREST,
    name: 'Pinterest Business',
    mockAccount: 'Pinterest Business · Demo Board',
    supports: 'Image, Video later',
    supportsImages: true,
    supportsVideo: true,
  },
  {
    platform: SocialSchedulerPlatform.YOUTUBE,
    name: 'YouTube Channel',
    mockAccount: 'YouTube Channel · Demo Channel',
    supports: 'Video only',
    supportsImages: false,
    supportsVideo: true,
  },
  {
    platform: SocialSchedulerPlatform.X,
    name: 'Twitter/X Account',
    mockAccount: 'X Account · Demo Handle',
    supports: 'Text, Image, Video (Paid API later)',
    supportsImages: true,
    supportsVideo: true,
    warning: 'Paid API integration in later sprint',
  },
];

export default function NewPostStudioPage() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Stage 1: Client
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(DEFAULT_WORKSPACES[0]);

  // Stage 2: Upload
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaAsset, setMediaAsset] = useState<Sprint1MediaAsset | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [internalAssetName, setInternalAssetName] = useState('');
  const [contentCategory, setContentCategory] = useState(CONTENT_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stage 3: Compose
  const [postTitle, setPostTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [notes, setNotes] = useState('');

  // Stage 4: Targets
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialSchedulerPlatform[]>([
    SocialSchedulerPlatform.INSTAGRAM,
    SocialSchedulerPlatform.FACEBOOK,
  ]);

  // Stage 5: Schedule
  const [scheduleDate, setScheduleDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState('11:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Stage 6: Success
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  useEffect(() => {
    const active = sprint1Storage.getActiveWorkspace();
    setSelectedWorkspace(active);
  }, []);

  const isVideo = mediaAsset ? mediaAsset.mimeType.startsWith('video/') : false;

  // Media file drop & validation
  const handleFileSelect = (file: File) => {
    setError(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type. Supported: JPEG, PNG, WEBP, MP4, MOV');
      return;
    }

    const isVid = file.type.startsWith('video/');
    const limit = isVid ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) {
      setError(`File size exceeds limit (${isVid ? '200 MB for video' : '10 MB for image'})`);
      return;
    }

    setMediaFile(file);
    if (!internalAssetName) {
      setInternalAssetName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadAndContinue = async () => {
    if (!mediaFile) {
      setError('Please select a media file to upload.');
      return;
    }
    if (!rightsConfirmed) {
      setError('You must confirm media usage rights before continuing.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Initiate upload with backend (generates real Backblaze B2 presigned PUT URL)
      const initRes = await fetch('/api/v0/social-scheduler/media/initiate-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          fileName: mediaFile.name,
          mimeType: mediaFile.type,
          byteSize: mediaFile.size,
          bucket: selectedWorkspace.storageBucket || 'sakhaa-forge-clean-media',
        }),
      });

      if (!initRes.ok) {
        const errJson = await initRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to initiate B2 upload');
      }

      const initData = await initRes.json();
      const { uploadUrl, objectKey, bucket, mediaAssetId } = initData;

      // 2. Direct binary HTTP PUT upload directly to Backblaze B2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mediaFile.type,
        },
        body: mediaFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`Backblaze B2 upload failed with status ${uploadRes.status}`);
      }

      // 3. Complete upload with backend (verifies object in B2 and creates presigned preview)
      const compRes = await fetch('/api/v0/social-scheduler/media/complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: selectedWorkspace.id,
          mediaAssetId,
          objectKey,
          bucket,
        }),
      });

      const compData = await compRes.json();
      const previewUrl =
        compData.previewUrl ||
        `/api/v0/social-scheduler/media/preview?key=${encodeURIComponent(objectKey)}&bucket=${encodeURIComponent(bucket)}`;

      const asset: Sprint1MediaAsset = {
        id: mediaAssetId,
        workspaceId: selectedWorkspace.id,
        uploadedByUserId: 'usr_admin',
        originalFileName: mediaFile.name,
        safeFileName: mediaFile.name.replace(/\s+/g, '_'),
        mimeType: mediaFile.type,
        byteSize: mediaFile.size,
        bucket,
        objectKey,
        status: SocialSchedulerMediaStatus.UPLOADED,
        previewUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMediaAsset(asset);
      setUploading(false);
      setCurrentStage(3); // Advance to Compose
    } catch (err: any) {
      console.error('B2 Upload error:', err);
      setError(err.message || 'Error uploading file to Backblaze B2');
      setUploading(false);
    }
  };

  const togglePlatform = (p: SocialSchedulerPlatform) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const selectAllEligible = () => {
    if (isVideo) {
      setSelectedPlatforms([
        SocialSchedulerPlatform.FACEBOOK,
        SocialSchedulerPlatform.INSTAGRAM,
        SocialSchedulerPlatform.PINTEREST,
        SocialSchedulerPlatform.YOUTUBE,
        SocialSchedulerPlatform.X,
      ]);
    } else {
      setSelectedPlatforms([
        SocialSchedulerPlatform.FACEBOOK,
        SocialSchedulerPlatform.INSTAGRAM,
        SocialSchedulerPlatform.PINTEREST,
        SocialSchedulerPlatform.X,
      ]);
    }
  };

  const handleScheduleTimeValidation = () => {
    setError(null);
    const combinedStr = `${scheduleDate}T${scheduleTime}:00`;
    const targetTimestamp = new Date(combinedStr).getTime();
    const now = Date.now();
    const minTimestamp = now + 5 * 60 * 1000; // now + 5 mins

    if (isNaN(targetTimestamp) || targetTimestamp < minTimestamp) {
      setError('Schedule time must be at least 5 minutes in the future.');
      return false;
    }
    return true;
  };

  const handleFinalSave = (isScheduled: boolean) => {
    setError(null);

    const hashtags = hashtagsStr
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

    const combinedStr = `${scheduleDate}T${scheduleTime}:00`;
    const scheduledAt = isScheduled ? new Date(combinedStr).toISOString() : undefined;

    const draftContentJson: DraftContentJson = {
      version: '1.0',
      source: 'manual_upload',
      postTitle: postTitle || 'Untitled Post',
      caption,
      cta: cta || undefined,
      hashtags,
      notes: notes || undefined,
      media: mediaAsset
        ? [
            {
              mediaAssetId: mediaAsset.id,
              role: 'primary',
              order: 0,
            },
          ]
        : [],
      platformOverrides: {},
      createdFromStage: 'review',
      lastEditedAt: new Date().toISOString(),
    };

    const targets: Sprint1PublishTarget[] = selectedPlatforms.map((p, idx) => {
      const conf = PLATFORMS_CONFIG.find((c) => c.platform === p);
      return {
        id: `tgt_${Date.now()}_${idx}`,
        postId: '',
        workspaceId: selectedWorkspace.id,
        platform: p,
        mockAccountName: conf ? conf.mockAccount : `${p} Demo`,
        status: SocialSchedulerTargetStatus.MOCK_READY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const post = sprint1Storage.createDraftPost({
      workspaceId: selectedWorkspace.id,
      title: postTitle || 'Scheduled Social Post',
      draftContentJson,
      mediaAssets: mediaAsset ? [mediaAsset] : [],
      targets,
      scheduledAt,
      timezone,
      status: isScheduled ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT,
    });

    setCreatedPostId(post.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/social-scheduler"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-white/5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Social Creation Studio</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D6B46A]/10 text-[#D6B46A] border border-[#D6B46A]/20 uppercase">
                Sprint 1 Guided Flow
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Isolated to workspace: <span className="text-white font-semibold">{selectedWorkspace.name}</span>
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-zinc-500">
          Step <span className="text-[#D6B46A] font-bold">{currentStage}</span> of 6
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Stage Content */}
      <div className="min-h-[520px]">
        {/* ============================================================ */}
        {/* STAGE 1: CLIENT */}
        {/* ============================================================ */}
        {currentStage === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Choose the client workspace</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Every scheduled post, upload, and draft is isolated to one workspace.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Select Active Workspace
                </label>
                <div className="space-y-2">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => setSelectedWorkspace(ws)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        selectedWorkspace.id === ws.id
                          ? 'bg-[#D6B46A]/10 border-[#D6B46A]/50 text-white'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-[#D6B46A]" />
                        <div>
                          <div className="text-sm font-semibold text-zinc-100">{ws.name}</div>
                          <div className="text-xs text-zinc-400">{ws.brandName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10">
                          {ws.permission}
                        </span>
                        {selectedWorkspace.id === ws.id && <Check className="h-4 w-4 text-[#D6B46A]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <Link
                  href="/app/social-scheduler"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20 flex items-center gap-1.5"
                >
                  <span>Continue to Upload</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Workspace Overview</div>
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#D6B46A]/10 border border-[#D6B46A]/20 flex items-center justify-center text-[#D6B46A]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedWorkspace.name}</h3>
                    <p className="text-xs text-zinc-400">{selectedWorkspace.brandName}</p>
                  </div>
                </div>

                <div className="divide-y divide-white/5 text-xs text-zinc-300 pt-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-zinc-500">Brand Status</span>
                    <span className="text-emerald-400 font-mono">
                      {selectedWorkspace.brandApproved ? 'Brand Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-zinc-500">Storage Bucket</span>
                    <span className="font-mono text-zinc-400">{selectedWorkspace.storageBucket}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-zinc-500">Role Permission</span>
                    <span className="font-mono text-[#D6B46A]">{selectedWorkspace.permission}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 2: UPLOAD */}
        {/* ============================================================ */}
        {currentStage === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Upload creative media</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Add the approved image or video that will be scheduled for social publishing (Backblaze B2).
                </p>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-[#D6B46A]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-900/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 text-zinc-300">
                  <UploadCloud className="h-6 w-6 text-[#D6B46A]" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  {mediaFile ? mediaFile.name : 'Drag and drop image or video here'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supports JPEG, PNG, WEBP (10 MB) or MP4, MOV (200 MB)
                </p>
              </div>

              {/* Metadata Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Internal Asset Name
                  </label>
                  <input
                    type="text"
                    value={internalAssetName}
                    onChange={(e) => setInternalAssetName(e.target.value)}
                    placeholder="e.g. Skyline Villa Launch"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Content Category
                  </label>
                  <select
                    value={contentCategory}
                    onChange={(e) => setContentCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#D6B46A]"
                  >
                    {CONTENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mandatory Rights Checkbox (Section 11) */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <input
                    type="checkbox"
                    id="rights-check"
                    checked={rightsConfirmed}
                    onChange={(e) => setRightsConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#D6B46A] focus:ring-0"
                  />
                  <label htmlFor="rights-check" className="text-xs text-zinc-300 leading-relaxed cursor-pointer">
                    I confirm this media is approved for use by{' '}
                    <span className="text-[#D6B46A] font-semibold">{selectedWorkspace.name}</span> and complies with
                    usage rights.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={uploading || !mediaFile || !rightsConfirmed}
                  onClick={handleUploadAndContinue}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{uploading ? 'Initiating B2 Upload...' : 'Upload and Continue'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Media Preview</div>
              {mediaFile ? (
                <div className="space-y-3">
                  <div className="aspect-square w-full rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(mediaFile)}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-mono text-zinc-400 space-y-1">
                    <div>Size: {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    <div>Type: {mediaFile.type}</div>
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-zinc-600 text-xs font-mono text-center p-6">
                  Select a media file to inspect thumbnail and storage parameters
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 3: COMPOSE */}
        {/* ============================================================ */}
        {currentStage === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Compose the post</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Write the caption and save the structured draft that will be persisted as JSONB.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Internal Post Title *
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Weekend property walkthrough"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Main Caption *
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">{caption.length} / 2,200 chars</span>
                </div>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write the main caption for this scheduled post..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Call To Action (Optional)
                  </label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="e.g. Book a site visit today"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Hashtags (Optional)
                  </label>
                  <input
                    type="text"
                    value={hashtagsStr}
                    onChange={(e) => setHashtagsStr(e.target.value)}
                    placeholder="#LuxuryHomes #Bangalore"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for the team or platform publish strategy..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D6B46A]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!postTitle.trim() || !caption.trim()}
                  onClick={() => setCurrentStage(4)}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Save Draft & Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Draft Composer Preview</div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3">
                {mediaAsset && (
                  <div className="aspect-video w-full rounded-lg bg-zinc-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaAsset.previewUrl} alt="Draft preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="text-sm font-semibold text-white">{postTitle || 'Untitled Post'}</div>
                <div className="text-xs text-zinc-300 leading-relaxed">
                  {caption || <span className="text-zinc-600 italic">No caption yet...</span>}
                </div>
                {cta && (
                  <div className="text-[11px] font-mono text-[#D6B46A] bg-[#D6B46A]/10 px-2 py-1 rounded inline-block">
                    CTA: {cta}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 4: TARGETS */}
        {/* ============================================================ */}
        {currentStage === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Choose platforms</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Select mock accounts for publishing. Real OAuth is enabled in later sprints.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={selectAllEligible}
                  className="text-xs font-mono text-[#D6B46A] hover:underline"
                >
                  Select All Eligible
                </button>
              </div>

              {/* Platform Cards */}
              <div className="space-y-3">
                {PLATFORMS_CONFIG.map((item) => {
                  const isBlocked = !isVideo && !item.supportsImages;
                  const isSelected = selectedPlatforms.includes(item.platform);

                  return (
                    <div
                      key={item.platform}
                      onClick={() => !isBlocked && togglePlatform(item.platform)}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        isBlocked
                          ? 'opacity-40 cursor-not-allowed bg-zinc-900/40 border-white/5'
                          : isSelected
                          ? 'bg-[#D6B46A]/10 border-[#D6B46A]/50 cursor-pointer'
                          : 'bg-zinc-900/60 border-white/5 hover:border-white/10 cursor-pointer'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{item.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400">
                            Mock Ready
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">{item.mockAccount}</div>
                        {isBlocked && (
                          <div className="text-[11px] text-rose-400 font-mono">
                            Blocked: YouTube requires video upload.
                          </div>
                        )}
                        {item.warning && (
                          <div className="text-[11px] text-amber-400/80 font-mono">{item.warning}</div>
                        )}
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#D6B46A] border-[#D6B46A] text-zinc-950'
                              : 'border-zinc-700 bg-zinc-900'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStage(3)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={selectedPlatforms.length === 0}
                  onClick={() => setCurrentStage(5)}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Continue to Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Platform Readiness</div>
              <div className="space-y-2 text-xs font-mono">
                {selectedPlatforms.map((p) => (
                  <div
                    key={p}
                    className="p-3 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-between"
                  >
                    <span className="text-zinc-200">{p}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mock Target Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 5: SCHEDULE */}
        {/* ============================================================ */}
        {currentStage === 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Set publish time</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose the date, time, and timezone for this scheduled post (minimum now + 5 minutes).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#D6B46A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Publish Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#D6B46A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Client Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#D6B46A]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="America/New_York">America/New_York (EST - UTC-5)</option>
                  <option value="Europe/London">Europe/London (GMT - UTC+0)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (handleScheduleTimeValidation()) {
                      setCurrentStage(6);
                    }
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20 flex items-center gap-1.5"
                >
                  <span>Review Scheduled Post</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Schedule Summary</div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Scheduled Date</span>
                  <span className="font-mono text-zinc-200">
                    {scheduleDate} at {scheduleTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timezone</span>
                  <span className="font-mono text-[#D6B46A]">{timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Platforms</span>
                  <span className="font-mono text-zinc-200">{selectedPlatforms.length} Selected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STAGE 6: REVIEW & SAVE */}
        {/* ============================================================ */}
        {currentStage === 6 && (
          <div className="space-y-6">
            {createdPostId ? (
              /* Success confirmation state */
              <div className="p-10 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-center max-w-xl mx-auto space-y-6">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Scheduled draft created</h2>
                  <p className="text-xs text-zinc-400 mt-2">
                    This post is saved and ready for the publishing worker in the next sprint.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Link
                    href={`/app/social-scheduler/${createdPostId}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D6B46A] hover:bg-[#c4a259] text-zinc-950 text-xs font-semibold tracking-wide transition-all shadow-lg shadow-[#D6B46A]/20"
                  >
                    View Post Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedPostId(null);
                      setCurrentStage(1);
                      setMediaFile(null);
                      setMediaAsset(null);
                      setPostTitle('');
                      setCaption('');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-medium text-zinc-200"
                  >
                    Create Another Post
                  </button>
                  <Link
                    href="/app/social-scheduler"
                    className="w-full sm:w-auto px-4 py-2.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Back to Scheduler
                  </Link>
                </div>
              </div>
            ) : (
              /* Review checklist & final submission */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6 p-6 rounded-2xl bg-zinc-950/80 border border-white/10">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Review and save</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Confirm the media, caption, platforms, and scheduled time before saving.
                    </p>
                  </div>

                  {/* Validation Checklist */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>Workspace selected: {selectedWorkspace.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>Media uploaded to B2 bucket: {selectedWorkspace.storageBucket}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>Draft Composer payload structured as JSONB</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>{selectedPlatforms.length} Mock target platform(s) selected</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-4 w-4" />
                      <span>Scheduled for: {scheduleDate} {scheduleTime} ({timezone})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setCurrentStage(5)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
                    >
                      Back
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleFinalSave(false)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-900 border border-white/10 hover:border-white/20"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFinalSave(true)}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-[#D6B46A] hover:bg-[#c4a259] transition-all shadow-lg shadow-[#D6B46A]/20"
                      >
                        Save Scheduled Post
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Preview */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">Scheduled Post Summary</div>
                  <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-3">
                    {mediaAsset && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mediaAsset.previewUrl} alt="Final" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="text-sm font-bold text-white">{postTitle}</div>
                    <p className="text-xs text-zinc-300 line-clamp-3">{caption}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedPlatforms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-white/5"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persistent Bottom Stage Rail (Section 9) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#050507]/90 backdrop-blur-xl border-t border-white/5 py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {STAGES.map((s) => {
            const isActive = currentStage === s.id;
            const isComplete = currentStage > s.id;
            const Icon = s.icon;

            return (
              <button
                key={s.id}
                type="button"
                disabled={s.id > currentStage}
                onClick={() => setCurrentStage(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'text-[#D6B46A] bg-[#D6B46A]/10 border border-[#D6B46A]/30 font-bold'
                    : isComplete
                    ? 'text-zinc-300 hover:bg-white/5 cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive
                      ? 'bg-[#D6B46A] text-zinc-950 font-bold'
                      : isComplete
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  {isComplete ? <Check className="h-3 w-3 stroke-[3]" /> : s.id}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
