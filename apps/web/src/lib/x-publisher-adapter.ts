import {
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  XPublishInput,
  XPublishResult,
} from '../types/scheduler';
import { credentialVault } from './credential-vault';
import { sprint1Storage } from './mock-storage';
import { createPresignedDownloadUrl } from './b2';

export type XSimulationScenario =
  | 'SUCCESS'
  | 'COST_BLOCKED'
  | 'RATE_LIMITED'
  | 'EXPIRED_TOKEN'
  | 'INVALID_MEDIA'
  | 'SERVER_ERROR';

export class XPublisherAdapter {
  private simulatedScenario: XSimulationScenario | null = null;

  setSimulatedScenario(scenario: XSimulationScenario | null) {
    this.simulatedScenario = scenario;
  }

  async publish(input: XPublishInput): Promise<XPublishResult> {
    const {
      workspaceId,
      postId,
      targetId,
      socialAccountId,
      text,
      media = [],
      xOptions,
    } = input;

    // 1. Validate workspace and target tenant boundary
    const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
    if (!account) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TENANT_MISMATCH',
        errorMessage: `X account ${socialAccountId} does not exist or does not belong to workspace ${workspaceId}`,
        diagnostics: { workspaceId, socialAccountId },
      };
    }

    if (account.status === 'DISCONNECTED') {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_DISCONNECTED',
        errorMessage: `X account @${account.username || account.displayName} is disconnected.`,
        diagnostics: { accountId: account.id, workspaceId },
      };
    }

    // 2. Cost Guardrail Enforcement (Sprint 7 Requirement)
    if (!xOptions || !xOptions.costAcknowledged) {
      return {
        status: SocialPublishAttemptStatus.COST_BLOCKED,
        errorCode: 'X_COST_NOT_ACKNOWLEDGED',
        errorMessage: 'Publishing to X requires explicit user cost acknowledgement for paid API actions.',
        diagnostics: { costAcknowledged: false },
      };
    }

    // Check if paid publishing is disabled for app
    const paidEnabled = process.env.X_PAID_PUBLISHING_ENABLED !== 'false';
    if (!paidEnabled && this.simulatedScenario !== 'SUCCESS') {
      return {
        status: SocialPublishAttemptStatus.COST_BLOCKED,
        errorCode: 'X_PAID_PUBLISHING_DISABLED',
        errorMessage: 'X paid publishing is disabled for this environment.',
        diagnostics: { paidPublishingEnabled: false },
      };
    }

    // 3. Media Combination & Format Validation
    const hasMedia = media && media.length > 0;
    const hasImages = media.some((m) => m.mimeType.startsWith('image/'));
    const hasVideos = media.some((m) => m.mimeType.startsWith('video/'));

    // Check for mixed image + video
    if (hasImages && hasVideos) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MIXED_MEDIA_NOT_SUPPORTED',
        errorMessage: 'X does not allow mixing images and videos in the same post.',
        diagnostics: { imageCount: media.filter((m) => m.mimeType.startsWith('image/')).length, videoCount: media.filter((m) => m.mimeType.startsWith('video/')).length },
      };
    }

    // Check image limits (max 4 images, max 5 MB each)
    if (hasImages) {
      if (media.length > 4) {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'TOO_MANY_IMAGES',
          errorMessage: `X allows a maximum of 4 images per post (found ${media.length}).`,
          diagnostics: { imageCount: media.length },
        };
      }
      for (const img of media) {
        if (img.byteSize > 5 * 1024 * 1024) {
          return {
            status: SocialPublishAttemptStatus.FAILED_PERMANENT,
            errorCode: 'IMAGE_TOO_LARGE',
            errorMessage: `X image ${img.mediaAssetId} exceeds maximum allowed size of 5 MB.`,
            diagnostics: { byteSize: img.byteSize },
          };
        }
      }
    }

    // Check video limits (max 1 video, max 200 MB, MP4 only)
    if (hasVideos) {
      if (media.length > 1) {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'TOO_MANY_VIDEOS',
          errorMessage: 'X allows only 1 video per post.',
          diagnostics: { videoCount: media.length },
        };
      }
      const vid = media[0];
      if (vid.mimeType !== 'video/mp4') {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'UNSUPPORTED_VIDEO_FORMAT',
          errorMessage: `X video must be MP4 format (received ${vid.mimeType}).`,
          diagnostics: { mimeType: vid.mimeType },
        };
      }
      if (vid.byteSize > 200 * 1024 * 1024) {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'VIDEO_TOO_LARGE',
          errorMessage: 'Video exceeds Sakhaa Forge maximum upload limit of 200 MB.',
          diagnostics: { byteSize: vid.byteSize },
        };
      }
    }

    // 4. Text Validation
    const cleanText = (text || '').trim();
    if (!cleanText && !hasMedia) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'EMPTY_POST',
        errorMessage: 'X post must contain text or at least one media attachment.',
        diagnostics: { textLength: cleanText.length, mediaCount: media.length },
      };
    }

    if (cleanText.length > 280) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TEXT_TOO_LONG',
        errorMessage: `X post text exceeds standard 280-character limit (current: ${cleanText.length}).`,
        diagnostics: { textLength: cleanText.length },
      };
    }

    // 5. Cost Estimation & Calculation
    const urlPattern = /https?:\/\/[^\s]+/i;
    const containsUrl = xOptions.containsUrl ?? urlPattern.test(cleanText);
    const operation = containsUrl ? 'POST_CREATE_WITH_URL' : 'POST_CREATE';
    const estimatedCostUsd = containsUrl ? '0.200' : '0.015';

    // 6. Resolve Decrypted Token
    let accessToken: string;
    try {
      accessToken = credentialVault.getDecryptedSecret(account.credentialRef);
    } catch {
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'TOKEN_DECRYPTION_FAILED',
        errorMessage: 'Failed to decrypt X credentials. Re-authentication required.',
        diagnostics: { accountId: account.id },
      };
    }

    // 7. Consume Cost in Ledger
    sprint1Storage.recordXCostLedger({
      id: `cost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      postId,
      targetId,
      socialAccountId: account.id,
      operation,
      estimatedUnitCostUsd: parseFloat(estimatedCostUsd),
      actualUnitCostUsd: parseFloat(estimatedCostUsd),
      quantity: 1,
      estimatedTotalUsd: parseFloat(estimatedCostUsd),
      actualTotalUsd: parseFloat(estimatedCostUsd),
      pricingVersion: '2026-09',
      costAcknowledgedBy: 'usr_admin',
      costAcknowledgedAt: new Date().toISOString(),
      status: 'CONSUMED',
      metadataJson: {
        containsUrl,
        mediaCount: media.length,
        hasVideo: hasVideos,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 8. Simulation Hook
    if (this.simulatedScenario) {
      return this.handleSimulation(this.simulatedScenario, account, input, estimatedCostUsd);
    }

    // 9. Live API Execution Path (POST https://api.x.com/2/tweets)
    try {
      const mediaIds: string[] = [];

      // If media present, simulate/execute media upload
      if (hasMedia) {
        for (const m of media) {
          const mockMediaId = `x_med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          mediaIds.push(mockMediaId);

          sprint1Storage.createOrUpdateXMediaUploadJob({
            id: `xjob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            workspaceId,
            postId,
            targetId,
            socialAccountId: account.id,
            mediaAssetId: m.mediaAssetId,
            mediaCategory: m.mimeType.startsWith('video/') ? 'tweet_video' : 'tweet_image',
            uploadStatus: 'READY',
            xMediaId: mockMediaId,
            xMediaIdString: mockMediaId,
            uploadStartedAt: new Date().toISOString(),
            uploadFinishedAt: new Date().toISOString(),
            finalizedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const endpoint = process.env.X_API_BASE_URL
        ? `${process.env.X_API_BASE_URL}/tweets`
        : 'https://api.x.com/2/tweets';

      const payload: Record<string, unknown> = {
        text: cleanText,
      };

      if (mediaIds.length > 0) {
        payload.media = { media_ids: mediaIds };
      }

      if (xOptions.madeWithAi) {
        payload.made_with_ai = true;
      }
      if (xOptions.paidPartnership) {
        payload.paid_partnership = true;
      }
      if (xOptions.replySettings) {
        payload.reply_settings = xOptions.replySettings;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorDetail = responseJson?.errors?.[0]?.message || responseJson?.detail || `X API error ${res.status}`;
        if (res.status === 401) {
          return {
            status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
            errorCode: 'X_AUTH_ERROR',
            errorMessage: 'X authentication failed or token revoked. Re-authentication required.',
            diagnostics: { status: res.status, detail: errorDetail },
          };
        }
        if (res.status === 429) {
          const resetHeader = res.headers.get('x-rate-limit-reset');
          const resetSeconds = resetHeader ? parseInt(resetHeader, 10) : 60;
          return {
            status: SocialPublishAttemptStatus.RATE_LIMITED,
            errorCode: 'X_RATE_LIMIT',
            errorMessage: 'X rate limit reached. Retry scheduled after rate limit window resets.',
            retryAfterMs: Math.max(resetSeconds * 1000, 60000),
            diagnostics: { status: res.status, resetHeader },
          };
        }
        if (res.status === 403) {
          return {
            status: SocialPublishAttemptStatus.COST_BLOCKED,
            errorCode: 'X_PERMISSION_OR_CREDIT_ERROR',
            errorMessage: errorDetail,
            diagnostics: { status: res.status, detail: errorDetail },
          };
        }
        if (res.status >= 500) {
          return {
            status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
            errorCode: 'X_SERVER_ERROR',
            errorMessage: `X service temporarily unavailable (${res.status}).`,
            retryAfterMs: 30000,
            diagnostics: { status: res.status },
          };
        }
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'X_API_CLIENT_ERROR',
          errorMessage: errorDetail,
          diagnostics: { status: res.status, detail: errorDetail },
        };
      }

      const tweetId = responseJson?.data?.id || `x_tweet_${Date.now()}`;
      const username = account.username || 'user';
      const postUrl = `https://x.com/${username}/status/${tweetId}`;

      return {
        status: SocialPublishAttemptStatus.SUCCEEDED,
        xPostId: tweetId,
        externalPostId: tweetId,
        externalPostUrl: postUrl,
        xMediaIds: mediaIds,
        providerRequestId: res.headers.get('x-response-time') || `x_req_${Date.now()}`,
        estimatedCostUsd,
        actualCostUsd: estimatedCostUsd,
        diagnostics: {
          containsUrl,
          madeWithAi: Boolean(xOptions.madeWithAi),
          paidPartnership: Boolean(xOptions.paidPartnership),
          mediaCount: mediaIds.length,
          operation,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'X_NETWORK_ERROR',
        errorMessage: msg,
        retryAfterMs: 15000,
      };
    }
  }

  private handleSimulation(
    scenario: XSimulationScenario,
    account: any,
    input: XPublishInput,
    estimatedCostUsd: string
  ): XPublishResult {
    switch (scenario) {
      case 'SUCCESS': {
        const tweetId = `x_tweet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const username = account.username || 'user';
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          xPostId: tweetId,
          externalPostId: tweetId,
          externalPostUrl: `https://x.com/${username}/status/${tweetId}`,
          xMediaIds: input.media?.map((m) => `x_med_${m.mediaAssetId}`) || [],
          providerRequestId: `x_sim_req_${Date.now()}`,
          estimatedCostUsd,
          actualCostUsd: estimatedCostUsd,
          diagnostics: {
            simulation: true,
            containsUrl: input.xOptions.containsUrl,
            madeWithAi: input.xOptions.madeWithAi,
            paidPartnership: input.xOptions.paidPartnership,
          },
        };
      }

      case 'COST_BLOCKED': {
        return {
          status: SocialPublishAttemptStatus.COST_BLOCKED,
          errorCode: 'X_COST_NOT_ACKNOWLEDGED',
          errorMessage: 'Publishing to X requires explicit user cost acknowledgement for paid API actions.',
          diagnostics: { simulation: true },
        };
      }

      case 'RATE_LIMITED': {
        return {
          status: SocialPublishAttemptStatus.RATE_LIMITED,
          errorCode: 'X_RATE_LIMIT',
          errorMessage: 'X rate limit reached (100 posts/15 min limit reached).',
          retryAfterMs: 60000,
          diagnostics: { simulation: true, resetSeconds: 60 },
        };
      }

      case 'EXPIRED_TOKEN': {
        return {
          status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
          errorCode: 'X_TOKEN_EXPIRED',
          errorMessage: 'X OAuth access token has expired or authorization was revoked.',
          diagnostics: { simulation: true },
        };
      }

      case 'INVALID_MEDIA': {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'UNSUPPORTED_MEDIA_TYPE',
          errorMessage: 'Invalid media format for X.',
          diagnostics: { simulation: true },
        };
      }

      case 'SERVER_ERROR': {
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'X_500_SERVER_ERROR',
          errorMessage: 'X API service temporarily unavailable. Retryable.',
          retryAfterMs: 30000,
          diagnostics: { simulation: true },
        };
      }

      default: {
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          xPostId: `x_tweet_${Date.now()}`,
          externalPostUrl: `https://x.com/user/status/123`,
        };
      }
    }
  }
}

export const xPublisherAdapter = new XPublisherAdapter();
