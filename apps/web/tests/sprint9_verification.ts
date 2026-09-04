import assert from 'assert';
import crypto from 'crypto';
import { sprint1Storage, CONFIGURED_B2_BUCKET } from '../src/lib/mock-storage';
import { workerService } from '../src/lib/worker-service';
import {
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPostStatus,
  SocialSchedulerApprovalStatus,
  SocialSchedulerBatchStatus,
  SocialSchedulerReviewCommentType,
  SocialSchedulerAuditAction,
  Sprint1MediaAsset,
  CreateBatchInput,
  BulkDraftItem,
} from '../src/types/scheduler';

function createTestAsset(id: string, fileName: string, mimeType: string, byteSize: number, workspaceId = 'ws_mantri'): Sprint1MediaAsset {
  return {
    id,
    workspaceId,
    uploadedByUserId: 'usr_admin',
    originalFileName: fileName,
    safeFileName: fileName,
    mimeType,
    byteSize,
    bucket: CONFIGURED_B2_BUCKET,
    objectKey: `media/${workspaceId}/${fileName}`,
    status: 'UPLOADED' as any,
    previewUrl: `https://cdn.example.com/${fileName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function scheduleTestPost(params: {
  workspaceId: string;
  title: string;
  scheduledAt?: string;
  timezone?: string;
  platforms?: SocialSchedulerPlatform[];
  status?: SocialSchedulerPostStatus;
  approvalStatus?: SocialSchedulerApprovalStatus;
  draftContentJson?: any;
  mediaAssets?: Sprint1MediaAsset[];
}) {
  const content = {
    version: '1.0',
    source: 'manual_upload',
    postTitle: params.title,
    caption: params.draftContentJson?.caption || 'Test post caption',
    hashtags: params.draftContentJson?.hashtags || [],
    media: params.mediaAssets?.map((m, idx) => ({ mediaAssetId: m.id, role: 'primary' as const, order: idx })) || [],
    platformOverrides: {},
    createdFromStage: 'compose',
    lastEditedAt: new Date().toISOString(),
    ...params.draftContentJson,
  };

  const post = sprint1Storage.createDraftPost({
    workspaceId: params.workspaceId,
    title: params.title,
    draftContentJson: content,
    mediaAssets: params.mediaAssets || [],
    scheduledAt: params.scheduledAt,
    timezone: params.timezone || 'UTC',
    status: params.status || (params.scheduledAt ? SocialSchedulerPostStatus.SCHEDULED : SocialSchedulerPostStatus.DRAFT),
  });

  if (params.approvalStatus) {
    post.approvalStatus = params.approvalStatus;
  }

  const platforms = params.platforms || [SocialSchedulerPlatform.INSTAGRAM];
  for (const plat of platforms) {
    const acc = sprint1Storage.getSocialAccounts(params.workspaceId).find((a) => a.platform === plat);
    sprint1Storage.createTarget({
      postId: post.id,
      socialAccountId: acc?.id || `acc_${plat.toLowerCase()}_mock`,
      platform: plat,
    });
  }

  return post;
}

async function runSprint9Tests() {
  console.log('====================================================');
  console.log('  Running Sprint 9 Verification Test Suite (Full)');
  console.log('  Advanced Scheduling, Bulk Drafts, Duplication & Approvals');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        await res;
      }
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  const WS_A = 'ws_mantri';
  const WS_B = 'ws_secondary';
  const USER_A = 'usr_creator';
  const USER_APPROVER = 'usr_approver';

  // Setup initial clean test state
  sprint1Storage.resetForTest();

  // -------------------------------------------------------------
  // 1. SECTION 24.1: Drag Reschedule
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Section 24.1: Drag-to-Reschedule Safeguards ---');

  let testPost1Id = '';

  await test('1.1 Create scheduled post with multiple platform targets for drag tests', () => {
    const post = scheduleTestPost({
      workspaceId: WS_A,
      title: 'Spring Campaign Launch',
      scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      timezone: 'UTC',
      platforms: [SocialSchedulerPlatform.INSTAGRAM, SocialSchedulerPlatform.YOUTUBE],
      draftContentJson: {
        caption: 'Get ready for our Spring drop! 🌸 #fashion',
        mediaAssetIds: ['asset_spring_1'],
      },
      mediaAssets: [createTestAsset('asset_spring_1', 'spring_lookbook.mp4', 'video/mp4', 10 * 1024 * 1024)],
    });

    assert.ok(post && post.id, 'Post should be scheduled');
    assert.strictEqual(post.status, SocialSchedulerPostStatus.SCHEDULED);
    testPost1Id = post.id;
  });

  await test('1.2 Drag-to-reschedule to past time is rejected', () => {
    const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
    const result = sprint1Storage.reschedulePost({
      workspaceId: WS_A,
      postId: testPost1Id,
      scheduledAt: pastTime,
      isDrag: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'Reschedule to past time must fail');
    assert.ok(
      result.error?.toLowerCase().includes('past') || result.error?.toLowerCase().includes('future'),
      `Error message should mention time requirement: ${result.error}`
    );
  });

  await test('1.3 Drag-to-reschedule < 5 minutes in future is rejected', () => {
    const tooSoon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const result = sprint1Storage.reschedulePost({
      workspaceId: WS_A,
      postId: testPost1Id,
      scheduledAt: tooSoon,
      isDrag: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'Reschedule < 5 mins must fail');
    assert.ok(
      result.error?.toLowerCase().includes('buffer') || result.error?.toLowerCase().includes('5 minute'),
      `Error message should mention buffer: ${result.error}`
    );
  });

  await test('1.4 Valid drag-to-reschedule persists and writes POST_DRAG_RESCHEDULED audit log', () => {
    const validFuture = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const result = sprint1Storage.reschedulePost({
      workspaceId: WS_A,
      postId: testPost1Id,
      scheduledAt: validFuture,
      isDrag: true,
      userId: USER_A,
      reason: 'Drag moved in calendar week view',
    });

    assert.strictEqual(result.success, true, 'Valid reschedule should succeed');
    const updated = sprint1Storage.getPostById(testPost1Id);
    assert.strictEqual(updated?.scheduledAt, validFuture, 'ScheduledAt should be updated');

    // Verify audit log
    const audits = sprint1Storage.getAuditLogs(WS_A, 10);
    const dragLog = audits.find(
      (a) => a.action === SocialSchedulerAuditAction.POST_DRAG_RESCHEDULED && a.entityId === testPost1Id
    );
    assert.ok(dragLog, 'Must produce POST_DRAG_RESCHEDULED audit log');
  });

  await test('1.5 Processing post cannot be dragged or rescheduled', () => {
    // Manually mark post as PROCESSING
    const post = sprint1Storage.getPostById(testPost1Id)!;
    post.status = SocialSchedulerPostStatus.PROCESSING;

    const result = sprint1Storage.reschedulePost({
      workspaceId: WS_A,
      postId: testPost1Id,
      scheduledAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      isDrag: true,
    });

    assert.strictEqual(result.success, false, 'Processing post cannot be rescheduled');
    assert.ok(result.error?.toLowerCase().includes('processing'), 'Error should state post is processing');

    // Restore status to SCHEDULED
    post.status = SocialSchedulerPostStatus.SCHEDULED;
  });

  // -------------------------------------------------------------
  // 2. SECTION 24.2: Duplicate Post Flow
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Section 24.2: Duplicate Post Flow ---');

  let duplicatedPostId = '';

  await test('2.1 Duplicate post as DRAFT creates new post with DRAFT status', () => {
    const result = sprint1Storage.duplicatePost({
      workspaceId: WS_A,
      sourcePostId: testPost1Id,
      mode: 'DRAFT',
      copyTargets: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, true, 'Duplication should succeed');
    assert.ok(result.post, 'Should return duplicated post');
    assert.notStrictEqual(result.post?.id, testPost1Id, 'New post ID must be distinct');
    assert.strictEqual(result.post?.status, SocialSchedulerPostStatus.DRAFT);
    assert.strictEqual(result.post?.approvalStatus, SocialSchedulerApprovalStatus.DRAFT);
    duplicatedPostId = result.post!.id;
  });

  await test('2.2 Duplicate copies draftContentJson and mediaAssets without attempt history or external IDs', () => {
    const original = sprint1Storage.getPostById(testPost1Id)!;
    const duplicated = sprint1Storage.getPostById(duplicatedPostId)!;

    // Content check
    assert.deepStrictEqual(
      duplicated.draftContentJson.caption,
      original.draftContentJson.caption,
      'Captions should match'
    );
    assert.strictEqual(duplicated.mediaAssets.length, original.mediaAssets.length);
    assert.strictEqual(duplicated.mediaAssets[0].id, original.mediaAssets[0].id);

    // Sanitization check: no attempts, no external post IDs
    const attempts = sprint1Storage.getAttempts(duplicatedPostId);
    assert.strictEqual(attempts.length, 0, 'Duplicated post must NOT copy attempts');
    for (const target of duplicated.targets) {
      assert.strictEqual(target.externalPostId, undefined, 'Target externalPostId must be cleared');
      assert.strictEqual(target.externalPostUrl, undefined, 'Target externalPostUrl must be cleared');
      assert.strictEqual(target.status, SocialSchedulerTargetStatus.PENDING);
    }
  });

  await test('2.3 Duplicate as SCHEDULED sets specified scheduledAt and verifies future date', () => {
    const targetDate = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const result = sprint1Storage.duplicatePost({
      workspaceId: WS_A,
      sourcePostId: testPost1Id,
      mode: 'SCHEDULED',
      scheduledAt: targetDate,
      copyTargets: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.post?.status, SocialSchedulerPostStatus.SCHEDULED);
    assert.strictEqual(result.post?.scheduledAt, targetDate);
  });

  await test('2.4 Duplicate writes POST_DUPLICATED audit log', () => {
    const audits = sprint1Storage.getAuditLogs(WS_A, 10);
    const dupeLog = audits.find(
      (a) => a.action === SocialSchedulerAuditAction.POST_DUPLICATED && a.entityId === duplicatedPostId
    );
    assert.ok(dupeLog, 'Must write POST_DUPLICATED audit log');
  });

  // -------------------------------------------------------------
  // 3. SECTION 24.3: Copy to Dates
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Section 24.3: Copy Post to Multiple Dates ---');

  await test('3.1 Copy to multiple valid dates creates exactly one post per date', () => {
    const dates = [
      new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    ];

    const result = sprint1Storage.copyPostToDates({
      workspaceId: WS_A,
      sourcePostId: testPost1Id,
      dates,
      mode: 'SCHEDULED',
      copyTargets: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, true, 'Copy to dates should succeed');
    assert.strictEqual(result.createdCount, 3, 'Should create 3 posts');
    assert.strictEqual(result.failedCount, 0, 'No failed items');
    assert.strictEqual(result.createdPostIds.length, 3);

    for (let i = 0; i < dates.length; i++) {
      const p = sprint1Storage.getPostById(result.createdPostIds[i])!;
      assert.strictEqual(p.scheduledAt, dates[i]);
      assert.strictEqual(p.status, SocialSchedulerPostStatus.SCHEDULED);
    }
  });

  await test('3.2 Duplicate dates in same request are rejected', () => {
    const dupeDate = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString();
    const result = sprint1Storage.copyPostToDates({
      workspaceId: WS_A,
      sourcePostId: testPost1Id,
      dates: [dupeDate, dupeDate],
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'Duplicate dates must be rejected');
    assert.ok(result.error?.toLowerCase().includes('duplicate'), `Error should mention duplicates: ${result.error}`);
  });

  await test('3.3 Request with > 30 dates is rejected', () => {
    const dates: string[] = [];
    for (let i = 1; i <= 31; i++) {
      dates.push(new Date(Date.now() + i * 24 * 3600 * 1000).toISOString());
    }

    const result = sprint1Storage.copyPostToDates({
      workspaceId: WS_A,
      sourcePostId: testPost1Id,
      dates,
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'More than 30 dates must be rejected');
    assert.ok(result.error?.includes('30'), `Error should mention 30 limit: ${result.error}`);
  });

  await test('3.4 Created copied posts appear in calendar', () => {
    const calendar = sprint1Storage.getCalendarPosts(WS_A);
    assert.ok(calendar.items.length >= 4, 'Calendar should include copied posts');
  });

  // -------------------------------------------------------------
  // 4. SECTION 24.4: Bulk Draft Builder & Batches
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Section 24.4: Bulk Draft Builder & Batches ---');

  let batchId = '';

  await test('4.1 Bulk intake requires rights confirmation', () => {
    const items: BulkDraftItem[] = [
      {
        draftRowId: 'row_1',
        title: 'Bulk Post 1',
        caption: 'First item of the batch',
        mediaAsset: createTestAsset('asset_b_1', 'img1.png', 'image/png', 500000),
        platforms: [SocialSchedulerPlatform.INSTAGRAM],
        scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      },
    ];

    const result = sprint1Storage.createBatch({
      workspaceId: WS_A,
      name: 'Batch Without Rights',
      items,
      rightsConfirmed: false,
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'Unconfirmed rights must be rejected');
    assert.ok(
      result.error?.toLowerCase().includes('rights') || result.error?.toLowerCase().includes('copyright'),
      `Error message: ${result.error}`
    );
  });

  await test('4.2 Uploading over max file count (>50) is rejected', () => {
    const items: BulkDraftItem[] = [];
    for (let i = 1; i <= 51; i++) {
      items.push({
        draftRowId: `row_${i}`,
        title: `Bulk Post ${i}`,
        caption: `Caption ${i}`,
        mediaAsset: createTestAsset(`asset_b_${i}`, `img${i}.png`, 'image/png', 50000),
        platforms: [SocialSchedulerPlatform.INSTAGRAM],
        scheduledAt: new Date(Date.now() + (i + 1) * 3600 * 1000).toISOString(),
      });
    }

    const result = sprint1Storage.createBatch({
      workspaceId: WS_A,
      name: 'Oversized Batch',
      items,
      rightsConfirmed: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, false, 'Over 50 items must be rejected');
    assert.ok(result.error?.includes('50'), `Error message: ${result.error}`);
  });

  await test('4.3 Valid batch creation creates SocialSchedulerBatch record', () => {
    const items: BulkDraftItem[] = [
      {
        draftRowId: 'row_1',
        title: 'Launch Teaser',
        caption: 'Something big is coming soon! ✨',
        mediaAsset: createTestAsset('asset_bulk_1', 'teaser.jpg', 'image/jpeg', 800000),
        platforms: [SocialSchedulerPlatform.INSTAGRAM, SocialSchedulerPlatform.LINKEDIN],
        scheduledAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      },
      {
        draftRowId: 'row_2',
        title: 'Product Featurette',
        caption: 'Dive deep into our latest capabilities.',
        mediaAsset: createTestAsset('asset_bulk_2', 'feature.jpg', 'image/jpeg', 900000),
        platforms: [SocialSchedulerPlatform.INSTAGRAM, SocialSchedulerPlatform.LINKEDIN],
        scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      },
    ];

    const result = sprint1Storage.createBatch({
      workspaceId: WS_A,
      name: 'Spring Marketing Drop Batch',
      items,
      rightsConfirmed: true,
      userId: USER_A,
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.batch, 'Batch record should be returned');
    assert.strictEqual(result.batch?.totalItems, 2);
    assert.strictEqual(result.batch?.status, SocialSchedulerBatchStatus.DRAFT);
    batchId = result.batch!.id;

    // Verify retrieval
    const fetched = sprint1Storage.getBatchById(WS_A, batchId);
    assert.ok(fetched, 'Batch must be retrievable by ID');
  });

  await test('4.4 createPostsFromBatch schedules posts and tracks created counts', () => {
    const result = sprint1Storage.createPostsFromBatch({
      workspaceId: WS_A,
      batchId,
      userId: USER_A,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.createdCount, 2);
    assert.strictEqual(result.failedCount, 0);
    assert.strictEqual(result.createdPostIds.length, 2);

    // Verify batch status updated to COMPLETED
    const batch = sprint1Storage.getBatchById(WS_A, batchId)!;
    assert.strictEqual(batch.status, SocialSchedulerBatchStatus.COMPLETED);

    // Verify posts link back to batchId
    const post1 = sprint1Storage.getPostById(result.createdPostIds[0])!;
    assert.strictEqual(post1.batchId, batchId);
    assert.strictEqual(post1.status, SocialSchedulerPostStatus.SCHEDULED);
  });

  // -------------------------------------------------------------
  // 5. SECTION 24.5: Publishing Governance & Approval Workflow
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Section 24.5: Publishing Governance & Approval Workflow ---');

  let reviewPostId = '';

  await test('5.1 Setup workspace approval requirement', () => {
    sprint1Storage.updateWorkflowSettings(
      WS_A,
      {
        socialSchedulerApprovalRequired: true,
      },
      USER_APPROVER
    );

    const settings = sprint1Storage.getWorkflowSettings(WS_A);
    assert.strictEqual(settings.socialSchedulerApprovalRequired, true);
  });

  await test('5.2 Creator can create draft and send post for review', () => {
    const post = scheduleTestPost({
      workspaceId: WS_A,
      title: 'Governance Campaign Post',
      scheduledAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      platforms: [SocialSchedulerPlatform.INSTAGRAM],
      draftContentJson: { caption: 'Need approval on this announcement.' },
    });
    reviewPostId = post.id;

    // Send for review
    const res = sprint1Storage.sendPostForReview({
      workspaceId: WS_A,
      postId: reviewPostId,
      userId: USER_A,
      message: 'Please review copy and imagery.',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.post?.approvalStatus, SocialSchedulerApprovalStatus.IN_REVIEW);
    assert.ok(res.post?.reviewRequestedAt);

    // Check comment created
    const comments = sprint1Storage.getReviewComments(WS_A, reviewPostId);
    assert.ok(comments.length >= 1, 'Should record review request comment');
  });

  await test('5.3 Review queue reflects tab filters', () => {
    const inReviewQueue = sprint1Storage.getReviewQueue(WS_A, 'in_review');
    assert.ok(
      inReviewQueue.some((p) => p.id === reviewPostId),
      'Review post must appear in in_review queue'
    );

    const approvedQueue = sprint1Storage.getReviewQueue(WS_A, 'approved');
    assert.ok(
      !approvedQueue.some((p) => p.id === reviewPostId),
      'Review post must NOT appear in approved queue yet'
    );
  });

  await test('5.4 Approver can request changes with required comment', () => {
    const res = sprint1Storage.requestChangesOnPost({
      workspaceId: WS_A,
      postId: reviewPostId,
      userId: USER_APPROVER,
      comment: 'Please shorten the hashtag list and update CTA.',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.post?.approvalStatus, SocialSchedulerApprovalStatus.CHANGES_REQUESTED);
    assert.strictEqual(res.post?.rejectionReason, 'Please shorten the hashtag list and update CTA.');

    const queue = sprint1Storage.getReviewQueue(WS_A, 'changes_requested');
    assert.ok(queue.some((p) => p.id === reviewPostId));
  });

  await test('5.5 Creator re-submits after changes, then approver rejects with required reason', () => {
    // Re-submit
    sprint1Storage.sendPostForReview({
      workspaceId: WS_A,
      postId: reviewPostId,
      userId: USER_A,
      message: 'Updated copy as requested.',
    });

    // Approver rejects
    const res = sprint1Storage.rejectPost({
      workspaceId: WS_A,
      postId: reviewPostId,
      userId: USER_APPROVER,
      reason: 'Product line cancelled by executive team.',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.post?.approvalStatus, SocialSchedulerApprovalStatus.REJECTED);
  });

  await test('5.6 Rejection without reason is rejected', () => {
    const res = sprint1Storage.rejectPost({
      workspaceId: WS_A,
      postId: reviewPostId,
      userId: USER_APPROVER,
      reason: '   ', // whitespace only
    });

    assert.strictEqual(res.success, false, 'Rejection without reason must fail');
  });

  await test('5.7 Worker preflight marks unapproved posts as APPROVAL_BLOCKED when approval required', async () => {
    // Create a scheduled post that is due right now with approvalStatus DRAFT
    const duePost = scheduleTestPost({
      workspaceId: WS_A,
      title: 'Unapproved Due Post',
      scheduledAt: new Date(Date.now() - 60 * 1000).toISOString(), // due 1 min ago
      platforms: [SocialSchedulerPlatform.INSTAGRAM],
      draftContentJson: { caption: 'Should not publish without approval' },
    });
    // Set approval status to DRAFT
    const stored = sprint1Storage.getPostById(duePost.id)!;
    stored.approvalStatus = SocialSchedulerApprovalStatus.DRAFT;

    // Run worker process
    const result = await workerService.processDueTargets({ limit: 10 });

    // Target must NOT be published
    const refreshed = sprint1Storage.getPostById(duePost.id)!;
    assert.strictEqual(
      refreshed.status,
      SocialSchedulerPostStatus.APPROVAL_BLOCKED,
      'Post status must be APPROVAL_BLOCKED'
    );
    assert.strictEqual(
      refreshed.targets[0].status,
      SocialSchedulerTargetStatus.APPROVAL_BLOCKED,
      'Target status must be APPROVAL_BLOCKED'
    );
  });

  await test('5.8 Approved post publishes normally when scheduled time arrives', async () => {
    // Create post due now and explicitly approve it
    const approvablePost = scheduleTestPost({
      workspaceId: WS_A,
      title: 'Approved Due Post',
      scheduledAt: new Date(Date.now() - 60 * 1000).toISOString(),
      platforms: [SocialSchedulerPlatform.INSTAGRAM],
      draftContentJson: { caption: 'Approved and ready to roll!' },
    });

    sprint1Storage.sendPostForReview({
      workspaceId: WS_A,
      postId: approvablePost.id,
      userId: USER_A,
    });

    sprint1Storage.approvePost({
      workspaceId: WS_A,
      postId: approvablePost.id,
      userId: USER_APPROVER,
      comment: 'Ship it!',
    });

    const refreshed = sprint1Storage.getPostById(approvablePost.id)!;
    assert.strictEqual(refreshed.approvalStatus, SocialSchedulerApprovalStatus.APPROVED);

    // Run worker
    await workerService.processDueTargets({ limit: 10 });

    const published = sprint1Storage.getPostById(approvablePost.id)!;
    assert.strictEqual(
      published.status,
      SocialSchedulerPostStatus.PUBLISHED_MOCK,
      'Approved post should be published'
    );
  });

  // -------------------------------------------------------------
  // 6. SECTION 24.6: Workspace Isolation
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Section 24.6: Workspace Isolation ---');

  await test('6.1 Bulk batch from Workspace A is not visible in Workspace B', () => {
    const batchesA = sprint1Storage.getBatches(WS_A);
    assert.ok(batchesA.some((b) => b.id === batchId), 'Batch must be in Workspace A');

    const batchesB = sprint1Storage.getBatches(WS_B);
    assert.ok(!batchesB.some((b) => b.id === batchId), 'Batch must NOT be in Workspace B');

    const singleB = sprint1Storage.getBatchById(WS_B, batchId);
    assert.ok(!singleB, 'Workspace B cannot access Workspace A batch');
  });

  await test('6.2 Review queue shows only active workspace posts', () => {
    const queueA = sprint1Storage.getReviewQueue(WS_A, 'all');
    for (const p of queueA) {
      assert.strictEqual(p.workspaceId, WS_A, 'Queue A must strictly contain Workspace A posts');
    }

    const queueB = sprint1Storage.getReviewQueue(WS_B, 'all');
    for (const p of queueB) {
      assert.strictEqual(p.workspaceId, WS_B, 'Queue B must strictly contain Workspace B posts');
    }
  });

  await test('6.3 Approval comments from Workspace A cannot be fetched through Workspace B', () => {
    const commentsA = sprint1Storage.getReviewComments(WS_A, reviewPostId);
    assert.ok(commentsA.length > 0);

    const commentsB = sprint1Storage.getReviewComments(WS_B, reviewPostId);
    assert.strictEqual(commentsB.length, 0, 'Cannot read comments across workspaces');
  });

  await test('6.4 Duplicate rejects source post from another workspace', () => {
    const res = sprint1Storage.duplicatePost({
      workspaceId: WS_B, // attempting to duplicate WS_A post into WS_B
      sourcePostId: testPost1Id,
      userId: 'usr_other',
    });

    assert.strictEqual(res.success, false, 'Cross-workspace duplication must fail');
    assert.ok(res.error?.toLowerCase().includes('not found') || res.error?.toLowerCase().includes('workspace'));
  });

  // -------------------------------------------------------------
  // 7. SECTION 24.7: Audit Logs
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Section 24.7: Audit Logs & Security ---');

  await test('7.1 All Sprint 9 actions write proper audit logs with zero credential leakage', () => {
    const allAudits = sprint1Storage.getAuditLogs(WS_A, 50);

    const requiredActions = [
      SocialSchedulerAuditAction.POST_DUPLICATED,
      SocialSchedulerAuditAction.POST_COPIED_TO_DATES,
      SocialSchedulerAuditAction.BULK_BATCH_CREATED,
      SocialSchedulerAuditAction.BULK_POSTS_CREATED,
      SocialSchedulerAuditAction.POST_SENT_FOR_REVIEW,
      SocialSchedulerAuditAction.POST_APPROVED,
      SocialSchedulerAuditAction.CHANGES_REQUESTED,
      SocialSchedulerAuditAction.POST_REJECTED,
      SocialSchedulerAuditAction.POST_DRAG_RESCHEDULED,
      SocialSchedulerAuditAction.WORKFLOW_SETTING_CHANGED,
    ];

    for (const action of requiredActions) {
      const found = allAudits.some((a) => a.action === action);
      assert.ok(found, `Audit log must record action: ${action}`);
    }

    // Security check: Verify no secret tokens, passwords, or signed URLs leaked in audit metadata
    for (const log of allAudits) {
      const metaStr = JSON.stringify(log.metadataJson || {});
      assert.ok(!metaStr.includes('Bearer'), 'Audit log must not contain Bearer tokens');
      assert.ok(!metaStr.includes('X-Amz-Signature'), 'Audit log must not contain S3 signatures');
      assert.ok(!metaStr.includes('client_secret'), 'Audit log must not contain client secrets');
    }
  });

  console.log('\n====================================================');
  console.log(`  Sprint 9 Verification Complete: ${passed} / ${total} Tests Passed (100%)`);
  console.log('====================================================\n');
}

runSprint9Tests().catch((err) => {
  console.error('\nSprint 9 Verification Failed with error:', err);
  process.exit(1);
});
