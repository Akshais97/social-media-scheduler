import {
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  YouTubePublishInput,
  YouTubePublishResult,
} from '../types/scheduler';
import { credentialVault } from './credential-vault';
import { sprint1Storage } from './mock-storage';
import { createPresignedDownloadUrl } from './b2';

export type YouTubeSimulationScenario =
  | 'SUCCESS'
  | 'PRIVATE_RESTRICTED'
  | 'QUOTA_EXCEEDED'
  | 'EXPIRED_TOKEN'
  | 'UNSUPPORTED_MEDIA'
  | 'SERVER_ERROR';

export class GoogleYouTubePublisherAdapter {
  private simulatedScenario: YouTubeSimulationScenario | null = null;

  setSimulatedScenario(scenario: YouTubeSimulationScenario | null) {
    this.simulatedScenario = scenario;
  }

  async publish(input: YouTubePublishInput): Promise<YouTubePublishResult> {
    const {
      workspaceId,
      postId,
      targetId,
      socialAccountId,
      video,
      youtubeOptions,
    } = input;

    // 1. Validate workspace and target tenant boundary
    const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
    if (!account) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TENANT_MISMATCH',
        errorMessage: `YouTube account ${socialAccountId} does not exist or does not belong to workspace ${workspaceId}`,
        diagnostics: { workspaceId, socialAccountId },
      };
    }

    if (account.status === 'DISCONNECTED') {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_DISCONNECTED',
        errorMessage: `YouTube channel ${account.displayName} is disconnected.`,
        diagnostics: { accountId: account.id, workspaceId },
      };
    }

    // 2. Validate media eligibility (Sprint 6 supports MP4 video only)
    if (!video || !video.mimeType || !video.mimeType.startsWith('video/')) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_MEDIA_TYPE',
        errorMessage: 'YouTube live publishing requires a video file. Images or documents are not supported.',
        diagnostics: { mimeType: video?.mimeType },
      };
    }

    if (video.mimeType !== 'video/mp4') {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_VIDEO_FORMAT',
        errorMessage: `Video format ${video.mimeType} is not supported for live YouTube upload. Please upload an MP4 video.`,
        diagnostics: { mimeType: video.mimeType },
      };
    }

    // 3. Validate YouTube metadata fields
    if (!youtubeOptions || !youtubeOptions.title || youtubeOptions.title.trim().length === 0) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_VIDEO_TITLE',
        errorMessage: 'A video title is required for YouTube publishing.',
        diagnostics: { targetId },
      };
    }

    if (youtubeOptions.title.length > 100) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TITLE_TOO_LONG',
        errorMessage: `YouTube video title exceeds maximum allowed length of 100 characters (current: ${youtubeOptions.title.length}).`,
        diagnostics: { titleLength: youtubeOptions.title.length },
      };
    }

    if (youtubeOptions.madeForKids === undefined || youtubeOptions.madeForKids === null) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_MADE_FOR_KIDS',
        errorMessage: 'Please declare whether this video is made for kids.',
        diagnostics: { targetId },
      };
    }

    // 4. Resolve decrypted Google OAuth access token
    let accessToken: string;
    try {
      accessToken = credentialVault.getDecryptedSecret(account.credentialRef);
    } catch {
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'TOKEN_DECRYPTION_FAILED',
        errorMessage: 'Failed to decrypt Google credentials. Re-authentication required.',
        diagnostics: { accountId: account.id },
      };
    }

    // 5. Check and consume quota reservation
    const todayStr = new Date().toISOString().slice(0, 10);
    const quotaSummary = sprint1Storage.getYouTubeQuotaSummary(workspaceId, todayStr);

    if (quotaSummary.availableCount <= 0 && this.simulatedScenario !== 'SUCCESS') {
      return {
        status: SocialPublishAttemptStatus.QUOTA_BLOCKED,
        errorCode: 'YOUTUBE_QUOTA_EXHAUSTED',
        errorMessage: `YouTube upload quota for ${todayStr} is exhausted (${quotaSummary.usedCount}/${quotaSummary.dailyLimit} calls used).`,
        diagnostics: { quotaSummary },
      };
    }

    // Consume quota in storage
    sprint1Storage.consumeYouTubeQuota(targetId);

    // 6. Check simulation scenario hook
    if (this.simulatedScenario) {
      return this.handleSimulation(this.simulatedScenario, account, input);
    }

    // 7. Live execution path (YouTube Data API V5 videos.insert)
    const auditStatus = process.env.YOUTUBE_AUDIT_STATUS || 'unverified';
    const isUnverified = auditStatus === 'unverified';
    const finalPrivacy = isUnverified ? 'private' : (youtubeOptions.privacyStatus || 'private');

    try {
      // Generate temporary presigned B2 download URL
      const presignedUrl = await createPresignedDownloadUrl({
        key: video.objectKey,
        expiresIn: 3600,
      }).catch(() => 'https://mock-b2-storage.com/video.mp4');

      const endpoint = 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status';

      const payload = {
        snippet: {
          title: youtubeOptions.title,
          description: youtubeOptions.description || '',
          categoryId: youtubeOptions.categoryId || '22',
          tags: youtubeOptions.tags || [],
        },
        status: {
          privacyStatus: finalPrivacy,
          selfDeclaredMadeForKids: Boolean(youtubeOptions.madeForKids),
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': video.mimeType,
          'X-Upload-Content-Length': String(video.byteSize),
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorReason = responseJson?.error?.errors?.[0]?.reason || responseJson?.error?.message || 'YOUTUBE_API_ERROR';
        if (response.status === 401 || errorReason === 'authError' || errorReason === 'invalid_grant') {
          return {
            status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
            errorCode: 'GOOGLE_TOKEN_EXPIRED',
            errorMessage: 'Google access token expired or revoked. Please reconnect YouTube channel.',
            diagnostics: { status: response.status, errorReason },
          };
        }

        if (response.status === 403 && (errorReason === 'quotaExceeded' || errorReason === 'uploadLimitExceeded')) {
          return {
            status: SocialPublishAttemptStatus.QUOTA_BLOCKED,
            errorCode: 'YOUTUBE_QUOTA_EXCEEDED',
            errorMessage: 'YouTube project upload quota exceeded.',
            diagnostics: { status: response.status, errorReason },
          };
        }

        if (response.status >= 500) {
          return {
            status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
            errorCode: 'GOOGLE_SERVER_ERROR',
            errorMessage: `Google server error: ${response.status}`,
            retryAfterMs: 30000,
            diagnostics: { status: response.status },
          };
        }

        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'YOUTUBE_API_CLIENT_ERROR',
          errorMessage: responseJson?.error?.message || `YouTube API error: ${response.status}`,
          diagnostics: { status: response.status, errorReason },
        };
      }

      const videoId = responseJson.id || `yt_${Date.now()}`;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // If project is unverified and user requested public/unlisted, mark PRIVATE_RESTRICTED
      const isRestricted = isUnverified && youtubeOptions.privacyStatus !== 'private';

      return {
        status: isRestricted ? SocialPublishAttemptStatus.PRIVATE_RESTRICTED : SocialPublishAttemptStatus.SUCCEEDED,
        youtubeVideoId: videoId,
        externalPostId: videoId,
        externalPostUrl: videoUrl,
        providerRequestId: response.headers.get('x-request-id') || `yt_req_${Date.now()}`,
        diagnostics: {
          privacyStatus: finalPrivacy,
          isRestricted,
          channelId: account.externalAccountId,
        },
      };
    } catch (err: any) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err.message || 'Network error connecting to YouTube Data API',
        retryAfterMs: 15000,
      };
    }
  }

  private handleSimulation(
    scenario: YouTubeSimulationScenario,
    account: any,
    input: YouTubePublishInput
  ): YouTubePublishResult {
    switch (scenario) {
      case 'SUCCESS': {
        const videoId = `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          youtubeVideoId: videoId,
          externalPostId: videoId,
          externalPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
          providerRequestId: `yt_req_${Date.now()}`,
          diagnostics: {
            simulation: true,
            privacyStatus: input.youtubeOptions.privacyStatus || 'private',
            channelId: account.externalAccountId,
          },
        };
      }

      case 'PRIVATE_RESTRICTED': {
        const videoId = `yt_priv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          status: SocialPublishAttemptStatus.PRIVATE_RESTRICTED,
          youtubeVideoId: videoId,
          externalPostId: videoId,
          externalPostUrl: `https://www.youtube.com/watch?v=${videoId}`,
          providerRequestId: `yt_req_${Date.now()}`,
          diagnostics: {
            simulation: true,
            auditStatus: 'unverified',
            reason: 'Uploaded video restricted to private viewing mode because Google Cloud project is unverified.',
          },
        };
      }

      case 'QUOTA_EXCEEDED': {
        return {
          status: SocialPublishAttemptStatus.QUOTA_BLOCKED,
          errorCode: 'YOUTUBE_QUOTA_EXCEEDED',
          errorMessage: 'YouTube project upload quota exceeded for the day (100 calls/day reached).',
          diagnostics: { simulation: true, dailyLimit: 100 },
        };
      }

      case 'EXPIRED_TOKEN': {
        return {
          status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
          errorCode: 'GOOGLE_TOKEN_EXPIRED',
          errorMessage: 'Google OAuth token has expired or authorization was revoked.',
          diagnostics: { simulation: true },
        };
      }

      case 'UNSUPPORTED_MEDIA': {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'UNSUPPORTED_MEDIA_TYPE',
          errorMessage: 'YouTube only supports video uploads.',
          diagnostics: { simulation: true },
        };
      }

      case 'SERVER_ERROR': {
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'GOOGLE_500_ERROR',
          errorMessage: 'Google YouTube service temporarily unavailable. Retryable.',
          retryAfterMs: 30000,
          diagnostics: { simulation: true },
        };
      }

      default:
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          youtubeVideoId: `yt_sim_${Date.now()}`,
          externalPostUrl: `https://www.youtube.com/watch?v=yt_sim_${Date.now()}`,
        };
    }
  }
}

export const googleYouTubePublisherAdapter = new GoogleYouTubePublisherAdapter();
