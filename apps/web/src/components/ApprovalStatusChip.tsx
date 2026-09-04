'use client';

import React from 'react';
import { SocialSchedulerApprovalStatus } from '@/types/scheduler';

interface ApprovalStatusChipProps {
  status?: SocialSchedulerApprovalStatus | string | null;
  className?: string;
}

export function ApprovalStatusChip({ status, className = '' }: ApprovalStatusChipProps) {
  if (!status || status === SocialSchedulerApprovalStatus.NOT_REQUIRED) {
    return null;
  }

  const getBadgeStyle = () => {
    switch (status) {
      case SocialSchedulerApprovalStatus.APPROVED:
      case SocialSchedulerApprovalStatus.AUTO_APPROVED:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case SocialSchedulerApprovalStatus.IN_REVIEW:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case SocialSchedulerApprovalStatus.CHANGES_REQUESTED:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case SocialSchedulerApprovalStatus.REJECTED:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case SocialSchedulerApprovalStatus.DRAFT:
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getLabel = () => {
    switch (status) {
      case SocialSchedulerApprovalStatus.APPROVED:
        return 'Approved';
      case SocialSchedulerApprovalStatus.AUTO_APPROVED:
        return 'Auto-Approved';
      case SocialSchedulerApprovalStatus.IN_REVIEW:
        return 'In Review';
      case SocialSchedulerApprovalStatus.CHANGES_REQUESTED:
        return 'Changes Requested';
      case SocialSchedulerApprovalStatus.REJECTED:
        return 'Rejected';
      case SocialSchedulerApprovalStatus.DRAFT:
        return 'Draft Review';
      default:
        return String(status).replace(/_/g, ' ');
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${getBadgeStyle()} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getLabel()}
    </span>
  );
}

export default ApprovalStatusChip;
