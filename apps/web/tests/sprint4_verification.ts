import { sprint1Storage } from '../src/lib/mock-storage';
import { credentialVault, sanitizePayload } from '../src/lib/credential-vault';
import { metaInstagramPublisherAdapter } from '../src/lib/meta-instagram-publisher-adapter';
import { workerService } from '../src/lib/worker-service';
import {
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialSchedulerPostStatus,
  SocialPublishAttemptStatus,
  SocialAccountStatus,
  SocialAccountType,
  SocialAccountProvider,
  SocialSchedulerMediaStatus,
  Sprint1MediaAsset,
  InstagramContainerStatus,
} from '../src/types/scheduler';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function createTestAsset(id: string, fileName: string, mimeType: string, byteSize: number): Sprint1MediaAsset {
  return {
    id,
    workspaceId: 'ws_mantri',
    uploadedByUserId: 'usr_admin',
    originalFileName: fileName,
    safeFileName: fileName,
    mimeType,
    byteSize,
    bucket: 'sakhaa-forge-clean-media',
    objectKey: `media/ws_mantri/${fileName}`,
    status: SocialSchedulerMediaStatus.UPLOADED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } else {
    results.push({ name, passed: false, error: detail || 'Assertion failed' });
    console.error(`  ✗ ${name} — ${detail || 'Assertion failed'}`);
  }
}

async function runSprint4Tests() {
  console.log('===============================================================');
  console.log('RUNNING SPRINT 4 VERIFICATION SUITE: INSTAGRAM LIVE PUBLISHING');
  console.log('===============================================================\n');

  sprint1Storage.resetForTest();
  metaInstagramPublisherAdapter.setSimulatedScenario(null);

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Multi-Tenant Instagram Account Discovery & Isolation
  // ---------------------------------------------------------------------------
  console.log('Group 1: Multi-Tenant Discovery & Isolation');

  const mantriAccounts = sprint1Storage.getSocialAccounts('ws_mantri');
  const sobhaAccounts = sprint1Storage.getSocialAccounts('ws_sobha');

  const mantriIg = mantriAccounts.find((a) => a.platform === SocialSchedulerPlatform.INSTAGRAM);
  const sobhaIg = sobhaAccounts.find((a) => a.platform === SocialSchedulerPlatform.INSTAGRAM);

  assert(!!mantriIg, 'ws_mantri has connected Instagram Business account seeded');
  assert(!!sobhaIg, 'ws_sobha has connected Instagram Business account seeded');
  assert(mantriIg?.username === 'mantridevelopers', 'Mantri Instagram account handle is mantridevelopers');
  assert(sobhaIg?.username === 'sobharealty', 'Sobha Instagram account handle is sobharealty');

  // Verify accounts in Mantri cannot be accessed by Sobha workspace
  const crossQuery = sprint1Storage.getSocialAccountById(mantriIg!.id, 'ws_sobha');
  assert(crossQuery === null, 'Tenant Isolation: Sobha workspace cannot read Mantri Instagram account');

  // Discovered linked accounts from Facebook Page
  const discoveredMantri = sprint1Storage.discoverInstagramAccounts('ws_mantri');
  assert(discoveredMantri.length > 0, 'Discovery finds linked Instagram account for Mantri Facebook Page');
  assert(discoveredMantri[0].canPublish === true, 'Discovered Mantri Instagram account has publishing permission');
  assert(discoveredMantri[0].instagramAccount?.username === 'mantri.developers', 'Discovered handle mapped from Facebook Page');

  // Tenant Mismatch Rejection on Publish
  const tenantMismatchResult = await metaInstagramPublisherAdapter.publish({
    workspaceId: 'ws_sobha', // Wrong workspace
    postId: 'post_test_001',
    targetId: 'tgt_test_001',
    platform: SocialSchedulerPlatform.INSTAGRAM,
    publishMode: 'LIVE_META',
    socialAccountId: mantriIg!.id,
    igUserId: mantriIg!.externalAccountId,
    caption: 'Cross-tenant breach attempt',
    media: [
      {
        mediaAssetId: 'med_01',
        mimeType: 'image/jpeg',
        byteSize: 1024,
        objectKey: 'media/test.jpg',
      },
    ],
  });

  assert(
    tenantMismatchResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT,
    'Publishing rejects cross-tenant account usage as FAILED_PERMANENT'
  );
  assert(tenantMismatchResult.errorCode === 'TENANT_MISMATCH', 'ErrorCode is TENANT_MISMATCH');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Instagram Container Storage Lifecycle
  // ---------------------------------------------------------------------------
  console.log('\nGroup 2: Container Model & Storage Lifecycle');

  const testContainer = sprint1Storage.createInstagramContainer({
    workspaceId: 'ws_mantri',
    postId: 'post_ig_container_test',
    targetId: 'tgt_ig_container_test',
    socialAccountId: mantriIg!.id,
    igUserId: mantriIg!.externalAccountId,
    containerId: 'ig_cnt_123456789',
    mediaType: 'REELS',
    status: InstagramContainerStatus.CREATED,
  });

  assert(!!testContainer.id, 'createInstagramContainer creates unique record');
  assert(testContainer.status === InstagramContainerStatus.CREATED, 'Initial container status is CREATED');

  const retrievedContainer = sprint1Storage.getInstagramContainer('ig_cnt_123456789');
  assert(retrievedContainer?.containerId === 'ig_cnt_123456789', 'getInstagramContainer retrieves container by ID');

  const updatedContainer = sprint1Storage.updateInstagramContainer('ig_cnt_123456789', {
    status: InstagramContainerStatus.PUBLISHED,
    publishedAt: new Date().toISOString(),
  });
  assert(updatedContainer?.status === InstagramContainerStatus.PUBLISHED, 'updateInstagramContainer updates status to PUBLISHED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Live Meta Instagram Publishing (Feed Image)
  // ---------------------------------------------------------------------------
  console.log('\nGroup 3: Live Publishing (Feed Image)');

  metaInstagramPublisherAdapter.setSimulatedScenario('SUCCESS_IMAGE');

  const feedPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Mantri Splendor Villa Showcase',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Luxury living defined. Visit Mantri Splendor this weekend! #luxury #realestate',
      hashtags: ['luxury', 'realestate'],
    },
    mediaAssets: [createTestAsset('med_img_01', 'villa.jpg', 'image/jpeg', 1024 * 1024 * 2)],
    targets: [
      {
        id: 'tgt_ig_image_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        instagramFormat: 'FEED_IMAGE',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  const workerRunResult = await workerService.processDueTargets({
    workspaceId: 'ws_mantri',
    limit: 5,
  });

  assert(workerRunResult.claimedTargets === 1, 'Worker claimed 1 due Instagram image target');
  assert(workerRunResult.succeeded === 1, 'Worker successfully published Instagram image target');

  const refreshedFeedPost = sprint1Storage.getPostById(feedPost.id);
  const igFeedTarget = refreshedFeedPost?.targets.find((t) => t.id === 'tgt_ig_image_01');

  assert(igFeedTarget?.status === SocialSchedulerTargetStatus.PUBLISHED, 'Target status transitioned to PUBLISHED');
  assert(!!igFeedTarget?.externalPostUrl?.includes('instagram.com/p/'), 'Instagram permalink generated');
  assert(refreshedFeedPost?.status === SocialSchedulerPostStatus.PUBLISHED, 'Parent post status transitioned to PUBLISHED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Live Meta Instagram Publishing (Reel/Video)
  // ---------------------------------------------------------------------------
  console.log('\nGroup 4: Live Publishing (Reel / Video)');

  metaInstagramPublisherAdapter.setSimulatedScenario('SUCCESS_VIDEO');

  const reelPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Mantri Walkthrough Reel',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Step inside modern luxury. #reels #walkthrough',
      hashtags: ['reels', 'walkthrough'],
    },
    mediaAssets: [createTestAsset('med_vid_01', 'walkthrough.mp4', 'video/mp4', 1024 * 1024 * 15)],
    targets: [
      {
        id: 'tgt_ig_video_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        instagramFormat: 'REEL_VIDEO',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  const reelRunResult = await workerService.processDueTargets({
    workspaceId: 'ws_mantri',
    limit: 5,
  });

  assert(reelRunResult.claimedTargets === 1, 'Worker claimed 1 due Instagram video target');
  assert(reelRunResult.succeeded === 1, 'Worker published Instagram Reel target');

  const refreshedReelPost = sprint1Storage.getPostById(reelPost.id);
  const igReelTarget = refreshedReelPost?.targets.find((t) => t.id === 'tgt_ig_video_01');
  assert(igReelTarget?.status === SocialSchedulerTargetStatus.PUBLISHED, 'Reel target status is PUBLISHED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Async Video Container Polling & PLATFORM_PROCESSING Release
  // ---------------------------------------------------------------------------
  console.log('\nGroup 5: Async Video Polling & PLATFORM_PROCESSING Release');

  metaInstagramPublisherAdapter.setSimulatedScenario('PROCESSING_THEN_READY');

  const asyncReelPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Async Video Processing Test',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Testing container async polling.',
      hashtags: [],
    },
    mediaAssets: [createTestAsset('med_vid_async', 'aerial.mp4', 'video/mp4', 1024 * 1024 * 30)],
    targets: [
      {
        id: 'tgt_ig_async_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        instagramFormat: 'REEL_VIDEO',
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  // Cycle 1: Container in progress -> PLATFORM_PROCESSING
  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const postAfterCycle1 = sprint1Storage.getPostById(asyncReelPost.id);
  const targetAfterCycle1 = postAfterCycle1?.targets.find((t) => t.id === 'tgt_ig_async_01');

  assert(
    targetAfterCycle1?.status === SocialSchedulerTargetStatus.PLATFORM_PROCESSING,
    'Cycle 1: Target transitioned to PLATFORM_PROCESSING'
  );
  assert(!!targetAfterCycle1?.instagramContainerId, 'Target has instagramContainerId populated');
  assert(!!targetAfterCycle1?.platformProcessingAt, 'Target has platformProcessingAt timestamp');
  assert(targetAfterCycle1?.lockedAt === null, 'Target lock released so worker is not held');
  assert(postAfterCycle1?.status === SocialSchedulerPostStatus.PROCESSING, 'Parent post remains in PROCESSING');

  // Fast forward target retry timer to simulate ready container
  targetAfterCycle1!.nextRetryAt = new Date(Date.now() - 1000).toISOString();
  sprint1Storage.updatePost(asyncReelPost.id, postAfterCycle1!);

  // Cycle 2: Container finished -> PUBLISHED
  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const postAfterCycle2 = sprint1Storage.getPostById(asyncReelPost.id);
  const targetAfterCycle2 = postAfterCycle2?.targets.find((t) => t.id === 'tgt_ig_async_01');

  assert(targetAfterCycle2?.status === SocialSchedulerTargetStatus.PUBLISHED, 'Cycle 2: Target transitioned to PUBLISHED');
  assert(postAfterCycle2?.status === SocialSchedulerPostStatus.PUBLISHED, 'Cycle 2: Parent post transitioned to PUBLISHED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Instagram Publishing Quota Limit Handling
  // ---------------------------------------------------------------------------
  console.log('\nGroup 6: Quota Limit Handling');

  metaInstagramPublisherAdapter.setSimulatedScenario('LIMIT_REACHED');

  const quotaPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Quota Exceeded Post',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Post over quota limit',
      hashtags: [],
    },
    mediaAssets: [createTestAsset('med_img_quota', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_ig_quota_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedQuotaPost = sprint1Storage.getPostById(quotaPost.id);
  const quotaTarget = refreshedQuotaPost?.targets.find((t) => t.id === 'tgt_ig_quota_01');

  assert(quotaTarget?.status === SocialSchedulerTargetStatus.LIMIT_REACHED, 'Target marked as LIMIT_REACHED');
  assert(quotaTarget?.lastErrorCode === 'INSTAGRAM_PUBLISHING_LIMIT_REACHED', 'ErrorCode is INSTAGRAM_PUBLISHING_LIMIT_REACHED');
  assert(!!quotaTarget?.nextRetryAt, 'Next retry timestamp scheduled (1 hour backoff)');
  assert(refreshedQuotaPost?.status === SocialSchedulerPostStatus.RETRYING, 'Parent post transitioned to RETRYING, not FAILED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Session Expiry & REAUTH_REQUIRED Classification
  // ---------------------------------------------------------------------------
  console.log('\nGroup 7: Session Expiry & Reauth Classification');

  metaInstagramPublisherAdapter.setSimulatedScenario('EXPIRED_TOKEN');

  const reauthPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Expired Token Test',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Expired token run',
      hashtags: [],
    },
    mediaAssets: [createTestAsset('med_img_reauth', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_ig_reauth_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedReauthPost = sprint1Storage.getPostById(reauthPost.id);
  const reauthTarget = refreshedReauthPost?.targets.find((t) => t.id === 'tgt_ig_reauth_01');
  const refreshedMantriIg = sprint1Storage.getSocialAccountById(mantriIg!.id);

  assert(reauthTarget?.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED, 'Target marked as REAUTH_REQUIRED');
  assert(refreshedMantriIg?.status === SocialAccountStatus.REAUTH_REQUIRED, 'SocialAccount record updated to REAUTH_REQUIRED');
  assert(refreshedReauthPost?.status === SocialSchedulerPostStatus.REAUTH_REQUIRED, 'Parent post marked as REAUTH_REQUIRED');

  // Reset account back to CONNECTED
  sprint1Storage.updateSocialAccount(mantriIg!.id, 'ws_mantri', { status: SocialAccountStatus.CONNECTED });

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Permanent vs Retryable Error Classification
  // ---------------------------------------------------------------------------
  console.log('\nGroup 8: Permanent vs Retryable Error Classification');

  // Subtest 8a: Permanent Unsupported Media
  metaInstagramPublisherAdapter.setSimulatedScenario('UNSUPPORTED_MEDIA');

  const permPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Unsupported Media Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Test', hashtags: [] },
    mediaAssets: [createTestAsset('med_img_perm', 'img.bmp', 'image/bmp', 1024)],
    targets: [
      {
        id: 'tgt_ig_perm_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedPermPost = sprint1Storage.getPostById(permPost.id);
  const permTarget = refreshedPermPost?.targets.find((t) => t.id === 'tgt_ig_perm_01');

  assert(permTarget?.status === SocialSchedulerTargetStatus.FAILED, 'Unsupported media immediately marked FAILED');
  assert(permTarget?.lastErrorCode === 'UNSUPPORTED_MEDIA_FORMAT', 'ErrorCode is UNSUPPORTED_MEDIA_FORMAT');
  assert(permTarget?.nextRetryAt === null, 'No retry scheduled for permanent failure');

  // Subtest 8b: Retryable Rate Limit (Meta Code 341)
  metaInstagramPublisherAdapter.setSimulatedScenario('RATE_LIMIT');

  const rateLimitPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Rate Limit Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Test', hashtags: [] },
    mediaAssets: [createTestAsset('med_img_rate', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_ig_rate_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.INSTAGRAM,
        publishMode: 'LIVE_META',
        socialAccountId: mantriIg!.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedRatePost = sprint1Storage.getPostById(rateLimitPost.id);
  const rateTarget = refreshedRatePost?.targets.find((t) => t.id === 'tgt_ig_rate_01');

  assert(rateTarget?.status === SocialSchedulerTargetStatus.RETRYING, 'Rate limit marked as RETRYING');
  assert(!!rateTarget?.nextRetryAt, 'Next retry scheduled');
  assert(rateTarget?.lastErrorCode === 'META_RATE_LIMIT', 'ErrorCode is META_RATE_LIMIT');

  // ---------------------------------------------------------------------------
  // TEST GROUP 9: Zero-Token Sanitization & Credential Safety
  // ---------------------------------------------------------------------------
  console.log('\nGroup 9: Zero-Token Sanitization');

  const dirtyPayload = {
    accessToken: 'EAABmockSecretToken1234567890',
    creation_id: 'ig_cnt_987654321',
    authorization: 'Bearer EAABmockSecretToken1234567890',
    meta: {
      secretKey: 'top_secret_meta_client_secret',
      status: 'FINISHED',
    },
  };

  const cleanPayload = sanitizePayload(dirtyPayload) as any;

  assert(cleanPayload.accessToken === '[REDACTED]', 'accessToken redacted');
  assert(cleanPayload.authorization === '[REDACTED]', 'authorization header redacted');
  assert(cleanPayload.meta.secretKey === '[REDACTED]', 'secretKey redacted');
  assert(cleanPayload.creation_id === 'ig_cnt_987654321', 'Non-sensitive creation_id preserved');

  // Verify all recorded attempts for Instagram have zero tokens
  const allAttempts = sprint1Storage.getAttempts(feedPost.id);
  const serializedAttempts = JSON.stringify(allAttempts);
  assert(!serializedAttempts.includes('EAABmockToken'), 'No access token substring found in stored attempts');

  // ---------------------------------------------------------------------------
  // TEST GROUP 10: Account Disconnection Guard
  // ---------------------------------------------------------------------------
  console.log('\nGroup 10: Disconnection Guard');

  // Disconnect Mantri Instagram account
  sprint1Storage.disconnectSocialAccount(mantriIg!.id, 'ws_mantri');

  const discResult = await metaInstagramPublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_disc_01',
    targetId: 'tgt_disc_01',
    platform: SocialSchedulerPlatform.INSTAGRAM,
    publishMode: 'LIVE_META',
    socialAccountId: mantriIg!.id,
    igUserId: mantriIg!.externalAccountId,
    caption: 'Attempt after disconnect',
    media: [
      {
        mediaAssetId: 'med_01',
        mimeType: 'image/jpeg',
        byteSize: 1024,
        objectKey: 'media/test.jpg',
      },
    ],
  });

  assert(
    discResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT,
    'Publishing to disconnected account rejected with FAILED_PERMANENT'
  );
  assert(
    discResult.errorCode === 'SOCIAL_ACCOUNT_DISCONNECTED',
    'ErrorCode is SOCIAL_ACCOUNT_DISCONNECTED'
  );

  // Restore account for idempotency
  sprint1Storage.updateSocialAccount(mantriIg!.id, 'ws_mantri', { status: SocialAccountStatus.CONNECTED });

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n===============================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`SPRINT 4 VERIFICATION RESULTS: ${passedCount}/${results.length} PASSED`);
  if (failedCount > 0) {
    console.error(`FAILED TESTS (${failedCount}):`);
    results.filter((r) => !r.passed).forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('ALL 10 SPRINT 4 SPECIFICATION REQUIREMENTS SATISFIED 100%!');
  }
  console.log('===============================================================\n');
}

runSprint4Tests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
