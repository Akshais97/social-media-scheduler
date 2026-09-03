'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileVideo, Image as ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { MediaAsset, MediaAssetStatus } from '../types/scheduler';

interface MediaDropzoneProps {
  mediaAssets: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

export default function MediaDropzone({ mediaAssets, onChange }: MediaDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Unsupported format (${file.type}). Allowed: JPG, PNG, WEBP, MP4, MOV`);
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > limit) {
      setError(`File size exceeds limit (${isVideo ? '200 MB for video' : '10 MB for image'})`);
      return;
    }

    setUploading(true);
    const simulatedB2Key = `social-scheduler/uploads/2026/09/b2_${Date.now()}/${file.name.replace(/\s+/g, '_')}`;
    const objectUrl = URL.createObjectURL(file);

    setTimeout(() => {
      const newAsset: MediaAsset = {
        id: `media_${Date.now()}`,
        b2Bucket: 'social-scheduler-media',
        b2Key: simulatedB2Key,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        status: MediaAssetStatus.UPLOADED,
        previewUrl: objectUrl,
        createdAt: new Date().toISOString(),
      };

      onChange([...mediaAssets, newAsset]);
      setUploading(false);
    }, 600);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeAsset = (id: string) => {
    onChange(mediaAssets.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
          Media Assets (Backblaze B2 Direct Upload)
        </label>
        <span className="text-[11px] font-mono text-zinc-500">
          Max: 10MB (Img) / 200MB (Vid)
        </span>
      </div>

      {mediaAssets.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/10 hover:border-white/20 bg-zinc-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
            {uploading ? (
              <div className="h-5 w-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>

          <p className="text-sm font-medium text-zinc-200">
            {uploading ? 'Directly uploading to B2 bucket...' : 'Click or drag media here'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            JPEG, PNG, WEBP, MP4, MOV supported
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {mediaAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-zinc-800 border border-white/5 flex items-center justify-center">
                  {asset.mimeType.startsWith('video/') ? (
                    <FileVideo className="h-6 w-6 text-indigo-400" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.previewUrl}
                      alt={asset.originalFilename}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200 truncate max-w-[200px] md:max-w-xs">
                    {asset.originalFilename}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-zinc-500">
                    <span>{(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      B2 Stored
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                title="Remove asset"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
