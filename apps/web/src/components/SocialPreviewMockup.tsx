import { SocialAccount, MediaAsset } from '../types/scheduler';
import PlatformIcon from './PlatformIcon';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';

interface SocialPreviewMockupProps {
  caption: string;
  mediaAssets: MediaAsset[];
  selectedAccount?: SocialAccount;
  scheduledFor?: string;
}

export default function SocialPreviewMockup({
  caption,
  mediaAssets,
  selectedAccount,
  scheduledFor,
}: SocialPreviewMockupProps) {
  const accountName = selectedAccount ? selectedAccount.displayName : 'your_account';
  const platform = selectedAccount ? selectedAccount.platform : 'INSTAGRAM';
  const previewImage = mediaAssets.length > 0 ? mediaAssets[0].previewUrl : null;

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
        <span>Live Feed Simulator</span>
        <span className="h-1 w-1 rounded-full bg-zinc-600" />
        <span className="text-indigo-400">{platform}</span>
      </div>

      {/* Mobile Card Container */}
      <div className="w-full max-w-[340px] rounded-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center">
              {selectedAccount?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedAccount.avatarUrl} alt={accountName} className="h-full w-full object-cover" />
              ) : (
                <PlatformIcon platform={platform} className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1">
                {accountName}
                <PlatformIcon platform={platform} className="h-3 w-3" />
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {scheduledFor ? new Date(scheduledFor).toLocaleDateString() : 'Scheduled'}
              </span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
        </div>

        {/* Media Canvas */}
        <div className="relative aspect-square w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
          {previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt="Post media preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-zinc-600 p-6 text-center">
              <PlatformIcon platform={platform} className="h-10 w-10 mb-2 opacity-30" />
              <span className="text-xs font-mono text-zinc-500">Upload media to see live preview</span>
            </div>
          )}

          {scheduledFor && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-indigo-300">
              {new Date(scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2.5 text-zinc-300">
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 hover:text-rose-400 cursor-pointer" />
              <MessageCircle className="h-4 w-4 cursor-pointer" />
              <Send className="h-4 w-4 cursor-pointer" />
            </div>
            <Bookmark className="h-4 w-4 text-zinc-400 cursor-pointer" />
          </div>

          {/* Caption Area */}
          <div className="text-xs text-zinc-300 line-clamp-3">
            <span className="font-semibold text-white mr-1.5">{accountName}</span>
            {caption || <span className="text-zinc-600 italic">No caption provided yet...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
