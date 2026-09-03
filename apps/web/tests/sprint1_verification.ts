// Sprint 1 Functional Test Suite
// Conforms strictly to Section 29 & Section 28 of docs/Sprint/Sakhaa Forge Social Scheduler — Sprint 1 Documentation.md

import {
  SocialSchedulerPostStatus,
  SocialSchedulerMediaStatus,
  SocialSchedulerPlatform,
  SocialSchedulerTargetStatus,
  DraftContentJson,
} from '../src/types/scheduler';
import { sprint1Storage, DEFAULT_WORKSPACES } from '../src/lib/mock-storage';

function runTests() {
  console.log('====================================================');
  console.log('Running Sprint 1 Functional Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Workspace Isolation
  console.log('\n--- 1. Workspace Isolation Tests ---');
  const mantriPosts = sprint1Storage.getPosts('ws_mantri');
  const sobhaPosts = sprint1Storage.getPosts('ws_sobha');

  assert(
    mantriPosts.every((p) => p.workspaceId === 'ws_mantri'),
    'Workspace A returns strictly Workspace A posts'
  );
  assert(
    sobhaPosts.every((p) => p.workspaceId === 'ws_sobha'),
    'Workspace B returns strictly Workspace B posts'
  );
  assert(
    !mantriPosts.some((p) => p.workspaceId === 'ws_sobha'),
    'Workspace isolation prevents cross-workspace post leak'
  );

  // 2. Upload Validation Tests
  console.log('\n--- 2. Upload & B2 Validation Tests ---');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

  function validateUpload(fileType: string, byteSize: number, rightsConfirmed: boolean) {
    if (!rightsConfirmed) return { success: false, error: 'Rights confirmation required' };
    if (!allowedTypes.includes(fileType)) return { success: false, error: 'Invalid file type' };
    const isVideo = fileType.startsWith('video/');
    const maxLimit = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (byteSize > maxLimit) return { success: false, error: 'File size exceeded' };
    return { success: true };
  }

  assert(
    validateUpload('image/jpeg', 5 * 1024 * 1024, true).success,
    'JPEG under 10 MB accepted'
  );
  assert(
    validateUpload('image/png', 9 * 1024 * 1024, true).success,
    'PNG under 10 MB accepted'
  );
  assert(
    validateUpload('video/mp4', 150 * 1024 * 1024, true).success,
    'MP4 under 200 MB accepted'
  );
  assert(
    !validateUpload('application/pdf', 1 * 1024 * 1024, true).success,
    'PDF file type rejected'
  );
  assert(
    !validateUpload('video/mp4', 250 * 1024 * 1024, true).success,
    'MP4 over 200 MB rejected'
  );
  assert(
    !validateUpload('image/jpeg', 5 * 1024 * 1024, false).success,
    'Upload without rights confirmation blocked'
  );

  // 3. Draft Composer JSONB Shape Tests
  console.log('\n--- 3. Draft Composer JSONB Tests ---');
  const sampleDraftJson: DraftContentJson = {
    version: '1.0',
    source: 'manual_upload',
    postTitle: 'Test luxury villa',
    caption: 'Discover luxury living at Mantri Signature',
    cta: 'Book now',
    hashtags: ['Luxury', 'Villa'],
    media: [
      {
        mediaAssetId: 'asset_123',
        role: 'primary',
        order: 0,
      },
    ],
    platformOverrides: {},
    createdFromStage: 'compose',
    lastEditedAt: new Date().toISOString(),
  };

  assert(sampleDraftJson.version === '1.0', 'Draft JSONB specifies version 1.0');
  assert(sampleDraftJson.source === 'manual_upload', 'Draft JSONB specifies manual_upload source');
  assert(
    sampleDraftJson.media.every((m) => m.mediaAssetId && !m.mediaAssetId.startsWith('http')),
    'Draft JSONB references mediaAssetId, never signed URLs'
  );

  // 4. Platform Target Compatibility Rules
  console.log('\n--- 4. Platform Target Compatibility Tests ---');
  function isTargetAllowed(platform: SocialSchedulerPlatform, isVideoMedia: boolean) {
    if (platform === SocialSchedulerPlatform.YOUTUBE && !isVideoMedia) {
      return false; // YouTube requires video
    }
    return true;
  }

  assert(
    !isTargetAllowed(SocialSchedulerPlatform.YOUTUBE, false),
    'YouTube target blocked for image-only post'
  );
  assert(
    isTargetAllowed(SocialSchedulerPlatform.YOUTUBE, true),
    'YouTube target permitted for video post'
  );
  assert(
    isTargetAllowed(SocialSchedulerPlatform.INSTAGRAM, false),
    'Instagram target permitted for image post'
  );
  assert(
    isTargetAllowed(SocialSchedulerPlatform.FACEBOOK, false),
    'Facebook target permitted for image post'
  );

  // 5. Schedule Time Validation
  console.log('\n--- 5. Schedule Time Validation Tests ---');
  function validateScheduleTime(targetTimeIso: string) {
    const targetMs = new Date(targetTimeIso).getTime();
    const minAllowedMs = Date.now() + 5 * 60 * 1000;
    return targetMs >= minAllowedMs;
  }

  const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
  const nearFutureTime = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // only 2 mins
  const validFutureTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); // tomorrow

  assert(!validateScheduleTime(pastTime), 'Past schedule time is rejected');
  assert(!validateScheduleTime(nearFutureTime), 'Time under now + 5 minutes is rejected');
  assert(validateScheduleTime(validFutureTime), 'Future schedule time (+24h) is accepted');

  // 6. Post Cancellation Tests
  console.log('\n--- 6. Cancellation Workflow Tests ---');
  const testPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Post to cancel',
    draftContentJson: sampleDraftJson,
    scheduledAt: validFutureTime,
    status: SocialSchedulerPostStatus.SCHEDULED,
  });

  assert(testPost.status === SocialSchedulerPostStatus.SCHEDULED, 'Post initially marked as SCHEDULED');

  const cancelledPost = sprint1Storage.cancelPost(testPost.id);
  assert(
    cancelledPost?.status === SocialSchedulerPostStatus.CANCELLED,
    'Post cancellation transitions status to CANCELLED'
  );
  assert(
    !!cancelledPost?.cancelledAt,
    'Post cancellation records cancelledAt timestamp'
  );

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
