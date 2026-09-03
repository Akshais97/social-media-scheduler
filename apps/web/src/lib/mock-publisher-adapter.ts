import {
  PublishInput,
  PublishResult,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
} from '@/types/scheduler';

export type MockAdapterMode =
  | 'success'
  | 'retryable_failure'
  | 'permanent_failure'
  | 'timeout'
  | 'mixed'
  | 'random';

export class MockSocialPublisherAdapter {
  async publish(
    input: PublishInput,
    mode: MockAdapterMode = 'success',
    attemptNumber: number = 1
  ): Promise<PublishResult> {
    // Resolve dynamic modes
    let effectiveMode = mode;
    if (mode === 'mixed') {
      // Mixed mode deterministically creates a mix across platforms
      switch (input.platform) {
        case SocialSchedulerPlatform.FACEBOOK:
        case SocialSchedulerPlatform.PINTEREST:
          effectiveMode = 'success';
          break;
        case SocialSchedulerPlatform.INSTAGRAM:
          effectiveMode = 'retryable_failure';
          break;
        case SocialSchedulerPlatform.X:
        case SocialSchedulerPlatform.YOUTUBE:
          effectiveMode = 'permanent_failure';
          break;
        default:
          effectiveMode = 'success';
      }
    } else if (mode === 'random') {
      const roll = Math.random();
      if (roll < 0.6) effectiveMode = 'success';
      else if (roll < 0.85) effectiveMode = 'retryable_failure';
      else effectiveMode = 'permanent_failure';
    }

    // Handle effective mode simulation
    switch (effectiveMode) {
      case 'success': {
        const platformSlug = input.platform.toLowerCase();
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const externalPostId = `mock_${platformSlug}_${randomId}`;
        const externalPostUrl = `https://mock.social/${platformSlug}/${externalPostId}`;

        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          externalPostId,
          externalPostUrl,
          diagnostics: {
            provider: 'mock',
            mode: 'success',
            platform: input.platform,
            captionLength: input.caption.length,
            mediaCount: input.media.length,
            processedAt: new Date().toISOString(),
          },
        };
      }

      case 'retryable_failure': {
        // Retry backoff per Section 15.2:
        // Attempt 1 -> 5 min, Attempt 2 -> 15 min, Attempt >= 3 -> Permanent failure
        if (attemptNumber >= 3) {
          return {
            status: SocialPublishAttemptStatus.FAILED_PERMANENT,
            errorCode: 'MOCK_MAX_RETRIES_EXCEEDED',
            errorMessage: 'Maximum retry attempts (3) exceeded for this mock platform target.',
            diagnostics: {
              provider: 'mock',
              mode: 'retryable_failure',
              finalAttempt: attemptNumber,
            },
          };
        }

        const retryAfterMs = attemptNumber === 1 ? 5 * 60 * 1000 : 15 * 60 * 1000;
        return {
          status: SocialPublishAttemptStatus.FAILED_RETRYABLE,
          errorCode: 'MOCK_TIMEOUT',
          errorMessage: 'Mock platform timeout. This target will retry automatically.',
          retryAfterMs,
          diagnostics: {
            provider: 'mock',
            mode: 'retryable_failure',
            attemptNumber,
            retryAfterMs,
          },
        };
      }

      case 'permanent_failure': {
        return {
          status: SocialPublishAttemptStatus.FAILED_PERMANENT,
          errorCode: 'MOCK_INVALID_MEDIA',
          errorMessage: 'Mock platform rejected this media as invalid or unsupported for target aspect ratio.',
          diagnostics: {
            provider: 'mock',
            mode: 'permanent_failure',
            platform: input.platform,
          },
        };
      }

      case 'timeout': {
        const retryAfterMs = attemptNumber === 1 ? 5 * 60 * 1000 : 15 * 60 * 1000;
        return {
          status: SocialPublishAttemptStatus.TIMED_OUT,
          errorCode: 'MOCK_PROVIDER_TIMEOUT',
          errorMessage: 'Mock provider gateway timed out while waiting for response.',
          retryAfterMs,
          diagnostics: {
            provider: 'mock',
            mode: 'timeout',
          },
        };
      }

      default:
        return {
          status: SocialPublishAttemptStatus.SUCCEEDED,
          externalPostId: `mock_${input.platform.toLowerCase()}_${Date.now()}`,
          externalPostUrl: `https://mock.social/${input.platform.toLowerCase()}`,
        };
    }
  }
}

export const mockPublisherAdapter = new MockSocialPublisherAdapter();
