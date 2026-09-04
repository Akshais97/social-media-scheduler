// TypeScript Domain Models & Enums for Social Media Scheduler (Sprint 1, 2 & 3)

export enum SocialSchedulerPostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED_MOCK = 'PUBLISHED_MOCK',
  PUBLISHED = 'PUBLISHED',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  PARTIALLY_FAILED = 'PARTIALLY_FAILED',
  RETRYING = 'RETRYING',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  COST_BLOCKED = 'COST_BLOCKED',
  QUOTA_BLOCKED = 'QUOTA_BLOCKED',
  APPROVAL_BLOCKED = 'APPROVAL_BLOCKED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
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
  PUBLISHED = 'PUBLISHED',
  RETRYING = 'RETRYING',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  PLATFORM_PROCESSING = 'PLATFORM_PROCESSING',
  LIMIT_REACHED = 'LIMIT_REACHED',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_BLOCKED = 'QUOTA_BLOCKED',
  COST_BLOCKED = 'COST_BLOCKED',
  APPROVAL_BLOCKED = 'APPROVAL_BLOCKED',
  PRIVATE_RESTRICTED = 'PRIVATE_RESTRICTED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  MOCK_READY = 'MOCK_READY', // backward compat
  BLOCKED = 'BLOCKED',       // backward compat
  PENDING = 'PENDING',
}

export enum SocialPublishAttemptStatus {
  STARTED = 'STARTED',
  CONTAINER_CREATED = 'CONTAINER_CREATED',
  PLATFORM_PROCESSING = 'PLATFORM_PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_PERMANENT = 'FAILED_PERMANENT',
  TIMED_OUT = 'TIMED_OUT',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  LIMIT_REACHED = 'LIMIT_REACHED',
  QUOTA_BLOCKED = 'QUOTA_BLOCKED',
  COST_BLOCKED = 'COST_BLOCKED',
  APPROVAL_BLOCKED = 'APPROVAL_BLOCKED',
  PRIVATE_RESTRICTED = 'PRIVATE_RESTRICTED',
  SKIPPED = 'SKIPPED',
}

export enum SocialAccountStatus {
  CONNECTED = 'CONNECTED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  PERMISSION_MISSING = 'PERMISSION_MISSING',
  REVOKED = 'REVOKED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  NEEDS_REAUTH = 'REAUTH_REQUIRED', // alias
}

export enum SocialAccountProvider {
  META = 'META',
  GOOGLE = 'GOOGLE',
  PINTEREST = 'PINTEREST',
  X = 'X',
}

export enum SocialAccountType {
  FACEBOOK_PAGE = 'FACEBOOK_PAGE',
  INSTAGRAM_BUSINESS = 'INSTAGRAM_BUSINESS',
  INSTAGRAM_CREATOR = 'INSTAGRAM_CREATOR',
  YOUTUBE_CHANNEL = 'YOUTUBE_CHANNEL',
  PINTEREST_ACCOUNT = 'PINTEREST_ACCOUNT',
  X_USER = 'X_USER',
}

// Sprint 9: Batch, Approval & Review Enums
export enum SocialSchedulerApprovalStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  AUTO_APPROVED = 'AUTO_APPROVED',
}

export enum SocialSchedulerBatchStatus {
  DRAFTING = 'DRAFTING',
  DRAFT = 'DRAFTING',
  VALIDATING = 'VALIDATING',
  CREATING = 'CREATING',
  COMPLETED = 'COMPLETED',
  PARTIAL_FAILED = 'PARTIAL_FAILED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum SocialSchedulerReviewCommentType {
  GENERAL = 'GENERAL',
  REVIEW_REQUEST = 'REVIEW_REQUEST',
  APPROVAL = 'APPROVAL',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
  REJECTION = 'REJECTION',
  SYSTEM = 'SYSTEM',
}

export enum InstagramContainerStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  PUBLISHED = 'PUBLISHED',
}

export enum InstagramFormat {
  FEED_IMAGE = 'FEED_IMAGE',
  REEL_VIDEO = 'REEL_VIDEO',
  CAROUSEL = 'CAROUSEL',
}

export interface InstagramPublishingLimit {
  quotaUsage: number;
  quotaTotal: number;
  quotaDuration?: number;
}

export interface InstagramPublishContainer {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  attemptId?: string;
  socialAccountId: string;
  igUserId: string;
  containerId: string;
  mediaType: string;
  status: InstagramContainerStatus;
  statusCode?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  lastPolledAt?: string;
  publishedAt?: string;
  diagnosticsJson?: Record<string, unknown>;
}

export interface PinterestBoard {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  externalBoardId: string;
  name: string;
  description?: string | null;
  privacy?: string | null;
  url?: string | null;
  sectionCount?: number;
  metadataJson?: Record<string, unknown>;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PinterestBoardSection {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  pinterestBoardId: string;
  externalSectionId: string;
  name: string;
  metadataJson?: Record<string, unknown>;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PinterestPlatformOptions {
  pinType?: 'IMAGE' | 'VIDEO';
  title?: string;
  description?: string;
  destinationLink?: string | null;
  boardId?: string;
  boardSectionId?: string | null;
}

export interface PinterestRateLimitInfo {
  limit?: string;
  remaining?: string;
  reset?: string;
  provider: 'pinterest';
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

export interface Workspace {
  id: string;
  name: string;
  brandName?: string;
  brandApproved: boolean;
  permission: 'OWNER' | 'CLIENT_MANAGER' | 'VIEWER';
  storageBucket: string;
}

export interface DraftContentJson {
  version?: '1.0' | string;
  source?: 'manual_upload' | string;
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
  // Sprint 3 live provider fields
  socialAccountId?: string | null;
  publishMode?: 'MOCK' | 'LIVE_META' | string;
  provider?: SocialAccountProvider | null;
  externalPostId?: string | null;
  externalPostUrl?: string | null;
  reauthRequiredAt?: string | null;
  // Sprint 4 Instagram lifecycle fields
  instagramContainerId?: string | null;
  platformProcessingAt?: string | null;
  platformReadyAt?: string | null;
  platformPublishAttemptedAt?: string | null;
  instagramFormat?: InstagramFormat | string | null;
  // Sprint 5 Pinterest fields
  pinterestBoardId?: string | null;
  pinterestBoardSectionId?: string | null;
  platformOptionsJson?: Record<string, unknown> | null;
  platformOptions?: PinterestPlatformOptions | YouTubePlatformOptions | Record<string, unknown>;
  // Sprint 6 YouTube fields
  youtubeUploadReservationId?: string | null;
  youtubeUploadJobId?: string | null;
  // Sprint 7 X fields
  xMediaUploadJobId?: string | null;
  xCostAcknowledgedAt?: string | null;
  xCostAcknowledgedBy?: string | null;
  scheduledFor?: string | null;
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
  // Sprint 3 provider fields
  provider?: SocialAccountProvider | null;
  socialAccountId?: string | null;
  providerRequestId?: string | null;
  providerErrorCode?: string | null;
  providerTraceId?: string | null;
  // Sprint 4 platform lifecycle stage
  platformLifecycleStage?: 'CREATE_CONTAINER' | 'POLL_CONTAINER' | 'PUBLISH_CONTAINER' | string | null;
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

  // Sprint 9: Batch, Duplication & Approval
  batchId?: string | null;
  sourcePostId?: string | null;
  approvalStatus?: SocialSchedulerApprovalStatus | string;
  reviewRequestedAt?: string | null;
  reviewRequestedByUserId?: string | null;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  changesRequestedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;

  // Sprint 2 timestamp tracking
  lastProcessedAt?: string | null;
  publishedMockAt?: string | null;
  publishedAt?: string | null;
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

export interface SocialAccount {
  id: string;
  workspaceId: string;
  connectedByUserId: string;
  provider: SocialAccountProvider;
  platform: SocialSchedulerPlatform;
  accountType: SocialAccountType;
  displayName: string;
  username?: string;
  externalAccountId: string;
  externalAccountIdMasked?: string;
  externalParentId?: string;
  status: SocialAccountStatus;
  scopes: string[];
  metadataJson?: Record<string, unknown>;
  credentialRef: string;
  tokenExpiresAt?: string | null;
  lastConnectedAt: string;
  lastValidatedAt?: string | null;
  disconnectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  ownerId?: string;
  platformAccountId?: string;
  avatarUrl?: string;
  expiresAt?: string;
}

export interface SocialOAuthState {
  id: string;
  workspaceId: string;
  userId: string;
  provider: SocialAccountProvider;
  stateHash: string;
  redirectPath?: string;
  expiresAt: string;
  consumedAt?: string | null;
  createdAt: string;
}

export interface MetaPageItem {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
  perms?: string[];
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

// Adapter Contracts
export interface PublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform;
  publishMode?: 'MOCK' | 'LIVE_META' | string;
  socialAccountId?: string;
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
  providerRequestId?: string;
  providerErrorCode?: string;
  providerTraceId?: string;
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

// Sprint 6 YouTube Domain Types
export interface YouTubeUploadQuotaLedger {
  id: string;
  quotaDate: string;
  provider: SocialAccountProvider;
  quotaBucket: string;
  dailyLimit: number;
  usedCount: number;
  reservedCount: number;
  resetTimezone: string;
  lastSyncedAt?: string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeUploadReservation {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  socialAccountId: string;
  quotaDate: string;
  status: 'RESERVED' | 'CONSUMED' | 'RELEASED' | 'EXPIRED' | 'FAILED' | string;
  reservedAt: string;
  consumedAt?: string | null;
  releasedAt?: string | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeUploadJob {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  attemptId?: string | null;
  socialAccountId: string;
  youtubeChannelId: string;
  uploadStatus:
    | 'CREATED'
    | 'UPLOADING'
    | 'UPLOADED'
    | 'PROCESSING'
    | 'PUBLISHED'
    | 'PRIVATE_RESTRICTED'
    | 'FAILED'
    | 'REAUTH_REQUIRED'
    | 'QUOTA_BLOCKED'
    | string;
  youtubeVideoId?: string | null;
  youtubeVideoUrl?: string | null;
  privacyStatus: 'private' | 'unlisted' | 'public' | string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  madeForKids?: boolean | null;
  tagsJson?: string[] | Record<string, unknown> | null;
  uploadStartedAt?: string | null;
  uploadFinishedAt?: string | null;
  processingCheckedAt?: string | null;
  publishedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  diagnosticsJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubePlatformOptions {
  title: string;
  description: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
  categoryId?: string;
  tags?: string[];
  madeForKids: boolean;
  notifySubscribers?: boolean;
}

export interface YouTubePublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform.YOUTUBE;
  publishMode: 'LIVE_GOOGLE';
  socialAccountId: string;
  youtubeChannelId?: string;
  video: {
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  };
  youtubeOptions: YouTubePlatformOptions;
  draftContentJson?: unknown;
}

export interface YouTubePublishResult {
  status: SocialPublishAttemptStatus;
  youtubeVideoId?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  providerRequestId?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  diagnostics?: Record<string, unknown>;
}

export interface YouTubeQuotaSummary {
  quotaDate: string;
  dailyLimit: number;
  usedCount: number;
  reservedCount: number;
  availableCount: number;
  resetTimezone: string;
  availableUploadsToday?: number;
  usedUploadsToday?: number;
  reservedUploadsToday?: number;
}

// ---------------------------------------------------------
// Sprint 7: Twitter/X Integration Types
// ---------------------------------------------------------

export type XCostLedgerStatus =
  | 'ESTIMATED'
  | 'ACKNOWLEDGED'
  | 'RESERVED'
  | 'CONSUMED'
  | 'RELEASED'
  | 'CANCELLED'
  | 'FAILED';

export interface XPlatformOptions {
  text?: string;
  containsUrl?: boolean;
  madeWithAi?: boolean;
  paidPartnership?: boolean;
  replySettings?: 'following' | 'mentionedUsers' | 'subscribers' | 'verified' | null;
  costAcknowledged?: boolean;
  estimatedCostUsd?: string;
}

export interface XPublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform.X;
  publishMode: 'LIVE_X';
  socialAccountId: string;
  xUserId?: string;
  text: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  xOptions: XPlatformOptions;
  draftContentJson?: unknown;
}

export interface XPublishResult {
  status: SocialPublishAttemptStatus;
  xPostId?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  xMediaIds?: string[];
  providerRequestId?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  estimatedCostUsd?: string;
  actualCostUsd?: string;
  diagnostics?: Record<string, unknown>;
}

export interface XMediaUploadJob {
  id: string;
  workspaceId: string;
  postId: string;
  targetId: string;
  attemptId?: string | null;
  socialAccountId: string;
  mediaAssetId: string;
  mediaCategory: string;
  uploadStatus:
    | 'CREATED'
    | 'INITIALIZED'
    | 'APPENDING'
    | 'FINALIZED'
    | 'PROCESSING'
    | 'READY'
    | 'FAILED'
    | 'REAUTH_REQUIRED'
    | 'RATE_LIMITED';
  xMediaId?: string | null;
  xMediaIdString?: string | null;
  uploadStartedAt?: string | null;
  uploadFinishedAt?: string | null;
  finalizedAt?: string | null;
  processingCheckedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  diagnosticsJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface XApiCostLedger {
  id: string;
  workspaceId: string;
  postId?: string | null;
  targetId?: string | null;
  attemptId?: string | null;
  socialAccountId?: string | null;
  operation: 'POST_CREATE' | 'POST_CREATE_WITH_URL' | 'MEDIA_METADATA' | string;
  estimatedUnitCostUsd: number;
  actualUnitCostUsd?: number | null;
  quantity: number;
  estimatedTotalUsd: number;
  actualTotalUsd?: number | null;
  pricingVersion?: string | null;
  costAcknowledgedBy?: string | null;
  costAcknowledgedAt?: string | null;
  status: XCostLedgerStatus;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface XCostEstimate {
  pricingVersion: string;
  operation: 'POST_CREATE' | 'POST_CREATE_WITH_URL';
  estimatedCostUsd: string;
  requiresAcknowledgement: boolean;
}

// ---------------------------------------------------------
// Sprint 8: Scheduler Hardening, Calendar, Health & QA Types
// ---------------------------------------------------------

export enum ReadinessStatus {
  READY = 'READY',
  READY_WITH_WARNINGS = 'READY_WITH_WARNINGS',
  BLOCKED = 'BLOCKED',
  UNKNOWN = 'UNKNOWN',
}

export type ReadinessCheckSource =
  | 'SCHEDULE_SAVE'
  | 'RESCHEDULE'
  | 'WORKER_PREFLIGHT'
  | 'DETAIL_VIEW'
  | 'HEALTH_CHECK'
  | 'QA_RUN';

export interface ReadinessIssue {
  code: string;
  message: string;
  targetId?: string;
  platform?: SocialSchedulerPlatform;
  blocking: boolean;
}

export interface ReadinessTargetSummary {
  targetId: string;
  platform: SocialSchedulerPlatform;
  status: ReadinessStatus;
  blockingIssues: ReadinessIssue[];
  warnings: ReadinessIssue[];
}

export interface SocialSchedulerReadinessCheck {
  id: string;
  workspaceId: string;
  postId: string;
  targetId?: string | null;
  status: ReadinessStatus;
  checkedAt: string;
  blockingIssues: ReadinessIssue[];
  warnings: ReadinessIssue[];
  targets: ReadinessTargetSummary[];
  diagnosticsJson?: Record<string, unknown> | null;
  createdByUserId?: string | null;
  source: ReadinessCheckSource | string;
  createdAt: string;
}

export enum AccountHealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  RECONNECT_REQUIRED = 'RECONNECT_REQUIRED',
  PERMISSION_MISSING = 'PERMISSION_MISSING',
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_BLOCKED = 'QUOTA_BLOCKED',
  COST_BLOCKED = 'COST_BLOCKED',
  DISCONNECTED = 'DISCONNECTED',
  UNKNOWN = 'UNKNOWN',
}

export interface SocialAccountHealthSnapshot {
  id: string;
  workspaceId: string;
  socialAccountId: string;
  provider: SocialAccountProvider;
  platform: SocialSchedulerPlatform;
  displayName: string;
  username?: string | null;
  status: AccountHealthStatus;
  checkedAt: string;
  tokenValid: boolean;
  tokenExpiry?: string | null;
  missingPermissions: string[];
  warnings: string[];
  permissionsJson?: Record<string, unknown> | null;
  quotaJson?: Record<string, unknown> | null;
  rateLimitJson?: Record<string, unknown> | null;
  costJson?: Record<string, unknown> | null;
  errorsJson?: Record<string, unknown> | null;
  diagnosticsJson?: Record<string, unknown> | null;
  createdAt: string;
}

export enum SocialSchedulerAuditAction {
  POST_CREATED = 'POST_CREATED',
  POST_UPDATED = 'POST_UPDATED',
  POST_SCHEDULED = 'POST_SCHEDULED',
  POST_RESCHEDULED = 'POST_RESCHEDULED',
  POST_CANCELLED = 'POST_CANCELLED',
  TARGET_ADDED = 'TARGET_ADDED',
  TARGET_REMOVED = 'TARGET_REMOVED',
  ACCOUNT_CONNECTED = 'ACCOUNT_CONNECTED',
  ACCOUNT_RECONNECTED = 'ACCOUNT_RECONNECTED',
  ACCOUNT_DISCONNECTED = 'ACCOUNT_DISCONNECTED',
  WORKER_ATTEMPT_STARTED = 'WORKER_ATTEMPT_STARTED',
  WORKER_ATTEMPT_FINISHED = 'WORKER_ATTEMPT_FINISHED',
  READINESS_CHECK_RUN = 'READINESS_CHECK_RUN',
  STALE_LOCK_RECOVERED = 'STALE_LOCK_RECOVERED',
  // Sprint 9: Batch, Duplication, and Approval Actions
  POST_DUPLICATED = 'POST_DUPLICATED',
  POST_COPIED_TO_DATES = 'POST_COPIED_TO_DATES',
  BULK_BATCH_CREATED = 'BULK_BATCH_CREATED',
  BULK_POSTS_CREATED = 'BULK_POSTS_CREATED',
  POST_SENT_FOR_REVIEW = 'POST_SENT_FOR_REVIEW',
  POST_APPROVED = 'POST_APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  POST_REJECTED = 'POST_REJECTED',
  POST_DRAG_RESCHEDULED = 'POST_DRAG_RESCHEDULED',
  POST_QUICK_EDITED = 'POST_QUICK_EDITED',
  WORKFLOW_SETTING_CHANGED = 'WORKFLOW_SETTING_CHANGED',
}

export interface SocialSchedulerAuditLog {
  id: string;
  workspaceId: string;
  actorUserId?: string | null;
  entityType: 'POST' | 'TARGET' | 'ACCOUNT' | 'WORKER' | string;
  entityId: string;
  action: SocialSchedulerAuditAction | string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PlatformQuotaSnapshot {
  id: string;
  workspaceId?: string | null;
  provider: SocialAccountProvider;
  platform: SocialSchedulerPlatform;
  socialAccountId?: string | null;
  quotaType: 'DAILY_UPLOADS' | 'RATE_LIMIT' | 'PUBLISHING_LIMIT' | 'COST_CAP' | string;
  limitValue?: number | null;
  usedValue?: number | null;
  remainingValue?: number | null;
  resetAt?: string | null;
  status: 'OK' | 'WARNING' | 'EXHAUSTED';
  rawMetadataJson?: Record<string, unknown> | null;
  sanitizedJson?: Record<string, unknown> | null;
  capturedAt: string;
}

export interface PlatformQuotaSummary {
  instagram: {
    status: 'OK' | 'WARNING' | 'EXHAUSTED';
    remaining: number;
    limit: number;
  };
  youtube: {
    status: 'OK' | 'WARNING' | 'EXHAUSTED';
    remainingUploadsToday: number;
    dailyLimit: number;
    usedUploadsToday: number;
    reservedUploadsToday: number;
    auditStatus: string;
  };
  x: {
    status: 'OK' | 'WARNING' | 'EXHAUSTED';
    estimatedMonthCostUsd: string;
    actualMonthCostUsd: string;
    paidPublishingEnabled: boolean;
    workspaceDailyCap: number;
  };
  pinterest: {
    status: 'OK' | 'WARNING' | 'EXHAUSTED';
    rateLimitRemaining: number;
    tier: 'Trial' | 'Standard';
    boardsSynced: number;
  };
}

export type CalendarMode = 'month' | 'week' | 'day' | 'list';

export interface CalendarItem {
  postId: string;
  title: string;
  caption?: string;
  thumbnailMediaAssetId?: string;
  mediaCount: number;
  scheduledAt: string;
  timezone: string;
  platforms: SocialSchedulerPlatform[];
  status: SocialSchedulerPostStatus;
  attentionRequired: boolean;
  attentionReason?: string;
  readinessStatus?: ReadinessStatus;
}

export interface SchedulerAttentionItem {
  postId: string;
  postTitle: string;
  scheduledAt: string;
  status: SocialSchedulerPostStatus;
  targetStatuses: { platform: SocialSchedulerPlatform; status: SocialSchedulerTargetStatus }[];
  reason: string;
  actionRequired: 'REAUTH' | 'QUOTA' | 'COST' | 'RATE_LIMIT' | 'MEDIA' | 'REVIEW';
}

export interface SchedulerOverviewSummary {
  scheduledToday: number;
  publishingSoon: number;
  needsAttention: number;
  publishedThisWeek: number;
  failedTargets: number;
  reauthRequired: number;
  upcoming: CalendarItem[];
  attentionItems: SchedulerAttentionItem[];
}

export type QaMatrixCellState = 'PASSED' | 'FAILED' | 'NOT_TESTED' | 'BLOCKED' | 'NOT_APPLICABLE';

export interface QaMatrixRow {
  platformId: string;
  label: string;
  platform: SocialSchedulerPlatform;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  accountConnected: QaMatrixCellState;
  mediaValidation: QaMatrixCellState;
  preflightReady: QaMatrixCellState;
  workerRoute: QaMatrixCellState;
  attemptLogged: QaMatrixCellState;
  successTested: QaMatrixCellState;
  failureTested: QaMatrixCellState;
  retryTested: QaMatrixCellState;
  reauthTested: QaMatrixCellState;
  workspaceIsolationTested: QaMatrixCellState;
  lastTestedAt?: string | null;
  notes?: string;
}

export interface ReschedulePostInput {
  workspaceId: string;
  postId: string;
  scheduledAt: string;
  timezone?: string;
  reason?: string;
  userId?: string;
  isDrag?: boolean;
}

export interface ReschedulePostResult {
  success: boolean;
  postId: string;
  status: SocialSchedulerPostStatus;
  scheduledAt: string;
  timezone: string;
  error?: string;
}

export interface CancelPostResult {
  success: boolean;
  postId: string;
  status: SocialSchedulerPostStatus;
  cancelledTargetCount: number;
  releasedReservations: {
    youtubeQuota: boolean;
    xCost: boolean;
  };
  error?: string;
}

export interface RetryTargetsResult {
  success: boolean;
  postId: string;
  retriedTargetIds: string[];
  skippedTargetIds: string[];
  error?: string;
}

// ---------------------------------------------------------
// Sprint 9: Batch, Duplication, Approval & Workflow Interfaces
// ---------------------------------------------------------

export interface SocialSchedulerBatch {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  name: string;
  status: SocialSchedulerBatchStatus | string;
  totalPosts: number;
  totalItems?: number;
  createdPosts: number;
  failedPosts: number;
  source: 'BULK_UI' | string;
  settingsJson?: Record<string, unknown> | null;
  summaryJson?: Record<string, unknown> | null;
  errorJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface SocialSchedulerReviewComment {
  id: string;
  workspaceId: string;
  postId: string;
  authorUserId: string;
  commentType: SocialSchedulerReviewCommentType | string;
  body: string;
  metadataJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicatePostInput {
  workspaceId: string;
  mode?: 'DRAFT' | 'SCHEDULED';
  copyTargets?: boolean;
  copySchedule?: boolean;
  newScheduledAt?: string;
  scheduledAt?: string;
  timezone?: string;
  userId?: string;
}

export interface DuplicatePostResult {
  success: boolean;
  sourcePostId: string;
  newPostId: string;
  status: SocialSchedulerPostStatus | string;
  post?: Sprint1ScheduledPost;
  error?: string;
}

export interface CopyToDatesInput {
  workspaceId: string;
  mode?: 'DRAFT' | 'SCHEDULED';
  timezone?: string;
  dates: string[];
  copyTargets?: boolean;
  captionSuffix?: string;
  userId?: string;
}

export interface CopyToDatesResult {
  success: boolean;
  createdCount: number;
  failedCount: number;
  createdPostIds: string[];
  failures: Array<{ date: string; error: string }>;
  error?: string;
}

export interface BulkDraftItem {
  draftRowId?: string;
  mediaAssetId?: string;
  mediaAsset?: Sprint1MediaAsset;
  title: string;
  caption?: string;
  hashtags?: string[];
  platforms?: SocialSchedulerPlatform[];
  draftContentJson?: DraftContentJson;
  targets?: Array<{
    platform: SocialSchedulerPlatform;
    socialAccountId?: string;
    mockAccountName?: string;
    publishMode?: string;
    platformOptions?: Record<string, unknown>;
  }>;
  scheduledAt?: string | null;
  timezone?: string;
}

export interface CreateBatchInput {
  workspaceId: string;
  name: string;
  createdByUserId?: string;
  settingsJson?: {
    mode?: 'DRAFTS_ONLY' | 'SCHEDULED';
    timezone?: string;
    [key: string]: unknown;
  };
}

export interface CreatePostsFromBatchInput {
  workspaceId: string;
  batchId: string;
  items?: BulkDraftItem[];
  userId?: string;
}

export interface CreatePostsFromBatchResult {
  success: boolean;
  batchId: string;
  createdPosts: number;
  failedPosts: number;
  postIds: string[];
  errors?: Array<{ index: number; error: string }>;
}

export interface SendForReviewInput {
  workspaceId: string;
  reviewerUserId?: string;
  message?: string;
  userId?: string;
}

export interface ApprovePostInput {
  workspaceId: string;
  comment?: string;
  userId?: string;
}

export interface RequestChangesInput {
  workspaceId: string;
  comment: string;
  userId?: string;
}

export interface RejectPostInput {
  workspaceId: string;
  reason: string;
  userId?: string;
}

export interface WorkflowSettings {
  workspaceId: string;
  socialSchedulerApprovalRequired: boolean;
  dragRescheduleEnabled: boolean;
  dragRescheduleRequiresConfirmation: boolean;
  bulkDraftsEnabled: boolean;
  maxBulkUploadFiles: number;
  maxCopyToDates: number;
  updatedAt?: string;
}
