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
      break;

    case 'DUE':
    case PublishTargetStatus.DUE:
      styles = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
      dotColor = 'bg-yellow-400';
      pulse = true;
      break;

    case PostStatus.PROCESSING:
    case PublishTargetStatus.PROCESSING:
      styles = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      dotColor = 'bg-purple-400';
      pulse = true;
      break;

    case PostStatus.PUBLISHED_MOCK:
    case PublishTargetStatus.PUBLISHED_MOCK:
    case PostStatus.PUBLISHED:
    case PublishTargetStatus.PUBLISHED:
      styles = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      dotColor = 'bg-emerald-400';
      break;

    case PostStatus.RETRYING:
    case PublishTargetStatus.RETRYING:
      styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      pulse = true;
      break;

    case PostStatus.PARTIALLY_FAILED:
      styles = 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      dotColor = 'bg-orange-400';
      break;

    case PostStatus.FAILED:
    case PublishTargetStatus.FAILED:
      styles = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      dotColor = 'bg-rose-400';
      break;

    case PostStatus.REAUTH_REQUIRED:
    case PublishTargetStatus.REAUTH_REQUIRED:
      styles = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      dotColor = 'bg-rose-400';
      break;

    case PostStatus.COST_BLOCKED:
    case PublishTargetStatus.COST_BLOCKED:
      styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      break;

    case PublishTargetStatus.QUOTA_BLOCKED:
      styles = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      dotColor = 'bg-rose-400';
      break;

    case PublishTargetStatus.LIMIT_REACHED:
      styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      break;

    case PublishTargetStatus.PRIVATE_RESTRICTED:
      styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      dotColor = 'bg-amber-400';
      break;

    case PublishTargetStatus.PLATFORM_PROCESSING:
      styles = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      dotColor = 'bg-purple-400';
      pulse = true;
      break;

    case PostStatus.PARTIALLY_PUBLISHED:
      styles = 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      dotColor = 'bg-teal-400';
      break;

    case PostStatus.CANCELLED:
    case PublishTargetStatus.CANCELLED:
    case PublishTargetStatus.SKIPPED:
      styles = 'bg-zinc-800/60 text-zinc-400 border-zinc-700/30';
      dotColor = 'bg-zinc-500';
      break;

    case PostStatus.DRAFT:
    case PublishTargetStatus.PENDING:
    case PublishTargetStatus.SELECTED:
    case PublishTargetStatus.MOCK_READY:
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
      {status.replace(/_/g, ' ')}
    </span>
  );
}
