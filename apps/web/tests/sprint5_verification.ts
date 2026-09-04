import { sprint1Storage } from '../src/lib/mock-storage';
import { credentialVault, sanitizePayload } from '../src/lib/credential-vault';
import { pinterestPublisherAdapter } from '../src/lib/pinterest-publisher-adapter';
import { workerService } from '../src/lib/worker-service';
import {
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  SocialSchedulerPostStatus,
  SocialPublishAttemptStatus,
  SocialAccountStatus,
  SocialAccountProvider,
  SocialAccountType,
  SocialSchedulerMediaStatus,
  Sprint1MediaAsset,
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

async function runSprint5Verification() {
  console.log('================================================================');
  console.log('SAKHAA FORGE SOCIAL SCHEDULER — SPRINT 5 VERIFICATION SUITE');
  console.log('Testing Pinterest Wiring, Board Discovery, and Image Pin Publishing');
  console.log('================================================================');

  // Reset in-memory state for clean deterministic verification
  sprint1Storage.resetForTest();

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: OAuth State Security & Workspace Binding
  // ---------------------------------------------------------------------------
  console.log('\nGroup 1: OAuth State Security & Workspace Binding');

  const { state: validState } = sprint1Storage.createOAuthState({
    workspaceId: 'ws_mantri',
    userId: 'usr_admin',
    provider: SocialAccountProvider.PINTEREST,
    redirectPath: '/app/social-accounts',
  });

  assert(!!validState && validState.length >= 32, 'OAuth state token generated with sufficient entropy');

  const validConsumption = sprint1Storage.verifyAndConsumeOAuthState(validState);
  assert(validConsumption.valid === true, 'Valid OAuth state verified successfully');
  assert(validConsumption.oauthState?.workspaceId === 'ws_mantri', 'OAuth state bound strictly to ws_mantri');
  assert(validConsumption.oauthState?.provider === SocialAccountProvider.PINTEREST, 'OAuth state bound to PINTEREST');

  // Reusing same state should be rejected
  const reusedConsumption = sprint1Storage.verifyAndConsumeOAuthState(validState);
  assert(reusedConsumption.valid === false, 'Reused OAuth state rejected (single-use CSRF protection)');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Multi-Tenant Pinterest Account Isolation
  // ---------------------------------------------------------------------------
  console.log('\nGroup 2: Multi-Tenant Account Isolation');

  const mantriAccounts = sprint1Storage.getSocialAccounts('ws_mantri');
  const sobhaAccounts = sprint1Storage.getSocialAccounts('ws_sobha');

  const mantriPin = mantriAccounts.find((a) => a.provider === SocialAccountProvider.PINTEREST);
  const sobhaPin = sobhaAccounts.find((a) => a.provider === SocialAccountProvider.PINTEREST);

  assert(!!mantriPin, 'ws_mantri has connected Pinterest account (@mantridevelopers)');
  assert(!!sobhaPin, 'ws_sobha has connected Pinterest account (@sobharealty)');
  assert(mantriPin?.id !== sobhaPin?.id, 'Pinterest account IDs are distinct across tenants');

  // Cross-tenant account query should return null
  const crossTenantAccount = sprint1Storage.getSocialAccountById(mantriPin!.id, 'ws_sobha');
  assert(crossTenantAccount === null, 'Tenant boundary: ws_sobha cannot query ws_mantri Pinterest account');

  // Cross-tenant adapter invocation should fail with TENANT_MISMATCH
  const crossTenantPublishResult = await pinterestPublisherAdapter.publish({
    workspaceId: 'ws_sobha',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.PINTEREST,
    publishMode: 'LIVE_PINTEREST',
    socialAccountId: mantriPin!.id,
    boardId: 'board_mantri_01',
    title: 'Luxury Living',
    description: 'Exclusive residences',
    media: [{ mediaAssetId: 'med_1', mimeType: 'image/jpeg', byteSize: 1000, objectKey: 'media/img.jpg' }],
  });

  assert(crossTenantPublishResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Cross-tenant publish rejected');
  assert(crossTenantPublishResult.errorCode === 'TENANT_MISMATCH', 'Error code classified as TENANT_MISMATCH');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Board Discovery, Caching, and Workspace Scoping
  // ---------------------------------------------------------------------------
  console.log('\nGroup 3: Board Discovery, Caching & Isolation');

  const mantriBoards = sprint1Storage.getPinterestBoards('ws_mantri');
  const sobhaBoards = sprint1Storage.getPinterestBoards('ws_sobha');

  assert(mantriBoards.length >= 2, 'ws_mantri has at least 2 Pinterest boards cached');
  assert(sobhaBoards.length >= 2, 'ws_sobha has at least 2 Pinterest boards cached');

  const mantriBoard01 = mantriBoards.find((b) => b.id === 'board_mantri_01');
  assert(!!mantriBoard01, 'Mantri board "Luxury Villas & Estates" is cached');
  assert(mantriBoard01?.workspaceId === 'ws_mantri', 'Board workspaceId is ws_mantri');

  // Ensure Sobha cannot access Mantri's boards
  const sobhaAccessMantriBoard = sobhaBoards.find((b) => b.id === 'board_mantri_01');
  assert(!sobhaAccessMantriBoard, 'Tenant boundary: Mantri board does not appear in Sobha workspace');

  // Board sync helper
  const syncResult = sprint1Storage.syncPinterestBoards('ws_mantri', mantriPin!.id);
  assert(syncResult.syncedBoards === mantriBoards.length, 'syncPinterestBoards returns correct board count');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Target Selection & Board Validation
  // ---------------------------------------------------------------------------
  console.log('\nGroup 4: Target Selection & Board Validation');

  // Subtest 4a: Missing boardId should fail
  const missingBoardResult = await pinterestPublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.PINTEREST,
    publishMode: 'LIVE_PINTEREST',
    socialAccountId: mantriPin!.id,
    boardId: '',
    title: 'Luxury Living',
    description: 'Exclusive residences',
    media: [{ mediaAssetId: 'med_1', mimeType: 'image/jpeg', byteSize: 1000, objectKey: 'media/img.jpg' }],
  });
  assert(missingBoardResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Publish without boardId fails');
  assert(missingBoardResult.errorCode === 'INVALID_BOARD_ID', 'Error code is INVALID_BOARD_ID');

  // Subtest 4b: Cross-tenant board usage fails
  const crossBoardResult = await pinterestPublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.PINTEREST,
    publishMode: 'LIVE_PINTEREST',
    socialAccountId: mantriPin!.id,
    boardId: 'board_sobha_01', // Sobha's board
    title: 'Luxury Living',
    description: 'Exclusive residences',
    media: [{ mediaAssetId: 'med_1', mimeType: 'image/jpeg', byteSize: 1000, objectKey: 'media/img.jpg' }],
  });
  assert(crossBoardResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Cross-tenant board usage rejected');
  assert(crossBoardResult.errorCode === 'BOARD_TENANT_MISMATCH', 'Error code is BOARD_TENANT_MISMATCH');

  // Subtest 4c: Missing Pin title fails
  const missingTitleResult = await pinterestPublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.PINTEREST,
    publishMode: 'LIVE_PINTEREST',
    socialAccountId: mantriPin!.id,
    boardId: 'board_mantri_01',
    title: '',
    description: 'Exclusive residences',
    media: [{ mediaAssetId: 'med_1', mimeType: 'image/jpeg', byteSize: 1000, objectKey: 'media/img.jpg' }],
  });
  assert(missingTitleResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Missing Pin title rejected');
  assert(missingTitleResult.errorCode === 'MISSING_PIN_TITLE', 'Error code is MISSING_PIN_TITLE');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Live Image Pin Publishing Execution
  // ---------------------------------------------------------------------------
  console.log('\nGroup 5: Live Image Pin Publishing Execution');

  pinterestPublisherAdapter.setSimulatedScenario('SUCCESS');

  const imagePinPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Mantri Splendor Sky Villa Pin',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Discover bespoke sky villa architecture at Mantri Splendor. #luxury #realestate',
      hashtags: ['luxury', 'realestate'],
    },
    mediaAssets: [createTestAsset('med_pin_img_01', 'villa_facade.jpg', 'image/jpeg', 1024 * 1024 * 3)],
    targets: [
      {
        id: 'tgt_pin_live_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.PINTEREST,
        publishMode: 'LIVE_PINTEREST',
        socialAccountId: mantriPin!.id,
        pinterestBoardId: 'board_mantri_01',
        platformOptionsJson: {
          pinType: 'IMAGE',
          title: 'Mantri Splendor Sky Villa',
          description: 'Discover bespoke sky villa architecture at Mantri Splendor.',
          destinationLink: 'https://mantri.in/splendor',
          boardId: 'board_mantri_01',
        },
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

  assert(workerRunResult.claimedTargets === 1, 'Worker claimed 1 due Pinterest target');
  assert(workerRunResult.succeeded === 1, 'Worker successfully published Pinterest target');

  const refreshedPost = sprint1Storage.getPostById(imagePinPost.id);
  const pinTarget = refreshedPost?.targets.find((t) => t.id === 'tgt_pin_live_01');

  assert(pinTarget?.status === SocialSchedulerTargetStatus.PUBLISHED, 'Target transitioned to PUBLISHED');
  assert(!!pinTarget?.externalPostId?.startsWith('pin_'), 'External Pin ID generated');
  assert(!!pinTarget?.externalPostUrl?.includes('pinterest.com/pin/'), 'Pinterest permalink generated');
  assert(refreshedPost?.status === SocialSchedulerPostStatus.PUBLISHED, 'Parent post status is PUBLISHED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Video Pin Block / Media Eligibility in Sprint 5
  // ---------------------------------------------------------------------------
  console.log('\nGroup 6: Video Pin Block / Media Eligibility');

  pinterestPublisherAdapter.setSimulatedScenario('UNSUPPORTED_MEDIA');

  const videoPinPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Video Pin Test Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Video Pin test', hashtags: [] },
    mediaAssets: [createTestAsset('med_vid_pin', 'walkthrough.mp4', 'video/mp4', 1024 * 1024 * 10)],
    targets: [
      {
        id: 'tgt_pin_video_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.PINTEREST,
        publishMode: 'LIVE_PINTEREST',
        socialAccountId: mantriPin!.id,
        pinterestBoardId: 'board_mantri_01',
        platformOptionsJson: {
          pinType: 'VIDEO',
          title: 'Walkthrough Video Pin',
          description: 'Video walkthrough',
          boardId: 'board_mantri_01',
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedVideoPost = sprint1Storage.getPostById(videoPinPost.id);
  const videoTarget = refreshedVideoPost?.targets.find((t) => t.id === 'tgt_pin_video_01');

  assert(videoTarget?.status === SocialSchedulerTargetStatus.FAILED, 'Video Pin immediately marked FAILED in Sprint 5');
  assert(videoTarget?.lastErrorCode === 'UNSUPPORTED_MEDIA_TYPE', 'ErrorCode is UNSUPPORTED_MEDIA_TYPE');
  assert(videoTarget?.nextRetryAt === null, 'No retry scheduled for permanent unsupported format');

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Pinterest Rate Limit Handling (HTTP 429)
  // ---------------------------------------------------------------------------
  console.log('\nGroup 7: Rate Limit Handling (HTTP 429)');

  pinterestPublisherAdapter.setSimulatedScenario('RATE_LIMIT');

  const rateLimitPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Rate Limit Pinterest Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Rate limit test', hashtags: [] },
    mediaAssets: [createTestAsset('med_img_pin_rl', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_pin_rl_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.PINTEREST,
        publishMode: 'LIVE_PINTEREST',
        socialAccountId: mantriPin!.id,
        pinterestBoardId: 'board_mantri_01',
        platformOptionsJson: {
          title: 'Rate Limit Pin',
          description: 'Rate limit test',
          boardId: 'board_mantri_01',
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedRlPost = sprint1Storage.getPostById(rateLimitPost.id);
  const rlTarget = refreshedRlPost?.targets.find((t) => t.id === 'tgt_pin_rl_01');

  assert(rlTarget?.status === SocialSchedulerTargetStatus.RETRYING, 'Target transitioned to RETRYING upon 429');
  assert(rlTarget?.lastErrorCode === 'PINTEREST_RATE_LIMIT', 'ErrorCode is PINTEREST_RATE_LIMIT');
  assert(!!rlTarget?.nextRetryAt, 'Next retry scheduled based on rate-limit reset window');
  assert(refreshedRlPost?.status === SocialSchedulerPostStatus.RETRYING, 'Parent post marked RETRYING, not FAILED');

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Session Expiry & REAUTH_REQUIRED Classification (HTTP 401)
  // ---------------------------------------------------------------------------
  console.log('\nGroup 8: Session Expiry & REAUTH_REQUIRED (HTTP 401)');

  pinterestPublisherAdapter.setSimulatedScenario('EXPIRED_TOKEN');

  const reauthPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Expired Pinterest Token Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Expired token test', hashtags: [] },
    mediaAssets: [createTestAsset('med_img_pin_reauth', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_pin_reauth_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.PINTEREST,
        publishMode: 'LIVE_PINTEREST',
        socialAccountId: mantriPin!.id,
        pinterestBoardId: 'board_mantri_01',
        platformOptionsJson: {
          title: 'Reauth Pin',
          description: 'Reauth test',
          boardId: 'board_mantri_01',
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedReauthPost = sprint1Storage.getPostById(reauthPost.id);
  const reauthTarget = refreshedReauthPost?.targets.find((t) => t.id === 'tgt_pin_reauth_01');
  const refreshedMantriPin = sprint1Storage.getSocialAccountById(mantriPin!.id);

  assert(reauthTarget?.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED, 'Target marked as REAUTH_REQUIRED');
  assert(refreshedMantriPin?.status === SocialAccountStatus.REAUTH_REQUIRED, 'SocialAccount status is REAUTH_REQUIRED');
  assert(refreshedReauthPost?.status === SocialSchedulerPostStatus.REAUTH_REQUIRED, 'Parent post is REAUTH_REQUIRED');

  // Restore account status
  sprint1Storage.updateSocialAccount(mantriPin!.id, 'ws_mantri', { status: SocialAccountStatus.CONNECTED });

  // ---------------------------------------------------------------------------
  // TEST GROUP 9: Zero-Token Sanitization & B2 Presigned URL Privacy
  // ---------------------------------------------------------------------------
  console.log('\nGroup 9: Zero-Token Sanitization & Security');

  const allAttempts = sprint1Storage.getAttempts();
  const pinAttempts = allAttempts.filter((a) => a.platform === SocialSchedulerPlatform.PINTEREST);

  assert(pinAttempts.length > 0, 'Publish attempts exist for Pinterest targets');

  let leakedToken = false;
  let leakedPresignedUrl = false;

  for (const att of pinAttempts) {
    const reqStr = JSON.stringify(att.requestJson || {});
    const resStr = JSON.stringify(att.responseJson || {});
    const diagStr = JSON.stringify(att.diagnosticsJson || {});

    if (reqStr.includes('pina_') || resStr.includes('pina_') || diagStr.includes('pina_')) {
      leakedToken = true;
    }
    if (reqStr.includes('X-Amz-Signature') || diagStr.includes('X-Amz-Signature')) {
      leakedPresignedUrl = true;
    }
  }

  assert(!leakedToken, 'Zero-token guarantee: No Pinterest bearer token found in attempt history');
  assert(!leakedPresignedUrl, 'Zero-token guarantee: No raw signed B2 URL persisted in database JSON logs');

  // ---------------------------------------------------------------------------
  // TEST GROUP 10: Disconnection Integrity
  // ---------------------------------------------------------------------------
  console.log('\nGroup 10: Disconnection Integrity');

  sprint1Storage.updateSocialAccount(mantriPin!.id, 'ws_mantri', { status: SocialAccountStatus.DISCONNECTED });

  pinterestPublisherAdapter.setSimulatedScenario('SUCCESS');

  const disconnectedPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Disconnected Account Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Disconnected test', hashtags: [] },
    mediaAssets: [createTestAsset('med_img_pin_disc', 'img.jpg', 'image/jpeg', 1024)],
    targets: [
      {
        id: 'tgt_pin_disc_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.PINTEREST,
        publishMode: 'LIVE_PINTEREST',
        socialAccountId: mantriPin!.id,
        pinterestBoardId: 'board_mantri_01',
        platformOptionsJson: {
          title: 'Disconnected Pin',
          description: 'Disconnected test',
          boardId: 'board_mantri_01',
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedDiscPost = sprint1Storage.getPostById(disconnectedPost.id);
  const discTarget = refreshedDiscPost?.targets.find((t) => t.id === 'tgt_pin_disc_01');

  assert(discTarget?.status === SocialSchedulerTargetStatus.FAILED, 'Disconnected account publish immediately FAILED');
  assert(discTarget?.lastErrorCode === 'SOCIAL_ACCOUNT_DISCONNECTED', 'ErrorCode is SOCIAL_ACCOUNT_DISCONNECTED');
  assert(discTarget?.nextRetryAt === null, 'No retry scheduled for disconnected account');

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`SPRINT 5 VERIFICATION RESULTS: ${passedCount} / ${results.length} PASSED`);
  if (failedCount > 0) {
    console.error(`FAILED TESTS (${failedCount}):`);
    results.filter((r) => !r.passed).forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('ALL SPRINT 5 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
    console.log('================================================================');
  }
}

runSprint5Verification().catch((err) => {
  console.error('Fatal error during Sprint 5 verification:', err);
  process.exit(1);
});
