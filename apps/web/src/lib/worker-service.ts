import {
  SocialSchedulerPostStatus,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialPublishAttempt,
  Sprint1ScheduledPost,
  Sprint1PublishTarget,
  PublishInput,
} from '@/types/scheduler';
import { sprint1Storage } from './mock-storage';
import { mockPublisherAdapter, MockAdapterMode } from './mock-publisher-adapter';

export interface ProcessDueResult {
  workerRunId: string;
  claimedTargets: number;
  succeeded: number;
  retrying: number;
  failed: number;
  skipped: number;
}

export interface WorkerSummary {
  dueTargets: number;
  processingTargets: number;
  retryingTargets: number;
  failedTargets: number;
  lastWorkerRunAt: string | null;
}

let lastWorkerRunTimestamp: string | null = null;

export class WorkerService {
  /**
   * Recovers targets stuck in PROCESSING where lockedAt is older than 15 minutes
   */
  recoverStaleLocks(): number {
    const STALE_LOCK_MS = 15 * 60 * 1000;
    const now = Date.now();
    let recoveredCount = 0;

    const allPosts = sprint1Storage.getAllPosts();
    for (const post of allPosts) {
      let postModified = false;
      for (const target of post.targets) {
        if (target.status === SocialSchedulerTargetStatus.PROCESSING && target.lockedAt) {
          const lockTime = new Date(target.lockedAt).getTime();
          if (now - lockTime > STALE_LOCK_MS) {
            target.status = SocialSchedulerTargetStatus.RETRYING;
            target.lockedAt = null;
            target.lockedBy = null;
            target.lastErrorMessage = 'Recovered from stale worker lock (>15m). Marked for retry.';
            recoveredCount++;
            postModified = true;
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
   * Identifies all targets that are due to be processed
   */
  getDueTargets(workspaceId?: string): Array<{ post: Sprint1ScheduledPost; target: Sprint1PublishTarget }> {
    const now = Date.now();
    const allPosts = sprint1Storage.getAllPosts();
    const dueList: Array<{ post: Sprint1ScheduledPost; target: Sprint1PublishTarget }> = [];

    for (const post of allPosts) {
      if (workspaceId && post.workspaceId !== workspaceId) continue;
      // Skip cancelled or draft posts per Section 13.1
      if (
        post.status === SocialSchedulerPostStatus.CANCELLED ||
        post.status === SocialSchedulerPostStatus.DRAFT
      ) {
        continue;
      }

      const postScheduledTime = post.scheduledAt ? new Date(post.scheduledAt).getTime() : 0;
      const isPostScheduledDue = postScheduledTime > 0 && postScheduledTime <= now;

      for (const target of post.targets) {
        // Target must be in SCHEDULED or RETRYING
        if (
          target.status !== SocialSchedulerTargetStatus.SCHEDULED &&
          target.status !== SocialSchedulerTargetStatus.RETRYING
        ) {
          continue;
        }

        // Check retry timer if retrying
        if (target.status === SocialSchedulerTargetStatus.RETRYING) {
          const retryTime = target.nextRetryAt ? new Date(target.nextRetryAt).getTime() : 0;
          if (retryTime <= now) {
            dueList.push({ post, target });
          }
        } else if (isPostScheduledDue) {
          // Regular scheduled due
          dueList.push({ post, target });
        }
      }
    }

    return dueList;
  }

  /**
   * Recalculates and updates parent post status according to Section 10.5
   */
  recalculatePostStatus(post: Sprint1ScheduledPost): SocialSchedulerPostStatus {
    const targets = post.targets;
    if (!targets || targets.length === 0) {
      return post.status;
    }

    const allPublished = targets.every(
      (t) =>
        t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK ||
        t.status === SocialSchedulerTargetStatus.PUBLISHED
    );
    const anyProcessing = targets.some((t) => t.status === SocialSchedulerTargetStatus.PROCESSING);
    const anyRetrying = targets.some((t) => t.status === SocialSchedulerTargetStatus.RETRYING);
    const somePublished = targets.some(
      (t) =>
        t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK ||
        t.status === SocialSchedulerTargetStatus.PUBLISHED
    );
    const someFailed = targets.some((t) => t.status === SocialSchedulerTargetStatus.FAILED);
    const allFailed = targets.every((t) => t.status === SocialSchedulerTargetStatus.FAILED);
    const allCancelled = targets.every((t) => t.status === SocialSchedulerTargetStatus.CANCELLED);

    let newStatus = post.status;

    if (allCancelled) {
      newStatus = SocialSchedulerPostStatus.CANCELLED;
    } else if (allPublished) {
      newStatus = SocialSchedulerPostStatus.PUBLISHED_MOCK;
      post.publishedMockAt = new Date().toISOString();
    } else if (anyProcessing) {
      newStatus = SocialSchedulerPostStatus.PROCESSING;
    } else if (anyRetrying && !anyProcessing) {
      newStatus = SocialSchedulerPostStatus.RETRYING;
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
   * Process due targets with mock publishing adapter and attempt logging
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

    // 3. Process claimed items
    for (const { post, target } of dueItems) {
      // Check if post was cancelled between detection and execution
      if (post.status === SocialSchedulerPostStatus.CANCELLED) {
        target.status = SocialSchedulerTargetStatus.SKIPPED;
        skipped++;
        sprint1Storage.updatePost(post.id, post);
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
        mockMode,
        startedAt: nowIso,
        retryable: false,
        requestJson: {
          platform: target.platform,
          mockAccount: target.mockAccountName,
          title: post.title,
          captionPreview: post.draftContentJson?.caption?.slice(0, 100),
          mediaCount: post.mediaAssets?.length || 0,
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      sprint1Storage.addAttempt(attempt);

      // Build sanitized mock input
      const publishInput: PublishInput = {
        workspaceId: post.workspaceId,
        postId: post.id,
        targetId: target.id,
        platform: target.platform,
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

      // Call Mock Publisher Adapter
      const result = await mockPublisherAdapter.publish(publishInput, mockMode, attemptNumber);
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
      attempt.diagnosticsJson = result.diagnostics || null;
      attempt.responseJson = {
        status: result.status,
        externalPostId: result.externalPostId,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      };

      // Apply result to target state machine
      if (result.status === SocialPublishAttemptStatus.SUCCEEDED) {
        target.status = SocialSchedulerTargetStatus.PUBLISHED_MOCK;
        target.mockExternalId = result.externalPostId || null;
        target.mockExternalUrl = result.externalPostUrl || null;
        target.lastErrorCode = null;
        target.lastErrorMessage = null;
        target.nextRetryAt = null;
        succeeded++;
      } else if (result.status === SocialPublishAttemptStatus.FAILED_RETRYABLE || result.status === SocialPublishAttemptStatus.TIMED_OUT) {
        attempt.retryable = true;
        if (attemptNumber < 3) {
          target.status = SocialSchedulerTargetStatus.RETRYING;
          const retryMs = result.retryAfterMs || 5 * 60 * 1000;
          const nextRetry = new Date(Date.now() + retryMs).toISOString();
          target.nextRetryAt = nextRetry;
          attempt.nextRetryAt = nextRetry;
          retrying++;
        } else {
          // Max attempts exceeded -> mark FAILED
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
        } else if (t.status === SocialSchedulerTargetStatus.FAILED) {
          failedTargets++;
        } else if (t.status === SocialSchedulerTargetStatus.SCHEDULED && isPostScheduledDue) {
          dueTargets++;
        }
      }
    }

    return {
      dueTargets,
      processingTargets,
      retryingTargets,
      failedTargets,
      lastWorkerRunAt: lastWorkerRunTimestamp,
    };
  }
}

export const workerService = new WorkerService();
