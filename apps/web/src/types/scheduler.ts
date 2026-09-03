// Social Media Scheduler MVP — Core Types and Enums
// Conforms strictly to docs/05_data_models.md and docs/10_status_enums_and_error_states.md

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PublishTargetStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  CANCELLED = 'CANCELLED',
}

export enum PublishAttemptStatus {
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum SocialAccountStatus {
  CONNECTED = 'CONNECTED',
  EXPIRED = 'EXPIRED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  REVOKED = 'REVOKED',
  ERROR = 'ERROR',
}

export enum MediaAssetStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK';

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  platformAccountId: string;
  status: SocialAccountStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  postId?: string;
  b2Bucket: string;
  b2Key: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  status: MediaAssetStatus;
  previewUrl: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PublishAttempt {
  id: string;
  publishTargetId: string;
  attemptNumber: number;
  status: PublishAttemptStatus;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  finishedAt?: string;
  createdAt: string;
}

export interface PublishTarget {
  id: string;
  postId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  status: PublishTargetStatus;
  scheduledFor: string;
  processingStartedAt?: string;
  publishedAt?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  idempotencyKey: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
  socialAccount?: SocialAccount;
  publishAttempts?: PublishAttempt[];
}

export interface Post {
  id: string;
  caption: string;
  scheduledFor?: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  mediaAssets: MediaAsset[];
  publishTargets: PublishTarget[];
}
