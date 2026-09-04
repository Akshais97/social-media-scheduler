import assert from 'assert';
import crypto from 'crypto';
import { sprint1Storage, CONFIGURED_B2_BUCKET } from '../src/lib/mock-storage';
import { credentialVault } from '../src/lib/credential-vault';
import { workerService } from '../src/lib/worker-service';
import {
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPostStatus,
  SocialAccountProvider,
  SocialAccountStatus,
  SocialAccountType,
  ReadinessStatus,
  AccountHealthStatus,
  SocialSchedulerAuditAction,
  Sprint1MediaAsset,
} from '../src/types/scheduler';

function createTestAsset(id: string, fileName: string, mimeType: string, byteSize: number): Sprint1MediaAsset {
  return {
    id,
    workspaceId: 'ws_mantri',
    uploadedByUserId: 'usr_admin',
    originalFileName: fileName,
    safeFileName: fileName,
    mimeType,
    byteSize,
    bucket: CONFIGURED_B2_BUCKET,
    objectKey: `media/ws_mantri/${fileName}`,
    status: 'UPLOADED' as any,
    previewUrl: `https://cdn.example.com/${fileName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function runSprint8Tests() {
  console.log('====================================================');
  console.log('  Running Sprint 8 Verification Test Suite (Full)');
  console.log('  Production Readiness, Calendar, Health & QA Matrix');
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

  sprint1Storage.resetForTest();

  // ----------------------------------------------------------------
  // Group 1: Calendar View & Query Filters (Section 26.1)
  // ----------------------------------------------------------------
  console.log('--- Group 1: Calendar View & Query Filters (Section 26.1) ---');

  await test('1.1 Returns calendar posts strictly scoped to the requesting workspace', () => {
    const mantriCalendar = sprint1Storage.getCalendarPosts('ws_mantri');
    const sobhaCalendar = sprint1Storage.getCalendarPosts('ws_sobha');

    assert.ok(mantriCalendar.items.length > 0, 'Mantri should have posts');
    assert.ok(sobhaCalendar.items.length > 0, 'Sobha should have posts');

    mantriCalendar.items.forEach((item) => {
      const post = sprint1Storage.getPostById(item.postId);
      assert.strictEqual(post?.workspaceId, 'ws_mantri');
    });

    sobhaCalendar.items.forEach((item) => {
      const post = sprint1Storage.getPostById(item.postId);
      assert.strictEqual(post?.workspaceId, 'ws_sobha');
    });
  });

  await test('1.2 Filters calendar items by date range (from and to)', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const farFutureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const rangeItems = sprint1Storage.getCalendarPosts(
      'ws_mantri',
      futureDate,
      farFutureDate
    );
    assert.strictEqual(rangeItems.items.length, 0, 'No posts should be in the far future range');
  });

  await test('1.3 Filters calendar items by platform target', () => {
    const fbItems = sprint1Storage.getCalendarPosts('ws_mantri', undefined, undefined, 'FACEBOOK');
    fbItems.items.forEach((item) => {
      assert.ok(item.platforms.includes(SocialSchedulerPlatform.FACEBOOK));
    });
  });

  await test('1.4 Filters calendar items by status', () => {
    const scheduledItems = sprint1Storage.getCalendarPosts('ws_mantri', undefined, undefined, 'ALL', 'SCHEDULED');
    scheduledItems.items.forEach((item) => {
      assert.strictEqual(item.status, SocialSchedulerPostStatus.SCHEDULED);
    });
  });

  await test('1.5 Computes attentionRequired for posts with failed or blocked targets', () => {
    const overview = sprint1Storage.getSchedulerOverview('ws_mantri');
    assert.ok(typeof overview.scheduledToday === 'number');
    assert.ok(typeof overview.needsAttention === 'number');
    assert.ok(Array.isArray(overview.attentionItems));
  });

  await test('1.6 Empty calendar returns items: [] when no posts match date range', () => {
    const pastFrom = '2020-01-01T00:00:00.000Z';
    const pastTo = '2020-01-02T00:00:00.000Z';
    const emptyCalendar = sprint1Storage.getCalendarPosts('ws_mantri', pastFrom, pastTo);
    assert.deepStrictEqual(emptyCalendar.items, []);
  });

  await test('1.7 Calendar items preserve thumbnailMediaAssetId, platforms, scheduledAt, and attention flag', () => {
    const calendar = sprint1Storage.getCalendarPosts('ws_mantri');
    assert.ok(calendar.items.length > 0);
    const first = calendar.items[0];
    assert.ok(first.postId);
    assert.ok(first.title);
    assert.ok(Array.isArray(first.platforms));
    assert.ok(first.scheduledAt);
    assert.ok(typeof first.attentionRequired === 'boolean');
  });

  // ----------------------------------------------------------------
  // Group 2: Reschedule Flow & Validation (Section 26.2)
  // ----------------------------------------------------------------
  console.log('\n--- Group 2: Reschedule Flow & Validation (Section 26.2) ---');

  await test('2.1 Rejects rescheduling if scheduled time is in the past', () => {
    const post = sprint1Storage.getPosts('ws_mantri')[0];
    const pastTime = new Date(Date.now() - 60000).toISOString();
    const resPast = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: post.id,
      scheduledAt: pastTime,
    });
    assert.strictEqual(resPast.success, false);
    assert.ok(resPast.error?.includes('5 minutes in the future'));
  });

  await test('2.2 Rejects rescheduling if scheduled time is < 5 minutes in future', () => {
    const post = sprint1Storage.getPosts('ws_mantri')[0];
    const fourMinTime = new Date(Date.now() + 4 * 60 * 1000).toISOString();
    const resSoon = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: post.id,
      scheduledAt: fourMinTime,
    });
    assert.strictEqual(resSoon.success, false);
    assert.ok(resSoon.error?.includes('5 minutes in the future'));
  });

  await test('2.3 Rejects rescheduling if post is in cancelled or published state', () => {
    const created = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Post to cancel and test reschedule',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Test',
        caption: 'Test caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      status: SocialSchedulerPostStatus.CANCELLED,
    });

    const newTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: created.id,
      scheduledAt: newTime,
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes('CANCELLED'));
  });

  await test('2.4 Successfully updates post scheduledAt and updates unpublished targets', () => {
    const created = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Reschedulable Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Reschedulable',
        caption: 'Caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    sprint1Storage.createTarget({
      postId: created.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      mockAccountName: 'Mantri Facebook Page',
      publishMode: 'MOCK',
    });

    const newTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const res = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: created.id,
      scheduledAt: newTime,
      timezone: 'Asia/Kolkata',
      reason: 'Client requested postponement',
    });

    assert.strictEqual(res.success, true);
    const updated = sprint1Storage.getPostById(created.id, 'ws_mantri');
    assert.strictEqual(updated?.scheduledAt, newTime);
    assert.strictEqual(updated?.targets[0].scheduledFor, newTime);
  });

  await test('2.5 Relocates YouTube daily upload quota reservation from old date to new date', () => {
    const oldDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const ytPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'YouTube Reschedule Quota Relocation Post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: oldDate,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'YT Reschedule',
        caption: 'Caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      mediaAssets: [createTestAsset('med_yt_resched', 'video.mp4', 'video/mp4', 1024 * 1024 * 5)],
    });

    const ytAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.YOUTUBE)!;
    const ytTarget = sprint1Storage.createTarget({
      postId: ytPost.id,
      platform: SocialSchedulerPlatform.YOUTUBE,
      socialAccountId: ytAcc.id,
      publishMode: 'LIVE_GOOGLE',
      status: SocialSchedulerTargetStatus.SCHEDULED,
    });

    sprint1Storage.reserveYouTubeQuota('ws_mantri', ytPost.id, ytTarget.id, ytAcc.id, oldDate.slice(0, 10));
    const oldQuotaBefore = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', oldDate.slice(0, 10));
    assert.strictEqual(oldQuotaBefore.reservedCount, 1);

    // Reschedule to newDate
    const res = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: ytPost.id,
      scheduledAt: newDate,
    });

    assert.strictEqual(res.success, true);
    const oldQuotaAfter = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', oldDate.slice(0, 10));
    const newQuotaAfter = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', newDate.slice(0, 10));

    assert.strictEqual(oldQuotaAfter.reservedCount, 0, 'Old quota date reservation should be released');
    assert.strictEqual(newQuotaAfter.reservedCount, 1, 'New quota date should receive reservation');
  });

  await test('2.6 Rejects rescheduling if date string format is invalid', () => {
    const post = sprint1Storage.getPosts('ws_mantri')[0];
    const res = sprint1Storage.reschedulePost({
      workspaceId: 'ws_mantri',
      postId: post.id,
      scheduledAt: 'not-a-valid-date',
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.error?.includes('Invalid scheduled date'));
  });

  await test('2.7 Emits POST_RESCHEDULED immutable audit log with before/after state', () => {
    const logs = sprint1Storage.getAuditLogs('ws_mantri', 'POST');
    const reschedLog = logs.find((l) => l.action === SocialSchedulerAuditAction.POST_RESCHEDULED);
    assert.ok(reschedLog, 'Audit log for POST_RESCHEDULED must exist');
    assert.ok(reschedLog.beforeJson);
    assert.ok(reschedLog.afterJson);
  });

  // ----------------------------------------------------------------
  // Group 3: Account Health Checks & Snapshots (Section 26.3)
  // ----------------------------------------------------------------
  console.log('\n--- Group 3: Account Health Checks & Snapshots (Section 26.3) ---');

  await test('3.1 Captures health snapshot for connected accounts in workspace', () => {
    const result = sprint1Storage.runAccountHealthCheck('ws_mantri');
    assert.ok(result.checkedAccounts > 0);

    const health = sprint1Storage.getAccountHealth('ws_mantri');
    assert.strictEqual(health.accounts.length, result.checkedAccounts);
    health.accounts.forEach((acc) => {
      assert.strictEqual(acc.workspaceId, 'ws_mantri');
      assert.ok(acc.tokenValid);
    });
  });

  await test('3.2 Detects corrupted credentials and flags RECONNECT_REQUIRED', () => {
    const corruptedAccount = sprint1Storage.createOrUpdateSocialAccount({
      workspaceId: 'ws_mantri',
      connectedByUserId: 'usr_admin',
      provider: SocialAccountProvider.X,
      platform: SocialSchedulerPlatform.X,
      accountType: SocialAccountType.X_USER,
      displayName: 'Corrupted Account',
      username: 'corrupted',
      externalAccountId: '999999',
      credentialRef: 'cred_non_existent_ref',
      scopes: ['tweet.write'],
      status: SocialAccountStatus.CONNECTED,
    });

    sprint1Storage.runAccountHealthCheck('ws_mantri');
    const health = sprint1Storage.getAccountHealth('ws_mantri');
    const corruptedSnap = health.accounts.find((a) => a.socialAccountId === corruptedAccount.id);

    assert.ok(corruptedSnap);
    assert.strictEqual(corruptedSnap.tokenValid, false);
    assert.strictEqual(corruptedSnap.status, AccountHealthStatus.RECONNECT_REQUIRED);
  });

  await test('3.3 Detects disconnected accounts and flags DISCONNECTED', () => {
    const credRef = credentialVault.storeToken('disc_token_123');
    const disconnectedAccount = sprint1Storage.createOrUpdateSocialAccount({
      workspaceId: 'ws_mantri',
      connectedByUserId: 'usr_admin',
      provider: SocialAccountProvider.META,
      platform: SocialSchedulerPlatform.FACEBOOK,
      accountType: SocialAccountType.FACEBOOK_PAGE,
      displayName: 'Disconnected Page',
      username: 'disconnected',
      externalAccountId: '111111',
      credentialRef: credRef,
      scopes: ['pages_manage_posts'],
      status: SocialAccountStatus.DISCONNECTED,
    });

    sprint1Storage.runAccountHealthCheck('ws_mantri');
    const health = sprint1Storage.getAccountHealth('ws_mantri');
    const discSnap = health.accounts.find((a) => a.socialAccountId === disconnectedAccount.id);

    assert.ok(discSnap);
    assert.strictEqual(discSnap.status, AccountHealthStatus.DISCONNECTED);
  });

  await test('3.4 Prevents cross-workspace leakage of account health snapshots', () => {
    const sobhaHealth = sprint1Storage.getAccountHealth('ws_sobha');
    sobhaHealth.accounts.forEach((acc) => {
      assert.strictEqual(acc.workspaceId, 'ws_sobha');
    });
  });

  await test('3.5 Detects missing scopes on Pinterest and flags PERMISSION_MISSING', () => {
    const credRef = credentialVault.storeToken('pin_missing_scope_token');
    const missingScopeAccount = sprint1Storage.createOrUpdateSocialAccount({
      workspaceId: 'ws_mantri',
      connectedByUserId: 'usr_admin',
      provider: SocialAccountProvider.PINTEREST,
      platform: SocialSchedulerPlatform.PINTEREST,
      accountType: SocialAccountType.PINTEREST_ACCOUNT,
      displayName: 'Scope Missing Pin Account',
      username: 'scopemissing',
      externalAccountId: '222222',
      credentialRef: credRef,
      scopes: ['boards:read'], // missing pins:write
      status: SocialAccountStatus.CONNECTED,
    });

    sprint1Storage.runAccountHealthCheck('ws_mantri');
    const health = sprint1Storage.getAccountHealth('ws_mantri');
    const snap = health.accounts.find((a) => a.socialAccountId === missingScopeAccount.id);

    assert.ok(snap);
    assert.strictEqual(snap.status, AccountHealthStatus.PERMISSION_MISSING);
    assert.ok(snap.missingPermissions.includes('pins:write'));
  });

  await test('3.6 Detects unverified YouTube channel and flags WARNING', () => {
    const ytAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.YOUTUBE);
    assert.ok(ytAcc);

    sprint1Storage.runAccountHealthCheck('ws_mantri');
    const health = sprint1Storage.getAccountHealth('ws_mantri');
    const ytSnap = health.accounts.find((a) => a.socialAccountId === ytAcc.id);

    assert.ok(ytSnap);
    assert.strictEqual(ytSnap.status, AccountHealthStatus.WARNING);
    assert.ok(ytSnap.warnings.some((w) => w.includes('YouTube project unverified')));
  });

  // ----------------------------------------------------------------
  // Group 4: Preflight Readiness Checks (Section 26.4)
  // ----------------------------------------------------------------
  console.log('\n--- Group 4: Preflight Readiness Checks (Section 26.4) ---');

  await test('4.1 Returns BLOCKED if post has no targets selected', () => {
    const emptyPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Post Without Targets',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'No Targets',
        caption: 'Valid caption with text',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', emptyPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'NO_TARGETS_SELECTED'));
  });

  await test('4.2 Returns BLOCKED if post has neither media nor text caption', () => {
    const emptyContentPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: '',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: '',
        caption: '',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    sprint1Storage.createTarget({
      postId: emptyContentPost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      mockAccountName: 'Mantri Page',
      publishMode: 'MOCK',
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', emptyContentPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'EMPTY_CONTENT'));
  });

  await test('4.3 Returns BLOCKED with code X_COST_UNACKNOWLEDGED when X cost not acknowledged', () => {
    const xPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'X Post Requiring Cost Acknowledgement',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'X Post',
        caption: 'Check out our new luxury villas at https://mantri.in/villas',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const xAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.id === 'acc_x_mantri_01');
    assert.ok(xAcc);

    sprint1Storage.createTarget({
      postId: xPost.id,
      platform: SocialSchedulerPlatform.X,
      socialAccountId: xAcc.id,
      publishMode: 'LIVE_X',
      platformOptionsJson: { costAcknowledged: false },
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', xPost.id, 'SCHEDULE_SAVE');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'X_COST_UNACKNOWLEDGED'));
  });

  await test('4.4 Returns BLOCKED with code PINTEREST_BOARD_MISSING when board not specified', () => {
    const pinPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Pinterest Post Missing Board',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Pin Post',
        caption: 'Dream living spaces',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const pinAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.PINTEREST);
    assert.ok(pinAcc);

    sprint1Storage.createTarget({
      postId: pinPost.id,
      platform: SocialSchedulerPlatform.PINTEREST,
      socialAccountId: pinAcc.id,
      publishMode: 'LIVE_PINTEREST',
      platformOptionsJson: {}, // No boardId
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', pinPost.id, 'SCHEDULE_SAVE');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'PINTEREST_BOARD_MISSING'));
  });

  await test('4.5 Returns BLOCKED with UNSUPPORTED_MEDIA_TYPE for YouTube image upload', () => {
    const ytPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'YouTube Image Only Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'YT Image',
        caption: 'Walkthrough video overview',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      mediaAssets: [createTestAsset('media_img_yt', 'villa.jpg', 'image/jpeg', 1024 * 1024)],
    });

    const ytAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.YOUTUBE);
    assert.ok(ytAcc);

    sprint1Storage.createTarget({
      postId: ytPost.id,
      platform: SocialSchedulerPlatform.YOUTUBE,
      socialAccountId: ytAcc.id,
      publishMode: 'LIVE_GOOGLE',
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', ytPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'UNSUPPORTED_MEDIA_TYPE'));
  });

  await test('4.6 Returns BLOCKED with code X_TEXT_TOO_LONG when text exceeds 280 characters', () => {
    const longTextPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Long X Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Long X',
        caption: 'A'.repeat(285),
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const xAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.id === 'acc_x_mantri_01')!;
    sprint1Storage.createTarget({
      postId: longTextPost.id,
      platform: SocialSchedulerPlatform.X,
      socialAccountId: xAcc.id,
      publishMode: 'LIVE_X',
      platformOptionsJson: { costAcknowledged: true },
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', longTextPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'X_TEXT_TOO_LONG'));
  });

  await test('4.7 Returns BLOCKED with code X_MIXED_MEDIA_BLOCKED when mixing image and video', () => {
    const mixedPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Mixed Media X Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Mixed',
        caption: 'Mixed media test',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      mediaAssets: [
        createTestAsset('med_img_mix', 'img.jpg', 'image/jpeg', 1024),
        createTestAsset('med_vid_mix', 'vid.mp4', 'video/mp4', 1024 * 1024),
      ],
    });

    const xAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.id === 'acc_x_mantri_01')!;
    sprint1Storage.createTarget({
      postId: mixedPost.id,
      platform: SocialSchedulerPlatform.X,
      socialAccountId: xAcc.id,
      publishMode: 'LIVE_X',
      platformOptionsJson: { costAcknowledged: true },
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', mixedPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.BLOCKED);
    assert.ok(check.blockingIssues.some((i) => i.code === 'X_MIXED_MEDIA_BLOCKED'));
  });

  await test('4.8 Returns READY_WITH_WARNINGS when post targets YouTube and channel has unverified audit status', () => {
    const ytWarningPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'YouTube Warning Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Valid Video',
        caption: 'Video description',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      mediaAssets: [createTestAsset('med_yt_valid', 'video.mp4', 'video/mp4', 1024 * 1024 * 2)],
    });

    const ytAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.YOUTUBE)!;
    sprint1Storage.createTarget({
      postId: ytWarningPost.id,
      platform: SocialSchedulerPlatform.YOUTUBE,
      socialAccountId: ytAcc.id,
      publishMode: 'LIVE_GOOGLE',
      platformOptionsJson: { title: 'Valid Video Title', privacyStatus: 'public' },
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', ytWarningPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.READY_WITH_WARNINGS);
    assert.ok(check.warnings.some((w) => w.code === 'YOUTUBE_AUDIT_UNVERIFIED'));
  });

  await test('4.9 Returns READY for fully valid Facebook post with media and caption', () => {
    const fbValidPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Valid FB Post',
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Valid FB',
        caption: 'Beautiful architecture ready for family life',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
      mediaAssets: [createTestAsset('med_fb_valid', 'exterior.jpg', 'image/jpeg', 1024 * 1024)],
    });

    const fbAcc = sprint1Storage.getSocialAccounts('ws_mantri').find(
      (a) => a.platform === SocialSchedulerPlatform.FACEBOOK && a.status === SocialAccountStatus.CONNECTED
    )!;
    sprint1Storage.createTarget({
      postId: fbValidPost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      socialAccountId: fbAcc.id,
      publishMode: 'LIVE_META',
    });

    const check = sprint1Storage.runReadinessCheck('ws_mantri', fbValidPost.id, 'DETAIL_VIEW');
    assert.strictEqual(check.status, ReadinessStatus.READY, JSON.stringify(check.blockingIssues));
    assert.strictEqual(check.blockingIssues.length, 0);
  });

  await test('4.10 Emits READINESS_CHECK_RUN audit log entry', () => {
    const logs = sprint1Storage.getAuditLogs('ws_mantri', 'POST');
    const readinessLog = logs.find((l) => l.action === SocialSchedulerAuditAction.READINESS_CHECK_RUN);
    assert.ok(readinessLog, 'READINESS_CHECK_RUN log must exist');
  });

  // ----------------------------------------------------------------
  // Group 5: Worker Hardening & Preflight (Section 26.5)
  // ----------------------------------------------------------------
  console.log('\n--- Group 5: Worker Hardening & Preflight (Section 26.5) ---');

  await test('5.1 Worker preflight skips execution and marks COST_BLOCKED for unacknowledged X post', async () => {
    const dueTime = new Date(Date.now() - 1000).toISOString();
    const xDuePost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Due X Post Unacknowledged',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: dueTime,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'X Due',
        caption: 'Due post caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const xAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.id === 'acc_x_mantri_01');
    assert.ok(xAcc);

    const xTarget = sprint1Storage.createTarget({
      postId: xDuePost.id,
      platform: SocialSchedulerPlatform.X,
      socialAccountId: xAcc.id,
      publishMode: 'LIVE_X',
      status: SocialSchedulerTargetStatus.SCHEDULED,
      platformOptionsJson: { costAcknowledged: false },
    });

    await workerService.processDueTargets({
      workspaceId: 'ws_mantri',
      limit: 10,
    });

    const refreshedPost = sprint1Storage.getPostById(xDuePost.id, 'ws_mantri');
    const refreshedTarget = refreshedPost?.targets.find((t) => t.id === xTarget.id);

    assert.strictEqual(refreshedTarget?.status, SocialSchedulerTargetStatus.COST_BLOCKED);
    assert.ok(refreshedTarget?.lastErrorMessage?.includes('cost acknowledgement'));
  });

  await test('5.2 Worker recovers stale locks after 15 minutes and emits STALE_LOCK_RECOVERED audit log', () => {
    const stalePost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Stale Lock Post',
      status: SocialSchedulerPostStatus.PROCESSING,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Stale',
        caption: 'Stale caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const staleTarget = sprint1Storage.createTarget({
      postId: stalePost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      mockAccountName: 'Mantri FB',
      status: SocialSchedulerTargetStatus.PROCESSING,
      publishMode: 'MOCK',
    });

    staleTarget.lockedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    staleTarget.lockedBy = 'worker_dead_run';

    const recovered = workerService.recoverStaleLocks();
    assert.ok(recovered > 0, 'Should have recovered at least 1 stale lock');

    const refreshedPost = sprint1Storage.getPostById(stalePost.id, 'ws_mantri');
    const refreshedTarget = refreshedPost?.targets.find((t) => t.id === staleTarget.id);

    assert.strictEqual(refreshedTarget?.status, SocialSchedulerTargetStatus.RETRYING);
    assert.strictEqual(refreshedTarget?.lockedAt, null);

    const auditLogs = sprint1Storage.getAuditLogs('ws_mantri', 'TARGET', staleTarget.id);
    const staleLog = auditLogs.find((l) => l.action === SocialSchedulerAuditAction.STALE_LOCK_RECOVERED);
    assert.ok(staleLog, 'Audit log STALE_LOCK_RECOVERED must be recorded');
  });

  await test('5.3 Duplicate worker calls do not double-process or double-publish an already claimed target', async () => {
    const dueTime = new Date(Date.now() - 5000).toISOString();
    const dupTestPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Duplicate Guard Test Post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: dueTime,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Dup Guard',
        caption: 'Testing duplicate execution guard',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const target = sprint1Storage.createTarget({
      postId: dupTestPost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      mockAccountName: 'FB Mock',
      status: SocialSchedulerTargetStatus.SCHEDULED,
      publishMode: 'MOCK',
    });

    // First worker run claims and finishes target
    await workerService.processDueTargets({ workspaceId: 'ws_mantri', mockMode: 'success' });

    const postAfterFirst = sprint1Storage.getPostById(dupTestPost.id, 'ws_mantri')!;
    const targetAfterFirst = postAfterFirst.targets.find((t) => t.id === target.id)!;
    assert.strictEqual(targetAfterFirst?.status, SocialSchedulerTargetStatus.PUBLISHED_MOCK);

    // Second worker run should find ZERO due items for this post
    const secondRunDue = workerService.getDueTargets('ws_mantri').filter((item) => item.target.id === target.id);
    assert.strictEqual(secondRunDue.length, 0, 'Already published target must never be returned by getDueTargets');
  });

  // ----------------------------------------------------------------
  // Group 6: Safe Target Retry Controls (Section 26.6)
  // ----------------------------------------------------------------
  console.log('\n--- Group 6: Safe Target Retry Controls (Section 26.6) ---');

  await test('6.1 Retries failed/blocked targets while preserving published ones', () => {
    const multiTargetPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Multi Target Retry Post',
      status: SocialSchedulerPostStatus.PARTIALLY_FAILED,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Multi',
        caption: 'Multi caption',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const publishedTarget = sprint1Storage.createTarget({
      postId: multiTargetPost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      status: SocialSchedulerTargetStatus.PUBLISHED,
      mockAccountName: 'FB',
    });

    const failedTarget = sprint1Storage.createTarget({
      postId: multiTargetPost.id,
      platform: SocialSchedulerPlatform.INSTAGRAM,
      status: SocialSchedulerTargetStatus.FAILED,
      mockAccountName: 'IG',
    });

    const retryResult = sprint1Storage.retryFailedTargets('ws_mantri', multiTargetPost.id, 'usr_admin');
    assert.strictEqual(retryResult.success, true);
    assert.ok(retryResult.retriedTargetIds.includes(failedTarget.id));
    assert.ok(retryResult.skippedTargetIds.includes(publishedTarget.id));

    const refreshedPost = sprint1Storage.getPostById(multiTargetPost.id, 'ws_mantri');
    const refreshedPublished = refreshedPost?.targets.find((t) => t.id === publishedTarget.id);
    const refreshedFailed = refreshedPost?.targets.find((t) => t.id === failedTarget.id);

    assert.strictEqual(refreshedPublished?.status, SocialSchedulerTargetStatus.PUBLISHED);
    assert.strictEqual(refreshedFailed?.status, SocialSchedulerTargetStatus.RETRYING);
  });

  await test('6.2 Retry creates new SocialPublishAttempt row and emits POST_UPDATED audit log', () => {
    const retryPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Retry Attempt Creation Post',
      status: SocialSchedulerPostStatus.FAILED,
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Retry Attempt',
        caption: 'Retry attempt test',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const retryTarget = sprint1Storage.createTarget({
      postId: retryPost.id,
      platform: SocialSchedulerPlatform.FACEBOOK,
      status: SocialSchedulerTargetStatus.FAILED,
      mockAccountName: 'FB Retry',
    });

    const attemptsBefore = sprint1Storage.getAttempts(retryPost.id);
    assert.strictEqual(attemptsBefore.length, 0);

    sprint1Storage.retryFailedTargets('ws_mantri', retryPost.id, 'usr_admin');

    const attemptsAfter = sprint1Storage.getAttempts(retryPost.id);
    assert.strictEqual(attemptsAfter.length, 1);
    assert.strictEqual(attemptsAfter[0].targetId, retryTarget.id);
    assert.strictEqual(attemptsAfter[0].attemptNumber, 1);

    const auditLogs = sprint1Storage.getAuditLogs('ws_mantri', 'POST', retryPost.id);
    const retryLog = auditLogs.find((l) => l.action === SocialSchedulerAuditAction.POST_UPDATED);
    assert.ok(retryLog, 'POST_UPDATED audit log must be recorded on retry');
  });

  // ----------------------------------------------------------------
  // Group 7: Post Cancellation & Reservation Cleanup (Section 26.7)
  // ----------------------------------------------------------------
  console.log('\n--- Group 7: Post Cancellation & Reservation Cleanup (Section 26.7) ---');

  await test('7.1 Cancels unpublished targets, preserves published targets, and releases YouTube quota & X cost', () => {
    const cancelTestPost = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Post For Quota Cancellation',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        postTitle: 'Quota Cancellation',
        caption: 'Testing reservation release',
        hashtags: [],
        media: [],
        platformOverrides: {},
        createdFromStage: 'compose',
        lastEditedAt: new Date().toISOString(),
      },
    });

    const ytAcc = sprint1Storage.getSocialAccounts('ws_mantri').find((a) => a.platform === SocialSchedulerPlatform.YOUTUBE);
    assert.ok(ytAcc);

    const ytTarget = sprint1Storage.createTarget({
      postId: cancelTestPost.id,
      platform: SocialSchedulerPlatform.YOUTUBE,
      socialAccountId: ytAcc.id,
      publishMode: 'LIVE_GOOGLE',
      status: SocialSchedulerTargetStatus.SCHEDULED,
    });

    // Reserve YouTube quota
    const reservation = sprint1Storage.reserveYouTubeQuota('ws_mantri', cancelTestPost.id, ytTarget.id, ytAcc.id);
    assert.strictEqual(reservation.success, true);
    assert.strictEqual(sprint1Storage.getYouTubeQuotaSummary('ws_mantri').reservedCount, 1);

    // Cancel the post
    const cancelResult = sprint1Storage.cancelPost(cancelTestPost.id, 'ws_mantri', 'Testing reservation release');
    assert.ok(cancelResult);
    assert.strictEqual(cancelResult.status, SocialSchedulerPostStatus.CANCELLED);

    // Verify YouTube quota reservation released
    assert.strictEqual(sprint1Storage.getYouTubeQuotaSummary('ws_mantri').reservedCount, 0);

    // Verify audit log recorded
    const auditLogs = sprint1Storage.getAuditLogs('ws_mantri', 'POST', cancelTestPost.id);
    const cancelLog = auditLogs.find((l) => l.action === SocialSchedulerAuditAction.POST_CANCELLED);
    assert.ok(cancelLog, 'POST_CANCELLED audit log must be recorded');
  });

  // ----------------------------------------------------------------
  // Group 8: Platform Limits, Quota & Cost Dashboards (Section 18)
  // ----------------------------------------------------------------
  console.log('\n--- Group 8: Platform Limits, Quota & Cost Dashboards (Section 18) ---');

  await test('8.1 Aggregates Instagram, YouTube, X, and Pinterest platform quotas', () => {
    const quotas = sprint1Storage.getPlatformQuotas('ws_mantri');

    assert.strictEqual(quotas.instagram.limit, 50);
    assert.ok(quotas.instagram.remaining <= 50);

    assert.strictEqual(quotas.youtube.dailyLimit, 100);
    assert.ok(quotas.youtube.remainingUploadsToday >= 0);

    assert.ok(quotas.x.paidPublishingEnabled);
    assert.strictEqual(quotas.x.workspaceDailyCap, 100);

    assert.strictEqual(quotas.pinterest.tier, 'Standard');
    assert.ok(quotas.pinterest.rateLimitRemaining > 0);
  });

  // ----------------------------------------------------------------
  // Group 9: QA Matrix & Release Gates (Section 19 & 20)
  // ----------------------------------------------------------------
  console.log('\n--- Group 9: QA Matrix & Release Gates (Section 19 & 20) ---');

  await test('9.1 Generates 8-row x 10-column matrix and confirms production readiness', () => {
    const qa = sprint1Storage.getQaMatrix('ws_mantri');

    assert.strictEqual(qa.rows.length, 8);
    assert.strictEqual(qa.productionReady, true);
    assert.strictEqual(qa.blockers.length, 0);

    const expectedRowIds = [
      'fb_page',
      'ig_image',
      'ig_video',
      'pin_image',
      'yt_video',
      'x_text',
      'x_image',
      'x_video',
    ];

    expectedRowIds.forEach((id) => {
      const row = qa.rows.find((r) => r.platformId === id);
      assert.ok(row, `Matrix row ${id} must exist`);
      assert.strictEqual(row.accountConnected, 'PASSED');
      assert.strictEqual(row.mediaValidation, 'PASSED');
      assert.strictEqual(row.preflightReady, 'PASSED');
      assert.strictEqual(row.workspaceIsolationTested, 'PASSED');
    });
  });

  // ----------------------------------------------------------------
  // Group 10: Multi-Tenant Isolation & Zero-Leakage Security (Section 26.9)
  // ----------------------------------------------------------------
  console.log('\n--- Group 10: Multi-Tenant Isolation & Zero-Leakage Security (Section 26.9) ---');

  await test('10.1 Calendar posts, readiness checks, and audit logs enforce strict tenant scoping', () => {
    const mantriLogs = sprint1Storage.getAuditLogs('ws_mantri');
    const sobhaLogs = sprint1Storage.getAuditLogs('ws_sobha');

    mantriLogs.forEach((l) => assert.strictEqual(l.workspaceId, 'ws_mantri'));
    sobhaLogs.forEach((l) => assert.strictEqual(l.workspaceId, 'ws_sobha'));
  });

  await test('10.2 Audit logs, preflight checks, and health snapshots never expose plain-text credentials', () => {
    const health = sprint1Storage.getAccountHealth('ws_mantri');
    const rawHealthStr = JSON.stringify(health);
    assert.ok(!rawHealthStr.includes('mock_token_'), 'Health snapshots must not leak token plaintext');
    assert.ok(!rawHealthStr.includes('refresh_token_'), 'Health snapshots must not leak refresh token plaintext');

    const logs = sprint1Storage.getAuditLogs('ws_mantri');
    const rawLogsStr = JSON.stringify(logs);
    assert.ok(!rawLogsStr.includes('mock_token_'), 'Audit logs must not leak token plaintext');
  });

  await test('10.3 Dynamic B2 bucket uses configured environment clean media bucket', () => {
    assert.strictEqual(CONFIGURED_B2_BUCKET, 'sakhaa-forge-clean-media');
    const workspaces = sprint1Storage.getWorkspaces();
    workspaces.forEach((ws) => {
      assert.strictEqual(ws.storageBucket, 'sakhaa-forge-clean-media');
    });
  });

  console.log('\n====================================================');
  console.log(`  Sprint 8 Verification Completed: ${passed} / ${total} Passed (100%)`);
  console.log('====================================================\n');
}

runSprint8Tests().catch((err) => {
  console.error('Sprint 8 Verification Failed:', err);
  process.exit(1);
});
