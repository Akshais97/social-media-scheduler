import {
  SocialSchedulerPostStatus,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  DraftContentJson,
  Sprint1ScheduledPost,
} from '../src/types/scheduler';
import { sprint1Storage } from '../src/lib/mock-storage';
import { workerService } from '../src/lib/worker-service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runSprint2Tests() {
  console.log('====================================================');
  console.log('Running Sprint 2 Functional Verification Test Suite');
  console.log('====================================================\n');

  const draftJson: DraftContentJson = {
    version: '1.0',
    source: 'manual_upload',
    caption: 'Sprint 2 test property walkthrough with smart execution',
    hashtags: ['luxury', 'realty'],
  };

  // --- 1. Due Detection Tests ---
  console.log('--- 1. Due Detection Tests (Section 28.1) ---');
  // Future post
  const futurePost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Future Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: 'tgt_future_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'Facebook Future',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  const dueBefore = workerService.getDueTargets('ws_mantri');
  const hasFuture = dueBefore.some((item) => item.post.id === futurePost.id);
  assert(!hasFuture, 'Future post targets are not due');

  // Past post
  const pastPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Past Due Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: 'tgt_past_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'Facebook Past Due',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  const dueNow = workerService.getDueTargets('ws_mantri');
  const hasPast = dueNow.some((item) => item.post.id === pastPost.id);
  assert(hasPast, 'Past post targets are correctly detected as due');

  // --- 2. Success Flow Tests ---
  console.log('\n--- 2. Success Path Tests (Section 28.2) ---');
  const successPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Success Flow Post',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: `tgt_suc_1_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'FB Target',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
      {
        id: `tgt_suc_2_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mockAccountName: 'IG Target',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  const successRun = await workerService.processDueTargets({
    mockMode: 'success',
    workspaceId: 'ws_mantri',
  });

  const postAfterSuccess = sprint1Storage.getPostById(successPost.id);
  assert(postAfterSuccess?.status === SocialSchedulerPostStatus.PUBLISHED_MOCK, 'Parent post recalculates to PUBLISHED_MOCK');
  assert(postAfterSuccess?.targets.every((t) => t.status === SocialSchedulerTargetStatus.PUBLISHED_MOCK) || false, 'All targets transition to PUBLISHED_MOCK');
  assert(postAfterSuccess?.targets.every((t) => t.mockExternalId && t.mockExternalUrl) || false, 'Targets receive mockExternalId and mockExternalUrl');

  const attemptsForPost = sprint1Storage.getAttempts(successPost.id);
  assert(attemptsForPost.length >= 2, 'Attempt rows created for each target');
  assert(attemptsForPost.every((a) => a.status === SocialPublishAttemptStatus.SUCCEEDED), 'Attempts record status SUCCEEDED');

  // --- 3. Retryable Failure Tests ---
  console.log('\n--- 3. Retryable Failure Tests (Section 28.3) ---');
  const retryPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_sobha',
    title: 'Retryable Failure Post',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: `tgt_ret_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_sobha',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        mockAccountName: 'IG Retry Target',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  await workerService.processDueTargets({
    mockMode: 'retryable_failure',
    workspaceId: 'ws_sobha',
  });

  const postAfterRetry = sprint1Storage.getPostById(retryPost.id);
  const targetAfterRetry = postAfterRetry?.targets[0];
  assert(targetAfterRetry?.status === SocialSchedulerTargetStatus.RETRYING, 'Target transitions to RETRYING');
  assert(postAfterRetry?.status === SocialSchedulerPostStatus.RETRYING, 'Parent post recalculates to RETRYING');
  assert(!!targetAfterRetry?.nextRetryAt, 'Target has nextRetryAt scheduled');
  assert(targetAfterRetry?.lastErrorCode === 'MOCK_TIMEOUT', 'Target records lastErrorCode MOCK_TIMEOUT');

  const retryAttempts = sprint1Storage.getAttempts(retryPost.id);
  assert(retryAttempts[0]?.status === SocialPublishAttemptStatus.FAILED_RETRYABLE, 'Attempt recorded as FAILED_RETRYABLE');
  assert(retryAttempts[0]?.retryable === true, 'Attempt marks retryable: true');

  // --- 4. Permanent Failure Tests ---
  console.log('\n--- 4. Permanent Failure Tests (Section 28.4) ---');
  const failPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_sobha',
    title: 'Permanent Failure Post',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: `tgt_fail_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_sobha',
        platform: SocialSchedulerPlatform.YOUTUBE,
        mockAccountName: 'YT Fail Target',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  await workerService.processDueTargets({
    mockMode: 'permanent_failure',
    workspaceId: 'ws_sobha',
  });

  const postAfterFail = sprint1Storage.getPostById(failPost.id);
  assert(postAfterFail?.status === SocialSchedulerPostStatus.FAILED, 'Parent post recalculates to FAILED when all targets fail');
  assert(postAfterFail?.targets[0]?.status === SocialSchedulerTargetStatus.FAILED, 'Target transitions to FAILED');
  assert(postAfterFail?.targets[0]?.lastErrorCode === 'MOCK_INVALID_MEDIA', 'Target records MOCK_INVALID_MEDIA error code');

  // --- 5. Cancelled Post Protection ---
  console.log('\n--- 5. Cancelled Post Protection (Section 28.6) ---');
  const cancelledPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_prestige',
    title: 'Cancelled Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    targets: [
      {
        id: `tgt_canc_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_prestige',
        platform: SocialSchedulerPlatform.PINTEREST,
        mockAccountName: 'Pinterest Cancelled',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  // Cancel post before worker execution
  sprint1Storage.cancelPost(cancelledPost.id);

  const beforeCancelledAttempts = sprint1Storage.getAttempts(cancelledPost.id).length;
  await workerService.processDueTargets({
    mockMode: 'success',
    workspaceId: 'ws_prestige',
  });
  const afterCancelledAttempts = sprint1Storage.getAttempts(cancelledPost.id).length;

  assert(beforeCancelledAttempts === afterCancelledAttempts, 'Cancelled post generates zero publish attempts');
  assert(sprint1Storage.getPostById(cancelledPost.id)?.status === SocialSchedulerPostStatus.CANCELLED, 'Cancelled post remains CANCELLED');

  // --- 6. Stale Lock Recovery Tests ---
  console.log('\n--- 6. Stale Lock Recovery (Section 28.9) ---');
  const stalePost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Stale Lock Post',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: SocialSchedulerPostStatus.PROCESSING,
    targets: [
      {
        id: `tgt_stale_${Date.now()}`,
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        mockAccountName: 'Stale Target',
        status: SocialSchedulerTargetStatus.PROCESSING,
        lockedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago (>15m)
        lockedBy: 'stale_worker_999',
      },
    ],
  });

  const recovered = workerService.recoverStaleLocks();
  assert(recovered >= 1, 'Worker recovers stale locks older than 15 minutes');

  const postAfterRecovery = sprint1Storage.getPostById(stalePost.id);
  assert(postAfterRecovery?.targets[0]?.status === SocialSchedulerTargetStatus.RETRYING, 'Stale target recovered to RETRYING');
  assert(postAfterRecovery?.targets[0]?.lockedAt === null, 'Stale target lock released');

  // --- 7. Workspace Isolation Tests ---
  console.log('\n--- 7. Workspace Isolation for Attempt History (Section 28.7) ---');
  const mantriAttempts = sprint1Storage.getAttempts(undefined, 'ws_mantri');
  const sobhaAttempts = sprint1Storage.getAttempts(undefined, 'ws_sobha');

  assert(mantriAttempts.every((a) => a.workspaceId === 'ws_mantri'), 'Mantri queries return strictly Mantri attempts');
  assert(sobhaAttempts.every((a) => a.workspaceId === 'ws_sobha'), 'Sobha queries return strictly Sobha attempts');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runSprint2Tests().catch((e) => {
  console.error(e);
  process.exit(1);
});
