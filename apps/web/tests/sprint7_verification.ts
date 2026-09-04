import assert from 'assert';
import crypto from 'crypto';
import { sprint1Storage } from '../src/lib/mock-storage';
import { credentialVault } from '../src/lib/credential-vault';
import { xPublisherAdapter } from '../src/lib/x-publisher-adapter';
import { workerService } from '../src/lib/worker-service';
import {
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPostStatus,
  SocialAccountProvider,
  SocialAccountStatus,
  SocialAccountType,
} from '../src/types/scheduler';

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function runSprint7Tests() {
  console.log('====================================================');
  console.log('  Running Sprint 7 Verification Test Suite');
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
  // Group 1: OAuth PKCE & State Security
  // ----------------------------------------------------------------
  console.log('--- Group 1: OAuth PKCE & State Security ---');

  await test('1.1 Generates single-use OAuth state bound to workspace and user', () => {
    const { state, record } = sprint1Storage.createOAuthState({
      workspaceId: 'ws_mantri',
      userId: 'usr_admin',
      provider: SocialAccountProvider.X,
      redirectPath: '/app/social-accounts',
    });

    assert.ok(state && state.length >= 32, 'OAuth state should have high entropy');
    assert.strictEqual(record.workspaceId, 'ws_mantri');
    assert.strictEqual(record.provider, SocialAccountProvider.X);
    assert.strictEqual(record.consumedAt, null);
  });

  await test('1.2 Consumes OAuth state exactly once; rejects reuse', () => {
    const { state } = sprint1Storage.createOAuthState({
      workspaceId: 'ws_mantri',
      userId: 'usr_admin',
      provider: SocialAccountProvider.X,
    });

    const firstValidation = sprint1Storage.verifyAndConsumeOAuthState(state);
    assert.strictEqual(firstValidation.valid, true, 'First consumption should be valid');

    const secondValidation = sprint1Storage.verifyAndConsumeOAuthState(state);
    assert.strictEqual(secondValidation.valid, false, 'Second consumption should be rejected');
    assert.strictEqual(secondValidation.error, 'OAuth state token has already been consumed');
  });

  await test('1.3 Rejects unknown or malformed OAuth state', () => {
    const validation = sprint1Storage.verifyAndConsumeOAuthState('fake_unknown_state_123');
    assert.strictEqual(validation.valid, false);
    assert.strictEqual(validation.error, 'Invalid or unknown OAuth state token');
  });

  await test('1.4 Generates valid SHA-256 base64url PKCE code challenge and verifier', () => {
    const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
    const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

    assert.ok(codeVerifier.length >= 43, 'Code verifier must be at least 43 characters');
    assert.ok(!codeVerifier.includes('+') && !codeVerifier.includes('/') && !codeVerifier.includes('='), 'Must be base64url safe');
    assert.ok(!codeChallenge.includes('+') && !codeChallenge.includes('/') && !codeChallenge.includes('='), 'Challenge must be base64url safe');
  });

  await test('1.5 OAuth state enforces workspace binding; rejects cross-workspace consumption', () => {
    const { state } = sprint1Storage.createOAuthState({
      workspaceId: 'ws_mantri',
      userId: 'usr_admin',
      provider: SocialAccountProvider.X,
    });

    const crossValidation = sprint1Storage.verifyAndConsumeOAuthState(state, 'ws_sobha');
    assert.strictEqual(crossValidation.valid, false);
    assert.strictEqual(crossValidation.error, 'OAuth state is bound to a different workspace');
  });

  // ----------------------------------------------------------------
  // Group 2: Multi-Tenant Account Isolation
  // ----------------------------------------------------------------
  console.log('\n--- Group 2: Multi-Tenant Account Isolation ---');

  await test('2.1 Seeded Mantri and Sobha X accounts are workspace-scoped', () => {
    const mantriAccounts = sprint1Storage.getSocialAccounts('ws_mantri');
    const mantriX = mantriAccounts.find((a) => a.platform === SocialSchedulerPlatform.X);
    assert.ok(mantriX, 'Mantri X account must exist');
    assert.strictEqual(mantriX.workspaceId, 'ws_mantri');
    assert.strictEqual(mantriX.username, 'mantridevelopers');

    const sobhaAccounts = sprint1Storage.getSocialAccounts('ws_sobha');
    const sobhaX = sobhaAccounts.find((a) => a.platform === SocialSchedulerPlatform.X);
    assert.ok(sobhaX, 'Sobha X account must exist');
    assert.strictEqual(sobhaX.workspaceId, 'ws_sobha');
    assert.strictEqual(sobhaX.username, 'sobharealty');
  });

  await test('2.2 Cannot access Mantri X account from Sobha workspace', () => {
    const crossAccess = sprint1Storage.getSocialAccountById('acc_x_mantri_01', 'ws_sobha');
    assert.strictEqual(crossAccess, null, 'Cross-workspace account access must return null');
  });

  await test('2.3 Adapter permanently rejects publish if account belongs to different workspace', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_sobha',
      postId: 'post_test',
      targetId: 'tgt_test',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01', // Mantri account in Sobha workspace
      text: 'Cross tenant test',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'TENANT_MISMATCH');
  });

  await test('2.4 getSocialAccounts only returns accounts matching requested workspace', () => {
    const mantriList = sprint1Storage.getSocialAccounts('ws_mantri');
    for (const acc of mantriList) {
      assert.strictEqual(acc.workspaceId, 'ws_mantri');
    }

    const sobhaList = sprint1Storage.getSocialAccounts('ws_sobha');
    for (const acc of sobhaList) {
      assert.strictEqual(acc.workspaceId, 'ws_sobha');
    }
  });

  // ----------------------------------------------------------------
  // Group 3: Media Rules & Combinations Enforcement
  // ----------------------------------------------------------------
  console.log('\n--- Group 3: Media Rules & Combinations Enforcement ---');

  await test('3.1 Text-only X post is valid and allowed', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_text_only',
      targetId: 'tgt_text_only',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Excited to announce the pre-launch of Mantri Sky Villas! #LuxuryLiving',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.ok(res.xPostId, 'Must return an xPostId');
  });

  await test('3.2 Up to 4 images are allowed in single post', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const images = [1, 2, 3, 4].map((i) => ({
      mediaAssetId: `asset_img_${i}`,
      mimeType: 'image/jpeg',
      byteSize: 2 * 1024 * 1024,
      objectKey: `mantri/img_${i}.jpg`,
    }));

    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_4_images',
      targetId: 'tgt_4_images',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Architectural views from four distinct angles.',
      media: images,
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.strictEqual(res.xMediaIds?.length, 4);
  });

  await test('3.3 Rejects more than 4 images with TOO_MANY_IMAGES', async () => {
    const images = [1, 2, 3, 4, 5].map((i) => ({
      mediaAssetId: `asset_img_${i}`,
      mimeType: 'image/jpeg',
      byteSize: 1024 * 1024,
      objectKey: `mantri/img_${i}.jpg`,
    }));

    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_5_images',
      targetId: 'tgt_5_images',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: '5 images test',
      media: images,
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'TOO_MANY_IMAGES');
  });

  await test('3.4 Rejects image exceeding 5 MB limit', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_huge_image',
      targetId: 'tgt_huge_image',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Huge image test',
      media: [
        {
          mediaAssetId: 'huge_img',
          mimeType: 'image/png',
          byteSize: 6 * 1024 * 1024, // 6 MB
          objectKey: 'mantri/huge.png',
        },
      ],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'IMAGE_TOO_LARGE');
  });

  await test('3.5 Single MP4 video up to 200 MB is allowed', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_video',
      targetId: 'tgt_video',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Watch our 4K cinematic walkthrough.',
      media: [
        {
          mediaAssetId: 'vid_01',
          mimeType: 'video/mp4',
          byteSize: 50 * 1024 * 1024,
          objectKey: 'mantri/walkthrough.mp4',
        },
      ],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
  });

  await test('3.6 Rejects mixing image and video in same post', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_mixed',
      targetId: 'tgt_mixed',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Mixed media test',
      media: [
        { mediaAssetId: 'img_1', mimeType: 'image/jpeg', byteSize: 1000, objectKey: '1.jpg' },
        { mediaAssetId: 'vid_1', mimeType: 'video/mp4', byteSize: 5000, objectKey: '1.mp4' },
      ],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'MIXED_MEDIA_NOT_SUPPORTED');
  });

  await test('3.7 Rejects multiple video attachments', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_multi_video',
      targetId: 'tgt_multi_video',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: '2 videos test',
      media: [
        { mediaAssetId: 'vid_1', mimeType: 'video/mp4', byteSize: 1000, objectKey: '1.mp4' },
        { mediaAssetId: 'vid_2', mimeType: 'video/mp4', byteSize: 1000, objectKey: '2.mp4' },
      ],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'TOO_MANY_VIDEOS');
  });

  await test('3.8 Rejects empty post with no text and no media', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_empty',
      targetId: 'tgt_empty',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: '   ',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'EMPTY_POST');
  });

  await test('3.9 Rejects text exceeding 280 characters', async () => {
    const longText = 'A'.repeat(281);
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_too_long',
      targetId: 'tgt_too_long',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: longText,
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'TEXT_TOO_LONG');
  });

  await test('3.10 Rejects non-MP4 video formats for X', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_webm',
      targetId: 'tgt_webm',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'WebM video test',
      media: [
        { mediaAssetId: 'vid_webm', mimeType: 'video/webm', byteSize: 10000, objectKey: 'video.webm' },
      ],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'UNSUPPORTED_VIDEO_FORMAT');
  });

  // ----------------------------------------------------------------
  // Group 4: Cost Estimation & Ledger Calculation
  // ----------------------------------------------------------------
  console.log('\n--- Group 4: Cost Estimation & Ledger Calculation ---');

  await test('4.1 Estimates plain post at $0.015 USD', () => {
    const estimate = sprint1Storage.estimateXCost('ws_mantri', 'Discover bespoke sky villas');
    assert.strictEqual(estimate.operation, 'POST_CREATE');
    assert.strictEqual(estimate.estimatedCostUsd, '0.015');
    assert.strictEqual(estimate.requiresAcknowledgement, true);
  });

  await test('4.2 Estimates post containing URL at $0.200 USD', () => {
    const estimate = sprint1Storage.estimateXCost(
      'ws_mantri',
      'Explore available floor plans at https://mantri.in/sky-villas'
    );
    assert.strictEqual(estimate.operation, 'POST_CREATE_WITH_URL');
    assert.strictEqual(estimate.estimatedCostUsd, '0.200');
    assert.strictEqual(estimate.requiresAcknowledgement, true);
  });

  await test('4.3 Records and aggregates workspace cost ledgers correctly', () => {
    sprint1Storage.recordXCostLedger({
      id: 'cost_test_01',
      workspaceId: 'ws_mantri',
      postId: 'post_01',
      targetId: 'tgt_01',
      socialAccountId: 'acc_x_mantri_01',
      operation: 'POST_CREATE',
      estimatedUnitCostUsd: 0.015,
      actualUnitCostUsd: 0.015,
      quantity: 1,
      estimatedTotalUsd: 0.015,
      actualTotalUsd: 0.015,
      status: 'CONSUMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    sprint1Storage.recordXCostLedger({
      id: 'cost_test_02',
      workspaceId: 'ws_mantri',
      postId: 'post_02',
      targetId: 'tgt_02',
      socialAccountId: 'acc_x_mantri_01',
      operation: 'POST_CREATE_WITH_URL',
      estimatedUnitCostUsd: 0.200,
      actualUnitCostUsd: 0.200,
      quantity: 1,
      estimatedTotalUsd: 0.200,
      actualTotalUsd: 0.200,
      status: 'CONSUMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const report = sprint1Storage.getXCostLedgers('ws_mantri');
    assert.strictEqual(report.items.length >= 2, true);
    const est = parseFloat(report.estimatedTotalUsd);
    assert.ok(est >= 0.215, `Expected at least 0.215, got ${report.estimatedTotalUsd}`);
  });

  await test('4.4 Detects http:// URLs as POST_CREATE_WITH_URL', () => {
    const estimate = sprint1Storage.estimateXCost('ws_mantri', 'Visit http://mantri.in for inquiries');
    assert.strictEqual(estimate.operation, 'POST_CREATE_WITH_URL');
    assert.strictEqual(estimate.estimatedCostUsd, '0.200');
  });

  // ----------------------------------------------------------------
  // Group 5: Cost Guardrail & Acknowledgement
  // ----------------------------------------------------------------
  console.log('\n--- Group 5: Cost Guardrail & Acknowledgement ---');

  await test('5.1 Blocks publish with COST_BLOCKED if cost was not acknowledged', async () => {
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_no_ack',
      targetId: 'tgt_no_ack',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Post without cost approval',
      media: [],
      xOptions: { costAcknowledged: false, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.COST_BLOCKED);
    assert.strictEqual(res.errorCode, 'X_COST_NOT_ACKNOWLEDGED');
  });

  await test('5.2 Worker transitions unacknowledged target to COST_BLOCKED without retries', async () => {
    const post = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Cost unacknowledged post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        caption: 'This post did not acknowledge X costs.',
        hashtags: [],
      },
      targets: [
        {
          id: 'tgt_worker_cost_blocked',
          postId: '',
          workspaceId: 'ws_mantri',
          platform: SocialSchedulerPlatform.X,
          publishMode: 'LIVE_X',
          socialAccountId: 'acc_x_mantri_01',
          status: SocialSchedulerTargetStatus.SCHEDULED,
          platformOptionsJson: {
            text: 'This post did not acknowledge X costs.',
            costAcknowledged: false,
          },
        },
      ],
    });

    const res = await workerService.processDueTargets();
    assert.strictEqual(res.claimedTargets >= 1, true);

    const refreshed = sprint1Storage.getPostById(post.id, 'ws_mantri');
    const target = refreshed?.targets?.find((t) => t.id === 'tgt_worker_cost_blocked');
    assert.strictEqual(target?.status, SocialSchedulerTargetStatus.COST_BLOCKED);
    assert.strictEqual(target?.nextRetryAt, null, 'COST_BLOCKED must not schedule retries');
    assert.strictEqual(refreshed?.status, SocialSchedulerPostStatus.COST_BLOCKED);
  });

  await test('5.3 Blocks publish with COST_BLOCKED when X paid publishing is disabled via env', async () => {
    const origEnv = process.env.X_PAID_PUBLISHING_ENABLED;
    process.env.X_PAID_PUBLISHING_ENABLED = 'false';

    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_disabled_env',
      targetId: 'tgt_disabled_env',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Disabled env test',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    process.env.X_PAID_PUBLISHING_ENABLED = origEnv;

    assert.strictEqual(res.status, SocialPublishAttemptStatus.COST_BLOCKED);
    assert.strictEqual(res.errorCode, 'X_PAID_PUBLISHING_DISABLED');
  });

  // ----------------------------------------------------------------
  // Group 6: Worker Live Publishing Execution
  // ----------------------------------------------------------------
  console.log('\n--- Group 6: Worker Live Publishing Execution ---');

  await test('6.1 Worker claims due live X target and successfully publishes', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');

    const post = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Live X Launch Post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        caption: 'Live announcement on Twitter/X!',
        hashtags: [],
      },
      targets: [
        {
          id: 'tgt_live_x_success',
          postId: '',
          workspaceId: 'ws_mantri',
          platform: SocialSchedulerPlatform.X,
          publishMode: 'LIVE_X',
          socialAccountId: 'acc_x_mantri_01',
          status: SocialSchedulerTargetStatus.SCHEDULED,
          xCostAcknowledgedAt: new Date().toISOString(),
          xCostAcknowledgedBy: 'usr_admin',
          platformOptionsJson: {
            text: 'Live announcement on Twitter/X!',
            costAcknowledged: true,
            estimatedCostUsd: '0.015',
          },
        },
      ],
    });

    const res = await workerService.processDueTargets();
    xPublisherAdapter.setSimulatedScenario(null);

    assert.ok(res.succeeded >= 1, 'Worker should report at least 1 success');

    const refreshed = sprint1Storage.getPostById(post.id, 'ws_mantri');
    const target = refreshed?.targets?.find((t) => t.id === 'tgt_live_x_success');
    assert.strictEqual(target?.status, SocialSchedulerTargetStatus.PUBLISHED);
    assert.ok(target?.externalPostId, 'Target should record externalPostId');
    assert.ok(target?.externalPostUrl?.includes('x.com/mantridevelopers/status/'), 'Must have correct X URL');
    assert.strictEqual(refreshed?.status, SocialSchedulerPostStatus.PUBLISHED);

    // Verify attempt row was recorded
    const attempts = sprint1Storage.getAttempts(post.id);
    const attempt = attempts.find((a) => a.targetId === 'tgt_live_x_success');
    assert.ok(attempt, 'Attempt row must be stored');
    assert.strictEqual(attempt.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.strictEqual(attempt.provider, SocialAccountProvider.X);
  });

  await test('6.2 External post URL matches canonical x.com permalink format', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_url_check',
      targetId: 'tgt_url_check',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Permalink format check',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.ok(res.externalPostUrl?.startsWith('https://x.com/mantridevelopers/status/'));
  });

  // ----------------------------------------------------------------
  // Group 7: Disclosures Support (AI & Paid Partnership)
  // ----------------------------------------------------------------
  console.log('\n--- Group 7: Disclosures Support ---');

  await test('7.1 Captures and verifies AI media disclosure (made_with_ai)', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_ai_disclosure',
      targetId: 'tgt_ai_disclosure',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'AI rendered preview of the Sky Villa interior.',
      media: [],
      xOptions: {
        madeWithAi: true,
        costAcknowledged: true,
        containsUrl: false,
        estimatedCostUsd: '0.015',
      },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.strictEqual(res.diagnostics?.madeWithAi, true);
  });

  await test('7.2 Captures and verifies paid partnership disclosure', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_sponsor_disclosure',
      targetId: 'tgt_sponsor_disclosure',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Proud to partner with Architectural Digest.',
      media: [],
      xOptions: {
        paidPartnership: true,
        costAcknowledged: true,
        containsUrl: false,
        estimatedCostUsd: '0.015',
      },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.strictEqual(res.diagnostics?.paidPartnership, true);
  });

  await test('7.3 Disclosures default to false when not specified', async () => {
    xPublisherAdapter.setSimulatedScenario('SUCCESS');
    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_default_disclosures',
      targetId: 'tgt_default_disclosures',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Default disclosures check',
      media: [],
      xOptions: {
        costAcknowledged: true,
        containsUrl: false,
        estimatedCostUsd: '0.015',
      },
    });
    xPublisherAdapter.setSimulatedScenario(null);

    assert.strictEqual(res.status, SocialPublishAttemptStatus.SUCCEEDED);
    assert.strictEqual(Boolean(res.diagnostics?.madeWithAi), false);
    assert.strictEqual(Boolean(res.diagnostics?.paidPartnership), false);
  });

  // ----------------------------------------------------------------
  // Group 8: Rate-Limit Handling (HTTP 429)
  // ----------------------------------------------------------------
  console.log('\n--- Group 8: Rate-Limit Handling ---');

  await test('8.1 Handles HTTP 429, schedules retry, and marks attempt RATE_LIMITED', async () => {
    xPublisherAdapter.setSimulatedScenario('RATE_LIMITED');

    const post = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Rate limited X post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        caption: 'Rate limit test',
        hashtags: [],
      },
      targets: [
        {
          id: 'tgt_x_rate_limited',
          postId: '',
          workspaceId: 'ws_mantri',
          platform: SocialSchedulerPlatform.X,
          publishMode: 'LIVE_X',
          socialAccountId: 'acc_x_mantri_01',
          status: SocialSchedulerTargetStatus.SCHEDULED,
          platformOptionsJson: { costAcknowledged: true, estimatedCostUsd: '0.015' },
        },
      ],
    });

    await workerService.processDueTargets();
    xPublisherAdapter.setSimulatedScenario(null);

    const refreshed = sprint1Storage.getPostById(post.id, 'ws_mantri');
    const target = refreshed?.targets?.find((t) => t.id === 'tgt_x_rate_limited');
    assert.strictEqual(target?.status, SocialSchedulerTargetStatus.RETRYING);
    assert.ok(target?.nextRetryAt, 'Target must have nextRetryAt set');

    const attempts = sprint1Storage.getAttempts(post.id);
    const attempt = attempts.find((a) => a.targetId === 'tgt_x_rate_limited');
    assert.strictEqual(attempt?.status, SocialPublishAttemptStatus.RATE_LIMITED);
  });

  // ----------------------------------------------------------------
  // Group 9: Session Expiry & Reauth (HTTP 401)
  // ----------------------------------------------------------------
  console.log('\n--- Group 9: Session Expiry & Reauth ---');

  await test('9.1 Handles expired X OAuth token with REAUTH_REQUIRED', async () => {
    xPublisherAdapter.setSimulatedScenario('EXPIRED_TOKEN');

    const post = sprint1Storage.createDraftPost({
      workspaceId: 'ws_mantri',
      title: 'Expired token post',
      status: SocialSchedulerPostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() - 60000).toISOString(),
      draftContentJson: {
        version: '1.0',
        source: 'manual_upload',
        caption: 'Expired token test',
        hashtags: [],
      },
      targets: [
        {
          id: 'tgt_x_expired',
          postId: '',
          workspaceId: 'ws_mantri',
          platform: SocialSchedulerPlatform.X,
          publishMode: 'LIVE_X',
          socialAccountId: 'acc_x_mantri_01',
          status: SocialSchedulerTargetStatus.SCHEDULED,
          platformOptionsJson: { costAcknowledged: true, estimatedCostUsd: '0.015' },
        },
      ],
    });

    await workerService.processDueTargets();
    xPublisherAdapter.setSimulatedScenario(null);

    const refreshed = sprint1Storage.getPostById(post.id, 'ws_mantri');
    const target = refreshed?.targets?.find((t) => t.id === 'tgt_x_expired');
    assert.strictEqual(target?.status, SocialSchedulerTargetStatus.REAUTH_REQUIRED);
    assert.strictEqual(refreshed?.status, SocialSchedulerPostStatus.REAUTH_REQUIRED);
  });

  await test('9.2 Corrupt credential ref returns REAUTH_REQUIRED', async () => {
    const corruptedAccount = sprint1Storage.createOrUpdateSocialAccount({
      id: 'acc_x_corrupt',
      workspaceId: 'ws_mantri',
      provider: SocialAccountProvider.X,
      platform: SocialSchedulerPlatform.X,
      accountType: SocialAccountType.X_USER,
      externalAccountId: 'x_corrupt_999999',
      displayName: 'Corrupted Token Account',
      credentialRef: 'non_existent_vault_key_xyz',
    });

    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_corrupt',
      targetId: 'tgt_corrupt',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: corruptedAccount.id,
      text: 'Test corrupted token',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.REAUTH_REQUIRED);
    assert.strictEqual(res.errorCode, 'TOKEN_DECRYPTION_FAILED');
  });

  // ----------------------------------------------------------------
  // Group 10: Zero-Token Storage & Disconnection Integrity
  // ----------------------------------------------------------------
  console.log('\n--- Group 10: Zero-Token Storage & Disconnection Integrity ---');

  await test('10.1 Access tokens are decrypted in memory and never logged to database rows', () => {
    const post = sprint1Storage.getPosts('ws_mantri')[0];
    const attempts = sprint1Storage.getAttempts(post.id);

    for (const att of attempts) {
      const serialized = JSON.stringify(att);
      assert.strictEqual(
        serialized.includes('mock_x_oauth_token'),
        false,
        'Attempt logs must never contain raw X access tokens'
      );
      assert.strictEqual(
        serialized.includes('X-Amz-Signature') || serialized.includes('token='),
        false,
        'Attempt logs must not leak signed URLs'
      );
    }
  });

  await test('10.2 Disconnected X account fails immediately with SOCIAL_ACCOUNT_DISCONNECTED', async () => {
    sprint1Storage.updateSocialAccount('acc_x_mantri_01', 'ws_mantri', {
      status: SocialAccountStatus.DISCONNECTED,
    });

    const res = await xPublisherAdapter.publish({
      workspaceId: 'ws_mantri',
      postId: 'post_disc',
      targetId: 'tgt_disc',
      platform: SocialSchedulerPlatform.X,
      publishMode: 'LIVE_X',
      socialAccountId: 'acc_x_mantri_01',
      text: 'Test disconnected account',
      media: [],
      xOptions: { costAcknowledged: true, containsUrl: false, estimatedCostUsd: '0.015' },
    });

    assert.strictEqual(res.status, SocialPublishAttemptStatus.FAILED_PERMANENT);
    assert.strictEqual(res.errorCode, 'SOCIAL_ACCOUNT_DISCONNECTED');

    // Restore for other tests
    sprint1Storage.updateSocialAccount('acc_x_mantri_01', 'ws_mantri', {
      status: SocialAccountStatus.CONNECTED,
    });
  });

  console.log('\n====================================================');
  console.log(`  Sprint 7 Verification Results: ${passed} / ${total} Passed`);
  console.log('====================================================\n');

  if (passed !== total) {
    throw new Error(`Sprint 7 verification failed: only ${passed} of ${total} tests passed.`);
  }
}

runSprint7Tests().catch((err) => {
  console.error('Sprint 7 test run failed:', err);
  process.exit(1);
});
