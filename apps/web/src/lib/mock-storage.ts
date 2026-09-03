import {
  Post,
  PostStatus,
  PublishTargetStatus,
  PublishAttemptStatus,
  SocialAccountStatus,
  MediaAssetStatus,
  SocialAccount,
  SocialPlatform,
  MediaAsset,
  User,
} from '../types/scheduler';

const STORAGE_KEYS = {
  POSTS: 'scheduler_posts_v1',
  AUTH: 'scheduler_auth_v1',
  ACCOUNTS: 'scheduler_accounts_v1',
};

export const MOCK_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc_ig_1',
    platform: 'INSTAGRAM',
    displayName: 'sakhaa_official',
    platformAccountId: 'ig_17841400012345678',
    status: SocialAccountStatus.CONNECTED,
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'acc_fb_1',
    platform: 'FACEBOOK',
    displayName: 'Sakhaa Forge Media',
    platformAccountId: 'fb_page_1029384756',
    status: SocialAccountStatus.CONNECTED,
    avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-08-15T10:30:00Z',
  },
  {
    id: 'acc_li_1',
    platform: 'LINKEDIN',
    displayName: 'Sakhaa Technologies',
    platformAccountId: 'urn:li:organization:8937461',
    status: SocialAccountStatus.REAUTH_REQUIRED,
    avatarUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-08-20T14:15:00Z',
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'post_001',
    caption: 'Forging new horizons with next-gen automated scheduling systems. Validated end-to-end with Backblaze B2 & Supabase. #TechArchitecture #SocialScheduler',
    scheduledFor: '2026-09-04T15:00:00.000Z',
    status: PostStatus.SCHEDULED,
    createdAt: '2026-09-03T10:30:00.000Z',
    updatedAt: '2026-09-03T10:30:00.000Z',
    mediaAssets: [
      {
        id: 'media_001',
        postId: 'post_001',
        b2Bucket: 'social-scheduler-media',
        b2Key: 'social-scheduler/uploads/2026/09/post_001/forge-system.png',
        originalFilename: 'forge-system.png',
        mimeType: 'image/png',
        sizeBytes: 1485200,
        width: 1200,
        height: 630,
        status: MediaAssetStatus.UPLOADED,
        previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-09-03T10:28:00.000Z',
      },
    ],
    publishTargets: [
      {
        id: 'target_001',
        postId: 'post_001',
        socialAccountId: 'acc_ig_1',
        platform: 'INSTAGRAM',
        status: PublishTargetStatus.SCHEDULED,
        scheduledFor: '2026-09-04T15:00:00.000Z',
        idempotencyKey: 'idemp_post_001_acc_ig_1',
        retryCount: 0,
        createdAt: '2026-09-03T10:30:00.000Z',
        updatedAt: '2026-09-03T10:30:00.000Z',
        socialAccount: MOCK_ACCOUNTS[0],
        publishAttempts: [],
      },
      {
        id: 'target_002',
        postId: 'post_001',
        socialAccountId: 'acc_fb_1',
        platform: 'FACEBOOK',
        status: PublishTargetStatus.SCHEDULED,
        scheduledFor: '2026-09-04T15:00:00.000Z',
        idempotencyKey: 'idemp_post_001_acc_fb_1',
        retryCount: 0,
        createdAt: '2026-09-03T10:30:00.000Z',
        updatedAt: '2026-09-03T10:30:00.000Z',
        socialAccount: MOCK_ACCOUNTS[1],
        publishAttempts: [],
      },
    ],
  },
  {
    id: 'post_002',
    caption: 'Excited to announce our standalone modular scheduler architecture! Reusable core designed for enterprise integration.',
    scheduledFor: '2026-09-02T18:00:00.000Z',
    status: PostStatus.PUBLISHED,
    createdAt: '2026-09-02T12:00:00.000Z',
    updatedAt: '2026-09-02T18:00:25.000Z',
    mediaAssets: [
      {
        id: 'media_002',
        postId: 'post_002',
        b2Bucket: 'social-scheduler-media',
        b2Key: 'social-scheduler/uploads/2026/09/post_002/architecture.jpg',
        originalFilename: 'architecture.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2451000,
        width: 1080,
        height: 1080,
        status: MediaAssetStatus.UPLOADED,
        previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-09-02T11:58:00.000Z',
      },
    ],
    publishTargets: [
      {
        id: 'target_003',
        postId: 'post_002',
        socialAccountId: 'acc_ig_1',
        platform: 'INSTAGRAM',
        status: PublishTargetStatus.PUBLISHED,
        scheduledFor: '2026-09-02T18:00:00.000Z',
        publishedAt: '2026-09-02T18:00:25.000Z',
        platformPostId: '17992837461523',
        platformPostUrl: 'https://instagram.com/p/C1234567890',
        idempotencyKey: 'idemp_post_002_acc_ig_1',
        retryCount: 0,
        createdAt: '2026-09-02T12:00:00.000Z',
        updatedAt: '2026-09-02T18:00:25.000Z',
        socialAccount: MOCK_ACCOUNTS[0],
        publishAttempts: [
          {
            id: 'att_001',
            publishTargetId: 'target_003',
            attemptNumber: 1,
            status: PublishAttemptStatus.SUCCESS,
            startedAt: '2026-09-02T18:00:02.000Z',
            finishedAt: '2026-09-02T18:00:25.000Z',
            createdAt: '2026-09-02T18:00:02.000Z',
          },
        ],
      },
    ],
  },
  {
    id: 'post_003',
    caption: 'Scheduled maintenance update: Enhancing pipeline concurrency and worker claim atomicity.',
    scheduledFor: '2026-09-01T09:00:00.000Z',
    status: PostStatus.FAILED,
    createdAt: '2026-08-31T20:00:00.000Z',
    updatedAt: '2026-09-01T09:15:30.000Z',
    mediaAssets: [
      {
        id: 'media_003',
        postId: 'post_003',
        b2Bucket: 'social-scheduler-media',
        b2Key: 'social-scheduler/uploads/2026/08/post_003/maintenance.jpg',
        originalFilename: 'maintenance.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 890400,
        status: MediaAssetStatus.UPLOADED,
        previewUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
        createdAt: '2026-08-31T19:55:00.000Z',
      },
    ],
    publishTargets: [
      {
        id: 'target_004',
        postId: 'post_003',
        socialAccountId: 'acc_li_1',
        platform: 'LINKEDIN',
        status: PublishTargetStatus.FAILED,
        scheduledFor: '2026-09-01T09:00:00.000Z',
        idempotencyKey: 'idemp_post_003_acc_li_1',
        lastErrorCode: 'TOKEN_EXPIRED',
        lastErrorMessage: 'The LinkedIn OAuth access token has expired. User must reconnect account.',
        retryCount: 3,
        createdAt: '2026-08-31T20:00:00.000Z',
        updatedAt: '2026-09-01T09:15:30.000Z',
        socialAccount: MOCK_ACCOUNTS[2],
        publishAttempts: [
          {
            id: 'att_002',
            publishTargetId: 'target_004',
            attemptNumber: 1,
            status: PublishAttemptStatus.FAILED,
            errorCode: 'TOKEN_EXPIRED',
            errorMessage: 'Token expired',
            startedAt: '2026-09-01T09:00:05.000Z',
            finishedAt: '2026-09-01T09:00:07.000Z',
            createdAt: '2026-09-01T09:00:05.000Z',
          },
        ],
      },
    ],
  },
];

export const mockStorage = {
  getPosts: (): Post[] => {
    if (typeof window === 'undefined') return INITIAL_POSTS;
    const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_POSTS;
    }
  },

  getPostById: (id: string): Post | undefined => {
    const posts = mockStorage.getPosts();
    return posts.find((p) => p.id === id);
  },

  createPost: (params: {
    caption: string;
    scheduledFor?: string;
    mediaAssets: MediaAsset[];
    targetAccounts: { accountId: string; platform: SocialPlatform }[];
  }): Post => {
    const posts = mockStorage.getPosts();
    const newId = `post_${Date.now()}`;
    const status = params.scheduledFor ? PostStatus.SCHEDULED : PostStatus.DRAFT;

    const targets = params.targetAccounts.map((t, idx) => {
      const acc = MOCK_ACCOUNTS.find((a) => a.id === t.accountId);
      return {
        id: `target_${Date.now()}_${idx}`,
        postId: newId,
        socialAccountId: t.accountId,
        platform: t.platform,
        status: params.scheduledFor ? PublishTargetStatus.SCHEDULED : PublishTargetStatus.PENDING,
        scheduledFor: params.scheduledFor || new Date().toISOString(),
        idempotencyKey: `idemp_${newId}_${t.accountId}`,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        socialAccount: acc,
        publishAttempts: [],
      };
    });

    const newPost: Post = {
      id: newId,
      caption: params.caption,
      scheduledFor: params.scheduledFor,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaAssets: params.mediaAssets.map((m) => ({ ...m, postId: newId })),
      publishTargets: targets,
    };

    const updated = [newPost, ...posts];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    }
    return newPost;
  },

  cancelPost: (id: string): Post | null => {
    const posts = mockStorage.getPosts();
    const post = posts.find((p) => p.id === id);
    if (!post) return null;

    post.status = PostStatus.CANCELLED;
    post.cancelledAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();
    post.publishTargets.forEach((t) => {
      if (t.status === PublishTargetStatus.SCHEDULED || t.status === PublishTargetStatus.PENDING) {
        t.status = PublishTargetStatus.CANCELLED;
      }
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    }
    return post;
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return { id: 'usr_admin', username: 'admin', createdAt: '2026-09-01T00:00:00Z' };
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!auth) return { id: 'usr_admin', username: 'admin', createdAt: '2026-09-01T00:00:00Z' }; // auto-login default for MVP convenience
    return JSON.parse(auth);
  },

  login: (username: string, _password: string): boolean => {
    if (username.trim()) {
      const user: User = { id: 'usr_admin', username, createdAt: new Date().toISOString() };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      }
      return true;
    }
    return false;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  },
};
