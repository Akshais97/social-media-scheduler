import {
  PublishInput,
  PublishResult,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  SocialAccountStatus,
} from '../types/scheduler';
import { sprint1Storage } from './mock-storage';
import { credentialVault, sanitizePayload } from './credential-vault';
import { b2Storage } from './b2';

export interface MetaAdapterConfig {
  graphVersion?: string;
  appMode?: 'development' | 'production' | 'test';
  simulatedScenario?: 'SUCCESS' | 'EXPIRED_TOKEN' | 'RATE_LIMIT' | 'INVALID_MEDIA' | 'SERVER_ERROR';
}

export class MetaFacebookPagePublisherAdapter {
  private config: MetaAdapterConfig;

  constructor(config: MetaAdapterConfig = {}) {
    this.config = {
      graphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
      appMode: (process.env.META_APP_MODE as any) || 'development',
      ...config,
    };
  }

  public setSimulatedScenario(scenario?: MetaAdapterConfig['simulatedScenario']): void {
    this.config.simulatedScenario = scenario;
  }

  public async publish(input: PublishInput): Promise<PublishResult> {
    const startedAt = Date.now();

    // 1. Validation - Platform & Account
    if (input.platform !== SocialSchedulerPlatform.FACEBOOK) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'UNSUPPORTED_PLATFORM',
        errorMessage: `Meta adapter only supports FACEBOOK, received ${input.platform}`,
      };
    }

    if (!input.socialAccountId) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MISSING_SOCIAL_ACCOUNT',
        errorMessage: 'Facebook Page target requires a connected socialAccountId',
      };
    }

    // 2. Load Social Account & Verify Workspace Isolation
    const account = sprint1Storage.getSocialAccountById(input.socialAccountId, input.workspaceId);
    if (!account) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_NOT_FOUND',
        errorMessage: `Social account ${input.socialAccountId} not found in workspace ${input.workspaceId}`,
      };
    }

    if (account.status === SocialAccountStatus.DISCONNECTED) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'SOCIAL_ACCOUNT_DISCONNECTED',
        errorMessage: `Facebook Page ${account.displayName} has been disconnected`,
      };
    }

    if (account.status === SocialAccountStatus.REAUTH_REQUIRED) {
      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'REAUTH_REQUIRED',
        errorMessage: `Facebook Page ${account.displayName} requires re-authorization`,
      };
    }

    // 3. Retrieve Page Access Token from Credential Vault
    const pageToken = credentialVault.getToken(account.credentialRef);
    if (!pageToken) {
      // Mark account as REAUTH_REQUIRED in storage
      sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });

      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        errorCode: 'TOKEN_INVALID_OR_EXPIRED',
        errorMessage: 'No valid decrypted token found in vault for this Facebook Page',
      };
    }

    // 4. Media Inspection (Sprint 3 mandates text + single image)
    const primaryMedia = input.media && input.media.length > 0 ? input.media[0] : null;
    const allowTextOnly = process.env.SOCIAL_SCHEDULER_ALLOW_TEXT_ONLY_FACEBOOK === 'true';

    if (!primaryMedia && !allowTextOnly) {
      return {
        status: SocialPublishAttemptStatus.FAILED_PERMANENT,
        errorCode: 'MEDIA_REQUIRED',
        errorMessage: 'Facebook Page publishing in Sprint 3 requires at least one uploaded image asset',
      };
    }

    // 5. Check Simulated Scenarios (for QA / testing without live Meta secrets)
    if (this.config.simulatedScenario) {
      return this.handleSimulatedScenario(this.config.simulatedScenario, account, primaryMedia, input);
    }

    // If live credentials present and not in mock scenario mode, perform real Graph API call
    const isLiveEnvironment =
      process.env.META_APP_ID &&
      process.env.META_APP_SECRET &&
      !pageToken.startsWith('EAABmockToken');

    if (isLiveEnvironment) {
      try {
        return await this.executeLiveMetaPublish(account, pageToken, primaryMedia, input);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown Meta Graph API error';
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'META_API_NETWORK_ERROR',
          errorMessage: message,
          diagnostics: sanitizePayload({
            error: message,
            durationMs: Date.now() - startedAt,
          }),
        };
      }
    }

    // Default development/sandbox success behavior
    return this.handleSimulatedScenario('SUCCESS', account, primaryMedia, input);
  }

  /**
   * Real Meta Graph API Call
   */
  private async executeLiveMetaPublish(
    account: any,
    pageToken: string,
    primaryMedia: any,
    input: PublishInput
  ): Promise<PublishResult> {
    const graphUrl = `https://graph.facebook.com/${this.config.graphVersion}/${account.externalAccountId}`;

    let endpoint: string;
    let payload: Record<string, string>;

    if (primaryMedia) {
      // Generate temporary presigned download URL from B2
      const downloadUrl = await b2Storage.getPresignedDownloadUrl(
        primaryMedia.objectKey,
        3600 // 1 hour validity
      );

      endpoint = `${graphUrl}/photos`;
      payload = {
        url: downloadUrl,
        caption: input.caption,
        access_token: pageToken,
      };
    } else {
      endpoint = `${graphUrl}/feed`;
      payload = {
        message: input.caption,
        access_token: pageToken,
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json();

    if (!res.ok || responseData.error) {
      return this.classifyGraphError(responseData.error, account);
    }

    const photoOrPostId = responseData.post_id || responseData.id;
    const externalPostId = `${account.externalAccountId}_${photoOrPostId}`;
    const externalPostUrl = `https://www.facebook.com/${account.externalAccountId}/posts/${photoOrPostId}`;

    return {
      status: SocialPublishAttemptStatus.SUCCEEDED,
      externalPostId,
      externalPostUrl,
      providerRequestId: res.headers.get('x-fb-request-id') || `fb_req_${Date.now()}`,
      diagnostics: sanitizePayload({
        graphVersion: this.config.graphVersion,
        pageId: account.externalAccountId,
        responseStatus: res.status,
        mediaAssetId: primaryMedia?.mediaAssetId,
      }),
    };
  }

  /**
   * Classifies Meta Graph API Errors according to Sprint 3 specifications
   */
  public classifyGraphError(error: any, account?: any): PublishResult {
    const code = error?.code || 0;
    const subcode = error?.error_subcode || 0;
    const message = error?.message || 'Meta API error occurred';

    // 1. Re-auth Required / Expired or Revoked Token / Missing Permission
    // Codes: 190 (Invalid OAuth access token), 102 (Session invalid), 200-299 (Permission errors)
    if (code === 190 || code === 102 || (code >= 200 && code <= 299) || [458, 459, 460, 463, 467].includes(subcode)) {
      if (account) {
        sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
          status: SocialAccountStatus.REAUTH_REQUIRED,
        });
      }

      return {
        status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
        providerErrorCode: `META_${code}_${subcode}`,
        errorCode: 'REAUTH_REQUIRED',
        errorMessage: `Facebook permission or session expired: ${message}`,
        diagnostics: sanitizePayload({ code, subcode, type: error?.type }),
      };
    }

    // 2. Retryable Errors: Rate Limits (Code 4, 17, 341) or Meta server temporary glitch (1, 2)
    if ([1, 2, 4, 17, 341].includes(code)) {
      return {
        status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
        providerErrorCode: `META_${code}`,
        errorCode: code === 4 || code === 17 || code === 341 ? 'RATE_LIMITED' : 'META_SERVER_TRANSIENT_ERROR',
        errorMessage: `Transient error from Meta: ${message}`,
        retryAfterMs: 60 * 1000, // 1 min backoff
        diagnostics: sanitizePayload({ code, subcode }),
      };
    }

    // 3. Permanent Failure (Invalid parameters, blocked content, unsupported mime)
    return {
      status: SocialPublishAttemptStatus.FAILED_PERMANENT,
      providerErrorCode: `META_${code}`,
      errorCode: 'META_API_PERMANENT_ERROR',
      errorMessage: message,
      diagnostics: sanitizePayload({ code, subcode, type: error?.type }),
    };
  }

  /**
   * Simulated Scenarios for QA testing and sandbox verification
   */
  private handleSimulatedScenario(
    scenario: MetaAdapterConfig['simulatedScenario'],
    account: any,
    primaryMedia: any,
    input: PublishInput
  ): PublishResult {
    const timestamp = Date.now();
    const photoId = `fb_photo_${timestamp}`;
    const postId = `fb_post_${account.externalAccountId}_${timestamp}`;

    switch (scenario) {
      case 'SUCCESS':
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          externalPostId: postId,
          externalPostUrl: `https://www.facebook.com/${account.externalAccountId}/posts/${photoId}`,
          providerRequestId: `fb_req_${timestamp}`,
          diagnostics: sanitizePayload({
            simulated: true,
            provider: 'META',
            pageId: account.externalAccountId,
            pageName: account.displayName,
            mediaAssetId: primaryMedia?.mediaAssetId,
            captionLength: input.caption.length,
          }),
        };

      case 'EXPIRED_TOKEN':
        sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
          status: SocialAccountStatus.REAUTH_REQUIRED,
        });
        return {
          status: SocialPublishAttemptStatus.REAUTH_REQUIRED,
          providerErrorCode: 'META_190_463',
          errorCode: 'REAUTH_REQUIRED',
          errorMessage: 'Error validating access token: Session has expired due to password change or expiration.',
          diagnostics: sanitizePayload({
            simulated: true,
            code: 190,
            subcode: 463,
            type: 'OAuthException',
          }),
        };

      case 'RATE_LIMIT':
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          providerErrorCode: 'META_341',
          errorCode: 'RATE_LIMITED',
          errorMessage: 'Application request limit reached. Please wait before attempting further publishing.',
          retryAfterMs: 120 * 1000,
          diagnostics: sanitizePayload({
            simulated: true,
            code: 341,
          }),
        };

      case 'INVALID_MEDIA':
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          providerErrorCode: 'META_100',
          errorCode: 'INVALID_IMAGE_PARAMETER',
          errorMessage: 'Invalid image parameter: Image could not be retrieved from storage URL or is corrupt.',
          diagnostics: sanitizePayload({
            simulated: true,
            code: 100,
          }),
        };

      case 'SERVER_ERROR':
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          providerErrorCode: 'META_2',
          errorCode: 'META_SERVER_TRANSIENT_ERROR',
          errorMessage: 'An unexpected error occurred while processing your request on Meta servers.',
          retryAfterMs: 30 * 1000,
          diagnostics: sanitizePayload({
            simulated: true,
            code: 2,
          }),
        };

      default:
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          externalPostId: postId,
          externalPostUrl: `https://www.facebook.com/${account.externalAccountId}/posts/${photoId}`,
        };
    }
  }
}

export const metaFacebookPagePublisherAdapter = new MetaFacebookPagePublisherAdapter();
