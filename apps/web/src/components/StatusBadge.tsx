import { PostStatus, PublishTargetStatus } from '../types/scheduler';

interface StatusBadgeProps {
  status: PostStatus | PublishTargetStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let styles = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50';
  let dotColor = 'bg-zinc-400';
  let pulse = false;

  switch (status) {
    case PostStatus.SCHEDULED:
    case PublishTargetStatus.SCHEDULED:
      styles = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      dotColor = 'bg-indigo-400';
      pulse = true;
      break;
    case PostStatus.PROCESSING:
    case PublishTargetStatus.PROCESSING:
      styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      pulse = true;
      break;
    case PostStatus.PUBLISHED:
    case PublishTargetStatus.PUBLISHED:
      styles = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      dotColor = 'bg-emerald-400';
      break;
    case PostStatus.FAILED:
    case PublishTargetStatus.FAILED:
      styles = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      dotColor = 'bg-rose-400';
      break;
    case PublishTargetStatus.RETRYING:
      styles = 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      dotColor = 'bg-orange-400';
      pulse = true;
      break;
    case PublishTargetStatus.REAUTH_REQUIRED:
      styles = 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30';
      dotColor = 'bg-fuchsia-400';
      break;
    case PostStatus.CANCELLED:
    case PublishTargetStatus.CANCELLED:
      styles = 'bg-zinc-800/60 text-zinc-400 border-zinc-700/30';
      dotColor = 'bg-zinc-500';
      break;
    case PostStatus.DRAFT:
    case PublishTargetStatus.PENDING:
      styles = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      dotColor = 'bg-blue-400';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase border ${styles} ${sizeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
      {status.replace('_', ' ')}
    </span>
  );
}
