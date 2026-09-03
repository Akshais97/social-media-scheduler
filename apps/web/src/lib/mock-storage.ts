import {
  SocialSchedulerPostStatus,
  SocialSchedulerMediaStatus,
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialPublishAttempt,
  SocialPublishAttemptStatus,
  Workspace,
  Sprint1ScheduledPost,
  Sprint1MediaAsset,
  Sprint1PublishTarget,
  DraftContentJson,
} from '../types/scheduler';

const STORAGE_KEYS = {
  POSTS: 'sakhaa_scheduler_posts_sprint1',
  WORKSPACES: 'sakhaa_scheduler_workspaces_sprint1',
  ACTIVE_WS: 'sakhaa_scheduler_active_ws_sprint1',
  MEDIA: 'sakhaa_scheduler_media_sprint1',
  ATTEMPTS: 'sakhaa_scheduler_attempts_sprint2',
};

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws_mantri',
    name: 'Mantri Developers',
    brandName: 'Mantri Luxury Homes',
    brandApproved: true,
    permission: 'OWNER',
    storageBucket: 'sakhaa-b2-mantri',
  },
  {
    id: 'ws_sobha',
    name: 'Sobha Realty',
    brandName: 'Sobha Signature',
    brandApproved: true,
    permission: 'CLIENT_MANAGER',
    storageBucket: 'sakhaa-b2-sobha',
  },
  {
    id: 'ws_prestige',
    name: 'Prestige Group',
    brandName: 'Prestige Estates',
    brandApproved: false,
    permission: 'VIEWER',
    storageBucket: 'sakhaa-b2-prestige',
  },
];

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
        bucket: 'sakhaa-b2-mantri',
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
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mockAccountName: 'Instagram Business · Mantri Official',
        status: SocialSchedulerTargetStatus.MOCK_READY,
        createdAt: '2026-09-02T14:15:00.000Z',
        updatedAt: '2026-09-02T14:15:00.000Z',
      },
      {
        id: 'tgt_002',
        postId: 'post_s1_001',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'Facebook Page · Mantri Developers',
        status: SocialSchedulerTargetStatus.MOCK_READY,
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
    title: 'Architectural Vision: Sustainable Luxury',
    status: SocialSchedulerPostStatus.DRAFT,
    scheduledAt: undefined,
    timezone: 'Asia/Kolkata',
    createdAt: '2026-09-03T09:15:00.000Z',
    updatedAt: '2026-09-03T09:15:00.000Z',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      postTitle: 'Architectural Vision: Sustainable Luxury',
      caption: 'Every curve, courtyard, and solar facade is engineered with ecological harmony in mind. Discover how our LEED-platinum designs redefine living.',
      cta: 'Read our architectural whitepaper',
      hashtags: ['SustainableArchitecture', 'GreenBuilding'],
      media: [
        {
          mediaAssetId: 'asset_mantri_02',
          role: 'primary',
          order: 0,
        },
      ],
      platformOverrides: {},
      createdFromStage: 'compose',
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
        bucket: 'sakhaa-b2-mantri',
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
        createdAt: '2026-09-02T16:30:00.000Z',
        updatedAt: '2026-09-02T16:30:00.000Z',
      },
    ],
    publishTargets: [],
  },
];

let inMemoryPosts: Sprint1ScheduledPost[] = [...INITIAL_SPRINT1_POSTS];
let inMemoryAttempts: SocialPublishAttempt[] = [];

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

  getPostById: (postId: string): Sprint1ScheduledPost | undefined => {
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
    return posts.find((p) => p.id === postId);
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
    const newId = `post_s1_${Date.now()}`;

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

  cancelPost: (postId: string): Sprint1ScheduledPost | null => {
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

    const post = allPosts.find((p) => p.id === postId);
    if (!post) return null;

    post.status = SocialSchedulerPostStatus.CANCELLED;
    post.cancelledAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();
    post.targets.forEach((t) => {
      t.status = SocialSchedulerTargetStatus.CANCELLED;
      t.updatedAt = new Date().toISOString();
    });

    inMemoryPosts = allPosts;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(allPosts));
    }
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
};

export const MOCK_ACCOUNTS = [
  {
    id: 'acc_ig_01',
    platform: SocialSchedulerPlatform.INSTAGRAM,
    displayName: 'Mantri Official (Instagram)',
    platformAccountId: 'ig_178414053092',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'CONNECTED',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'acc_fb_01',
    platform: SocialSchedulerPlatform.FACEBOOK,
    displayName: 'Mantri Developers (Facebook Page)',
    platformAccountId: 'fb_page_10928374',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'CONNECTED',
    createdAt: '2026-09-01T10:05:00.000Z',
    updatedAt: '2026-09-01T10:05:00.000Z',
  },
  {
    id: 'acc_li_01',
    platform: SocialSchedulerPlatform.LINKEDIN,
    displayName: 'Mantri Estates Corporate (LinkedIn)',
    platformAccountId: 'urn:li:organization:987213',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'REAUTH_REQUIRED',
    createdAt: '2026-09-01T10:10:00.000Z',
    updatedAt: '2026-09-01T10:10:00.000Z',
  },
];

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
  getPostById: (postId: string) => {
    const p = sprint1Storage.getPostById(postId);
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
