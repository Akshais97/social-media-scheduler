// TypeScript Domain Models & Enums for Social Media Scheduler (Sprint 1 & Sprint 2)

export enum SocialSchedulerPostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED_MOCK = 'PUBLISHED_MOCK',
  PARTIALLY_FAILED = 'PARTIALLY_FAILED',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PUBLISHED = 'PUBLISHED', // backward compat
}

export enum SocialSchedulerMediaStatus {
  INITIATED = 'INITIATED',
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED',
}

export enum SocialSchedulerPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  PINTEREST = 'PINTEREST',
  YOUTUBE = 'YOUTUBE',
  X = 'X',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
}

export enum SocialSchedulerTargetStatus {
  SELECTED = 'SELECTED',
  SCHEDULED = 'SCHEDULED',
  DUE = 'DUE',
  PROCESSING = 'PROCESSING',
  PUBLISHED_MOCK = 'PUBLISHED_MOCK',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  MOCK_READY = 'MOCK_READY', // backward compat
  BLOCKED = 'BLOCKED',       // backward compat
  PUBLISHED = 'PUBLISHED',   // backward compat
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  PENDING = 'PENDING',
}

export enum SocialPublishAttemptStatus {
  STARTED = 'STARTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_PERMANENT = 'FAILED_PERMANENT',
  TIMED_OUT = 'TIMED_OUT',
  SKIPPED = 'SKIPPED',
}

// Backward-compatible type aliases
export const PostStatus = SocialSchedulerPostStatus;
export type PostStatus = SocialSchedulerPostStatus;

export const MediaAssetStatus = SocialSchedulerMediaStatus;
export type MediaAssetStatus = SocialSchedulerMediaStatus;

export const SocialPlatform = SocialSchedulerPlatform;
export type SocialPlatform = SocialSchedulerPlatform;

export const PublishTargetStatus = SocialSchedulerTargetStatus;
export type PublishTargetStatus = SocialSchedulerTargetStatus;

export enum SocialAccountStatus {
  CONNECTED = 'CONNECTED',
  NEEDS_REAUTH = 'NEEDS_REAUTH',
  DISCONNECTED = 'DISCONNECTED',
}

export interface Workspace {
  id: string;
  name: string;
  brandName?: string;
  brandApproved: boolean;
  permission: 'OWNER' | 'CLIENT_MANAGER' | 'VIEWER';
  storageBucket: string;
}

export interface DraftContentJson {
  version: '1.0';
  source: 'manual_upload';
  title?: string;
  postTitle?: string;
  caption: string;
  cta?: string;
  hashtags: string[];
  internalNotes?: string;
  notes?: string;
  mediaAssetId?: string;
  mediaCategory?: string;
  media?: Array<{
    mediaAssetId: string;
    role: string;
    order: number;
  }>;
  platformOverrides?: Record<string, any>;
  createdFromStage?: string;
  lastEditedAt?: string;
  customization?: Record<string, { caption?: string; hashtags?: string[] }>;
}

export interface Sprint1MediaAsset {
  id: string;
  workspaceId: string;
  uploadedByUserId: string;
  originalFileName: string;
  safeFileName: string;
  mimeType: string;
  byteSize: number;
  bucket: string;
  objectKey: string;
  status: SocialSchedulerMediaStatus;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  originalFilename?: string;
  sizeBytes?: number;
  b2Bucket?: string;
  b2Key?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  sha256?: string;
}

export interface Sprint1PublishTarget {
  id: string;
  postId: string;
  workspaceId: string;
  platform: SocialSchedulerPlatform;
  mockAccountName?: string;
  externalAccountId?: string;
  status: SocialSchedulerTargetStatus;
  validationJson?: Record<string, unknown>;
  // Sprint 2 worker & retry fields
  attemptCount?: number;
  lastAttemptAt?: string | null;
  nextRetryAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  mockExternalId?: string | null;
  mockExternalUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Legacy aliases
  accountName?: string;
}

export interface SocialPublishAttempt {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform;
  attemptNumber: number;
  status: SocialPublishAttemptStatus;
  workerRunId?: string | null;
  mockMode?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryable: boolean;
  nextRetryAt?: string | null;
  requestJson?: Record<string, unknown> | null;
  responseJson?: Record<string, unknown> | null;
  diagnosticsJson?: Record<string, unknown> | null;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint1ScheduledPost {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  title: string;
  status: SocialSchedulerPostStatus;
  draftContentJson: DraftContentJson;
  scheduledAt?: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  // Sprint 2 timestamp tracking
  lastProcessedAt?: string | null;
  publishedMockAt?: string | null;
  failedAt?: string | null;
  // Relations
  mediaAssets: Sprint1MediaAsset[];
  targets: Sprint1PublishTarget[];
  attempts?: SocialPublishAttempt[];
  // Legacy compatibility fields
  caption?: string;
  scheduledFor?: string | null;
  publishTargets?: any[];
}

// Adapter Contracts
export interface PublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform;
  caption: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  scheduledAt: string;
  draftContentJson: DraftContentJson;
}

export interface PublishResult {
  status: SocialPublishAttemptStatus;
  externalPostId?: string;
  externalPostUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  diagnostics?: Record<string, unknown>;
}

// Backward-compatible entity aliases
export type MediaAsset = Sprint1MediaAsset;
export type PublishTarget = Sprint1PublishTarget;
export type ScheduledPost = Sprint1ScheduledPost;
export type Post = Sprint1ScheduledPost;

export interface SocialAccount {
  id: string;
  ownerId?: string;
  workspaceId?: string;
  platform: SocialPlatform;
  displayName: string;
  platformAccountId: string;
  avatarUrl?: string;
  status: SocialAccountStatus | string;
  expiresAt?: string;
  scopes?: string[];
  createdAt: string;
  updatedAt: string;
}
