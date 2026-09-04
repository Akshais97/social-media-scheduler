import { sprint1Storage } from '../src/lib/mock-storage';
import { credentialVault, sanitizePayload } from '../src/lib/credential-vault';
import { googleYouTubePublisherAdapter } from '../src/lib/google-youtube-publisher-adapter';
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

function createTestVideoAsset(id: string, fileName: string, mimeType: string, byteSize: number): Sprint1MediaAsset {
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

async function runSprint6Verification() {
  console.log('================================================================');
  console.log('SAKHAA FORGE SOCIAL SCHEDULER — SPRINT 6 VERIFICATION SUITE');
  console.log('Testing YouTube Channel Wiring, Video Publishing & Quota Guardrails');
  console.log('================================================================');

  // Reset in-memory state for clean deterministic verification
  sprint1Storage.resetForTest();

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Google OAuth State Security & Workspace Binding
  // ---------------------------------------------------------------------------
  console.log('\nGroup 1: Google OAuth State Security & Workspace Binding');

  const { state: validState } = sprint1Storage.createOAuthState({
    workspaceId: 'ws_mantri',
    userId: 'usr_admin',
    provider: SocialAccountProvider.GOOGLE,
    redirectPath: '/app/social-accounts',
  });

  assert(!!validState && validState.length >= 32, 'OAuth state token generated with high entropy');

  const validConsumption = sprint1Storage.verifyAndConsumeOAuthState(validState);
  assert(validConsumption.valid === true, 'Valid OAuth state verified successfully');
  assert(validConsumption.oauthState?.workspaceId === 'ws_mantri', 'OAuth state bound strictly to ws_mantri');
  assert(validConsumption.oauthState?.provider === SocialAccountProvider.GOOGLE, 'OAuth state bound to GOOGLE');

  // Reusing same state should be rejected
  const reusedConsumption = sprint1Storage.verifyAndConsumeOAuthState(validState);
  assert(reusedConsumption.valid === false, 'Reused OAuth state rejected (single-use CSRF protection)');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Multi-Tenant YouTube Channel Isolation
  // ---------------------------------------------------------------------------
  console.log('\nGroup 2: Multi-Tenant Account Isolation');

  const mantriAccounts = sprint1Storage.getSocialAccounts('ws_mantri');
  const sobhaAccounts = sprint1Storage.getSocialAccounts('ws_sobha');

  const mantriYt = mantriAccounts.find((a) => a.provider === SocialAccountProvider.GOOGLE);
  const sobhaYt = sobhaAccounts.find((a) => a.provider === SocialAccountProvider.GOOGLE);

  assert(!!mantriYt, 'ws_mantri has connected YouTube channel (Mantri Developers Official)');
  assert(!!sobhaYt, 'ws_sobha has connected YouTube channel (Sobha Realty Official)');
  assert(mantriYt?.id !== sobhaYt?.id, 'YouTube account IDs are distinct across tenants');

  // Cross-tenant account query should return null
  const crossTenantAccount = sprint1Storage.getSocialAccountById(mantriYt!.id, 'ws_sobha');
  assert(crossTenantAccount === null, 'Tenant boundary: ws_sobha cannot query ws_mantri YouTube channel');

  // Cross-tenant adapter invocation should fail with TENANT_MISMATCH
  const crossTenantPublishResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_sobha',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_vid_1', mimeType: 'video/mp4', byteSize: 5000000, objectKey: 'media/video.mp4' },
    youtubeOptions: {
      title: 'Luxury Villa Tour',
      description: 'Exclusive tour',
      privacyStatus: 'private',
      madeForKids: false,
    },
  });

  assert(crossTenantPublishResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Cross-tenant publish rejected');
  assert(crossTenantPublishResult.errorCode === 'TENANT_MISMATCH', 'Error code classified as TENANT_MISMATCH');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Video-Only Platform Validation
  // ---------------------------------------------------------------------------
  console.log('\nGroup 3: Video-Only Media Validation');

  // Subtest 3a: Image upload rejected for live YouTube publishing
  const imagePublishResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_img_1', mimeType: 'image/jpeg', byteSize: 1000000, objectKey: 'media/img.jpg' },
    youtubeOptions: {
      title: 'Photo Gallery',
      description: 'Photo gallery description',
      privacyStatus: 'private',
      madeForKids: false,
    },
  });

  assert(imagePublishResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Image media rejected for YouTube');
  assert(imagePublishResult.errorCode === 'UNSUPPORTED_MEDIA_TYPE', 'Error code is UNSUPPORTED_MEDIA_TYPE');

  // Subtest 3b: Unsupported video container (e.g. MOV without transcoding)
  const movPublishResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_mov_1', mimeType: 'video/quicktime', byteSize: 5000000, objectKey: 'media/video.mov' },
    youtubeOptions: {
      title: 'MOV Video',
      description: 'MOV video description',
      privacyStatus: 'private',
      madeForKids: false,
    },
  });

  assert(movPublishResult.status === SocialPublishAttemptStatus.FAILED_PERMANENT, 'Non-MP4 video rejected in Sprint 6');
  assert(movPublishResult.errorCode === 'UNSUPPORTED_VIDEO_FORMAT', 'Error code is UNSUPPORTED_VIDEO_FORMAT');

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Target Metadata Validation
  // ---------------------------------------------------------------------------
  console.log('\nGroup 4: Target Metadata Validation');

  // Subtest 4a: Missing title
  const missingTitleResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_vid_1', mimeType: 'video/mp4', byteSize: 5000000, objectKey: 'media/video.mp4' },
    youtubeOptions: {
      title: '',
      description: 'Description',
      privacyStatus: 'private',
      madeForKids: false,
    },
  });
  assert(missingTitleResult.errorCode === 'MISSING_VIDEO_TITLE', 'Empty video title rejected');

  // Subtest 4b: Title exceeds 100 characters
  const longTitleResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_vid_1', mimeType: 'video/mp4', byteSize: 5000000, objectKey: 'media/video.mp4' },
    youtubeOptions: {
      title: 'A'.repeat(101),
      description: 'Description',
      privacyStatus: 'private',
      madeForKids: false,
    },
  });
  assert(longTitleResult.errorCode === 'TITLE_TOO_LONG', 'Title over 100 chars rejected');

  // Subtest 4c: Missing madeForKids declaration
  const missingKidsResult = await googleYouTubePublisherAdapter.publish({
    workspaceId: 'ws_mantri',
    postId: 'post_fake',
    targetId: 'tgt_fake',
    platform: SocialSchedulerPlatform.YOUTUBE,
    publishMode: 'LIVE_GOOGLE',
    socialAccountId: mantriYt!.id,
    video: { mediaAssetId: 'med_vid_1', mimeType: 'video/mp4', byteSize: 5000000, objectKey: 'media/video.mp4' },
    youtubeOptions: {
      title: 'Valid Title',
      description: 'Description',
      privacyStatus: 'private',
      madeForKids: undefined as any,
    },
  });
  assert(missingKidsResult.errorCode === 'MISSING_MADE_FOR_KIDS', 'Missing madeForKids rejected');

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Quota Ledger & Reservation Lifecycle
  // ---------------------------------------------------------------------------
  console.log('\nGroup 5: Quota Ledger & Reservation Lifecycle');

  const todayStr = new Date().toISOString().slice(0, 10);
  const initialQuota = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', todayStr);

  assert(initialQuota.dailyLimit === 100, 'Project-level quota dailyLimit is 100 uploads');
  assert(initialQuota.availableCount === 100, 'Initial available upload count is 100');

  // Reserve quota
  const reservationResult = sprint1Storage.reserveYouTubeQuota('ws_mantri', 'post_yt_01', 'tgt_yt_01', mantriYt!.id, todayStr);
  assert(reservationResult.success === true, 'Quota reservation created successfully');
  assert(reservationResult.reservation?.status === 'RESERVED', 'Reservation status is RESERVED');

  const afterReserveQuota = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', todayStr);
  assert(afterReserveQuota.reservedCount === 1, 'Quota reservedCount incremented to 1');
  assert(afterReserveQuota.availableCount === 99, 'Available count reduced to 99');

  // Cancel post releases reservation
  sprint1Storage.releaseYouTubeQuota('tgt_yt_01');
  const afterReleaseQuota = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', todayStr);
  assert(afterReleaseQuota.reservedCount === 0, 'Quota reservedCount decremented back to 0 on release');
  assert(afterReleaseQuota.availableCount === 100, 'Available count restored to 100');

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Worker Live Video Upload Execution
  // ---------------------------------------------------------------------------
  console.log('\nGroup 6: Worker Live Video Upload Execution');

  googleYouTubePublisherAdapter.setSimulatedScenario('SUCCESS');

  // Reserve quota for post
  sprint1Storage.reserveYouTubeQuota('ws_mantri', 'post_yt_live', 'tgt_yt_live_01', mantriYt!.id, todayStr);

  const youtubePost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Sky Villa Walkthrough Video',
    draftContentJson: {
      version: '1.0',
      source: 'manual_upload',
      caption: 'Exclusive 4K walkthrough of our premier sky villas. #luxury #realestate',
      hashtags: ['luxury', 'realestate'],
    },
    mediaAssets: [createTestVideoAsset('med_yt_vid_01', 'sky_villa_walkthrough.mp4', 'video/mp4', 1024 * 1024 * 15)],
    targets: [
      {
        id: 'tgt_yt_live_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.YOUTUBE,
        publishMode: 'LIVE_GOOGLE',
        socialAccountId: mantriYt!.id,
        platformOptionsJson: {
          title: 'Sky Villa Walkthrough Video | Mantri Developers',
          description: 'Exclusive 4K walkthrough of our premier sky villas.',
          privacyStatus: 'private',
          categoryId: '22',
          tags: ['real estate', 'luxury'],
          madeForKids: false,
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

  assert(workerRunResult.claimedTargets === 1, 'Worker claimed 1 due YouTube target');
  assert(workerRunResult.succeeded === 1, 'Worker successfully uploaded YouTube video');

  const refreshedPost = sprint1Storage.getPostById(youtubePost.id);
  const ytTarget = refreshedPost?.targets.find((t) => t.id === 'tgt_yt_live_01');

  assert(ytTarget?.status === SocialSchedulerTargetStatus.PUBLISHED, 'Target transitioned to PUBLISHED');
  assert(!!ytTarget?.externalPostId?.startsWith('yt_'), 'YouTube video ID generated');
  assert(!!ytTarget?.externalPostUrl?.includes('youtube.com/watch?v='), 'YouTube watch URL generated');
  assert(refreshedPost?.status === SocialSchedulerPostStatus.PUBLISHED, 'Parent post status is PUBLISHED');

  // Verify YouTubeUploadJob was recorded
  const ytJob = sprint1Storage.getYouTubeUploadJob('tgt_yt_live_01');
  assert(!!ytJob, 'YouTubeUploadJob recorded in storage');
  assert(ytJob?.uploadStatus === 'PUBLISHED', 'Upload job status is PUBLISHED');
  assert(ytJob?.youtubeVideoId === ytTarget?.externalPostId, 'Upload job video ID matches target external ID');

  // Verify quota consumption
  const afterPublishQuota = sprint1Storage.getYouTubeQuotaSummary('ws_mantri', todayStr);
  assert(afterPublishQuota.usedCount === 1, 'Quota usedCount incremented to 1');
  assert(afterPublishQuota.reservedCount === 0, 'Quota reservedCount decremented to 0');

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Unverified Project Private Viewing Mode Restriction
  // ---------------------------------------------------------------------------
  console.log('\nGroup 7: Unverified Project Private Viewing Mode');

  googleYouTubePublisherAdapter.setSimulatedScenario('PRIVATE_RESTRICTED');

  const privateRestrictedPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Unverified Project Upload Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Testing unverified privacy', hashtags: [] },
    mediaAssets: [createTestVideoAsset('med_yt_vid_02', 'tour.mp4', 'video/mp4', 1024 * 1024 * 5)],
    targets: [
      {
        id: 'tgt_yt_priv_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.YOUTUBE,
        publishMode: 'LIVE_GOOGLE',
        socialAccountId: mantriYt!.id,
        platformOptionsJson: {
          title: 'Unverified Project Upload',
          description: 'Testing private restricted mode',
          privacyStatus: 'public', // User requested public, but project is unverified
          madeForKids: false,
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedPrivPost = sprint1Storage.getPostById(privateRestrictedPost.id);
  const privTarget = refreshedPrivPost?.targets.find((t) => t.id === 'tgt_yt_priv_01');

  assert(privTarget?.status === SocialSchedulerTargetStatus.PRIVATE_RESTRICTED, 'Target transitioned to PRIVATE_RESTRICTED');
  assert(!!privTarget?.externalPostId?.startsWith('yt_priv_'), 'Private restricted video ID generated');
  assert(refreshedPrivPost?.status === SocialSchedulerPostStatus.PUBLISHED, 'Parent post considered published');

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Quota Exhaustion Handling
  // ---------------------------------------------------------------------------
  console.log('\nGroup 8: Quota Exhaustion Handling');

  googleYouTubePublisherAdapter.setSimulatedScenario('QUOTA_EXCEEDED');

  const quotaExhaustedPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Quota Blocked Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Quota limit test', hashtags: [] },
    mediaAssets: [createTestVideoAsset('med_yt_vid_03', 'clip.mp4', 'video/mp4', 1024 * 1024)],
    targets: [
      {
        id: 'tgt_yt_quota_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.YOUTUBE,
        publishMode: 'LIVE_GOOGLE',
        socialAccountId: mantriYt!.id,
        platformOptionsJson: {
          title: 'Quota Blocked Upload',
          description: 'Testing quota block',
          privacyStatus: 'private',
          madeForKids: false,
        },
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
    scheduledAt: new Date(Date.now() - 10000).toISOString(),
    timezone: 'Asia/Kolkata',
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  await workerService.processDueTargets({ workspaceId: 'ws_mantri', limit: 5 });

  const refreshedQuotaPost = sprint1Storage.getPostById(quotaExhaustedPost.id);
  const quotaTarget = refreshedQuotaPost?.targets.find((t) => t.id === 'tgt_yt_quota_01');

  assert(quotaTarget?.status === SocialSchedulerTargetStatus.QUOTA_BLOCKED, 'Target marked QUOTA_BLOCKED upon quota exceeded');
  assert(quotaTarget?.lastErrorCode === 'YOUTUBE_QUOTA_EXCEEDED', 'ErrorCode is YOUTUBE_QUOTA_EXCEEDED');
  assert(quotaTarget?.nextRetryAt === null, 'No immediate retry for daily quota block');

  // ---------------------------------------------------------------------------
  // TEST GROUP 9: Session Expiry & REAUTH_REQUIRED (HTTP 401)
  // ---------------------------------------------------------------------------
  console.log('\nGroup 9: Session Expiry & REAUTH_REQUIRED (HTTP 401)');

  googleYouTubePublisherAdapter.setSimulatedScenario('EXPIRED_TOKEN');

  const reauthPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Expired Google Token Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Expired token test', hashtags: [] },
    mediaAssets: [createTestVideoAsset('med_yt_vid_04', 'clip.mp4', 'video/mp4', 1024 * 1024)],
    targets: [
      {
        id: 'tgt_yt_reauth_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.YOUTUBE,
        publishMode: 'LIVE_GOOGLE',
        socialAccountId: mantriYt!.id,
        platformOptionsJson: {
          title: 'Reauth Upload',
          description: 'Reauth test',
          privacyStatus: 'private',
          madeForKids: false,
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
  const reauthTarget = refreshedReauthPost?.targets.find((t) => t.id === 'tgt_yt_reauth_01');
  const refreshedMantriYt = sprint1Storage.getSocialAccountById(mantriYt!.id);

  assert(reauthTarget?.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED, 'Target marked as REAUTH_REQUIRED');
  assert(refreshedReauthPost?.status === SocialSchedulerPostStatus.REAUTH_REQUIRED, 'Parent post recalculated to REAUTH_REQUIRED');

  // Restore account status
  sprint1Storage.updateSocialAccount(mantriYt!.id, 'ws_mantri', { status: SocialAccountStatus.CONNECTED });

  // ---------------------------------------------------------------------------
  // TEST GROUP 10: Zero-Token Sanitization & Disconnection Guard
  // ---------------------------------------------------------------------------
  console.log('\nGroup 10: Zero-Token Sanitization & Disconnection Integrity');

  const allAttempts = sprint1Storage.getAttempts();
  const ytAttempts = allAttempts.filter((a) => a.platform === SocialSchedulerPlatform.YOUTUBE);

  assert(ytAttempts.length > 0, 'Publish attempts exist for YouTube targets');

  let leakedToken = false;
  let leakedPresignedUrl = false;

  for (const att of ytAttempts) {
    const reqStr = JSON.stringify(att.requestJson || {});
    const resStr = JSON.stringify(att.responseJson || {});
    const diagStr = JSON.stringify(att.diagnosticsJson || {});

    if (reqStr.includes('ya29.') || resStr.includes('ya29.') || diagStr.includes('ya29.')) {
      leakedToken = true;
    }
    if (reqStr.includes('X-Amz-Signature') || diagStr.includes('X-Amz-Signature')) {
      leakedPresignedUrl = true;
    }
  }

  assert(!leakedToken, 'Zero-token guarantee: No Google access token found in attempt history');
  assert(!leakedPresignedUrl, 'Zero-token guarantee: No raw signed B2 URL persisted in database JSON logs');

  // Disconnection test
  sprint1Storage.updateSocialAccount(mantriYt!.id, 'ws_mantri', { status: SocialAccountStatus.DISCONNECTED });
  googleYouTubePublisherAdapter.setSimulatedScenario('SUCCESS');

  const disconnectedPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Disconnected Account Post',
    draftContentJson: { version: '1.0', source: 'manual_upload', caption: 'Disconnected test', hashtags: [] },
    mediaAssets: [createTestVideoAsset('med_yt_vid_05', 'clip.mp4', 'video/mp4', 1024 * 1024)],
    targets: [
      {
        id: 'tgt_yt_disc_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.YOUTUBE,
        publishMode: 'LIVE_GOOGLE',
        socialAccountId: mantriYt!.id,
        platformOptionsJson: {
          title: 'Disconnected Upload',
          description: 'Disconnected test',
          privacyStatus: 'private',
          madeForKids: false,
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
  const discTarget = refreshedDiscPost?.targets.find((t) => t.id === 'tgt_yt_disc_01');

  assert(discTarget?.status === SocialSchedulerTargetStatus.FAILED, 'Disconnected YouTube account publish immediately FAILED');
  assert(discTarget?.lastErrorCode === 'SOCIAL_ACCOUNT_DISCONNECTED', 'ErrorCode is SOCIAL_ACCOUNT_DISCONNECTED');
  assert(discTarget?.nextRetryAt === null, 'No retry scheduled for disconnected account');

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`SPRINT 6 VERIFICATION RESULTS: ${passedCount} / ${results.length} PASSED`);
  if (failedCount > 0) {
    console.error(`FAILED TESTS (${failedCount}):`);
    results.filter((r) => !r.passed).forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('ALL SPRINT 6 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
    console.log('================================================================');
  }
}

runSprint6Verification().catch((err) => {
  console.error('Fatal error during Sprint 6 verification:', err);
  process.exit(1);
});
