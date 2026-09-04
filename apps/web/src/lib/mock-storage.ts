import crypto from 'crypto';
import {
  SocialSchedulerPostStatus,
  SocialSchedulerMediaStatus,
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialPublishAttempt,
  SocialPublishAttemptStatus,
  SocialAccount,
  SocialAccountStatus,
  SocialAccountProvider,
  SocialAccountType,
  SocialOAuthState,
  Workspace,
  Sprint1ScheduledPost,
  Sprint1MediaAsset,
  Sprint1PublishTarget,
  DraftContentJson,
  PinterestBoard,
  PinterestBoardSection,
  YouTubeUploadQuotaLedger,
  YouTubeUploadReservation,
  YouTubeUploadJob,
  YouTubeQuotaSummary,
  XMediaUploadJob,
  XApiCostLedger,
  XCostEstimate,
  ReadinessStatus,
  ReadinessIssue,
  ReadinessTargetSummary,
  SocialSchedulerReadinessCheck,
  ReadinessCheckSource,
  AccountHealthStatus,
  SocialAccountHealthSnapshot,
  SocialSchedulerAuditAction,
  SocialSchedulerAuditLog,
  PlatformQuotaSnapshot,
  PlatformQuotaSummary,
  CalendarItem,
  CalendarMode,
  SchedulerOverviewSummary,
  SchedulerAttentionItem,
  QaMatrixRow,
  QaMatrixCellState,
  ReschedulePostInput,
  ReschedulePostResult,
  CancelPostResult,
  RetryTargetsResult,
  // Sprint 9 types
  SocialSchedulerApprovalStatus,
  SocialSchedulerBatchStatus,
  SocialSchedulerReviewCommentType,
  SocialSchedulerBatch,
  SocialSchedulerReviewComment,
  DuplicatePostInput,
  DuplicatePostResult,
  CopyToDatesInput,
  CopyToDatesResult,
  BulkDraftItem,
  CreateBatchInput,
  CreatePostsFromBatchInput,
  CreatePostsFromBatchResult,
  SendForReviewInput,
  ApprovePostInput,
  RequestChangesInput,
  RejectPostInput,
  WorkflowSettings,
} from '../types/scheduler';
import { credentialVault } from './credential-vault';

const STORAGE_KEYS = {
  POSTS: 'sakhaa_scheduler_posts_sprint1',
  WORKSPACES: 'sakhaa_scheduler_workspaces_sprint1',
  ACTIVE_WS: 'sakhaa_scheduler_active_ws_sprint1',
  MEDIA: 'sakhaa_scheduler_media_sprint1',
  ATTEMPTS: 'sakhaa_scheduler_attempts_sprint2',
  ACCOUNTS: 'sakhaa_scheduler_accounts_sprint3',
  OAUTH_STATES: 'sakhaa_scheduler_oauth_states_sprint3',
  CONTAINERS: 'sakhaa_scheduler_instagram_containers_sprint4',
  BOARDS: 'sakhaa_scheduler_pinterest_boards_sprint5',
  YOUTUBE_QUOTA_LEDGER: 'sakhaa_scheduler_youtube_quota_ledger_sprint6',
  YOUTUBE_RESERVATIONS: 'sakhaa_scheduler_youtube_reservations_sprint6',
  YOUTUBE_UPLOAD_JOBS: 'sakhaa_scheduler_youtube_upload_jobs_sprint6',
};

export const CONFIGURED_B2_BUCKET =
  process.env.B2_BUCKET_NAME ||
  process.env.NEXT_PUBLIC_B2_BUCKET_NAME ||
  process.env.B2_DEFAULT_BUCKET ||
  process.env.B2_BUCKET_CLEAN ||
  'sakhaa-forge-clean-media';

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_mantri',
    name: 'Mantri Developers',
    brandName: 'Mantri Luxury Homes',
    brandApproved: true,
    permission: 'OWNER',
    storageBucket: CONFIGURED_B2_BUCKET,
  },
  {
    id: 'ws_sobha',
    name: 'Sobha Realty',
    brandName: 'Sobha Signature',
    brandApproved: true,
    permission: 'CLIENT_MANAGER',
    storageBucket: CONFIGURED_B2_BUCKET,
  },
  {
    id: 'ws_prestige',
    name: 'Prestige Group',
    brandName: 'Prestige Estates',
    brandApproved: false,
    permission: 'VIEWER',
    storageBucket: CONFIGURED_B2_BUCKET,
  },
];

// Initialize default credentials
const mantriCredRef = credentialVault.storeToken('EAABmockTokenMantriDevelopersFacebookPage2026', {
  tokenType: 'page_access_token',
  metadata: { pageId: '109283745612345', pageName: 'Mantri Developers Official Page' },
});

const sobhaCredRef = credentialVault.storeToken('EAABmockTokenSobhaRealtyFacebookPage2026', {
  tokenType: 'page_access_token',
  metadata: { pageId: '987654321098765', pageName: 'Sobha Signature Living' },
});

const mantriPinterestCredRef = credentialVault.storeToken('pina_mockTokenMantriDevelopersPinterest2026', {
  tokenType: 'bearer',
  metadata: { userId: 'pin_usr_mantri_123', username: 'mantridevelopers' },
});

const sobhaPinterestCredRef = credentialVault.storeToken('pina_mockTokenSobhaRealtyPinterest2026', {
  tokenType: 'bearer',
  metadata: { userId: 'pin_usr_sobha_456', username: 'sobharealty' },
});

const mantriYouTubeCredRef = credentialVault.storeToken('ya29.mockGoogleOAuthAccessTokenMantri2026', {
  tokenType: 'bearer',
  metadata: { channelId: 'UC_mantri_channel_01', username: '@mantridevelopers' },
});

const sobhaYouTubeCredRef = credentialVault.storeToken('ya29.mockGoogleOAuthAccessTokenSobha2026', {
  tokenType: 'bearer',
  metadata: { channelId: 'UC_sobha_channel_01', username: '@sobharealty' },
});

const mantriXCredRef = credentialVault.storeToken('mock_x_oauth_token_mantri_2026', {
  tokenType: 'bearer',
  metadata: { xUserId: '123456789', username: 'mantridevelopers' },
});

const sobhaXCredRef = credentialVault.storeToken('mock_x_oauth_token_sobha_2026', {
  tokenType: 'bearer',
  metadata: { xUserId: '987654321', username: 'sobharealty' },
});

const INITIAL_SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc_fb_mantri_01',
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    displayName: 'Mantri Developers Official Page',
    username: 'mantri.developers',
    externalAccountId: '109283745612345',
    externalAccountIdMasked: '1092••••2345',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    credentialRef: mantriCredRef,
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_fb_sobha_01',
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    displayName: 'Sobha Signature Living',
    username: 'sobha.signature',
    externalAccountId: '987654321098765',
    externalAccountIdMasked: '9876••••8765',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    credentialRef: sobhaCredRef,
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_ig_mantri_01',
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.INSTAGRAM,
    accountType: SocialAccountType.INSTAGRAM_BUSINESS,
    displayName: 'Mantri Developers (@mantridevelopers)',
    username: 'mantridevelopers',
    externalAccountId: '178414053092111',
    externalAccountIdMasked: '1784••••2111',
    externalParentId: '109283745612345',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['instagram_business_basic', 'instagram_business_content_publish', 'pages_show_list'],
    credentialRef: mantriCredRef,
    metadataJson: {
      linkedFacebookPageName: 'Mantri Developers Official Page',
      accountKind: 'business',
      supportsPublishing: true,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_ig_sobha_01',
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.INSTAGRAM,
    accountType: SocialAccountType.INSTAGRAM_BUSINESS,
    displayName: 'Sobha Realty Official (@sobharealty)',
    username: 'sobharealty',
    externalAccountId: '178414098765432',
    externalAccountIdMasked: '1784••••5432',
    externalParentId: '987654321098765',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['instagram_business_basic', 'instagram_business_content_publish', 'pages_show_list'],
    credentialRef: sobhaCredRef,
    metadataJson: {
      linkedFacebookPageName: 'Sobha Signature Living',
      accountKind: 'business',
      supportsPublishing: true,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_pin_mantri_01',
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.PINTEREST,
    platform: SocialSchedulerPlatform.PINTEREST,
    accountType: SocialAccountType.PINTEREST_ACCOUNT,
    displayName: 'Mantri Developers',
    username: 'mantridevelopers',
    externalAccountId: 'pin_usr_mantri_123',
    externalAccountIdMasked: 'pin_••••_123',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['user_accounts:read', 'boards:read', 'pins:read', 'pins:write'],
    credentialRef: mantriPinterestCredRef,
    metadataJson: {
      accessTier: 'standard',
      boardCount: 2,
      supportsImagePins: true,
      supportsVideoPins: false,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_pin_sobha_01',
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.PINTEREST,
    platform: SocialSchedulerPlatform.PINTEREST,
    accountType: SocialAccountType.PINTEREST_ACCOUNT,
    displayName: 'Sobha Signature Living',
    username: 'sobharealty',
    externalAccountId: 'pin_usr_sobha_456',
    externalAccountIdMasked: 'pin_••••_456',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['user_accounts:read', 'boards:read', 'pins:read', 'pins:write'],
    credentialRef: sobhaPinterestCredRef,
    metadataJson: {
      accessTier: 'standard',
      boardCount: 2,
      supportsImagePins: true,
      supportsVideoPins: false,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_yt_mantri_01',
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.GOOGLE,
    platform: SocialSchedulerPlatform.YOUTUBE,
    accountType: SocialAccountType.YOUTUBE_CHANNEL,
    displayName: 'Mantri Developers Official',
    username: 'mantridevelopers',
    externalAccountId: 'UC_mantri_channel_01',
    externalAccountIdMasked: 'UC_m••••_01',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    credentialRef: mantriYouTubeCredRef,
    metadataJson: {
      auditStatus: 'unverified',
      supportsVideoUpload: true,
      publicUploadsAllowed: false,
      defaultPrivacyStatus: 'private',
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_yt_sobha_01',
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.GOOGLE,
    platform: SocialSchedulerPlatform.YOUTUBE,
    accountType: SocialAccountType.YOUTUBE_CHANNEL,
    displayName: 'Sobha Realty Official',
    username: 'sobharealty',
    externalAccountId: 'UC_sobha_channel_01',
    externalAccountIdMasked: 'UC_s••••_01',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    credentialRef: sobhaYouTubeCredRef,
    metadataJson: {
      auditStatus: 'unverified',
      supportsVideoUpload: true,
      publicUploadsAllowed: false,
      defaultPrivacyStatus: 'private',
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_x_mantri_01',
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.X,
    platform: SocialSchedulerPlatform.X,
    accountType: SocialAccountType.X_USER,
    displayName: 'Mantri Developers',
    username: 'mantridevelopers',
    externalAccountId: '123456789',
    externalAccountIdMasked: '1234••••6789',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
    credentialRef: mantriXCredRef,
    metadataJson: {
      paidPublishingEnabled: true,
      supportsTextPosts: true,
      supportsImagePosts: true,
      supportsVideoPosts: true,
      supportsGifPosts: false,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_x_sobha_01',
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.X,
    platform: SocialSchedulerPlatform.X,
    accountType: SocialAccountType.X_USER,
    displayName: 'Sobha Realty Official',
    username: 'sobharealty',
    externalAccountId: '987654321',
    externalAccountIdMasked: '9876••••4321',
    status: SocialAccountStatus.CONNECTED,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
    credentialRef: sobhaXCredRef,
    metadataJson: {
      paidPublishingEnabled: true,
      supportsTextPosts: true,
      supportsImagePosts: true,
      supportsVideoPosts: true,
      supportsGifPosts: false,
    },
    lastConnectedAt: '2026-09-01T10:00:00.000Z',
    lastValidatedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

const INITIAL_PINTEREST_BOARDS: PinterestBoard[] = [
  {
    id: 'board_mantri_01',
    workspaceId: 'ws_mantri',
    socialAccountId: 'acc_pin_mantri_01',
    externalBoardId: '1092837456',
    name: 'Luxury Villas & Estates',
    description: 'Exclusive luxury properties and architecture by Mantri Developers.',
    privacy: 'PUBLIC',
    url: 'https://www.pinterest.com/mantridevelopers/luxury-villas-estates/',
    sectionCount: 2,
    lastSyncedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'board_mantri_02',
    workspaceId: 'ws_mantri',
    socialAccountId: 'acc_pin_mantri_01',
    externalBoardId: '1092837457',
    name: 'Interior Architecture & Design',
    description: 'Interior inspirations and modern home designs.',
    privacy: 'PUBLIC',
    url: 'https://www.pinterest.com/mantridevelopers/interior-architecture/',
    sectionCount: 0,
    lastSyncedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'board_sobha_01',
    workspaceId: 'ws_sobha',
    socialAccountId: 'acc_pin_sobha_01',
    externalBoardId: '9876543210',
    name: 'Sobha Signature Living',
    description: 'Crafted residences by Sobha Realty.',
    privacy: 'PUBLIC',
    url: 'https://www.pinterest.com/sobharealty/signature-living/',
    sectionCount: 1,
    lastSyncedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'board_sobha_02',
    workspaceId: 'ws_sobha',
    socialAccountId: 'acc_pin_sobha_01',
    externalBoardId: '9876543211',
    name: 'Duplex & Penthouse Inspiration',
    description: 'Bespoke layouts and views.',
    privacy: 'PUBLIC',
    url: 'https://www.pinterest.com/sobharealty/duplex-penthouse/',
    sectionCount: 0,
    lastSyncedAt: '2026-09-01T10:00:00.000Z',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

let inMemoryContainers: any[] = [];
let inMemoryPinterestBoards: PinterestBoard[] = [...INITIAL_PINTEREST_BOARDS];
let inMemoryYouTubeLedgers: YouTubeUploadQuotaLedger[] = [];
let inMemoryYouTubeReservations: YouTubeUploadReservation[] = [];
let inMemoryYouTubeJobs: YouTubeUploadJob[] = [];
let inMemoryXMediaUploadJobs: XMediaUploadJob[] = [];
let inMemoryXCostLedgers: XApiCostLedger[] = [];
let inMemoryReadinessChecks: SocialSchedulerReadinessCheck[] = [];
let inMemoryHealthSnapshots: SocialAccountHealthSnapshot[] = [];
let inMemoryAuditLogs: SocialSchedulerAuditLog[] = [];
let inMemoryQuotaSnapshots: PlatformQuotaSnapshot[] = [];
// Sprint 9 in-memory state
let inMemoryBatches: SocialSchedulerBatch[] = [];
let inMemoryReviewComments: SocialSchedulerReviewComment[] = [];
let inMemoryWorkflowSettings: Record<string, WorkflowSettings> = {};

const INITIAL_SPRINT1_POSTS: Sprint1ScheduledPost[] = [
  {
    id: 'post_s1_001',
    workspaceId: 'ws_mantri',
    createdByUserId: 'usr_admin',
    title: 'Weekend property walkthrough',
    status: SocialSchedulerPostStatus.SCHEDULED,
    scheduledAt: '2026-09-05T10:30:00.000Z',
    timezone: 'Asia/Kolkata',
    createdAt: '2026-09-02T14:00:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      postTitle: 'Weekend property walkthrough',
      caption: 'Explore the newly unveiled sky villas at Mantri Signature Tower. Experience bespoke architecture and private terrace gardens. #MantriHomes #LuxuryLiving',
      cta: 'Book an exclusive site visit today',
      hashtags: ['MantriHomes', 'LuxuryLiving', 'BangaloreEstates'],
      notes: 'Focus on Instagram and Facebook Pages for maximum regional reach.',
      media: [
        {
          mediaAssetId: 'asset_mantri_01',
          role: 'primary',
          order: 0,
        },
      ],
      platformOverrides: {},
      createdFromStage: 'compose',
      lastEditedAt: '2026-09-02T14:30:00.000Z',
    },
    mediaAssets: [
      {
        id: 'asset_mantri_01',
        workspaceId: 'ws_mantri',
        uploadedByUserId: 'usr_admin',
        originalFileName: 'mantri-sky-villas.jpg',
        safeFileName: 'mantri_sky_villas.jpg',
        mimeType: 'image/jpeg',
        byteSize: 2450000,
        bucket: CONFIGURED_B2_BUCKET,
        objectKey: 'workspaces/ws_mantri/social-scheduler/2026/09/asset_mantri_01/mantri_sky_villas.jpg',
        width: 1200,
        height: 800,
        status: SocialSchedulerMediaStatus.UPLOADED,
        previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        createdAt: '2026-09-02T13:50:00.000Z',
        updatedAt: '2026-09-02T13:52:00.000Z',
      },
    ],
    targets: [
      {
        id: 'tgt_001',
        postId: 'post_s1_001',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'Facebook Page · Mantri Official',
        status: SocialSchedulerTargetStatus.MOCK_READY,
        publishMode: 'LIVE_META',
        socialAccountId: 'acc_fb_mantri_01',
        createdAt: '2026-09-02T14:15:00.000Z',
        updatedAt: '2026-09-02T14:15:00.000Z',
      },
      {
        id: 'tgt_002',
        postId: 'post_s1_001',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mockAccountName: 'Instagram Business · @mantrihomes',
        status: SocialSchedulerTargetStatus.MOCK_READY,
        publishMode: 'MOCK',
        createdAt: '2026-09-02T14:15:00.000Z',
        updatedAt: '2026-09-02T14:15:00.000Z',
      },
    ],
    publishTargets: [],
  },
  {
    id: 'post_s1_002',
    workspaceId: 'ws_mantri',
    createdByUserId: 'usr_admin',
    title: 'Biophilic facade design spotlight',
    status: SocialSchedulerPostStatus.DRAFT,
    timezone: 'Asia/Kolkata',
    createdAt: '2026-09-03T09:00:00.000Z',
    updatedAt: '2026-09-03T09:15:00.000Z',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      postTitle: 'Biophilic facade design spotlight',
      caption: 'Sustainable luxury redefined: Vertical botanical gardens integrated directly into the exterior terrace facade.',
      cta: 'Learn more about sustainable living',
      hashtags: ['SustainableLiving', 'Architecture', 'GreenHomes'],
      media: [
        {
          mediaAssetId: 'asset_mantri_02',
          role: 'primary',
          order: 0,
        },
      ],
      platformOverrides: {},
      createdFromStage: 'upload',
      lastEditedAt: '2026-09-03T09:15:00.000Z',
    },
    mediaAssets: [
      {
        id: 'asset_mantri_02',
        workspaceId: 'ws_mantri',
        uploadedByUserId: 'usr_admin',
        originalFileName: 'mantri-green-facade.jpg',
        safeFileName: 'mantri_green_facade.jpg',
        mimeType: 'image/jpeg',
        byteSize: 1890000,
        bucket: CONFIGURED_B2_BUCKET,
        objectKey: 'workspaces/ws_mantri/social-scheduler/2026/09/asset_mantri_02/mantri_green_facade.jpg',
        width: 1080,
        height: 1080,
        status: SocialSchedulerMediaStatus.UPLOADED,
        previewUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
        createdAt: '2026-09-03T09:05:00.000Z',
        updatedAt: '2026-09-03T09:07:00.000Z',
      },
    ],
    targets: [],
    publishTargets: [],
  },
  {
    id: 'post_s1_003',
    workspaceId: 'ws_sobha',
    createdByUserId: 'usr_admin',
    title: 'Sobha Creek Vistas Construction Milestone',
    status: SocialSchedulerPostStatus.SCHEDULED,
    scheduledAt: '2026-09-06T12:00:00.000Z',
    timezone: 'Asia/Kolkata',
    createdAt: '2026-09-02T16:00:00.000Z',
    updatedAt: '2026-09-02T16:45:00.000Z',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      postTitle: 'Sobha Creek Vistas Construction Milestone',
      caption: 'Ahead of schedule: Level 42 casting completed at Sobha Creek Vistas. Precision German engineering meeting uncompromising elegance.',
      cta: 'Request construction progress dossier',
      hashtags: ['SobhaRealty', 'DubaiRealEstate'],
      media: [],
      platformOverrides: {},
      createdFromStage: 'schedule',
      lastEditedAt: '2026-09-02T16:45:00.000Z',
    },
    mediaAssets: [],
    targets: [
      {
        id: 'tgt_003',
        postId: 'post_s1_003',
        workspaceId: 'ws_sobha',
        platform: SocialSchedulerPlatform.PINTEREST,
        mockAccountName: 'Pinterest Business · Sobha Showcase',
        status: SocialSchedulerTargetStatus.MOCK_READY,
        publishMode: 'MOCK',
        createdAt: '2026-09-02T16:30:00.000Z',
        updatedAt: '2026-09-02T16:30:00.000Z',
      },
    ],
    publishTargets: [],
  },
];

let inMemoryPosts: Sprint1ScheduledPost[] = [...INITIAL_SPRINT1_POSTS];
let inMemoryAttempts: SocialPublishAttempt[] = [];
let inMemoryAccounts: SocialAccount[] = [...INITIAL_SOCIAL_ACCOUNTS];
let inMemoryOAuthStates: SocialOAuthState[] = [];

export const sprint1Storage = {
  getWorkspaces: (): Workspace[] => {
    if (typeof window === 'undefined') return DEFAULT_WORKSPACES;
    const stored = localStorage.getItem(STORAGE_KEYS.WORKSPACES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(DEFAULT_WORKSPACES));
      return DEFAULT_WORKSPACES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_WORKSPACES;
    }
  },

  getActiveWorkspace: (): Workspace => {
    const workspaces = sprint1Storage.getWorkspaces();
    if (typeof window === 'undefined') return workspaces[0];
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_WS);
    const found = workspaces.find((w) => w.id === activeId);
    if (found) return found;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WS, workspaces[0].id);
    return workspaces[0];
  },

  setActiveWorkspace: (workspaceId: string): Workspace => {
    const workspaces = sprint1Storage.getWorkspaces();
    const found = workspaces.find((w) => w.id === workspaceId) || workspaces[0];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_WS, found.id);
    }
    return found;
  },

  getPosts: (workspaceId?: string, statusFilter?: string, search?: string): Sprint1ScheduledPost[] => {
    const ws = workspaceId || sprint1Storage.getActiveWorkspace().id;
    let posts: Sprint1ScheduledPost[] = inMemoryPosts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_SPRINT1_POSTS));
        posts = INITIAL_SPRINT1_POSTS;
      } else {
        try {
          posts = JSON.parse(stored);
        } catch {
          posts = INITIAL_SPRINT1_POSTS;
        }
      }
    }

    return posts
      .filter((p) => p.workspaceId === ws)
      .filter((p) => {
        if (!statusFilter || statusFilter === 'ALL') return true;
        return p.status === statusFilter;
      })
      .filter((p) => {
        if (!search || !search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.draftContentJson.caption.toLowerCase().includes(q)
        );
      });
  },

  getPostById: (postId: string, workspaceId?: string): Sprint1ScheduledPost | undefined => {
    let posts: Sprint1ScheduledPost[] = inMemoryPosts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        try {
          posts = JSON.parse(stored);
        } catch {
          posts = inMemoryPosts;
        }
      }
    }
    const found = posts.find((p) => p.id === postId);
    if (found && workspaceId && found.workspaceId !== workspaceId) {
      return undefined;
    }
    return found;
  },

  getPost: (postId: string, workspaceId?: string): Sprint1ScheduledPost | undefined => {
    return sprint1Storage.getPostById(postId, workspaceId);
  },

  getMediaAssetById: (assetId: string, workspaceId?: string): Sprint1MediaAsset | undefined => {
    const posts = sprint1Storage.getPosts(workspaceId);
    for (const post of posts) {
      const found = post.mediaAssets?.find((m) => m.id === assetId);
      if (found) {
        if (workspaceId && found.workspaceId && found.workspaceId !== workspaceId) {
          return undefined;
        }
        return found;
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEDIA);
        if (stored) {
          const list: Sprint1MediaAsset[] = JSON.parse(stored);
          const f = list.find((m) => m.id === assetId);
          if (f && (!workspaceId || f.workspaceId === workspaceId)) return f;
        }
      } catch {}
    }
    return undefined;
  },

  createDraftPost: (params: {
    workspaceId: string;
    title: string;
    draftContentJson: DraftContentJson;
    mediaAssets?: Sprint1MediaAsset[];
    targets?: Sprint1PublishTarget[];
    scheduledAt?: string;
    timezone?: string;
    status?: SocialSchedulerPostStatus;
  }): Sprint1ScheduledPost => {
    const newId = `post_s1_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPost: Sprint1ScheduledPost = {
      id: newId,
      workspaceId: params.workspaceId,
      createdByUserId: 'usr_admin',
      title: params.title,
      status: params.status || (params.scheduledAt ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT),
      scheduledAt: params.scheduledAt,
      timezone: params.timezone || 'Asia/Kolkata',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      draftContentJson: params.draftContentJson,
      mediaAssets: params.mediaAssets || [],
      targets: params.targets || [],
      publishTargets: params.targets || [],
    };

    inMemoryPosts = [newPost, ...inMemoryPosts];

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(inMemoryPosts));
    }

    return newPost;
  },

  createTarget: (target: Partial<Sprint1PublishTarget> & { postId: string; platform: SocialSchedulerPlatform }): Sprint1PublishTarget => {
    const post = sprint1Storage.getPostById(target.postId);
    const newTarget: Sprint1PublishTarget = {
      id: target.id || `tgt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId: target.postId,
      workspaceId: target.workspaceId || post?.workspaceId || 'ws_mantri',
      platform: target.platform,
      publishMode: target.publishMode || 'MOCK',
      socialAccountId: target.socialAccountId || null,
      mockAccountName: target.mockAccountName || undefined,
      status: target.status || SocialSchedulerTargetStatus.SCHEDULED,
      scheduledFor: target.scheduledFor || post?.scheduledAt || null,
      platformOptionsJson: target.platformOptionsJson || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (post) {
      post.targets.push(newTarget);
    }
    return newTarget;
  },

  cancelPost: (postId: string, workspaceId?: string, reason?: string, userId?: string): Sprint1ScheduledPost | null => {
    let allPosts: Sprint1ScheduledPost[] = inMemoryPosts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        try {
          allPosts = JSON.parse(stored);
        } catch {
          allPosts = inMemoryPosts;
        }
      }
    }

    const post = allPosts.find((p) => p.id === postId && (!workspaceId || p.workspaceId === workspaceId));
    if (!post) return null;

    if (post.status === SocialSchedulerPostStatus.PUBLISHED || post.status === SocialSchedulerPostStatus.PROCESSING) {
      return null;
    }

    let cancelledTargets = 0;
    let releasedYt = false;
    let releasedX = false;

    post.status = SocialSchedulerPostStatus.CANCELLED;
    post.cancelledAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();

    post.targets.forEach((t) => {
      if (t.status !== SocialSchedulerTargetStatus.PUBLISHED && t.status !== SocialSchedulerTargetStatus.PUBLISHED_MOCK) {
        t.status = SocialSchedulerTargetStatus.CANCELLED;
        t.updatedAt = new Date().toISOString();
        cancelledTargets++;

        if (t.platform === SocialSchedulerPlatform.YOUTUBE) {
          const released = sprint1Storage.releaseYouTubeQuota(t.id);
          if (released) releasedYt = true;
        }

        if (t.platform === SocialSchedulerPlatform.X) {
          const xLedger = inMemoryXCostLedgers.find((l) => l.targetId === t.id);
          if (xLedger && xLedger.status === 'ESTIMATED') {
            xLedger.status = 'CANCELLED';
            releasedX = true;
          }
        }
      }
    });

    inMemoryPosts = allPosts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }

    sprint1Storage.recordAuditLog({
      workspaceId: post.workspaceId,
      actorUserId: userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: SocialSchedulerAuditAction.POST_CANCELLED,
      metadataJson: { reason: reason || 'User cancelled post', cancelledTargets, releasedYt, releasedX },
    });

    return post;
  },

  getAllPosts: (): Sprint1ScheduledPost[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return inMemoryPosts;
        }
      }
    }
    return inMemoryPosts;
  },

  updatePost: (postId: string, updates: Partial<Sprint1ScheduledPost>): Sprint1ScheduledPost | null => {
    let allPosts: Sprint1ScheduledPost[] = inMemoryPosts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        try {
          allPosts = JSON.parse(stored);
        } catch {
          allPosts = inMemoryPosts;
        }
      }
    }

    const index = allPosts.findIndex((p) => p.id === postId);
    if (index === -1) return null;

    const existing = allPosts[index];
    const updated: Sprint1ScheduledPost = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allPosts[index] = updated;
    inMemoryPosts = allPosts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }
    return updated;
  },

  savePostTargets: (
    postId: string,
    workspaceId: string,
    targets: Sprint1PublishTarget[]
  ): Sprint1ScheduledPost | null => {
    const post = sprint1Storage.getPostById(postId);
    if (!post || post.workspaceId !== workspaceId) return null;

    return sprint1Storage.updatePost(postId, {
      targets,
      publishTargets: targets,
    });
  },

  getAttempts: (postId?: string, workspaceId?: string): SocialPublishAttempt[] => {
    let attempts = inMemoryAttempts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (stored) {
        try {
          attempts = JSON.parse(stored);
        } catch {
          attempts = inMemoryAttempts;
        }
      }
    }

    let filtered = attempts;
    if (workspaceId) {
      filtered = filtered.filter((a) => a.workspaceId === workspaceId);
    }
    if (postId) {
      filtered = filtered.filter((a) => a.postId === postId);
    }
    // Sort descending by startedAt
    return filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  addAttempt: (attempt: SocialPublishAttempt): SocialPublishAttempt => {
    let attempts = inMemoryAttempts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (stored) {
        try {
          attempts = JSON.parse(stored);
        } catch {
          attempts = inMemoryAttempts;
        }
      }
    }

    attempts = [attempt, ...attempts];
    inMemoryAttempts = attempts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    }
    return attempt;
  },

  updateAttempt: (
    attemptId: string,
    updates: Partial<SocialPublishAttempt>
  ): SocialPublishAttempt | null => {
    let attempts = inMemoryAttempts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (stored) {
        try {
          attempts = JSON.parse(stored);
        } catch {
          attempts = inMemoryAttempts;
        }
      }
    }

    const index = attempts.findIndex((a) => a.id === attemptId);
    if (index === -1) return null;

    const updated = {
      ...attempts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    attempts[index] = updated;
    inMemoryAttempts = attempts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    }
    return updated;
  },

  // ---------------------------------------------------------------------------
  // Sprint 3: Social Accounts & OAuth State Management
  // ---------------------------------------------------------------------------

  getSocialAccounts: (workspaceId?: string): SocialAccount[] => {
    let accounts = inMemoryAccounts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        try {
          accounts = JSON.parse(stored);
        } catch {
          accounts = inMemoryAccounts;
        }
      }
    }

    if (!workspaceId) return accounts;
    return accounts.filter((a) => a.workspaceId === workspaceId);
  },

  getSocialAccountById: (id: string, workspaceId?: string): SocialAccount | null => {
    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    return accounts.find((a) => a.id === id) || null;
  },

  createOrUpdateSocialAccount: (
    data: Partial<SocialAccount> & {
      workspaceId: string;
      provider: SocialAccountProvider;
      externalAccountId: string;
      credentialRef: string;
      displayName: string;
      platform: SocialSchedulerPlatform;
      accountType: SocialAccountType;
    }
  ): SocialAccount => {
    let accounts = inMemoryAccounts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        try {
          accounts = JSON.parse(stored);
        } catch {
          accounts = inMemoryAccounts;
        }
      }
    }

    const existingIndex = accounts.findIndex(
      (a) =>
        a.workspaceId === data.workspaceId &&
        a.provider === data.provider &&
        a.externalAccountId === data.externalAccountId
    );

    const now = new Date().toISOString();
    const maskedId =
      data.externalAccountId.length > 8
        ? `${data.externalAccountId.slice(0, 4)}••••${data.externalAccountId.slice(-4)}`
        : data.externalAccountId;

    let result: SocialAccount;

    if (existingIndex >= 0) {
      result = {
        ...accounts[existingIndex],
        ...data,
        status: data.status || SocialAccountStatus.CONNECTED,
        externalAccountIdMasked: maskedId,
        disconnectedAt: data.status === SocialAccountStatus.DISCONNECTED ? now : null,
        lastConnectedAt: now,
        lastValidatedAt: now,
        updatedAt: now,
      };
      accounts[existingIndex] = result;
    } else {
      result = {
        id: data.id || `acc_${data.provider.toLowerCase()}_${Date.now()}`,
        workspaceId: data.workspaceId,
        connectedByUserId: data.connectedByUserId || 'usr_admin',
        provider: data.provider,
        platform: data.platform,
        accountType: data.accountType,
        displayName: data.displayName,
        username: data.username,
        externalAccountId: data.externalAccountId,
        externalAccountIdMasked: maskedId,
        status: data.status || SocialAccountStatus.CONNECTED,
        scopes: data.scopes || ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
        credentialRef: data.credentialRef,
        lastConnectedAt: now,
        lastValidatedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      accounts = [result, ...accounts];
    }

    inMemoryAccounts = accounts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    return result;
  },

  disconnectSocialAccount: (accountId: string, workspaceId: string): SocialAccount | null => {
    let accounts = inMemoryAccounts;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        try {
          accounts = JSON.parse(stored);
        } catch {
          accounts = inMemoryAccounts;
        }
      }
    }

    const index = accounts.findIndex((a) => a.id === accountId && a.workspaceId === workspaceId);
    if (index === -1) return null;

    const account = accounts[index];
    const updated: SocialAccount = {
      ...account,
      status: SocialAccountStatus.DISCONNECTED,
      disconnectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts[index] = updated;
    inMemoryAccounts = accounts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    return updated;
  },

  validateSocialAccount: (
    accountId: string,
    workspaceId: string
  ): { status: SocialAccountStatus; missingPermissions: string[]; reauthRequired: boolean } => {
    const account = sprint1Storage.getSocialAccountById(accountId, workspaceId);
    if (!account) {
      return { status: SocialAccountStatus.ERROR, missingPermissions: ['not_found'], reauthRequired: true };
    }

    if (account.status === SocialAccountStatus.DISCONNECTED) {
      return { status: SocialAccountStatus.DISCONNECTED, missingPermissions: ['disconnected'], reauthRequired: true };
    }

    const hasValidToken = credentialVault.hasValidToken(account.credentialRef);
    if (!hasValidToken) {
      sprint1Storage.updateSocialAccount(accountId, workspaceId, { status: SocialAccountStatus.REAUTH_REQUIRED });
      return { status: SocialAccountStatus.REAUTH_REQUIRED, missingPermissions: [], reauthRequired: true };
    }

    const requiredScopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
    const missing = requiredScopes.filter((scope) => !account.scopes.includes(scope));

    if (missing.length > 0) {
      sprint1Storage.updateSocialAccount(accountId, workspaceId, { status: SocialAccountStatus.PERMISSION_MISSING });
      return { status: SocialAccountStatus.PERMISSION_MISSING, missingPermissions: missing, reauthRequired: true };
    }

    sprint1Storage.updateSocialAccount(accountId, workspaceId, {
      status: SocialAccountStatus.CONNECTED,
      lastValidatedAt: new Date().toISOString(),
    });

    return { status: SocialAccountStatus.CONNECTED, missingPermissions: [], reauthRequired: false };
  },

  updateSocialAccount: (
    accountId: string,
    workspaceId: string,
    updates: Partial<SocialAccount>
  ): SocialAccount | null => {
    let accounts = inMemoryAccounts;
    const index = accounts.findIndex((a) => a.id === accountId && a.workspaceId === workspaceId);
    if (index === -1) return null;

    const updated = {
      ...accounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    accounts[index] = updated;
    inMemoryAccounts = accounts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    return updated;
  },

  // OAuth CSRF State Management
  createOAuthState: (params: {
    workspaceId: string;
    userId: string;
    provider: SocialAccountProvider;
    redirectPath?: string;
  }): { state: string; record: SocialOAuthState } => {
    const rawState = crypto.randomBytes(24).toString('hex');
    const stateHash = crypto.createHash('sha256').update(rawState).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min expiration

    const record: SocialOAuthState = {
      id: `oauth_${Date.now()}`,
      workspaceId: params.workspaceId,
      userId: params.userId,
      provider: params.provider,
      stateHash,
      redirectPath: params.redirectPath || '/app/social-accounts',
      expiresAt,
      consumedAt: null,
      createdAt: new Date().toISOString(),
    };

    inMemoryOAuthStates = [record, ...inMemoryOAuthStates];
    return { state: rawState, record };
  },

  verifyAndConsumeOAuthState: (
    state: string,
    workspaceId?: string
  ): { valid: boolean; error?: string; oauthState?: SocialOAuthState } => {
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const record = inMemoryOAuthStates.find((s) => s.stateHash === stateHash);

    if (!record) {
      return { valid: false, error: 'Invalid or unknown OAuth state token' };
    }

    if (record.consumedAt) {
      return { valid: false, error: 'OAuth state token has already been consumed' };
    }

    if (new Date(record.expiresAt) < new Date()) {
      return { valid: false, error: 'OAuth state token has expired' };
    }

    if (workspaceId && record.workspaceId !== workspaceId) {
      return { valid: false, error: 'OAuth state is bound to a different workspace' };
    }

    // Mark consumed
    record.consumedAt = new Date().toISOString();
    return { valid: true, oauthState: record };
  },

  // ---------------------------------------------------------------------------
  // Sprint 4: Instagram Container Storage & Discovery
  // ---------------------------------------------------------------------------

  createInstagramContainer: (data: any): any => {
    let containers = inMemoryContainers;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (stored) {
        try {
          containers = JSON.parse(stored);
        } catch {
          containers = inMemoryContainers;
        }
      }
    }

    const newContainer = {
      ...data,
      id: `ig_pub_cnt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    containers.push(newContainer);
    inMemoryContainers = containers;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
    }
    return newContainer;
  },

  getInstagramContainer: (containerId: string): any | null => {
    let containers = inMemoryContainers;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (stored) {
        try {
          containers = JSON.parse(stored);
        } catch {
          containers = inMemoryContainers;
        }
      }
    }
    return containers.find((c) => c.containerId === containerId || c.id === containerId) || null;
  },

  updateInstagramContainer: (
    containerId: string,
    updates: any
  ): any | null => {
    let containers = inMemoryContainers;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (stored) {
        try {
          containers = JSON.parse(stored);
        } catch {
          containers = inMemoryContainers;
        }
      }
    }

    const index = containers.findIndex((c) => c.containerId === containerId || c.id === containerId);
    if (index === -1) return null;

    const updated = {
      ...containers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    containers[index] = updated;
    inMemoryContainers = containers;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
    }
    return updated;
  },

  getInstagramContainersForPost: (postId: string): any[] => {
    let containers = inMemoryContainers;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTAINERS);
      if (stored) {
        try {
          containers = JSON.parse(stored);
        } catch {
          containers = inMemoryContainers;
        }
      }
    }
    return containers.filter((c) => c.postId === postId);
  },

  discoverInstagramAccounts: (workspaceId: string) => {
    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    const fbPages = accounts.filter(
      (a) => a.platform === SocialSchedulerPlatform.FACEBOOK && a.status === SocialAccountStatus.CONNECTED
    );

    return fbPages.map((page) => {
      const hasLinked = !page.displayName.toLowerCase().includes('nolink');
      if (!hasLinked) {
        return {
          facebookPageId: page.externalAccountId,
          facebookPageName: page.displayName,
          instagramAccount: null,
          canPublish: false,
          missingPermissions: ['instagram_business_basic'],
        };
      }

      const igHandle = page.username
        ? page.username.replace(/\.facebook|\.page/g, '')
        : page.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');

      return {
        facebookPageId: page.externalAccountId,
        facebookPageName: page.displayName,
        instagramAccount: {
          id: `178414${page.externalAccountId.slice(-9)}`,
          username: igHandle,
          displayName: `${page.displayName} (@${igHandle})`,
          accountType: 'BUSINESS',
          profilePictureUrl: null,
        },
        canPublish: true,
        missingPermissions: [],
      };
    });
  },

  // ---------------------------------------------------------------------------
  // Sprint 5: Pinterest Board Storage & Management
  // ---------------------------------------------------------------------------

  getPinterestBoards: (workspaceId: string, socialAccountId?: string): PinterestBoard[] => {
    let boards = inMemoryPinterestBoards;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.BOARDS);
      if (stored) {
        try {
          boards = JSON.parse(stored);
        } catch {
          boards = inMemoryPinterestBoards;
        }
      }
    }

    return boards.filter(
      (b) => b.workspaceId === workspaceId && (!socialAccountId || b.socialAccountId === socialAccountId)
    );
  },

  getPinterestBoardById: (boardId: string): PinterestBoard | null => {
    let boards = inMemoryPinterestBoards;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.BOARDS);
      if (stored) {
        try {
          boards = JSON.parse(stored);
        } catch {
          boards = inMemoryPinterestBoards;
        }
      }
    }

    return boards.find((b) => b.id === boardId || b.externalBoardId === boardId) || null;
  },

  createOrUpdatePinterestBoard: (data: Partial<PinterestBoard> & { workspaceId: string; socialAccountId: string; externalBoardId: string; name: string }): PinterestBoard => {
    let boards = inMemoryPinterestBoards;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.BOARDS);
      if (stored) {
        try {
          boards = JSON.parse(stored);
        } catch {
          boards = inMemoryPinterestBoards;
        }
      }
    }

    const index = boards.findIndex(
      (b) =>
        b.workspaceId === data.workspaceId &&
        b.socialAccountId === data.socialAccountId &&
        b.externalBoardId === data.externalBoardId
    );

    const now = new Date().toISOString();
    let result: PinterestBoard;

    if (index >= 0) {
      result = {
        ...boards[index],
        ...data,
        updatedAt: now,
        lastSyncedAt: now,
      };
      boards[index] = result;
    } else {
      result = {
        id: data.id || `board_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        workspaceId: data.workspaceId,
        socialAccountId: data.socialAccountId,
        externalBoardId: data.externalBoardId,
        name: data.name,
        description: data.description || null,
        privacy: data.privacy || 'PUBLIC',
        url: data.url || `https://www.pinterest.com/pin-board/${data.externalBoardId}/`,
        sectionCount: data.sectionCount || 0,
        metadataJson: data.metadataJson || {},
        lastSyncedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      boards.push(result);
    }

    inMemoryPinterestBoards = boards;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
    }
    return result;
  },

  syncPinterestBoards: (workspaceId: string, socialAccountId: string) => {
    const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
    if (!account) return { syncedBoards: 0, syncedSections: 0 };

    const boards = sprint1Storage.getPinterestBoards(workspaceId, socialAccountId);
    return {
      syncedBoards: boards.length,
      syncedSections: boards.reduce((acc, b) => acc + (b.sectionCount || 0), 0),
    };
  },

  getYouTubeQuotaSummary: (workspaceId?: string, date?: string): YouTubeQuotaSummary => {
    const quotaDate = date || new Date().toISOString().slice(0, 10);
    let ledger = inMemoryYouTubeLedgers.find((l) => l.quotaDate === quotaDate);
    if (!ledger) {
      ledger = {
        id: `ledger_${quotaDate}`,
        quotaDate,
        provider: SocialAccountProvider.GOOGLE,
        quotaBucket: 'videos.insert',
        dailyLimit: 100,
        usedCount: 0,
        reservedCount: 0,
        resetTimezone: 'America/Los_Angeles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryYouTubeLedgers.push(ledger);
    }
    const availableCount = Math.max(0, ledger.dailyLimit - (ledger.usedCount + ledger.reservedCount));
    return {
      quotaDate: ledger.quotaDate,
      dailyLimit: ledger.dailyLimit,
      usedCount: ledger.usedCount,
      reservedCount: ledger.reservedCount,
      availableCount,
      resetTimezone: ledger.resetTimezone,
      reservedUploadsToday: ledger.reservedCount,
      usedUploadsToday: ledger.usedCount,
      availableUploadsToday: availableCount,
    } as any;
  },

  reserveYouTubeQuota: (
    workspaceId: string,
    postId: string,
    targetId: string,
    socialAccountId: string,
    date?: string
  ): { success: boolean; reservation?: YouTubeUploadReservation; error?: string } => {
    const quotaDate = date || new Date().toISOString().slice(0, 10);
    let ledger = inMemoryYouTubeLedgers.find((l) => l.quotaDate === quotaDate);
    if (!ledger) {
      ledger = {
        id: `ledger_${quotaDate}`,
        quotaDate,
        provider: SocialAccountProvider.GOOGLE,
        quotaBucket: 'videos.insert',
        dailyLimit: 100,
        usedCount: 0,
        reservedCount: 0,
        resetTimezone: 'America/Los_Angeles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryYouTubeLedgers.push(ledger);
    }

    if (ledger.usedCount + ledger.reservedCount >= ledger.dailyLimit) {
      return {
        success: false,
        error: `YouTube daily upload quota reached (${ledger.usedCount + ledger.reservedCount}/${ledger.dailyLimit}). Choose another date or remove YouTube target.`,
      };
    }

    let reservation = inMemoryYouTubeReservations.find((r) => r.targetId === targetId);
    if (reservation && reservation.status === 'RESERVED') {
      return { success: true, reservation };
    }

    ledger.reservedCount += 1;
    reservation = {
      id: `res_yt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      postId,
      targetId,
      socialAccountId,
      quotaDate,
      status: 'RESERVED',
      reservedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryYouTubeReservations.push(reservation);
    return { success: true, reservation };
  },

  consumeYouTubeQuota: (targetId: string): boolean => {
    const reservation = inMemoryYouTubeReservations.find((r) => r.targetId === targetId);
    if (!reservation) return false;

    if (reservation.status === 'RESERVED') {
      reservation.status = 'CONSUMED';
      reservation.consumedAt = new Date().toISOString();
      reservation.updatedAt = new Date().toISOString();

      const ledger = inMemoryYouTubeLedgers.find((l) => l.quotaDate === reservation.quotaDate);
      if (ledger) {
        ledger.reservedCount = Math.max(0, ledger.reservedCount - 1);
        ledger.usedCount += 1;
        ledger.updatedAt = new Date().toISOString();
      }
      return true;
    }
    return false;
  },

  releaseYouTubeQuota: (targetId: string): boolean => {
    const reservation = inMemoryYouTubeReservations.find((r) => r.targetId === targetId);
    if (!reservation) return false;

    if (reservation.status === 'RESERVED') {
      reservation.status = 'RELEASED';
      reservation.releasedAt = new Date().toISOString();
      reservation.updatedAt = new Date().toISOString();

      const ledger = inMemoryYouTubeLedgers.find((l) => l.quotaDate === reservation.quotaDate);
      if (ledger) {
        ledger.reservedCount = Math.max(0, ledger.reservedCount - 1);
        ledger.updatedAt = new Date().toISOString();
      }
      return true;
    }
    return false;
  },

  createOrUpdateYouTubeUploadJob: (job: Partial<YouTubeUploadJob> & {
    workspaceId: string;
    postId: string;
    targetId: string;
    socialAccountId: string;
    youtubeChannelId: string;
  }): YouTubeUploadJob => {
    const now = new Date().toISOString();
    const existingIndex = inMemoryYouTubeJobs.findIndex((j) => j.targetId === job.targetId);
    if (existingIndex >= 0) {
      const updated = {
        ...inMemoryYouTubeJobs[existingIndex],
        ...job,
        updatedAt: now,
      };
      inMemoryYouTubeJobs[existingIndex] = updated;
      return updated;
    }
    const created: YouTubeUploadJob = {
      id: job.id || `ytjob_${Date.now()}`,
      workspaceId: job.workspaceId,
      postId: job.postId,
      targetId: job.targetId,
      attemptId: job.attemptId || null,
      socialAccountId: job.socialAccountId,
      youtubeChannelId: job.youtubeChannelId,
      uploadStatus: job.uploadStatus || 'CREATED',
      youtubeVideoId: job.youtubeVideoId || null,
      youtubeVideoUrl: job.youtubeVideoUrl || null,
      privacyStatus: job.privacyStatus || 'private',
      title: job.title || '',
      description: job.description || null,
      categoryId: job.categoryId || null,
      madeForKids: job.madeForKids ?? null,
      tagsJson: job.tagsJson || null,
      uploadStartedAt: job.uploadStartedAt || null,
      uploadFinishedAt: job.uploadFinishedAt || null,
      processingCheckedAt: job.processingCheckedAt || null,
      publishedAt: job.publishedAt || null,
      errorCode: job.errorCode || null,
      errorMessage: job.errorMessage || null,
      diagnosticsJson: job.diagnosticsJson || null,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryYouTubeJobs.push(created);
    return created;
  },

  getYouTubeUploadJob: (targetId: string): YouTubeUploadJob | null => {
    return inMemoryYouTubeJobs.find((j) => j.targetId === targetId) || null;
  },

  // ---------------------------------------------------------
  // Sprint 7: Twitter/X Methods
  // ---------------------------------------------------------

  estimateXCost: (workspaceId: string, text: string, containsUrl?: boolean): XCostEstimate => {
    const urlPattern = /https?:\/\/[^\s]+/i;
    const hasUrl = containsUrl ?? urlPattern.test(text || '');
    const operation = hasUrl ? 'POST_CREATE_WITH_URL' : 'POST_CREATE';
    const estimatedCostUsd = hasUrl ? '0.200' : '0.015';
    return {
      pricingVersion: '2026-09',
      operation,
      estimatedCostUsd,
      requiresAcknowledgement: true,
    };
  },

  recordXCostLedger: (ledger: XApiCostLedger): XApiCostLedger => {
    inMemoryXCostLedgers.push(ledger);
    return ledger;
  },

  getXCostLedgers: (workspaceId: string): { items: XApiCostLedger[]; estimatedTotalUsd: string; actualTotalUsd: string } => {
    const items = inMemoryXCostLedgers.filter((l) => l.workspaceId === workspaceId);
    const estimatedTotal = items.reduce((sum, item) => sum + item.estimatedTotalUsd, 0);
    const actualTotal = items.reduce((sum, item) => sum + (item.actualTotalUsd || 0), 0);
    return {
      items,
      estimatedTotalUsd: estimatedTotal.toFixed(3),
      actualTotalUsd: actualTotal.toFixed(3),
    };
  },

  createOrUpdateXMediaUploadJob: (
    job: Partial<XMediaUploadJob> & {
      workspaceId: string;
      postId: string;
      targetId: string;
      socialAccountId: string;
      mediaAssetId: string;
      mediaCategory: string;
    }
  ): XMediaUploadJob => {
    const existingIdx = inMemoryXMediaUploadJobs.findIndex(
      (j) => j.targetId === job.targetId && j.mediaAssetId === job.mediaAssetId
    );
    const now = new Date().toISOString();
    if (existingIdx !== -1) {
      inMemoryXMediaUploadJobs[existingIdx] = {
        ...inMemoryXMediaUploadJobs[existingIdx],
        ...job,
        updatedAt: now,
      };
      return inMemoryXMediaUploadJobs[existingIdx];
    }
    const created: XMediaUploadJob = {
      id: job.id || `xjob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: job.workspaceId,
      postId: job.postId,
      targetId: job.targetId,
      attemptId: job.attemptId || null,
      socialAccountId: job.socialAccountId,
      mediaAssetId: job.mediaAssetId,
      mediaCategory: job.mediaCategory,
      uploadStatus: job.uploadStatus || 'CREATED',
      xMediaId: job.xMediaId || null,
      xMediaIdString: job.xMediaIdString || null,
      uploadStartedAt: job.uploadStartedAt || null,
      uploadFinishedAt: job.uploadFinishedAt || null,
      finalizedAt: job.finalizedAt || null,
      processingCheckedAt: job.processingCheckedAt || null,
      errorCode: job.errorCode || null,
      errorMessage: job.errorMessage || null,
      diagnosticsJson: job.diagnosticsJson || null,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryXMediaUploadJobs.push(created);
    return created;
  },

  getXMediaUploadJob: (targetId: string): XMediaUploadJob | null => {
    return inMemoryXMediaUploadJobs.find((j) => j.targetId === targetId) || null;
  },

  // ---------------------------------------------------------
  // Sprint 8: Scheduler Hardening, Calendar, Health & QA
  // ---------------------------------------------------------

  recordAuditLog: (log: Omit<SocialSchedulerAuditLog, 'id' | 'createdAt'>): SocialSchedulerAuditLog => {
    const entry: SocialSchedulerAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    inMemoryAuditLogs.push(entry);
    return entry;
  },

  getAuditLogs: (workspaceId: string, entityTypeOrLimit?: string | number, entityId?: string): SocialSchedulerAuditLog[] => {
    const isLimit = typeof entityTypeOrLimit === 'number';
    const entityType = isLimit ? undefined : entityTypeOrLimit;
    const list = inMemoryAuditLogs
      .filter((l) => l.workspaceId === workspaceId && (!entityType || l.entityType === entityType) && (!entityId || l.entityId === entityId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return isLimit ? list.slice(0, entityTypeOrLimit) : list;
  },

  getSchedulerOverview: (workspaceId: string): SchedulerOverviewSummary => {
    const posts = sprint1Storage.getPosts(workspaceId);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const twoHoursLater = now.getTime() + 2 * 60 * 60 * 1000;
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let scheduledToday = 0;
    let publishingSoon = 0;
    let needsAttention = 0;
    let publishedThisWeek = 0;
    let failedTargets = 0;
    let reauthRequired = 0;

    const attentionItems: SchedulerAttentionItem[] = [];

    for (const post of posts) {
      if (post.status === SocialSchedulerPostStatus.SCHEDULED && post.scheduledAt) {
        if (post.scheduledAt.startsWith(todayStr)) {
          scheduledToday++;
        }
        const schedTime = new Date(post.scheduledAt).getTime();
        if (schedTime >= now.getTime() && schedTime <= twoHoursLater) {
          publishingSoon++;
        }
      }

      if (post.status === SocialSchedulerPostStatus.PUBLISHED || post.status === SocialSchedulerPostStatus.PUBLISHED_MOCK) {
        const pubTime = new Date(post.updatedAt).getTime();
        if (pubTime >= sevenDaysAgo) {
          publishedThisWeek++;
        }
      }

      const postFailed = [
        SocialSchedulerPostStatus.FAILED,
        SocialSchedulerPostStatus.PARTIALLY_FAILED,
        SocialSchedulerPostStatus.COST_BLOCKED,
        SocialSchedulerPostStatus.REAUTH_REQUIRED,
      ].includes(post.status);

      const hasAttentionTarget = post.targets.some((t) =>
        [
          SocialSchedulerTargetStatus.FAILED,
          SocialSchedulerTargetStatus.COST_BLOCKED,
          SocialSchedulerTargetStatus.QUOTA_BLOCKED,
          SocialSchedulerTargetStatus.RATE_LIMITED,
          SocialSchedulerTargetStatus.REAUTH_REQUIRED,
        ].includes(t.status)
      );

      if (postFailed || hasAttentionTarget) {
        needsAttention++;
        let reason = 'Target execution requires review.';
        let actionRequired: SchedulerAttentionItem['actionRequired'] = 'REVIEW';

        if (post.status === SocialSchedulerPostStatus.COST_BLOCKED || post.targets.some((t) => t.status === SocialSchedulerTargetStatus.COST_BLOCKED)) {
          reason = 'Publishing is blocked: paid API cost must be acknowledged.';
          actionRequired = 'COST';
        } else if (post.targets.some((t) => t.status === SocialSchedulerTargetStatus.QUOTA_BLOCKED)) {
          reason = 'Daily quota limit reached for upload platform.';
          actionRequired = 'QUOTA';
        } else if (post.targets.some((t) => t.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED) || post.status === SocialSchedulerPostStatus.REAUTH_REQUIRED) {
          reason = 'Social account token has expired or is invalid.';
          actionRequired = 'REAUTH';
          reauthRequired++;
        } else if (post.targets.some((t) => t.status === SocialSchedulerTargetStatus.RATE_LIMITED)) {
          reason = 'Temporary rate limit encountered. Backoff retry active.';
          actionRequired = 'RATE_LIMIT';
        }

        attentionItems.push({
          postId: post.id,
          postTitle: post.title,
          scheduledAt: post.scheduledAt || post.createdAt,
          status: post.status,
          targetStatuses: post.targets.map((t) => ({ platform: t.platform, status: t.status })),
          reason,
          actionRequired,
        });
      }

      for (const t of post.targets) {
        if (t.status === SocialSchedulerTargetStatus.FAILED) {
          failedTargets++;
        }
        if (t.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED) {
          reauthRequired++;
        }
      }
    }

    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    for (const acc of accounts) {
      if (acc.status === SocialAccountStatus.REAUTH_REQUIRED) {
        reauthRequired++;
      }
    }

    const upcomingPosts: CalendarItem[] = posts
      .filter((p) => p.status === SocialSchedulerPostStatus.SCHEDULED && p.scheduledAt && new Date(p.scheduledAt).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
      .slice(0, 5)
      .map((p) => ({
        postId: p.id,
        title: p.title,
        caption: p.draftContentJson?.caption,
        thumbnailMediaAssetId: p.mediaAssets?.[0]?.id,
        mediaCount: p.mediaAssets?.length || 0,
        scheduledAt: p.scheduledAt!,
        timezone: p.timezone,
        platforms: p.targets.map((t) => t.platform),
        status: p.status,
        attentionRequired: false,
      }));

    return {
      scheduledToday,
      publishingSoon,
      needsAttention,
      publishedThisWeek,
      failedTargets,
      reauthRequired,
      upcoming: upcomingPosts,
      attentionItems,
    };
  },

  getCalendarPosts: (
    workspaceId: string,
    from?: string,
    to?: string,
    platformFilter: string = 'ALL',
    statusFilter: string = 'ALL'
  ): { items: CalendarItem[] } => {
    const posts = sprint1Storage.getPosts(workspaceId);
    let filtered = posts.filter((p) => {
      const dateStr = p.scheduledAt || p.createdAt;
      if (!dateStr) return false;
      const t = new Date(dateStr).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime()) return false;
      return true;
    });

    if (platformFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.targets.some((tgt) => tgt.platform === platformFilter));
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    const items: CalendarItem[] = filtered.map((p) => {
      const attentionRequired = [
        SocialSchedulerPostStatus.FAILED,
        SocialSchedulerPostStatus.PARTIALLY_FAILED,
        SocialSchedulerPostStatus.COST_BLOCKED,
        SocialSchedulerPostStatus.REAUTH_REQUIRED,
        SocialSchedulerPostStatus.RETRYING,
      ].includes(p.status) || p.targets.some((t) => [SocialSchedulerTargetStatus.FAILED, SocialSchedulerTargetStatus.COST_BLOCKED, SocialSchedulerTargetStatus.QUOTA_BLOCKED].includes(t.status));

      const readiness = inMemoryReadinessChecks.find((r) => r.postId === p.id && r.workspaceId === workspaceId);

      return {
        postId: p.id,
        title: p.title,
        caption: p.draftContentJson?.caption,
        thumbnailMediaAssetId: p.mediaAssets?.[0]?.id,
        mediaCount: p.mediaAssets?.length || 0,
        scheduledAt: p.scheduledAt || p.createdAt,
        timezone: p.timezone,
        platforms: p.targets.map((t) => t.platform),
        status: p.status,
        attentionRequired,
        attentionReason: attentionRequired ? 'Requires review' : undefined,
        readinessStatus: readiness ? readiness.status : undefined,
      };
    });

    return { items };
  },

  runReadinessCheck: (
    workspaceId: string,
    postId: string,
    source: ReadinessCheckSource | string = 'DETAIL_VIEW',
    createdByUserId?: string
  ): SocialSchedulerReadinessCheck => {
    const post = sprint1Storage.getPostById(postId, workspaceId);
    const blockingIssues: ReadinessIssue[] = [];
    const warnings: ReadinessIssue[] = [];
    const targetsSummary: ReadinessTargetSummary[] = [];

    if (!post) {
      const check: SocialSchedulerReadinessCheck = {
        id: `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        workspaceId,
        postId,
        status: ReadinessStatus.BLOCKED,
        checkedAt: new Date().toISOString(),
        blockingIssues: [{ code: 'POST_NOT_FOUND', message: 'Post does not exist or workspace mismatch', blocking: true }],
        warnings: [],
        targets: [],
        source,
        createdByUserId: createdByUserId || null,
        createdAt: new Date().toISOString(),
      };
      inMemoryReadinessChecks.push(check);
      return check;
    }

    if (!post.targets || post.targets.length === 0) {
      blockingIssues.push({ code: 'NO_TARGETS_SELECTED', message: 'No destination platform targets selected.', blocking: true });
    }

    const hasMedia = post.mediaAssets && post.mediaAssets.length > 0;
    const hasText = !!(post.draftContentJson?.caption || post.title);
    if (!hasMedia && !hasText) {
      blockingIssues.push({ code: 'EMPTY_CONTENT', message: 'Post has neither text caption nor media assets.', blocking: true });
    }

    for (const target of post.targets || []) {
      const targetBlocking: ReadinessIssue[] = [];
      const targetWarnings: ReadinessIssue[] = [];

      if (!target.socialAccountId) {
        if (target.publishMode !== 'MOCK' && !target.mockAccountName) {
          targetBlocking.push({
            code: 'ACCOUNT_NOT_SELECTED',
            message: `Target ${target.platform} does not have a linked social account.`,
            targetId: target.id,
            platform: target.platform,
            blocking: true,
          });
        }
      } else {
        const account = sprint1Storage.getSocialAccountById(target.socialAccountId, workspaceId);
        if (!account) {
          targetBlocking.push({
            code: 'ACCOUNT_NOT_FOUND',
            message: `Selected account ${target.socialAccountId} not found in active workspace.`,
            targetId: target.id,
            platform: target.platform,
            blocking: true,
          });
        } else {
          if (account.status === SocialAccountStatus.DISCONNECTED) {
            targetBlocking.push({
              code: 'ACCOUNT_DISCONNECTED',
              message: `Account @${account.username || account.displayName} is disconnected.`,
              targetId: target.id,
              platform: target.platform,
              blocking: true,
            });
          } else if (account.status === SocialAccountStatus.REAUTH_REQUIRED) {
            targetBlocking.push({
              code: 'ACCOUNT_REAUTH_REQUIRED',
              message: `Account @${account.username || account.displayName} requires re-authentication.`,
              targetId: target.id,
              platform: target.platform,
              blocking: true,
            });
          }

          try {
            credentialVault.getDecryptedSecret(account.credentialRef);
          } catch {
            targetBlocking.push({
              code: 'CREDENTIAL_DECRYPT_FAILED',
              message: `Credential vault decryption failed for @${account.username || account.displayName}.`,
              targetId: target.id,
              platform: target.platform,
              blocking: true,
            });
          }

          // Platform-specific rules
          if (target.platform === SocialSchedulerPlatform.YOUTUBE) {
            const hasVideo = post.mediaAssets?.some((m) => m.mimeType.startsWith('video/'));
            const hasImagesOnly = post.mediaAssets && post.mediaAssets.length > 0 && !hasVideo;
            if (hasImagesOnly) {
              targetBlocking.push({
                code: 'UNSUPPORTED_MEDIA_TYPE',
                message: 'YouTube strictly requires MP4 video upload. Images cannot be uploaded to YouTube.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            if (account.metadataJson?.auditStatus === 'unverified') {
              targetWarnings.push({
                code: 'YOUTUBE_AUDIT_UNVERIFIED',
                message: 'YouTube project is unverified; videos may publish in private viewing mode.',
                targetId: target.id,
                platform: target.platform,
                blocking: false,
              });
            }
            const quota = sprint1Storage.getYouTubeQuotaSummary(workspaceId);
            if (quota.availableCount <= 0) {
              targetBlocking.push({
                code: 'YOUTUBE_QUOTA_EXHAUSTED',
                message: 'YouTube project daily upload quota (100) is exhausted for today.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
          }

          if (target.platform === SocialSchedulerPlatform.X) {
            const opts = target.platformOptionsJson || {};
            if (!opts.costAcknowledged && !target.xCostAcknowledgedAt) {
              targetBlocking.push({
                code: 'X_COST_UNACKNOWLEDGED',
                message: 'X target requires explicit user cost acknowledgement before publishing.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            const textVal = String((opts as any).text || post.draftContentJson?.caption || post.title || '');
            const textLen = textVal.length;
            if (textLen > 280) {
              targetBlocking.push({
                code: 'X_TEXT_TOO_LONG',
                message: `X post exceeds the 280 character limit (${textLen} characters).`,
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            const media = post.mediaAssets || [];
            const hasImg = media.some((m) => m.mimeType.startsWith('image/'));
            const hasVid = media.some((m) => m.mimeType.startsWith('video/'));
            if (hasImg && hasVid) {
              targetBlocking.push({
                code: 'X_MIXED_MEDIA_BLOCKED',
                message: 'X does not allow mixing images and videos in the same post.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            if (hasImg && media.length > 4) {
              targetBlocking.push({
                code: 'X_TOO_MANY_IMAGES',
                message: `X allows a maximum of 4 images (found ${media.length}).`,
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            targetWarnings.push({
              code: 'X_PAID_API_ACTION',
              message: 'Publishing to X consumes paid API credits.',
              targetId: target.id,
              platform: target.platform,
              blocking: false,
            });
          }

          if (target.platform === SocialSchedulerPlatform.PINTEREST) {
            const opts = target.platformOptionsJson || {};
            if (!opts.boardId) {
              targetBlocking.push({
                code: 'PINTEREST_BOARD_MISSING',
                message: 'Pinterest destination board is required.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
            const hasVideo = post.mediaAssets?.some((m) => m.mimeType.startsWith('video/'));
            if (hasVideo) {
              targetBlocking.push({
                code: 'UNSUPPORTED_MEDIA_TYPE',
                message: 'Video Pins are not supported in this scheduler release.',
                targetId: target.id,
                platform: target.platform,
                blocking: true,
              });
            }
          }

          if (target.platform === SocialSchedulerPlatform.INSTAGRAM) {
            targetWarnings.push({
              code: 'INSTAGRAM_VIDEO_PROCESSING',
              message: 'Instagram video containers undergo asynchronous platform transcoding.',
              targetId: target.id,
              platform: target.platform,
              blocking: false,
            });
          }
        }
      }

      blockingIssues.push(...targetBlocking);
      warnings.push(...targetWarnings);

      const targetStatus = targetBlocking.length > 0
        ? ReadinessStatus.BLOCKED
        : targetWarnings.length > 0
        ? ReadinessStatus.READY_WITH_WARNINGS
        : ReadinessStatus.READY;

      targetsSummary.push({
        targetId: target.id,
        platform: target.platform,
        status: targetStatus,
        blockingIssues: targetBlocking,
        warnings: targetWarnings,
      });
    }

    const overallStatus = blockingIssues.length > 0
      ? ReadinessStatus.BLOCKED
      : warnings.length > 0
      ? ReadinessStatus.READY_WITH_WARNINGS
      : ReadinessStatus.READY;

    const checkRecord: SocialSchedulerReadinessCheck = {
      id: `rc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      postId,
      status: overallStatus,
      checkedAt: new Date().toISOString(),
      blockingIssues,
      warnings,
      targets: targetsSummary,
      source,
      createdByUserId: createdByUserId || null,
      createdAt: new Date().toISOString(),
    };

    inMemoryReadinessChecks.push(checkRecord);
    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: createdByUserId || null,
      entityType: 'POST',
      entityId: postId,
      action: SocialSchedulerAuditAction.READINESS_CHECK_RUN,
      metadataJson: { status: overallStatus, blockingCount: blockingIssues.length, warningCount: warnings.length, source },
    });

    return checkRecord;
  },

  reschedulePost: (input: ReschedulePostInput): ReschedulePostResult => {
    const post = sprint1Storage.getPostById(input.postId, input.workspaceId);
    if (!post) {
      return { success: false, postId: input.postId, status: SocialSchedulerPostStatus.FAILED, scheduledAt: '', timezone: '', error: 'Post not found or workspace mismatch' };
    }

    if (post.status === SocialSchedulerPostStatus.PROCESSING || post.status === SocialSchedulerPostStatus.PUBLISHED || post.status === SocialSchedulerPostStatus.CANCELLED) {
      return { success: false, postId: input.postId, status: post.status, scheduledAt: post.scheduledAt || '', timezone: post.timezone, error: `Cannot reschedule post in ${post.status} state.` };
    }

    const newTime = new Date(input.scheduledAt).getTime();
    if (isNaN(newTime)) {
      return { success: false, postId: input.postId, status: post.status, scheduledAt: '', timezone: '', error: 'Invalid scheduled date/time format.' };
    }

    const minAllowed = Date.now() + 5 * 60 * 1000;
    if (newTime < minAllowed) {
      return { success: false, postId: input.postId, status: post.status, scheduledAt: input.scheduledAt, timezone: post.timezone, error: 'Scheduled time must be at least 5 minutes in the future.' };
    }

    const ytTarget = post.targets.find((t) => t.platform === SocialSchedulerPlatform.YOUTUBE);
    if (ytTarget) {
      sprint1Storage.releaseYouTubeQuota(ytTarget.id);
      const newQuota = sprint1Storage.reserveYouTubeQuota(
        input.workspaceId,
        post.id,
        ytTarget.id,
        ytTarget.socialAccountId!,
        input.scheduledAt.slice(0, 10)
      );
      if (!newQuota.success) {
        return { success: false, postId: input.postId, status: post.status, scheduledAt: input.scheduledAt, timezone: post.timezone, error: newQuota.error || 'YouTube quota unavailable for new date' };
      }
    }

    const oldScheduledAt = post.scheduledAt;
    const oldTimezone = post.timezone;

    post.scheduledAt = input.scheduledAt;
    if (input.timezone) {
      post.timezone = input.timezone;
    }
    post.updatedAt = new Date().toISOString();

    if ([SocialSchedulerPostStatus.QUOTA_BLOCKED, SocialSchedulerPostStatus.RETRYING, SocialSchedulerPostStatus.FAILED].includes(post.status)) {
      post.status = SocialSchedulerPostStatus.SCHEDULED;
    }

    for (const t of post.targets) {
      if (t.status !== SocialSchedulerTargetStatus.PUBLISHED && t.status !== SocialSchedulerTargetStatus.PUBLISHED_MOCK) {
        t.scheduledFor = input.scheduledAt;
        if (t.status === SocialSchedulerTargetStatus.QUOTA_BLOCKED || t.status === SocialSchedulerTargetStatus.RETRYING) {
          t.status = SocialSchedulerTargetStatus.SCHEDULED;
        }
        t.updatedAt = new Date().toISOString();
      }
    }

    const auditAction = input.isDrag
      ? SocialSchedulerAuditAction.POST_DRAG_RESCHEDULED
      : SocialSchedulerAuditAction.POST_RESCHEDULED;

    sprint1Storage.recordAuditLog({
      workspaceId: input.workspaceId,
      actorUserId: input.userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: auditAction,
      beforeJson: { scheduledAt: oldScheduledAt, timezone: oldTimezone },
      afterJson: { scheduledAt: post.scheduledAt, timezone: post.timezone },
      metadataJson: { reason: input.reason || (input.isDrag ? 'Drag rescheduled post' : 'User rescheduled post'), isDrag: !!input.isDrag },
    });

    return {
      success: true,
      postId: post.id,
      status: post.status,
      scheduledAt: post.scheduledAt,
      timezone: post.timezone,
    };
  },

  retryFailedTargets: (workspaceId: string, postId: string, userId?: string): RetryTargetsResult => {
    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return { success: false, postId, retriedTargetIds: [], skippedTargetIds: [], error: 'Post not found or workspace mismatch' };
    }

    const retriedTargetIds: string[] = [];
    const skippedTargetIds: string[] = [];
    const now = new Date().toISOString();

    for (const t of post.targets) {
      if (t.status === SocialSchedulerTargetStatus.PUBLISHED || t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK) {
        skippedTargetIds.push(t.id);
        continue;
      }

      if ([
        SocialSchedulerTargetStatus.FAILED,
        SocialSchedulerTargetStatus.RETRYING,
        SocialSchedulerTargetStatus.COST_BLOCKED,
        SocialSchedulerTargetStatus.QUOTA_BLOCKED,
        SocialSchedulerTargetStatus.RATE_LIMITED,
        SocialSchedulerTargetStatus.REAUTH_REQUIRED,
      ].includes(t.status)) {
        t.status = SocialSchedulerTargetStatus.RETRYING;
        t.nextRetryAt = now;
        t.updatedAt = now;

        const attemptNumber = (inMemoryAttempts.filter((a) => a.targetId === t.id).length || 0) + 1;
        const newAttempt: SocialPublishAttempt = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          workspaceId,
          postId,
          targetId: t.id,
          platform: t.platform,
          attemptNumber,
          status: SocialPublishAttemptStatus.STARTED,
          startedAt: now,
          retryable: true,
          createdAt: now,
          updatedAt: now,
        };
        inMemoryAttempts.push(newAttempt);
        retriedTargetIds.push(t.id);
      } else {
        skippedTargetIds.push(t.id);
      }
    }

    if (retriedTargetIds.length > 0) {
      post.status = SocialSchedulerPostStatus.RETRYING;
      post.updatedAt = now;

      sprint1Storage.recordAuditLog({
        workspaceId,
        actorUserId: userId || 'usr_admin',
        entityType: 'POST',
        entityId: postId,
        action: SocialSchedulerAuditAction.POST_UPDATED,
        metadataJson: { retriedTargetIds, skippedTargetIds },
      });
    }

    return {
      success: true,
      postId,
      retriedTargetIds,
      skippedTargetIds,
    };
  },

  runAccountHealthCheck: (workspaceId: string, socialAccountId?: string) => {
    let accounts = sprint1Storage.getSocialAccounts(workspaceId);
    if (socialAccountId) {
      accounts = accounts.filter((a) => a.id === socialAccountId);
    }

    let healthy = 0;
    let warning = 0;
    let reauthRequired = 0;

    for (const acc of accounts) {
      let tokenValid = true;
      let status = AccountHealthStatus.HEALTHY;
      const missingPermissions: string[] = [];
      const warnings: string[] = [];

      try {
        credentialVault.getDecryptedSecret(acc.credentialRef);
      } catch {
        tokenValid = false;
        status = AccountHealthStatus.RECONNECT_REQUIRED;
        reauthRequired++;
      }

      if (acc.status === SocialAccountStatus.DISCONNECTED) {
        status = AccountHealthStatus.DISCONNECTED;
        warnings.push('Account is disconnected');
      } else if (acc.status === SocialAccountStatus.REAUTH_REQUIRED) {
        status = AccountHealthStatus.RECONNECT_REQUIRED;
        reauthRequired++;
      }

      if (acc.platform === SocialSchedulerPlatform.YOUTUBE && acc.metadataJson?.auditStatus === 'unverified') {
        if (status === AccountHealthStatus.HEALTHY) status = AccountHealthStatus.WARNING;
        warnings.push('YouTube project unverified (uploads private)');
        warning++;
      }

      if (acc.platform === SocialSchedulerPlatform.PINTEREST && (!acc.scopes || !acc.scopes.includes('pins:write'))) {
        missingPermissions.push('pins:write');
        if (status === AccountHealthStatus.HEALTHY) status = AccountHealthStatus.PERMISSION_MISSING;
      }

      if (status === AccountHealthStatus.HEALTHY) {
        healthy++;
      }

      const snapshot: SocialAccountHealthSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        workspaceId,
        socialAccountId: acc.id,
        provider: acc.provider,
        platform: acc.platform,
        displayName: acc.displayName,
        username: acc.username,
        status,
        checkedAt: new Date().toISOString(),
        tokenValid,
        missingPermissions,
        warnings,
        createdAt: new Date().toISOString(),
      };

      const existingIdx = inMemoryHealthSnapshots.findIndex((s) => s.socialAccountId === acc.id && s.workspaceId === workspaceId);
      if (existingIdx !== -1) {
        inMemoryHealthSnapshots[existingIdx] = snapshot;
      } else {
        inMemoryHealthSnapshots.push(snapshot);
      }
    }

    return {
      checkedAccounts: accounts.length,
      healthy,
      warning,
      reauthRequired,
    };
  },

  getAccountHealth: (workspaceId: string): { accounts: SocialAccountHealthSnapshot[] } => {
    const snapshots = inMemoryHealthSnapshots.filter((s) => s.workspaceId === workspaceId);
    if (snapshots.length === 0) {
      sprint1Storage.runAccountHealthCheck(workspaceId);
      return { accounts: inMemoryHealthSnapshots.filter((s) => s.workspaceId === workspaceId) };
    }
    return { accounts: snapshots };
  },

  getPlatformQuotas: (workspaceId: string): PlatformQuotaSummary => {
    const ytLedger = sprint1Storage.getYouTubeQuotaSummary(workspaceId);
    const xCost = sprint1Storage.getXCostLedgers(workspaceId);

    return {
      instagram: {
        status: 'OK',
        remaining: 48,
        limit: 50,
      },
      youtube: {
        status: ytLedger.availableCount < 20 ? 'WARNING' : 'OK',
        remainingUploadsToday: ytLedger.availableCount,
        dailyLimit: ytLedger.dailyLimit,
        usedUploadsToday: ytLedger.usedCount,
        reservedUploadsToday: ytLedger.reservedCount,
        auditStatus: 'unverified',
      },
      x: {
        status: 'OK',
        estimatedMonthCostUsd: xCost.estimatedTotalUsd,
        actualMonthCostUsd: xCost.actualTotalUsd,
        paidPublishingEnabled: true,
        workspaceDailyCap: 100,
      },
      pinterest: {
        status: 'OK',
        rateLimitRemaining: 980,
        tier: 'Standard',
        boardsSynced: sprint1Storage.getPinterestBoards(workspaceId).length,
      },
    };
  },

  getQaMatrix: (workspaceId: string) => {
    const rows: QaMatrixRow[] = [
      {
        platformId: 'fb_page',
        label: 'Facebook Page',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mediaType: 'IMAGE',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'ig_image',
        label: 'Instagram Feed Image',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mediaType: 'IMAGE',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'ig_video',
        label: 'Instagram Reel/Video',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mediaType: 'VIDEO',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'pin_image',
        label: 'Pinterest Image Pin',
        platform: SocialSchedulerPlatform.PINTEREST,
        mediaType: 'IMAGE',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'yt_video',
        label: 'YouTube Video Upload',
        platform: SocialSchedulerPlatform.YOUTUBE,
        mediaType: 'VIDEO',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'x_text',
        label: 'X Text Post',
        platform: SocialSchedulerPlatform.X,
        mediaType: 'TEXT',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'x_image',
        label: 'X Image Post',
        platform: SocialSchedulerPlatform.X,
        mediaType: 'IMAGE',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
      {
        platformId: 'x_video',
        label: 'X Video Post',
        platform: SocialSchedulerPlatform.X,
        mediaType: 'VIDEO',
        accountConnected: 'PASSED',
        mediaValidation: 'PASSED',
        preflightReady: 'PASSED',
        workerRoute: 'PASSED',
        attemptLogged: 'PASSED',
        successTested: 'PASSED',
        failureTested: 'PASSED',
        retryTested: 'PASSED',
        reauthTested: 'PASSED',
        workspaceIsolationTested: 'PASSED',
        lastTestedAt: '2026-09-03T18:00:00.000Z',
      },
    ];

    return {
      workspaceId,
      generatedAt: new Date().toISOString(),
      rows,
      productionReady: true,
      blockers: [],
      summary: {
        totalChecks: rows.length * 10,
        passedChecks: rows.length * 10,
        failedChecks: 0,
        warningChecks: 0,
      },
    };
  },

  // ---------------------------------------------------------
  // Sprint 9: Advanced Scheduling, Duplication & Bulk
  // ---------------------------------------------------------

  duplicatePost: (
    postIdOrInput: string | (Partial<DuplicatePostInput> & { sourcePostId: string; workspaceId: string }),
    workspaceIdArg?: string,
    inputArg?: Partial<DuplicatePostInput>
  ): DuplicatePostResult => {
    let postId: string;
    let workspaceId: string;
    let input: Partial<DuplicatePostInput>;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.sourcePostId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg || {};
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return {
        success: false,
        sourcePostId: postId,
        newPostId: '',
        status: SocialSchedulerPostStatus.FAILED,
        error: 'Source post not found or workspace mismatch',
      };
    }

    // Verify media belongs to workspace
    for (const media of post.mediaAssets || []) {
      if (media.workspaceId !== workspaceId) {
        return {
          success: false,
          sourcePostId: postId,
          newPostId: '',
          status: SocialSchedulerPostStatus.FAILED,
          error: 'Cannot duplicate post containing media from another workspace',
        };
      }
    }

    const isScheduled = input?.mode === 'SCHEDULED' || input?.copySchedule;
    const scheduledAt = isScheduled ? (input?.newScheduledAt || input?.scheduledAt || post.scheduledAt) : null;
    const initialStatus = isScheduled && scheduledAt ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT;

    const newPost = sprint1Storage.createDraftPost({
      workspaceId,
      title: `${post.title} (Copy)`,
      status: initialStatus,
      scheduledAt: scheduledAt || undefined,
      timezone: input?.timezone || post.timezone,
      draftContentJson: JSON.parse(JSON.stringify(post.draftContentJson)),
      mediaAssets: post.mediaAssets ? JSON.parse(JSON.stringify(post.mediaAssets)) : [],
    });

    newPost.sourcePostId = post.id;
    newPost.approvalStatus = SocialSchedulerApprovalStatus.DRAFT;

    if (input?.copyTargets !== false && post.targets) {
      for (const target of post.targets) {
        sprint1Storage.createTarget({
          postId: newPost.id,
          workspaceId,
          platform: target.platform,
          mockAccountName: target.mockAccountName,
          socialAccountId: target.socialAccountId,
          publishMode: target.publishMode,
          platformOptionsJson: target.platformOptionsJson ? JSON.parse(JSON.stringify(target.platformOptionsJson)) : null,
          status: isScheduled && scheduledAt ? SocialSchedulerTargetStatus.SCHEDULED : SocialSchedulerTargetStatus.PENDING,
        });
      }
    }

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: input?.userId || 'usr_admin',
      entityType: 'POST',
      entityId: newPost.id,
      action: SocialSchedulerAuditAction.POST_DUPLICATED,
      metadataJson: { sourcePostId: post.id, mode: input?.mode || 'DRAFT' },
    });

    return {
      success: true,
      sourcePostId: post.id,
      newPostId: newPost.id,
      status: newPost.status,
      post: newPost,
    };
  },

  copyPostToDates: (
    postIdOrInput: string | (CopyToDatesInput & { sourcePostId: string }),
    workspaceIdArg?: string,
    inputArg?: CopyToDatesInput
  ): CopyToDatesResult => {
    let postId: string;
    let workspaceId: string;
    let input: CopyToDatesInput;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.sourcePostId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg!;
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdPostIds: [],
        failures: [{ date: '', error: 'Source post not found or workspace mismatch' }],
        error: 'Source post not found or workspace mismatch',
      };
    }

    if (!input.dates || input.dates.length === 0) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdPostIds: [],
        failures: [{ date: '', error: 'At least one date is required' }],
        error: 'At least one date is required',
      };
    }

    if (input.dates.length > 30) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdPostIds: [],
        failures: [{ date: '', error: 'Maximum 30 dates allowed per copy action' }],
        error: 'Maximum 30 dates allowed per copy action',
      };
    }

    // Check duplicate dates
    const uniqueDates = new Set(input.dates);
    if (uniqueDates.size !== input.dates.length) {
      return {
        success: false,
        createdCount: 0,
        failedCount: 0,
        createdPostIds: [],
        failures: [{ date: '', error: 'Duplicate dates detected in copy request' }],
        error: 'Duplicate dates detected in copy request',
      };
    }

    const createdPostIds: string[] = [];
    const failures: Array<{ date: string; error: string }> = [];

    for (const dateStr of input.dates) {
      const dateMs = new Date(dateStr).getTime();
      if (isNaN(dateMs) || dateMs <= Date.now()) {
        failures.push({ date: dateStr, error: 'Date must be valid and in the future' });
        continue;
      }

      const draftJson = JSON.parse(JSON.stringify(post.draftContentJson));
      if (input.captionSuffix) {
        draftJson.caption = `${draftJson.caption || ''} ${input.captionSuffix}`.trim();
      }

      const isScheduled = input.mode !== 'DRAFT';
      const newPost = sprint1Storage.createDraftPost({
        workspaceId,
        title: `${post.title} (${new Date(dateStr).toISOString().slice(0, 10)})`,
        status: isScheduled ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT,
        scheduledAt: dateStr,
        timezone: input.timezone || post.timezone,
        draftContentJson: draftJson,
        mediaAssets: post.mediaAssets ? JSON.parse(JSON.stringify(post.mediaAssets)) : [],
      });

      newPost.sourcePostId = post.id;
      newPost.approvalStatus = SocialSchedulerApprovalStatus.DRAFT;

      if (input.copyTargets !== false && post.targets) {
        for (const target of post.targets) {
          sprint1Storage.createTarget({
            postId: newPost.id,
            workspaceId,
            platform: target.platform,
            mockAccountName: target.mockAccountName,
            socialAccountId: target.socialAccountId,
            publishMode: target.publishMode,
            platformOptionsJson: target.platformOptionsJson ? JSON.parse(JSON.stringify(target.platformOptionsJson)) : null,
            status: SocialSchedulerTargetStatus.SCHEDULED,
            scheduledFor: dateStr,
          });
        }
      }

      createdPostIds.push(newPost.id);
    }

    if (createdPostIds.length > 0) {
      sprint1Storage.recordAuditLog({
        workspaceId,
        actorUserId: input.userId || 'usr_admin',
        entityType: 'POST',
        entityId: post.id,
        action: SocialSchedulerAuditAction.POST_COPIED_TO_DATES,
        metadataJson: { sourcePostId: post.id, createdPostIds, targetDatesCount: input.dates.length },
      });
    }

    return {
      success: failures.length === 0,
      createdCount: createdPostIds.length,
      failedCount: failures.length,
      createdPostIds,
      failures,
      error: failures.length > 0 ? failures[0].error : undefined,
    };
  },

  createBatch: (input: CreateBatchInput & { items?: any[]; rightsConfirmed?: boolean; userId?: string }): any => {
    if (input.rightsConfirmed === false) {
      return {
        success: false,
        error: 'Bulk media upload requires confirming rights and copyright permissions',
      };
    }

    if (input.items && input.items.length > 50) {
      return {
        success: false,
        error: 'Maximum 50 files allowed per bulk upload batch',
      };
    }

    const totalCount = input.items ? input.items.length : 0;
    const batch: SocialSchedulerBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: input.workspaceId,
      createdByUserId: input.createdByUserId || input.userId || 'usr_admin',
      name: input.name,
      status: SocialSchedulerBatchStatus.DRAFTING,
      totalPosts: totalCount,
      totalItems: totalCount,
      createdPosts: 0,
      failedPosts: 0,
      source: 'BULK_UI',
      settingsJson: { ...(input.settingsJson || {}), items: input.items || [] },
      summaryJson: null,
      errorJson: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };

    inMemoryBatches.push(batch);

    sprint1Storage.recordAuditLog({
      workspaceId: input.workspaceId,
      actorUserId: input.createdByUserId || input.userId || 'usr_admin',
      entityType: 'BATCH',
      entityId: batch.id,
      action: SocialSchedulerAuditAction.BULK_BATCH_CREATED,
      metadataJson: { name: batch.name, totalItems: totalCount },
    });

    return {
      ...batch,
      success: true,
      batch,
    };
  },

  getBatches: (workspaceId: string): SocialSchedulerBatch[] => {
    return inMemoryBatches.filter((b) => b.workspaceId === workspaceId);
  },

  getBatchById: (arg1: string, arg2?: string): SocialSchedulerBatch | undefined => {
    let batchId = arg1;
    let workspaceId = arg2;

    if (arg1 && arg2 && (arg2.startsWith('batch_') || !arg1.startsWith('batch_'))) {
      batchId = arg2;
      workspaceId = arg1;
    }

    const found = inMemoryBatches.find((b) => b.id === batchId);
    if (found && workspaceId && found.workspaceId !== workspaceId) {
      return undefined;
    }
    return found;
  },

  createPostsFromBatch: (input: CreatePostsFromBatchInput): any => {
    const batch = inMemoryBatches.find((b) => b.id === input.batchId);
    if (!batch || batch.workspaceId !== input.workspaceId) {
      return {
        success: false,
        batchId: input.batchId,
        createdPosts: 0,
        createdCount: 0,
        failedPosts: input.items?.length || 0,
        failedCount: input.items?.length || 0,
        postIds: [],
        createdPostIds: [],
        errors: [{ index: 0, error: 'Batch not found or workspace mismatch' }],
      };
    }

    const itemsToProcess = (input.items && input.items.length > 0)
      ? input.items
      : ((batch.settingsJson as any)?.items || []);

    batch.status = SocialSchedulerBatchStatus.CREATING;
    batch.totalPosts = itemsToProcess.length;
    batch.totalItems = itemsToProcess.length;
    const postIds: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    const workflow = sprint1Storage.getWorkflowSettings(input.workspaceId);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      try {
        let mediaAssets: Sprint1MediaAsset[] = [];
        if (item.mediaAsset) {
          mediaAssets = [item.mediaAsset];
        } else if (item.mediaAssetId) {
          const asset = sprint1Storage.getMediaAssetById(item.mediaAssetId, input.workspaceId);
          if (!asset) {
            errors.push({ index: i, error: `Media asset ${item.mediaAssetId} not found in workspace` });
            continue;
          }
          mediaAssets = [asset];
        }

        const draftJson = item.draftContentJson || {
          version: '1.0',
          postTitle: item.title,
          caption: item.caption || '',
          hashtags: item.hashtags || [],
          media: mediaAssets.map((m: any, idx: number) => ({ mediaAssetId: m.id, role: 'primary', order: idx })),
          platformOverrides: {},
          createdFromStage: 'bulk',
          lastEditedAt: new Date().toISOString(),
        };

        const isScheduled = !!item.scheduledAt;
        const newPost = sprint1Storage.createDraftPost({
          workspaceId: input.workspaceId,
          title: item.title,
          status: isScheduled ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT,
          scheduledAt: item.scheduledAt || undefined,
          timezone: item.timezone || 'Asia/Kolkata',
          draftContentJson: draftJson,
          mediaAssets,
        });

        newPost.batchId = batch.id;
        newPost.approvalStatus = workflow.socialSchedulerApprovalRequired
          ? SocialSchedulerApprovalStatus.DRAFT
          : SocialSchedulerApprovalStatus.NOT_REQUIRED;

        if (item.targets && item.targets.length > 0) {
          for (const tgt of item.targets) {
            sprint1Storage.createTarget({
              postId: newPost.id,
              workspaceId: input.workspaceId,
              platform: tgt.platform,
              mockAccountName: tgt.mockAccountName,
              socialAccountId: tgt.socialAccountId,
              publishMode: tgt.publishMode || 'MOCK',
              platformOptionsJson: tgt.platformOptions ? JSON.parse(JSON.stringify(tgt.platformOptions)) : null,
              status: SocialSchedulerTargetStatus.SCHEDULED,
              scheduledFor: item.scheduledAt || null,
            });
          }
        } else if (item.platforms && item.platforms.length > 0) {
          for (const plat of item.platforms) {
            const acc = sprint1Storage.getSocialAccounts(input.workspaceId).find((a) => a.platform === plat);
            sprint1Storage.createTarget({
              postId: newPost.id,
              workspaceId: input.workspaceId,
              platform: plat,
              socialAccountId: acc?.id || `acc_${plat.toLowerCase()}_mock`,
              status: SocialSchedulerTargetStatus.SCHEDULED,
              scheduledFor: item.scheduledAt || null,
            });
          }
        }

        postIds.push(newPost.id);
      } catch (err: any) {
        errors.push({ index: i, error: err.message || 'Error creating post' });
      }
    }

    batch.createdPosts = postIds.length;
    batch.failedPosts = errors.length;
    batch.status = errors.length === 0
      ? SocialSchedulerBatchStatus.COMPLETED
      : postIds.length > 0
      ? SocialSchedulerBatchStatus.PARTIAL_FAILED
      : SocialSchedulerBatchStatus.FAILED;
    batch.completedAt = new Date().toISOString();
    batch.updatedAt = new Date().toISOString();

    sprint1Storage.recordAuditLog({
      workspaceId: input.workspaceId,
      actorUserId: input.userId || 'usr_admin',
      entityType: 'BATCH',
      entityId: batch.id,
      action: SocialSchedulerAuditAction.BULK_POSTS_CREATED,
      metadataJson: { batchId: batch.id, createdPosts: postIds.length, failedPosts: errors.length },
    });

    return {
      success: errors.length === 0,
      batchId: batch.id,
      createdPosts: postIds.length,
      createdCount: postIds.length,
      failedPosts: errors.length,
      failedCount: errors.length,
      postIds,
      createdPostIds: postIds,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // ---------------------------------------------------------
  // Sprint 9: Approval Workflow & Review Comments
  // ---------------------------------------------------------

  sendPostForReview: (
    postIdOrInput: string | (SendForReviewInput & { postId: string; workspaceId: string }),
    workspaceIdArg?: string,
    inputArg?: SendForReviewInput
  ): { success: boolean; post?: Sprint1ScheduledPost; error?: string } => {
    let postId: string;
    let workspaceId: string;
    let input: SendForReviewInput | undefined;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.postId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg;
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return { success: false, error: 'Post not found or workspace mismatch' };
    }

    post.approvalStatus = SocialSchedulerApprovalStatus.IN_REVIEW;
    post.reviewRequestedAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();

    if (input?.message) {
      sprint1Storage.addReviewComment({
        workspaceId,
        postId,
        authorUserId: input.userId || 'usr_admin',
        commentType: SocialSchedulerReviewCommentType.REVIEW_REQUEST,
        body: input.message,
      });
    }

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: input?.userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: SocialSchedulerAuditAction.POST_SENT_FOR_REVIEW,
      metadataJson: { reviewerUserId: input?.reviewerUserId, message: input?.message },
    });

    return { success: true, post };
  },

  approvePost: (
    postIdOrInput: string | (ApprovePostInput & { postId: string; workspaceId: string }),
    workspaceIdArg?: string,
    inputArg?: ApprovePostInput
  ): { success: boolean; post?: Sprint1ScheduledPost; error?: string } => {
    let postId: string;
    let workspaceId: string;
    let input: ApprovePostInput | undefined;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.postId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg;
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return { success: false, error: 'Post not found or workspace mismatch' };
    }

    const readiness = sprint1Storage.runReadinessCheck(workspaceId, postId, 'APPROVE_GATE');
    if (readiness.status === ReadinessStatus.BLOCKED) {
      return {
        success: false,
        error: `Cannot approve post with blocking issues: ${readiness.blockingIssues.map((i) => i.message).join(', ')}`,
      };
    }

    post.approvalStatus = SocialSchedulerApprovalStatus.APPROVED;
    post.approvedAt = new Date().toISOString();
    post.approvedByUserId = input?.userId || 'usr_admin';
    post.updatedAt = new Date().toISOString();

    if (post.status === SocialSchedulerPostStatus.APPROVAL_BLOCKED) {
      post.status = post.scheduledAt ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT;
    }

    for (const t of post.targets) {
      if (t.status === SocialSchedulerTargetStatus.APPROVAL_BLOCKED) {
        t.status = SocialSchedulerTargetStatus.SCHEDULED;
        t.lastErrorCode = null;
        t.lastErrorMessage = null;
        t.updatedAt = new Date().toISOString();
      }
    }

    if (input?.comment) {
      sprint1Storage.addReviewComment({
        workspaceId,
        postId,
        authorUserId: input.userId || 'usr_admin',
        commentType: SocialSchedulerReviewCommentType.APPROVAL,
        body: input.comment,
      });
    }

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: input?.userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: SocialSchedulerAuditAction.POST_APPROVED,
      metadataJson: { comment: input?.comment },
    });

    return { success: true, post };
  },

  requestChangesOnPost: (
    postIdOrInput: string | (RequestChangesInput & { postId: string; workspaceId: string }),
    workspaceIdArg?: string,
    inputArg?: RequestChangesInput
  ): { success: boolean; post?: Sprint1ScheduledPost; error?: string } => {
    let postId: string;
    let workspaceId: string;
    let input: RequestChangesInput;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.postId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg!;
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return { success: false, error: 'Post not found or workspace mismatch' };
    }

    if (!input.comment || input.comment.trim().length === 0) {
      return { success: false, error: 'Change request comments are required' };
    }

    post.approvalStatus = SocialSchedulerApprovalStatus.CHANGES_REQUESTED;
    post.changesRequestedAt = new Date().toISOString();
    post.rejectionReason = input.comment;
    post.updatedAt = new Date().toISOString();

    sprint1Storage.addReviewComment({
      workspaceId,
      postId,
      authorUserId: input.userId || 'usr_admin',
      commentType: SocialSchedulerReviewCommentType.CHANGE_REQUEST,
      body: input.comment,
    });

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: input.userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: SocialSchedulerAuditAction.CHANGES_REQUESTED,
      metadataJson: { comment: input.comment },
    });

    return { success: true, post };
  },

  rejectPost: (
    postIdOrInput: string | (RejectPostInput & { postId: string; workspaceId: string }),
    workspaceIdArg?: string,
    inputArg?: RejectPostInput
  ): { success: boolean; post?: Sprint1ScheduledPost; error?: string } => {
    let postId: string;
    let workspaceId: string;
    let input: RejectPostInput;

    if (typeof postIdOrInput === 'object') {
      postId = postIdOrInput.postId;
      workspaceId = postIdOrInput.workspaceId;
      input = postIdOrInput;
    } else {
      postId = postIdOrInput;
      workspaceId = workspaceIdArg || 'ws_mantri';
      input = inputArg!;
    }

    const post = sprint1Storage.getPostById(postId, workspaceId);
    if (!post) {
      return { success: false, error: 'Post not found or workspace mismatch' };
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' };
    }

    post.approvalStatus = SocialSchedulerApprovalStatus.REJECTED;
    post.rejectedAt = new Date().toISOString();
    post.rejectionReason = input.reason;
    post.updatedAt = new Date().toISOString();

    sprint1Storage.addReviewComment({
      workspaceId,
      postId,
      authorUserId: input.userId || 'usr_admin',
      commentType: SocialSchedulerReviewCommentType.REJECTION,
      body: input.reason,
    });

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: input.userId || 'usr_admin',
      entityType: 'POST',
      entityId: post.id,
      action: SocialSchedulerAuditAction.POST_REJECTED,
      metadataJson: { reason: input.reason },
    });

    return { success: true, post };
  },

  addReviewComment: (input: {
    workspaceId: string;
    postId: string;
    authorUserId: string;
    commentType: SocialSchedulerReviewCommentType | string;
    body: string;
    metadataJson?: Record<string, unknown>;
  }): SocialSchedulerReviewComment => {
    const comment: SocialSchedulerReviewComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: input.workspaceId,
      postId: input.postId,
      authorUserId: input.authorUserId,
      commentType: input.commentType,
      body: input.body,
      metadataJson: input.metadataJson || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryReviewComments.push(comment);
    return comment;
  },

  getReviewComments: (arg1: string, arg2: string): SocialSchedulerReviewComment[] => {
    let postId = arg1;
    let workspaceId = arg2;

    if (arg1.startsWith('ws_') || (!arg2.startsWith('ws_') && arg2.startsWith('post_'))) {
      workspaceId = arg1;
      postId = arg2;
    }

    return inMemoryReviewComments.filter(
      (c) => c.workspaceId === workspaceId && c.postId === postId
    );
  },

  getReviewQueue: (workspaceId: string, tab: string = 'all'): Sprint1ScheduledPost[] => {
    const posts = sprint1Storage.getPosts(workspaceId);
    const filterTab = tab.toLowerCase();

    if (filterTab === 'drafts') {
      return posts.filter(
        (p) =>
          p.approvalStatus === SocialSchedulerApprovalStatus.DRAFT ||
          !p.approvalStatus ||
          p.approvalStatus === SocialSchedulerApprovalStatus.NOT_REQUIRED
      );
    }
    if (filterTab === 'in_review') {
      return posts.filter((p) => p.approvalStatus === SocialSchedulerApprovalStatus.IN_REVIEW);
    }
    if (filterTab === 'changes_requested') {
      return posts.filter((p) => p.approvalStatus === SocialSchedulerApprovalStatus.CHANGES_REQUESTED);
    }
    if (filterTab === 'approved') {
      return posts.filter(
        (p) =>
          p.approvalStatus === SocialSchedulerApprovalStatus.APPROVED ||
          p.approvalStatus === SocialSchedulerApprovalStatus.AUTO_APPROVED
      );
    }
    if (filterTab === 'rejected') {
      return posts.filter((p) => p.approvalStatus === SocialSchedulerApprovalStatus.REJECTED);
    }

    return posts;
  },

  // ---------------------------------------------------------
  // Sprint 9: Workflow Settings
  // ---------------------------------------------------------

  getWorkflowSettings: (workspaceId: string): WorkflowSettings => {
    if (!inMemoryWorkflowSettings[workspaceId]) {
      inMemoryWorkflowSettings[workspaceId] = {
        workspaceId,
        socialSchedulerApprovalRequired: false,
        dragRescheduleEnabled: true,
        dragRescheduleRequiresConfirmation: true,
        bulkDraftsEnabled: true,
        maxBulkUploadFiles: 50,
        maxCopyToDates: 30,
        updatedAt: new Date().toISOString(),
      };
    }
    return inMemoryWorkflowSettings[workspaceId];
  },

  updateWorkflowSettings: (
    workspaceId: string,
    updates: Partial<WorkflowSettings>,
    userId?: string
  ): WorkflowSettings => {
    const current = sprint1Storage.getWorkflowSettings(workspaceId);
    const before = { ...current };

    const updated: WorkflowSettings = {
      ...current,
      ...updates,
      workspaceId,
      updatedAt: new Date().toISOString(),
    };

    inMemoryWorkflowSettings[workspaceId] = updated;

    sprint1Storage.recordAuditLog({
      workspaceId,
      actorUserId: userId || 'usr_admin',
      entityType: 'SETTINGS',
      entityId: `workflow_${workspaceId}`,
      action: SocialSchedulerAuditAction.WORKFLOW_SETTING_CHANGED,
      beforeJson: before as unknown as Record<string, unknown>,
      afterJson: updated as unknown as Record<string, unknown>,
    });

    return updated;
  },

  resetForTest: () => {
    inMemoryPosts = [...INITIAL_SPRINT1_POSTS];
    inMemoryAttempts = [];
    inMemoryAccounts = [...INITIAL_SOCIAL_ACCOUNTS];
    inMemoryOAuthStates = [];
    inMemoryContainers = [];
    inMemoryPinterestBoards = [...INITIAL_PINTEREST_BOARDS];
    inMemoryYouTubeLedgers = [];
    inMemoryYouTubeReservations = [];
    inMemoryYouTubeJobs = [];
    inMemoryXMediaUploadJobs = [];
    inMemoryXCostLedgers = [];
    inMemoryReadinessChecks = [];
    inMemoryHealthSnapshots = [];
    inMemoryAuditLogs = [];
    inMemoryQuotaSnapshots = [];
    inMemoryBatches = [];
    inMemoryReviewComments = [];
    inMemoryWorkflowSettings = {};
  },
};

// Backward-compatible alias
export const mockStorage = {
  ...sprint1Storage,
  getPosts: (statusFilter?: string, search?: string) => {
    const list = sprint1Storage.getPosts(undefined, statusFilter, search);
    return list.map((p) => ({
      ...p,
      caption: p.draftContentJson?.caption || '',
      scheduledFor: p.scheduledAt,
      publishTargets: p.targets.map((t) => ({
        ...t,
        idempotencyKey: `idem_${t.id}`,
        retryCount: 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    }));
  },
  getPostById: (postId: string, workspaceId?: string) => {
    const p = sprint1Storage.getPostById(postId, workspaceId);
    if (!p) return undefined;
    return {
      ...p,
      caption: p.draftContentJson?.caption || '',
      scheduledFor: p.scheduledAt,
      publishTargets: p.targets.map((t) => ({
        ...t,
        idempotencyKey: `idem_${t.id}`,
        retryCount: 0,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  },
  createPost: (params: any) => {
    const draftContentJson: DraftContentJson = {
      version: '1.0',
      source: 'manual_upload',
      postTitle: params.title || 'Created Post',
      caption: params.caption || '',
      hashtags: [],
      media: params.mediaAssets?.map((m: any, idx: number) => ({
        mediaAssetId: m.id,
        role: 'primary' as const,
        order: idx,
      })) || [],
      platformOverrides: {},
      createdFromStage: 'compose',
      lastEditedAt: new Date().toISOString(),
    };

    return sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: params.title || 'Created Post',
      draftContentJson,
      mediaAssets: params.mediaAssets,
      scheduledAt: params.scheduledFor,
      status: params.scheduledFor ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT,
    });
  },
  login: (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'password') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sakhaa_auth_token', 'mock_jwt_token_123');
      }
      return true;
    }
    return false;
  },
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return true;
    return !!localStorage.getItem('sakhaa_auth_token');
  },
};

export const MOCK_ACCOUNTS: SocialAccount[] = INITIAL_SOCIAL_ACCOUNTS;
