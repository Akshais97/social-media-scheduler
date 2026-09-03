// Social Media Scheduler — Core Domain Types & Enums
// Conforms strictly to docs/Sprint/Sakhaa Forge Social Scheduler — Sprint 1 Documentation.md
// and docs/05_data_models.md

export enum SocialSchedulerPostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  MOCK_READY = 'MOCK_READY',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
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
  MOCK_READY = 'MOCK_READY',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  PENDING = 'PENDING',
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
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  EXPIRED = 'EXPIRED',
  ERROR = 'ERROR',
}

export interface Workspace {
  id: string;
  name: string;
  brandName: string;
  brandApproved: boolean;
  permission: 'OWNER' | 'ADMIN' | 'CLIENT_MANAGER' | 'VIEWER';
  storageBucket: string;
}

export interface DraftComposerMediaItem {
  mediaAssetId: string;
  role: 'primary' | 'secondary';
  order: number;
}

export interface DraftContentJson {
  version: string;
  source: 'manual_upload';
  postTitle: string;
  caption: string;
  cta?: string;
  hashtags: string[];
  notes?: string;
  campaign?: {
    name?: string | null;
    type?: string | null;
  };
  media: DraftComposerMediaItem[];
  platformOverrides: Record<string, unknown>;
  createdFromStage: string;
  lastEditedAt: string;
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
  sha256?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  status: SocialSchedulerMediaStatus;
  previewUrl: string;
  createdAt: string;
  updatedAt: string;
  // Aliases for compatibility
  originalFilename?: string;
  b2Bucket?: string;
  b2Key?: string;
  sizeBytes?: number;
}

export type MediaAsset = Sprint1MediaAsset;

export interface Sprint1PublishTarget {
  id: string;
  postId: string;
  workspaceId: string;
  platform: SocialSchedulerPlatform;
  mockAccountName: string;
  externalAccountId?: string;
  status: SocialSchedulerTargetStatus;
  validationJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Compatibility fields
  socialAccountId?: string;
  scheduledFor?: string;
  idempotencyKey?: string;
  retryCount?: number;
  lastErrorMessage?: string;
  lastErrorCode?: string;
  platformPostUrl?: string;
  socialAccount?: {
    id: string;
    platform: SocialSchedulerPlatform;
    displayName: string;
  };
}

export type PublishTarget = Sprint1PublishTarget;

export interface Sprint1ScheduledPost {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  title: string;
  status: SocialSchedulerPostStatus;
  draftContentJson: DraftContentJson;
  scheduledAt?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  mediaAssets: Sprint1MediaAsset[];
  targets: Sprint1PublishTarget[];
  // Compatibility fields
  caption?: string;
  scheduledFor?: string;
  publishTargets: Sprint1PublishTarget[];
}

export type Post = Sprint1ScheduledPost;

export interface SocialAccount {
  id: string;
  platform: SocialSchedulerPlatform;
  displayName: string;
  platformAccountId: string;
  avatarUrl?: string;
  status: SocialAccountStatus | string;
  createdAt: string;
  updatedAt: string;
}
