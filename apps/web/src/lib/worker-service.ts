import {
  SocialSchedulerPostStatus,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  SocialAccountProvider,
  SocialPublishAttempt,
  Sprint1ScheduledPost,
  Sprint1PublishTarget,
  PublishInput,
  PublishResult,
  ReadinessStatus,
  SocialSchedulerAuditAction,
  SocialSchedulerApprovalStatus,
} from '../types/scheduler';
import { sprint1Storage } from './mock-storage';
import { mockPublisherAdapter, MockAdapterMode } from './mock-publisher-adapter';
import { metaFacebookPagePublisherAdapter } from './meta-facebook-page-adapter';
import { metaInstagramPublisherAdapter } from './meta-instagram-publisher-adapter';
import { pinterestPublisherAdapter } from './pinterest-publisher-adapter';
import { googleYouTubePublisherAdapter } from './google-youtube-publisher-adapter';
import { xPublisherAdapter } from './x-publisher-adapter';
import { sanitizePayload } from './credential-vault';

export interface ProcessDueResult {
  workerRunId: string;
  claimedTargets: number;
  succeeded: number;
  retrying: number;
  failed: number;
  skipped: number;
  reauthRequired?: number;
}

export interface WorkerSummary {
  dueTargets: number;
  processingTargets: number;
  retryingTargets: number;
  failedTargets: number;
  reauthRequiredTargets?: number;
  lastWorkerRunAt: string | null;
}

let lastWorkerRunTimestamp: string | null = null;

export class WorkerService {
  /**
   * Recovers stale locks older than 15 minutes according to Section 8.3 & 28.9
   */
  recoverStaleLocks(): number {
    const allPosts = sprint1Storage.getAllPosts();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    let recoveredCount = 0;

    for (const post of allPosts) {
      let postModified = false;

      for (const target of post.targets) {
        if (target.status === SocialSchedulerTargetStatus.PROCESSING && target.lockedAt) {
          const lockTime = new Date(target.lockedAt).getTime();
          if (lockTime < fifteenMinutesAgo) {
            // Break stale lock
            target.status = SocialSchedulerTargetStatus.RETRYING;
            target.lockedAt = null;
            target.lockedBy = null;
            target.lastErrorMessage = 'Recovered from stale lock exceeding 15 minutes timeout';
            postModified = true;
            recoveredCount++;

            sprint1Storage.recordAuditLog({
              workspaceId: post.workspaceId,
              actorUserId: 'worker_daemon',
              entityType: 'TARGET',
              entityId: target.id,
              action: SocialSchedulerAuditAction.STALE_LOCK_RECOVERED,
              metadataJson: { postId: post.id, targetId: target.id, previousLockTime: lockTime },
            });
          }
        }
      }

      if (postModified) {
        this.recalculatePostStatus(post);
        sprint1Storage.updatePost(post.id, post);
      }
    }

    return recoveredCount;
  }

  /**
   * Queries due targets according to Section 8.1 & 28.1
   */
  getDueTargets(workspaceId?: string): Array<{ post: Sprint1ScheduledPost; target: Sprint1PublishTarget }> {
    const allPosts = sprint1Storage.getAllPosts();
    const now = Date.now();
    const dueList: Array<{ post: Sprint1ScheduledPost; target: Sprint1PublishTarget }> = [];

    for (const post of allPosts) {
      if (workspaceId && post.workspaceId !== workspaceId) {
        continue;
      }

      if (
        post.status === SocialSchedulerPostStatus.CANCELLED ||
        post.status === SocialSchedulerPostStatus.DRAFT
      ) {
        continue;
      }

      const isPostScheduledDue = post.scheduledAt ? new Date(post.scheduledAt).getTime() <= now : false;

      for (const target of post.targets) {
        if (target.status === SocialSchedulerTargetStatus.PROCESSING && target.lockedAt) {
          // Currently locked and active
          continue;
        }

        if (
          target.status === SocialSchedulerTargetStatus.RETRYING ||
          target.status === SocialSchedulerTargetStatus.PLATFORM_PROCESSING ||
          target.status === SocialSchedulerTargetStatus.LIMIT_REACHED
        ) {
          // Retry target becomes due when nextRetryAt <= now
          const retryTime = target.nextRetryAt ? new Date(target.nextRetryAt).getTime() : 0;
          if (retryTime <= now) {
            dueList.push({ post, target });
          }
        } else if (
          target.status === SocialSchedulerTargetStatus.SCHEDULED ||
          target.status === SocialSchedulerTargetStatus.DUE ||
          target.status === SocialSchedulerTargetStatus.MOCK_READY
        ) {
          if (isPostScheduledDue) {
            dueList.push({ post, target });
          }
        }
      }
    }

    return dueList;
  }

  /**
   * Recalculates and updates parent post status according to Sprint 2 & 3 state machines
   */
  recalculatePostStatus(post: Sprint1ScheduledPost): SocialSchedulerPostStatus {
    const targets = post.targets;
    if (!targets || targets.length === 0) {
      return post.status;
    }

    const allCancelled = targets.every((t) => t.status === SocialSchedulerTargetStatus.CANCELLED);
    const anyProcessing = targets.some(
      (t) =>
        t.status === SocialSchedulerTargetStatus.PROCESSING ||
        t.status === SocialSchedulerTargetStatus.PLATFORM_PROCESSING
    );
    const anyRetrying = targets.some(
      (t) =>
        t.status === SocialSchedulerTargetStatus.RETRYING ||
        t.status === SocialSchedulerTargetStatus.LIMIT_REACHED
    );
    const anyReauth = targets.some((t) => t.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED);
    const anyCostBlocked = targets.some((t) => t.status === SocialSchedulerTargetStatus.COST_BLOCKED);
    const anyApprovalBlocked = targets.some((t) => t.status === SocialSchedulerTargetStatus.APPROVAL_BLOCKED);

    const isTargetPublished = (t: any) =>
      t.status === SocialSchedulerTargetStatus.PUBLISHED ||
      t.status === SocialSchedulerTargetStatus.PRIVATE_RESTRICTED;

    const allLivePublished = targets.every(isTargetPublished);
    const allMockPublished = targets.every((t) => t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK);
    const allPublishedAny = targets.every(
      (t) => isTargetPublished(t) || t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK
    );

    const somePublished = targets.some(
      (t) => isTargetPublished(t) || t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK
    );
    const someFailed = targets.some(
      (t) =>
        t.status === SocialSchedulerTargetStatus.FAILED ||
        t.status === SocialSchedulerTargetStatus.QUOTA_BLOCKED ||
        t.status === SocialSchedulerTargetStatus.COST_BLOCKED
    );
    const allFailed = targets.every(
      (t) =>
        t.status === SocialSchedulerTargetStatus.FAILED ||
        t.status === SocialSchedulerTargetStatus.QUOTA_BLOCKED ||
        t.status === SocialSchedulerTargetStatus.COST_BLOCKED
    );

    let newStatus = post.status;

    if (allCancelled) {
      newStatus = SocialSchedulerPostStatus.CANCELLED;
    } else if (allLivePublished) {
      newStatus = SocialSchedulerPostStatus.PUBLISHED;
      post.publishedAt = new Date().toISOString();
    } else if (allMockPublished) {
      newStatus = SocialSchedulerPostStatus.PUBLISHED_MOCK;
      post.publishedMockAt = new Date().toISOString();
    } else if (allPublishedAny) {
      newStatus = SocialSchedulerPostStatus.PARTIALLY_PUBLISHED;
    } else if (anyProcessing) {
      newStatus = SocialSchedulerPostStatus.PROCESSING;
    } else if (anyRetrying && !anyProcessing) {
      newStatus = SocialSchedulerPostStatus.RETRYING;
    } else if (anyCostBlocked && !somePublished) {
      newStatus = SocialSchedulerPostStatus.COST_BLOCKED;
    } else if (anyApprovalBlocked && !somePublished) {
      newStatus = SocialSchedulerPostStatus.APPROVAL_BLOCKED;
    } else if (anyReauth && !somePublished) {
      newStatus = SocialSchedulerPostStatus.REAUTH_REQUIRED;
    } else if (somePublished && someFailed) {
      newStatus = SocialSchedulerPostStatus.PARTIALLY_FAILED;
    } else if (allFailed) {
      newStatus = SocialSchedulerPostStatus.FAILED;
      post.failedAt = new Date().toISOString();
    } else {
      newStatus = SocialSchedulerPostStatus.SCHEDULED;
    }

    post.status = newStatus;
    post.lastProcessedAt = new Date().toISOString();
    return newStatus;
  }

  /**
   * Process due targets with mock publishing adapter or live Meta adapter
   */
  async processDueTargets(options: {
    limit?: number;
    mockMode?: MockAdapterMode;
    workspaceId?: string;
    workerRunId?: string;
  } = {}): Promise<ProcessDueResult> {
    const {
      limit = 25,
      mockMode = 'success',
      workspaceId,
      workerRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    } = options;

    lastWorkerRunTimestamp = new Date().toISOString();

    // 1. Stale lock recovery
    this.recoverStaleLocks();

    // 2. Due detection
    const dueItems = this.getDueTargets(workspaceId).slice(0, limit);

    let succeeded = 0;
    let retrying = 0;
    let failed = 0;
    let skipped = 0;
    let reauthRequired = 0;

    // 3. Process claimed items
    for (const { post, target } of dueItems) {
      // Check if post was cancelled between detection and execution
      if (post.status === SocialSchedulerPostStatus.CANCELLED) {
        target.status = SocialSchedulerTargetStatus.SKIPPED;
        skipped++;
        sprint1Storage.updatePost(post.id, post);
        continue;
      }

      // Guard against duplicate processing of already published targets
      if (target.status === SocialSchedulerTargetStatus.PUBLISHED || target.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK) {
        skipped++;
        continue;
      }

      // Sprint 9: Approval Preflight Gate
      const workflow = sprint1Storage.getWorkflowSettings(post.workspaceId);
      if (workflow.socialSchedulerApprovalRequired) {
        const isApproved =
          post.approvalStatus === SocialSchedulerApprovalStatus.APPROVED ||
          post.approvalStatus === SocialSchedulerApprovalStatus.AUTO_APPROVED;

        if (!isApproved) {
          target.status = SocialSchedulerTargetStatus.APPROVAL_BLOCKED;
          target.lastErrorCode = 'APPROVAL_REQUIRED';
          target.lastErrorMessage = 'Workspace requires approval before publishing. Post is not yet approved.';
          target.nextRetryAt = null;
          target.lockedAt = null;
          target.lockedBy = null;
          this.recalculatePostStatus(post);
          sprint1Storage.updatePost(post.id, post);
          skipped++;
          continue;
        }
      }

      // Preflight validation check before target claim & execution
      const readiness = sprint1Storage.runReadinessCheck(post.workspaceId, post.id, 'WORKER_PREFLIGHT', 'worker_daemon');
      const targetCheck = readiness.targets.find((t) => t.targetId === target.id);
      if (targetCheck && targetCheck.status === ReadinessStatus.BLOCKED) {
        const discIssue = targetCheck.blockingIssues.find((i) => i.code === 'ACCOUNT_DISCONNECTED');
        const costIssue = targetCheck.blockingIssues.find((i) => i.code === 'X_COST_UNACKNOWLEDGED');
        const quotaIssue = targetCheck.blockingIssues.find((i) => i.code === 'YOUTUBE_QUOTA_EXHAUSTED');
        const reauthIssue = targetCheck.blockingIssues.find((i) => i.code === 'ACCOUNT_REAUTH_REQUIRED');

        target.nextRetryAt = null;
        if (discIssue) {
          target.status = SocialSchedulerTargetStatus.FAILED;
          target.lastErrorCode = 'SOCIAL_ACCOUNT_DISCONNECTED';
          target.lastErrorMessage = discIssue.message;
        } else if (costIssue) {
          target.status = SocialSchedulerTargetStatus.COST_BLOCKED;
          target.lastErrorCode = 'X_COST_UNACKNOWLEDGED';
          target.lastErrorMessage = costIssue.message;
        } else if (quotaIssue) {
          target.status = SocialSchedulerTargetStatus.QUOTA_BLOCKED;
          target.lastErrorCode = 'YOUTUBE_QUOTA_EXHAUSTED';
          target.lastErrorMessage = quotaIssue.message;
        } else if (reauthIssue) {
          target.status = SocialSchedulerTargetStatus.REAUTH_REQUIRED;
          target.lastErrorCode = 'ACCOUNT_REAUTH_REQUIRED';
          target.lastErrorMessage = reauthIssue.message;
          reauthRequired++;
        } else {
          const primaryIssue = targetCheck.blockingIssues[0];
          target.status = SocialSchedulerTargetStatus.FAILED;
          target.lastErrorCode = primaryIssue?.code || 'PREFLIGHT_BLOCKED';
          target.lastErrorMessage = primaryIssue?.message || 'Preflight readiness check blocked execution.';
        }
        target.lockedAt = null;
        target.lockedBy = null;
        this.recalculatePostStatus(post);
        sprint1Storage.updatePost(post.id, post);
        failed++;
        continue;
      }

      // Atomic Claim: set target & post to PROCESSING with worker lock
      const nowIso = new Date().toISOString();
      target.status = SocialSchedulerTargetStatus.PROCESSING;
      target.lockedAt = nowIso;
      target.lockedBy = workerRunId;
      post.status = SocialSchedulerPostStatus.PROCESSING;
      sprint1Storage.updatePost(post.id, post);

      // Increment attempt number
      const attemptNumber = (target.attemptCount || 0) + 1;
      target.attemptCount = attemptNumber;
      target.lastAttemptAt = nowIso;

      const isLiveFb = target.publishMode === 'LIVE_META' && target.platform === SocialSchedulerPlatform.FACEBOOK;
      const isLiveIg = target.publishMode === 'LIVE_META' && target.platform === SocialSchedulerPlatform.INSTAGRAM;
      const isLivePin = target.publishMode === 'LIVE_PINTEREST' && target.platform === SocialSchedulerPlatform.PINTEREST;
      const isLiveYt = target.publishMode === 'LIVE_GOOGLE' && target.platform === SocialSchedulerPlatform.YOUTUBE;
      const isLiveX = target.publishMode === 'LIVE_X' && target.platform === SocialSchedulerPlatform.X;
      const isLive = isLiveFb || isLiveIg || isLivePin || isLiveYt || isLiveX;

      // Create SocialPublishAttempt row with STARTED
      const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const attempt: SocialPublishAttempt = {
        id: attemptId,
        workspaceId: post.workspaceId,
        postId: post.id,
        targetId: target.id,
        platform: target.platform,
        attemptNumber,
        status: SocialPublishAttemptStatus.STARTED,
        workerRunId,
        mockMode: isLiveFb || isLiveIg ? 'live_meta' : isLivePin ? 'live_pinterest' : isLiveYt ? 'live_youtube' : isLiveX ? 'live_x' : mockMode,
        provider: isLiveFb || isLiveIg ? SocialAccountProvider.META : isLivePin ? SocialAccountProvider.PINTEREST : isLiveYt ? SocialAccountProvider.GOOGLE : isLiveX ? SocialAccountProvider.X : null,
        socialAccountId: target.socialAccountId || null,
        startedAt: nowIso,
        retryable: false,
        requestJson: sanitizePayload({
          platform: target.platform,
          publishMode: target.publishMode || 'MOCK',
          socialAccountId: target.socialAccountId,
          mockAccount: target.mockAccountName,
          title: post.title,
          captionPreview: post.draftContentJson?.caption?.slice(0, 100),
          mediaCount: post.mediaAssets?.length || 0,
        }),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      sprint1Storage.addAttempt(attempt);

      // Build sanitized publish input
      const publishInput: PublishInput = {
        workspaceId: post.workspaceId,
        postId: post.id,
        targetId: target.id,
        platform: target.platform,
        publishMode: target.publishMode,
        socialAccountId: target.socialAccountId || undefined,
        caption: post.draftContentJson?.caption || '',
        media: post.mediaAssets.map((m) => ({
          mediaAssetId: m.id,
          mimeType: m.mimeType,
          byteSize: m.byteSize,
          objectKey: m.objectKey,
        })),
        scheduledAt: post.scheduledAt || nowIso,
        draftContentJson: post.draftContentJson,
      };

      // Call appropriate adapter
      let result: PublishResult | any;
      if (isLiveYt) {
        const platformOpts = (target.platformOptions || target.platformOptionsJson || {}) as any;
        const videoAsset = post.mediaAssets?.find((m) => m.mimeType.startsWith('video/')) || post.mediaAssets?.[0];

        result = await googleYouTubePublisherAdapter.publish({
          workspaceId: post.workspaceId,
          postId: post.id,
          targetId: target.id,
          platform: SocialSchedulerPlatform.YOUTUBE,
          publishMode: 'LIVE_GOOGLE',
          socialAccountId: target.socialAccountId || '',
          youtubeChannelId: target.externalAccountId || '',
          video: {
            mediaAssetId: videoAsset?.id || '',
            mimeType: videoAsset?.mimeType || '',
            byteSize: videoAsset?.byteSize || 0,
            objectKey: videoAsset?.objectKey || '',
          },
          youtubeOptions: {
            title: platformOpts.title || post.title,
            description: platformOpts.description || post.draftContentJson?.caption || '',
            privacyStatus: platformOpts.privacyStatus || 'private',
            categoryId: platformOpts.categoryId,
            tags: platformOpts.tags,
            madeForKids: Boolean(platformOpts.madeForKids),
            notifySubscribers: platformOpts.notifySubscribers,
          },
          draftContentJson: post.draftContentJson,
        });

        // Record YouTubeUploadJob
        sprint1Storage.createOrUpdateYouTubeUploadJob({
          workspaceId: post.workspaceId,
          postId: post.id,
          targetId: target.id,
          attemptId,
          socialAccountId: target.socialAccountId || '',
          youtubeChannelId: target.externalAccountId || '',
          uploadStatus:
            result.status === SocialPublishAttemptStatus.SUCCEEDED
              ? 'PUBLISHED'
              : result.status === SocialPublishAttemptStatus.PRIVATE_RESTRICTED
              ? 'PRIVATE_RESTRICTED'
              : result.status === SocialPublishAttemptStatus.QUOTA_BLOCKED
              ? 'QUOTA_BLOCKED'
              : 'FAILED',
          youtubeVideoId: result.youtubeVideoId || null,
          youtubeVideoUrl: result.externalPostUrl || null,
          privacyStatus: platformOpts.privacyStatus || 'private',
          title: platformOpts.title || post.title,
          description: platformOpts.description || null,
          categoryId: platformOpts.categoryId || null,
          madeForKids: platformOpts.madeForKids ?? null,
          tagsJson: platformOpts.tags || null,
          uploadStartedAt: nowIso,
          uploadFinishedAt: new Date().toISOString(),
          publishedAt: result.status === SocialPublishAttemptStatus.SUCCEEDED ? new Date().toISOString() : null,
          errorCode: result.errorCode || null,
          errorMessage: result.errorMessage || null,
          diagnosticsJson: result.diagnostics || null,
        });
      } else if (isLiveX) {
        const platformOpts = (target.platformOptions || target.platformOptionsJson || {}) as any;
        const xOptions = {
          text: platformOpts.text || post.title || post.draftContentJson?.caption,
          containsUrl: platformOpts.containsUrl,
          madeWithAi: platformOpts.madeWithAi,
          paidPartnership: platformOpts.paidPartnership,
          replySettings: platformOpts.replySettings,
          costAcknowledged: Boolean(platformOpts.costAcknowledged ?? target.xCostAcknowledgedAt),
          estimatedCostUsd: platformOpts.estimatedCostUsd || '0.015',
        };

        result = await xPublisherAdapter.publish({
          workspaceId: post.workspaceId,
          postId: post.id,
          targetId: target.id,
          platform: SocialSchedulerPlatform.X,
          publishMode: 'LIVE_X',
          socialAccountId: target.socialAccountId || '',
          xUserId: target.externalAccountId || '',
          text: xOptions.text || '',
          media:
            post.mediaAssets?.map((m) => ({
              mediaAssetId: m.id,
              mimeType: m.mimeType,
              byteSize: m.byteSize,
              objectKey: m.objectKey,
            })) || [],
          xOptions,
          draftContentJson: post.draftContentJson,
        });
      } else if (isLivePin) {
        const platformOpts = (target.platformOptions || target.platformOptionsJson || {}) as any;
        const boardId = target.pinterestBoardId || platformOpts.boardId || '';
        const boardSectionId = target.pinterestBoardSectionId || platformOpts.boardSectionId || null;
        const title = platformOpts.title || post.title;
        const description = platformOpts.description || post.draftContentJson?.caption;
        const destinationLink = platformOpts.destinationLink || null;

        result = await pinterestPublisherAdapter.publish({
          workspaceId: post.workspaceId,
          postId: post.id,
          targetId: target.id,
          platform: SocialSchedulerPlatform.PINTEREST,
          publishMode: 'LIVE_PINTEREST',
          socialAccountId: target.socialAccountId || '',
          boardId,
          boardSectionId,
          title,
          description,
          destinationLink,
          media: post.mediaAssets.map((m) => ({
            mediaAssetId: m.id,
            mimeType: m.mimeType,
            byteSize: m.byteSize,
            objectKey: m.objectKey,
          })),
          draftContentJson: post.draftContentJson,
          platformOptionsJson: target.platformOptionsJson,
        });
      } else if (isLiveIg) {
        result = await metaInstagramPublisherAdapter.publish({
          ...publishInput,
          platform: SocialSchedulerPlatform.INSTAGRAM,
          publishMode: 'LIVE_META',
          socialAccountId: target.socialAccountId || '',
          igUserId: target.externalAccountId || '',
          instagramFormat: target.instagramFormat || undefined,
        });
      } else if (isLiveFb) {
        result = await metaFacebookPagePublisherAdapter.publish(publishInput);
      } else {
        result = await mockPublisherAdapter.publish(publishInput, mockMode, attemptNumber);
      }

      const finishedIso = new Date().toISOString();

      // Release lock
      target.lockedAt = null;
      target.lockedBy = null;

      // Update attempt with result
      attempt.status = result.status;
      attempt.finishedAt = finishedIso;
      attempt.errorCode = result.errorCode || null;
      attempt.errorMessage = result.errorMessage || null;
      attempt.externalPostId = result.externalPostId || null;
      attempt.externalPostUrl = result.externalPostUrl || null;
      attempt.providerRequestId = result.providerRequestId || null;
      attempt.providerErrorCode = result.providerErrorCode || null;
      attempt.diagnosticsJson = result.diagnostics ? sanitizePayload(result.diagnostics) : null;
      attempt.responseJson = sanitizePayload({
        status: result.status,
        externalPostId: result.externalPostId,
        externalPostUrl: result.externalPostUrl,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        providerRequestId: result.providerRequestId,
        providerErrorCode: result.providerErrorCode,
      });

      // Apply result to target state machine
      if (result.status === SocialPublishAttemptStatus.SUCCEEDED) {
        if (isLive) {
          target.status = SocialSchedulerTargetStatus.PUBLISHED;
          target.externalPostId = result.externalPostId || null;
          target.externalPostUrl = result.externalPostUrl || null;
        } else {
          target.status = SocialSchedulerTargetStatus.PUBLISHED_MOCK;
          target.mockExternalId = result.externalPostId || null;
          target.mockExternalUrl = result.externalPostUrl || null;
        }
        target.lastErrorCode = null;
        target.lastErrorMessage = null;
        target.nextRetryAt = null;
        succeeded++;
      } else if (result.status === SocialPublishAttemptStatus.PRIVATE_RESTRICTED) {
        target.status = SocialSchedulerTargetStatus.PRIVATE_RESTRICTED;
        target.externalPostId = result.externalPostId || null;
        target.externalPostUrl = result.externalPostUrl || null;
        target.lastErrorCode = null;
        target.lastErrorMessage = null;
        target.nextRetryAt = null;
        succeeded++;
      } else if (result.status === SocialPublishAttemptStatus.QUOTA_BLOCKED) {
        target.status = SocialSchedulerTargetStatus.QUOTA_BLOCKED;
        target.lastErrorCode = result.errorCode || 'YOUTUBE_QUOTA_EXHAUSTED';
        target.lastErrorMessage = result.errorMessage || null;
        target.nextRetryAt = null;
        failed++;
      } else if (result.status === SocialPublishAttemptStatus.COST_BLOCKED) {
        target.status = SocialSchedulerTargetStatus.COST_BLOCKED;
        target.lastErrorCode = result.errorCode || 'X_COST_NOT_ACKNOWLEDGED';
        target.lastErrorMessage = result.errorMessage || null;
        target.nextRetryAt = null;
        failed++;
      } else if (result.status === SocialPublishAttemptStatus.PLATFORM_PROCESSING) {
        target.status = SocialSchedulerTargetStatus.PLATFORM_PROCESSING;
        target.instagramContainerId = result.containerId || null;
        target.platformProcessingAt = finishedIso;
        const retryMs = result.retryAfterMs || 30000;
        const nextRetry = new Date(Date.now() + retryMs).toISOString();
        target.nextRetryAt = nextRetry;
        attempt.nextRetryAt = nextRetry;
        retrying++;
      } else if (result.status === SocialPublishAttemptStatus.RATE_LIMITED) {
        target.status = SocialSchedulerTargetStatus.RETRYING;
        attempt.retryable = true;
        const retryMs = result.retryAfterMs || 60000;
        const nextRetry = new Date(Date.now() + retryMs).toISOString();
        target.nextRetryAt = nextRetry;
        attempt.nextRetryAt = nextRetry;
        target.lastErrorCode = result.errorCode || 'PINTEREST_RATE_LIMIT';
        target.lastErrorMessage = result.errorMessage || null;
        retrying++;
      } else if (result.status === SocialPublishAttemptStatus.LIMIT_REACHED) {
        target.status = SocialSchedulerTargetStatus.LIMIT_REACHED;
        const retryMs = result.retryAfterMs || 3600000;
        const nextRetry = new Date(Date.now() + retryMs).toISOString();
        target.nextRetryAt = nextRetry;
        attempt.nextRetryAt = nextRetry;
        target.lastErrorCode = result.errorCode || 'INSTAGRAM_PUBLISHING_LIMIT_REACHED';
        target.lastErrorMessage = result.errorMessage || null;
        retrying++;
      } else if (result.status === SocialPublishAttemptStatus.REAUTH_REQUIRED) {
        target.status = SocialSchedulerTargetStatus.REAUTH_REQUIRED;
        target.reauthRequiredAt = finishedIso;
        target.lastErrorCode = result.errorCode || 'REAUTH_REQUIRED';
        target.lastErrorMessage = result.errorMessage || null;
        target.nextRetryAt = null;
        reauthRequired++;
      } else if (
        result.status === SocialPublishAttemptStatus.FAILED_RETRYABLE ||
        result.status === SocialPublishAttemptStatus.TIMED_OUT
      ) {
        attempt.retryable = true;
        if (attemptNumber < 3) {
          target.status = SocialSchedulerTargetStatus.RETRYING;
          const retryMs = result.retryAfterMs || 5 * 60 * 1000;
          const nextRetry = new Date(Date.now() + retryMs).toISOString();
          target.nextRetryAt = nextRetry;
          attempt.nextRetryAt = nextRetry;
          retrying++;
        } else {
          target.status = SocialSchedulerTargetStatus.FAILED;
          target.nextRetryAt = null;
          failed++;
        }
        target.lastErrorCode = result.errorCode || null;
        target.lastErrorMessage = result.errorMessage || null;
      } else if (result.status === SocialPublishAttemptStatus.SKIPPED) {
        target.status = SocialSchedulerTargetStatus.SKIPPED;
        skipped++;
      } else {
        // Permanent failure
        target.status = SocialSchedulerTargetStatus.FAILED;
        target.lastErrorCode = result.errorCode || null;
        target.lastErrorMessage = result.errorMessage || null;
        target.nextRetryAt = null;
        failed++;
      }

      // Persist attempt update
      sprint1Storage.updateAttempt(attempt.id, attempt);

      // Recalculate parent post status
      this.recalculatePostStatus(post);
      sprint1Storage.updatePost(post.id, post);
    }

    return {
      workerRunId,
      claimedTargets: dueItems.length,
      succeeded,
      retrying,
      failed,
      skipped,
      reauthRequired,
    };
  }

  /**
   * Triggers an immediate retry for a specific target
   */
  async retryTargetNow(
    postId: string,
    targetId: string,
    mockMode: MockAdapterMode = 'success'
  ): Promise<SocialPublishAttempt | null> {
    const post = sprint1Storage.getPostById(postId);
    if (!post) return null;

    const target = post.targets.find((t) => t.id === targetId);
    if (!target) return null;

    // Reset nextRetryAt to now and process
    target.nextRetryAt = new Date().toISOString();
    target.status = SocialSchedulerTargetStatus.RETRYING;
    sprint1Storage.updatePost(post.id, post);

    const workerRunId = `manual_retry_${Date.now()}`;
    await this.processDueTargets({
      limit: 1,
      mockMode,
      workspaceId: post.workspaceId,
      workerRunId,
    });

    const attempts = sprint1Storage.getAttempts(postId);
    return attempts[0] || null;
  }

  /**
   * Provides worker summary counts for diagnostics dashboard
   */
  getWorkerSummary(workspaceId?: string): WorkerSummary {
    const allPosts = sprint1Storage.getAllPosts();
    let dueTargets = 0;
    let processingTargets = 0;
    let retryingTargets = 0;
    let failedTargets = 0;
    let reauthRequiredTargets = 0;

    const now = Date.now();

    for (const post of allPosts) {
      if (workspaceId && post.workspaceId !== workspaceId) continue;
      if (
        post.status === SocialSchedulerPostStatus.CANCELLED ||
        post.status === SocialSchedulerPostStatus.DRAFT
      ) {
        continue;
      }

      const isPostScheduledDue = post.scheduledAt ? new Date(post.scheduledAt).getTime() <= now : false;

      for (const t of post.targets) {
        if (t.status === SocialSchedulerTargetStatus.PROCESSING) {
          processingTargets++;
        } else if (t.status === SocialSchedulerTargetStatus.RETRYING) {
          retryingTargets++;
          const retryTime = t.nextRetryAt ? new Date(t.nextRetryAt).getTime() : 0;
          if (retryTime <= now) dueTargets++;
        } else if (t.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED) {
          reauthRequiredTargets++;
        } else if (t.status === SocialSchedulerTargetStatus.FAILED) {
          failedTargets++;
        } else if (
          (t.status === SocialSchedulerTargetStatus.SCHEDULED ||
            t.status === SocialSchedulerTargetStatus.MOCK_READY ||
            t.status === SocialSchedulerTargetStatus.DUE) &&
          isPostScheduledDue
        ) {
          dueTargets++;
        }
      }
    }

    return {
      dueTargets,
      processingTargets,
      retryingTargets,
      failedTargets,
      reauthRequiredTargets,
      lastWorkerRunAt: lastWorkerRunTimestamp,
    };
  }
}

export const workerService = new WorkerService();
