import {
  SocialSchedulerPlatform,
  SocialPublishAttemptStatus,
  SocialAccountStatus,
  PinterestRateLimitInfo,
} from '../types/scheduler';
import { sprint1Storage } from './mock-storage';
import { credentialVault, sanitizePayload } from './credential-vault';
import { b2Storage } from './b2';

export interface PinterestPublishInput {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: SocialSchedulerPlatform.PINTEREST;
  publishMode: 'LIVE_PINTEREST';
  socialAccountId: string;
  pinterestAccountId?: string;
  boardId: string;
  boardSectionId?: string | null;
  title: string;
  description: string;
  destinationLink?: string | null;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  draftContentJson?: any;
  platformOptionsJson?: any;
}

export interface PinterestPublishResult {
  status: SocialPublishAttemptStatus;
  externalPostId?: string;
  externalPostUrl?: string;
  providerRequestId?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  rateLimit?: PinterestRateLimitInfo;
  diagnostics?: Record<string, unknown>;
}

export type SimulatedPinterestScenario =
  | 'SUCCESS'
  | 'RATE_LIMIT'
  | 'EXPIRED_TOKEN'
  | 'INVALID_BOARD'
  | 'UNSUPPORTED_MEDIA'
  | 'SERVER_ERROR';

export class PinterestPublisherAdapter {
  private simulatedScenario: SimulatedPinterestScenario | null = null;

  public setSimulatedScenario(scenario: SimulatedPinterestScenario | null) {
    this.simulatedScenario = scenario;
  }

  /**
   * Publish an image Pin to a selected Pinterest board
   */
  public async publish(input: PinterestPublishInput): Promise<PinterestPublishResult> {
    const { workspaceId, socialAccountId, boardId, media, title, description } = input;

    // 1. Account & Workspace Verification
    const account = sprint1Storage.getSocialAccountById(socialAccountId);
    if (!account) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_NOT_FOUND',
        errorMessage: `Pinterest account ${socialAccountId} was not found`,
      };
    }

    if (account.workspaceId !== workspaceId) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'TENANT_MISMATCH',
        errorMessage: 'Pinterest account does not belong to the target workspace',
      };
    }

    if (account.status === SocialAccountStatus.DISCONNECTED) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_DISCONNECTED',
        errorMessage: `Pinterest account @${account.username || account.displayName} is disconnected`,
      };
    }

    if (account.status === SocialAccountStatus.REAUTH_REQUIRED) {
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'REAUTH_REQUIRED',
        errorMessage: `Pinterest account @${account.username || account.displayName} requires re-authorization`,
      };
    }

    // 2. Token Retrieval
    const accessToken = credentialVault.getToken(account.credentialRef);
    if (!accessToken) {
      sprint1Storage.updateSocialAccount(account.id, workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'TOKEN_VAULT_EMPTY',
        errorMessage: 'Decrypted Pinterest access token not found in credential vault',
      };
    }

    // 3. Board Ownership Validation
    const board = sprint1Storage.getPinterestBoardById(boardId);
    if (!board) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'INVALID_BOARD_ID',
        errorMessage: `Selected Pinterest board ${boardId} not found or no longer accessible`,
      };
    }

    if (board.workspaceId !== workspaceId || board.socialAccountId !== account.id) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'BOARD_TENANT_MISMATCH',
        errorMessage: 'The selected board belongs to another client workspace or Pinterest account',
      };
    }

    // 4. Media Format Validation (Sprint 5: Image Pins only)
    if (!media || media.length === 0) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_MEDIA',
        errorMessage: 'Pinterest Pin publishing requires an image media asset',
      };
    }

    const primaryMedia = media[0];
    const isVideo = primaryMedia.mimeType.startsWith('video/');
    if (isVideo) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_MEDIA_TYPE',
        errorMessage: 'Video Pins are not supported in Sprint 5. Please use a JPEG or PNG image.',
      };
    }

    const isSupportedImage =
      primaryMedia.mimeType === 'image/jpeg' ||
      primaryMedia.mimeType === 'image/png' ||
      primaryMedia.mimeType === 'image/webp';

    if (!isSupportedImage) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_MEDIA_FORMAT',
        errorMessage: 'Pinterest image Pins only support JPEG or PNG images.',
      };
    }

    // 5. Title & Content Validation
    const finalTitle = title || input.draftContentJson?.title || input.draftContentJson?.caption?.slice(0, 100);
    if (!finalTitle || finalTitle.trim().length === 0) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_PIN_TITLE',
        errorMessage: 'Pinterest Pin title is required',
      };
    }

    const finalDescription = description || input.draftContentJson?.caption || '';

    // 6. Handle Simulated Scenarios
    if (this.simulatedScenario) {
      return this.handleSimulatedScenario(account, board);
    }

    // 7. Live Pinterest API V5 Execution
    try {
      const baseUrl = process.env.PINTEREST_API_BASE_URL || 'https://api.pinterest.com/v5';
      const presignedUrl = await b2Storage.getPresignedDownloadUrl(primaryMedia.objectKey, 3600);

      const pinPayload: Record<string, any> = {
        board_id: board.externalBoardId,
        title: finalTitle.slice(0, 100),
        description: finalDescription.slice(0, 800),
        media_source: {
          source_type: 'image_url',
          url: presignedUrl,
        },
      };

      if (input.destinationLink) {
        pinPayload.link = input.destinationLink;
      }
      if (input.boardSectionId) {
        pinPayload.board_section_id = input.boardSectionId;
      }

      const res = await fetch(`${baseUrl}/pins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(pinPayload),
      });

      const rateLimitInfo: PinterestRateLimitInfo = {
        limit: res.headers.get('x-ratelimit-limit') || undefined,
        remaining: res.headers.get('x-ratelimit-remaining') || undefined,
        reset: res.headers.get('x-ratelimit-reset') || undefined,
        provider: 'pinterest',
      };

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return this.classifyPinterestError(res.status, data, rateLimitInfo, account);
      }

      const pinId = data.id || `pin_${Date.now()}`;
      const pinUrl = data.link || `https://www.pinterest.com/pin/${pinId}/`;

      return {
        status: SocialPublishAttemptStatus.SUCCEEDED,
        externalPostId: pinId,
        externalPostUrl: pinUrl,
        providerRequestId: data.client_request_id || res.headers.get('x-pinterest-rid') || undefined,
        rateLimit: rateLimitInfo,
        diagnostics: sanitizePayload({
          pinId,
          boardId: board.externalBoardId,
          pinType: 'IMAGE',
          rateLimit: rateLimitInfo,
        }),
      };
    } catch (err: unknown) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Network error communicating with Pinterest API',
      };
    }
  }

  private handleSimulatedScenario(account: any, board: any): PinterestPublishResult {
    const mockPinId = `pin_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const mockPinUrl = `https://www.pinterest.com/pin/${mockPinId}/`;

    switch (this.simulatedScenario) {
      case 'SUCCESS':
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          externalPostId: mockPinId,
          externalPostUrl: mockPinUrl,
          rateLimit: {
            limit: '100',
            remaining: '95',
            reset: '60',
            provider: 'pinterest',
          },
          diagnostics: {
            simulated: true,
            boardName: board.name,
            pinId: mockPinId,
          },
        };

      case 'RATE_LIMIT':
        return {
          status: SocialPublishAttemptStatus.RATE_LIMITED,
          errorCode: 'PINTEREST_RATE_LIMIT',
          providerErrorCode: '429',
          errorMessage: 'Pinterest write rate limit exceeded. Retry scheduled.',
          retryAfterMs: 60000,
          rateLimit: {
            limit: '100',
            remaining: '0',
            reset: '60',
            provider: 'pinterest',
          },
        };

      case 'EXPIRED_TOKEN':
        sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
          status: SocialAccountStatus.REAUTH_REQUIRED,
        });
        return {
          status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
          errorCode: 'PINTEREST_TOKEN_EXPIRED',
          providerErrorCode: '401',
          errorMessage: 'Pinterest access token is expired or was revoked',
        };

      case 'INVALID_BOARD':
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'INVALID_BOARD_ID',
          providerErrorCode: '404',
          errorMessage: 'Pinterest board not found or not owned by account',
        };

      case 'UNSUPPORTED_MEDIA':
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'UNSUPPORTED_MEDIA_TYPE',
          providerErrorCode: '400',
          errorMessage: 'Pinterest image Pins require a JPEG or PNG image',
        };

      case 'SERVER_ERROR':
      default:
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'PINTEREST_SERVER_ERROR',
          providerErrorCode: '500',
          errorMessage: 'Pinterest internal server error. Retry scheduled.',
          retryAfterMs: 60000,
        };
    }
  }

  private classifyPinterestError(
    status: number,
    errorData: any,
    rateLimit: PinterestRateLimitInfo,
    account: any
  ): PinterestPublishResult {
    const code = errorData?.code || status;
    const message = errorData?.message || 'Pinterest API request failed';

    if (status === 401 || code === 401) {
      sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'PINTEREST_TOKEN_EXPIRED',
        providerErrorCode: `${status}`,
        errorMessage: message,
        rateLimit,
      };
    }

    if (status === 429 || code === 429) {
      const resetSeconds = parseInt(rateLimit.reset || '60', 10);
      return {
        status: SocialPublishAttemptStatus.RATE_LIMITED,
        errorCode: 'PINTEREST_RATE_LIMIT',
        providerErrorCode: `${status}`,
        errorMessage: message,
        retryAfterMs: resetSeconds * 1000,
        rateLimit,
      };
    }

    if (status >= 500) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        errorCode: 'PINTEREST_SERVER_ERROR',
        providerErrorCode: `${status}`,
        errorMessage: message,
        retryAfterMs: 60000,
        rateLimit,
      };
    }

    // Default 4xx client errors are permanent
    return {
      status: SocialPublishAttemptStatus.FAILED_PERMANENT,
      errorCode: 'PINTEREST_API_ERROR',
      providerErrorCode: `${status}`,
      errorMessage: message,
      rateLimit,
    };
  }
}

export const pinterestPublisherAdapter = new PinterestPublisherAdapter();
