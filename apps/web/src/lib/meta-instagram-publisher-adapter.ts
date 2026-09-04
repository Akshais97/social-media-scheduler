import {
  SocialSchedulerPlatform,
  SocialPublishAttemptStatus,
  SocialAccountStatus,
  SocialAccountProvider,
  InstagramFormat,
  InstagramContainerStatus,
  InstagramPublishingLimit,
} from '../types/scheduler';
import { sprint1Storage } from './mock-storage';
import { credentialVault, sanitizePayload } from './credential-vault';
import { b2Storage } from './b2';

export interface InstagramPublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform.INSTAGRAM;
  publishMode: 'LIVE_META';
  socialAccountId: string;
  igUserId: string;
  caption: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  instagramFormat?: InstagramFormat | 'FEED_IMAGE' | 'REEL_VIDEO' | string;
  draftContentJson?: any;
}

export interface InstagramPublishResult {
  status: SocialPublishAttemptStatus;
  containerId?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  diagnostics?: Record<string, unknown>;
  platformLifecycleStage?: 'CREATE_CONTAINER' | 'POLL_CONTAINER' | 'PUBLISH_CONTAINER';
}

export type SimulatedInstagramScenario =
  | 'SUCCESS_IMAGE'
  | 'SUCCESS_VIDEO'
  | 'PROCESSING_THEN_READY'
  | 'LIMIT_REACHED'
  | 'EXPIRED_TOKEN'
  | 'UNSUPPORTED_MEDIA'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR';

export class MetaInstagramPublisherAdapter {
  private simulatedScenario: SimulatedInstagramScenario | null = null;
  private processingContainerTracker: Map<string, number> = new Map();

  /**
   * Set simulated scenario for unit tests and local QA
   */
  public setSimulatedScenario(scenario: SimulatedInstagramScenario | null) {
    this.simulatedScenario = scenario;
  }

  /**
   * Check content publishing limit for the Instagram User
   */
  public async checkPublishingLimit(
    igUserId: string,
    accessToken: string
  ): Promise<InstagramPublishingLimit> {
    if (this.simulatedScenario === 'LIMIT_REACHED') {
      return {
        quotaUsage: 50,
        quotaTotal: 50,
        quotaDuration: 86400,
      };
    }

    if (this.simulatedScenario) {
      return {
        quotaUsage: 5,
        quotaTotal: 50,
        quotaDuration: 86400,
      };
    }

    try {
      const graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';
      const url = `https://graph.facebook.com/${graphVersion}/${igUserId}/content_publishing_limit?fields=quota_usage,quota_total,quota_duration`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        return { quotaUsage: 0, quotaTotal: 50 };
      }

      const data = await res.json();
      const quotaData = data.data?.[0] || {};
      return {
        quotaUsage: quotaData.quota_usage ?? 0,
        quotaTotal: quotaData.quota_total ?? 50,
        quotaDuration: quotaData.quota_duration ?? 86400,
      };
    } catch {
      return { quotaUsage: 0, quotaTotal: 50 };
    }
  }

  /**
   * Publish single image or video/Reel post to Instagram
   */
  public async publish(input: InstagramPublishInput): Promise<InstagramPublishResult> {
    const { workspaceId, socialAccountId, media, caption } = input;

    // 1. Verify Social Account
    const account = sprint1Storage.getSocialAccountById(socialAccountId);
    if (!account) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_NOT_FOUND',
        errorMessage: `Instagram account ${socialAccountId} was not found`,
      };
    }

    if (account.workspaceId !== workspaceId) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TENANT_MISMATCH',
        errorMessage: 'Instagram account does not belong to the target workspace',
      };
    }

    if (account.status === SocialAccountStatus.DISCONNECTED) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_DISCONNECTED',
        errorMessage: `Instagram account @${account.username || account.displayName} is disconnected`,
      };
    }

    if (account.status === SocialAccountStatus.REAUTH_REQUIRED) {
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'REAUTH_REQUIRED',
        errorMessage: `Instagram account @${account.username || account.displayName} requires re-authorization`,
      };
    }

    // 2. Resolve Page/User Access Token from Credential Vault
    const accessToken = credentialVault.getToken(account.credentialRef);
    if (!accessToken) {
      sprint1Storage.updateSocialAccount(account.id, workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'TOKEN_VAULT_EMPTY',
        errorMessage: 'Decrypted access token not found in credential vault',
      };
    }

    // 3. Format & Media Validation
    if (!media || media.length === 0) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_MEDIA',
        errorMessage: 'Instagram publishing requires at least one media asset',
      };
    }

    const primaryMedia = media[0];
    const isVideo = primaryMedia.mimeType.startsWith('video/');
    const isImage = primaryMedia.mimeType.startsWith('image/');
    const format = input.instagramFormat || (isVideo ? 'REEL_VIDEO' : 'FEED_IMAGE');

    if (format === 'FEED_IMAGE' && !isImage) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'INVALID_MEDIA_FORMAT',
        errorMessage: 'Feed image format requires an image media asset (JPEG/PNG)',
      };
    }

    if (format === 'REEL_VIDEO' && !isVideo) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'INVALID_MEDIA_FORMAT',
        errorMessage: 'Reel / video format requires a video media asset (MP4)',
      };
    }

    // 4. Content Publishing Limit Check
    const igUserId = account.externalAccountId;
    const limit = await this.checkPublishingLimit(igUserId, accessToken);
    if (limit.quotaUsage >= limit.quotaTotal) {
      return {
        status: SocialPublishAttemptStatus.LIMIT_REACHED,
        errorCode: 'INSTAGRAM_PUBLISHING_LIMIT_REACHED',
        errorMessage: `Instagram publishing limit reached (${limit.quotaUsage}/${limit.quotaTotal}). Retry scheduled.`,
        retryAfterMs: 3600000, // 1 hour
        diagnostics: {
          quotaUsage: limit.quotaUsage,
          quotaTotal: limit.quotaTotal,
        },
      };
    }

    // 5. Handle Simulated Scenarios for Deterministic Testing
    if (this.simulatedScenario) {
      return this.handleSimulatedScenario(input, account, isVideo);
    }

    // 6. Live Meta Graph API Execution
    try {
      const graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';

      // Step A: Generate short-lived presigned B2 URL
      const presignedUrl = await b2Storage.getPresignedDownloadUrl(primaryMedia.objectKey, 3600);

      // Step B: Create Media Container
      let containerBody: Record<string, string>;
      if (isVideo) {
        containerBody = {
          media_type: 'REELS',
          video_url: presignedUrl,
          caption: caption || '',
        };
      } else {
        containerBody = {
          image_url: presignedUrl,
          caption: caption || '',
        };
      }

      const containerRes = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(containerBody),
        }
      );

      const containerData = await containerRes.json();
      if (!containerRes.ok || !containerData.id) {
        return this.classifyGraphError(containerData, account, 'CREATE_CONTAINER');
      }

      const containerId = containerData.id;

      // Track container in storage
      sprint1Storage.createInstagramContainer({
        workspaceId,
        postId: input.postId,
        targetId: input.targetId,
        socialAccountId: account.id,
        igUserId,
        containerId,
        mediaType: isVideo ? 'REELS' : 'IMAGE',
        status: InstagramContainerStatus.CREATED,
      });

      // Step C: Poll container if video
      if (isVideo) {
        let isReady = false;
        const maxPolls = 10;
        for (let i = 0; i < maxPolls; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          const statusRes = await fetch(
            `https://graph.facebook.com/${graphVersion}/${containerId}?fields=status_code,status`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const statusData = await statusRes.json();
          if (statusData.status_code === 'FINISHED') {
            isReady = true;
            break;
          }
          if (statusData.status_code === 'ERROR') {
            return {
              status: SocialPublishAttemptStatus.FAILED_PERMANENT,
              errorCode: 'INSTAGRAM_CONTAINER_ERROR',
              errorMessage: statusData.status || 'Instagram media processing failed',
              containerId,
            };
          }
        }

        if (!isReady) {
          sprint1Storage.updateInstagramContainer(containerId, {
            status: InstagramContainerStatus.IN_PROGRESS,
          });
          return {
            status: SocialPublishAttemptStatus.PLATFORM_PROCESSING,
            errorCode: 'CONTAINER_PROCESSING',
            errorMessage: 'Instagram video container is still processing. Retrying shortly.',
            containerId,
            retryAfterMs: 60000,
            platformLifecycleStage: 'POLL_CONTAINER',
          };
        }
      }

      // Step D: Publish Container
      const publishRes = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ creation_id: containerId }),
        }
      );

      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.id) {
        return this.classifyGraphError(publishData, account, 'PUBLISH_CONTAINER');
      }

      const mediaId = publishData.id;
      const permalink = `https://www.instagram.com/p/${mediaId}/`;

      sprint1Storage.updateInstagramContainer(containerId, {
        status: InstagramContainerStatus.PUBLISHED,
        publishedAt: new Date().toISOString(),
      });

      return {
        status: SocialPublishAttemptStatus.SUCCEEDED,
        containerId,
        externalPostId: mediaId,
        externalPostUrl: permalink,
        platformLifecycleStage: 'PUBLISH_CONTAINER',
        diagnostics: sanitizePayload({
          containerId,
          mediaId,
          quotaUsage: limit.quotaUsage + 1,
        }),
      };
    } catch (err: unknown) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Network error communicating with Meta Graph API',
      };
    }
  }

  /**
   * Simulated scenario execution for deterministic unit tests
   */
  private handleSimulatedScenario(
    input: InstagramPublishInput,
    account: any,
    isVideo: boolean
  ): InstagramPublishResult {
    const mockContainerId = `ig_cnt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mockMediaId = `1799${Date.now()}`;
    const mockPermalink = `https://www.instagram.com/p/${mockMediaId}/`;

    switch (this.simulatedScenario) {
      case 'SUCCESS_IMAGE':
      case 'SUCCESS_VIDEO': {
        sprint1Storage.createInstagramContainer({
          workspaceId: input.workspaceId,
          postId: input.postId,
          targetId: input.targetId,
          socialAccountId: account.id,
          igUserId: account.externalAccountId,
          containerId: mockContainerId,
          mediaType: isVideo ? 'REELS' : 'IMAGE',
          status: InstagramContainerStatus.PUBLISHED,
          publishedAt: new Date().toISOString(),
        });

        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          containerId: mockContainerId,
          externalPostId: mockMediaId,
          externalPostUrl: mockPermalink,
          platformLifecycleStage: 'PUBLISH_CONTAINER',
          diagnostics: {
            simulated: true,
            scenario: this.simulatedScenario,
            containerId: mockContainerId,
          },
        };
      }

      case 'PROCESSING_THEN_READY': {
        const pollCount = this.processingContainerTracker.get(input.targetId) || 0;
        if (pollCount === 0) {
          this.processingContainerTracker.set(input.targetId, 1);
          sprint1Storage.createInstagramContainer({
            workspaceId: input.workspaceId,
            postId: input.postId,
            targetId: input.targetId,
            socialAccountId: account.id,
            igUserId: account.externalAccountId,
            containerId: mockContainerId,
            mediaType: 'REELS',
            status: InstagramContainerStatus.IN_PROGRESS,
          });

          return {
            status: SocialPublishAttemptStatus.PLATFORM_PROCESSING,
            containerId: mockContainerId,
            errorCode: 'CONTAINER_PROCESSING',
            errorMessage: 'Instagram video container is processing. Retrying shortly.',
            retryAfterMs: 30000,
            platformLifecycleStage: 'POLL_CONTAINER',
          };
        }

        // On subsequent run: Success!
        this.processingContainerTracker.delete(input.targetId);
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          containerId: mockContainerId,
          externalPostId: mockMediaId,
          externalPostUrl: mockPermalink,
          platformLifecycleStage: 'PUBLISH_CONTAINER',
        };
      }

      case 'EXPIRED_TOKEN': {
        sprint1Storage.updateSocialAccount(account.id, input.workspaceId, {
          status: SocialAccountStatus.REAUTH_REQUIRED,
        });

        return {
          status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
          errorCode: 'META_SESSION_EXPIRED',
          providerErrorCode: '190',
          errorMessage: 'Error validating access token: Session has expired or token was revoked',
        };
      }

      case 'UNSUPPORTED_MEDIA': {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'UNSUPPORTED_MEDIA_FORMAT',
          providerErrorCode: '2207001',
          errorMessage: 'Instagram does not support this media format or aspect ratio',
        };
      }

      case 'RATE_LIMIT': {
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'META_RATE_LIMIT',
          providerErrorCode: '341',
          errorMessage: 'Application request limit reached. Please try again later.',
          retryAfterMs: 300000,
        };
      }

      case 'SERVER_ERROR':
      default: {
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'META_INTERNAL_ERROR',
          providerErrorCode: '2',
          errorMessage: 'Meta temporary service failure',
          retryAfterMs: 60000,
        };
      }
    }
  }

  /**
   * Classify Meta Graph API errors into structured status codes
   */
  private classifyGraphError(
    errorJson: any,
    account: any,
    stage: 'CREATE_CONTAINER' | 'PUBLISH_CONTAINER'
  ): InstagramPublishResult {
    const error = errorJson?.error || {};
    const code = error.code;
    const subcode = error.error_subcode;
    const message = error.message || 'Meta Graph API error';

    // 190 / 102 / subcode 463/467 -> Session expired
    if (code === 190 || code === 102 || subcode === 463 || subcode === 467 || subcode === 460) {
      sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });

      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'META_SESSION_EXPIRED',
        providerErrorCode: `${code}`,
        errorMessage: message,
        platformLifecycleStage: stage,
      };
    }

    // Rate limits (4, 17, 341)
    if (code === 4 || code === 17 || code === 341) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'META_RATE_LIMIT',
        providerErrorCode: `${code}`,
        errorMessage: message,
        retryAfterMs: 300000,
        platformLifecycleStage: stage,
      };
    }

    // Unsupported media (2207001, 2207003)
    if (code === 2207001 || code === 2207003 || code === 36003) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_MEDIA',
        providerErrorCode: `${code}`,
        errorMessage: message,
        platformLifecycleStage: stage,
      };
    }

    // Default: permanent error for client error 4xx, retryable for 5xx
    const isClientError = code >= 100 && code < 500;
    return {
      status: isClientError
        ? SocialPublishAttemptStatus.FAILED_PERMANENT
        : SocialPublishAttemptStatus.FAILED_RETRYABLE,
      errorCode: 'META_GRAPH_ERROR',
      providerErrorCode: `${code}`,
      errorMessage: message,
      platformLifecycleStage: stage,
    };
  }
}

export const metaInstagramPublisherAdapter = new MetaInstagramPublisherAdapter();
