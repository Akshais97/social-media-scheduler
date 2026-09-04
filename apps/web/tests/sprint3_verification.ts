import {
  SocialSchedulerPostStatus,
  SocialSchedulerMediaStatus,
  SocialSchedulerTargetStatus,
  SocialPublishAttemptStatus,
  SocialSchedulerPlatform,
  SocialAccountProvider,
  SocialAccountType,
  SocialAccountStatus,
  DraftContentJson,
  Sprint1ScheduledPost,
} from '../src/types/scheduler';
import { sprint1Storage } from '../src/lib/mock-storage';
import { workerService } from '../src/lib/worker-service';
import { credentialVault, encryptSecret, decryptSecret, sanitizePayload } from '../src/lib/credential-vault';
import { metaFacebookPagePublisherAdapter } from '../src/lib/meta-facebook-page-adapter';

let passed = 0;
let failed = 0;

function assert(condition: unknown, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runSprint3Tests() {
  console.log('====================================================');
  console.log('Running Sprint 3 Functional Verification Test Suite');
  console.log('====================================================\n');

  // Reset storage for clean test run
  sprint1Storage.resetForTest();
  credentialVault.clear();

  // --- 1. Encryption & Credential Vault Tests ---
  console.log('--- 1. Encryption & Credential Vault Security ---');
  const rawToken = 'EAABmockTokenSecret1234567890MetaPage';
  const encrypted = encryptSecret(rawToken);
  assert(encrypted !== rawToken, 'Encrypted secret is not plain text');
  assert(!encrypted.includes('EAAB'), 'Encrypted secret does not leak token prefix');

  const decrypted = decryptSecret(encrypted);
  assert(decrypted === rawToken, 'Decrypted secret matches original raw token');

  const credRef = credentialVault.storeToken(rawToken, {
    tokenType: 'page_access_token',
    metadata: { pageId: 'fb_page_1001' },
  });
  assert(credRef.startsWith('cred_'), 'Credential ref format is opaque pointer');
  assert(credentialVault.getToken(credRef) === rawToken, 'Credential vault retrieves valid decrypted token');

  // --- 2. OAuth CSRF State & Workspace Binding Tests ---
  console.log('\n--- 2. OAuth CSRF State & Workspace Binding ---');
  const { state, record } = sprint1Storage.createOAuthState({
    workspaceId: 'ws_mantri',
    userId: 'usr_admin',
    provider: SocialAccountProvider.META,
    redirectPath: '/app/social-accounts',
  });
  assert(record.workspaceId === 'ws_mantri', 'OAuth state record bound to ws_mantri');
  assert(record.consumedAt === null, 'OAuth state initially unconsumed');

  // Test tampered state
  const tamperedResult = sprint1Storage.verifyAndConsumeOAuthState('invalid_tampered_state');
  assert(!tamperedResult.valid, 'Tampered or unknown state is rejected');

  // Test cross-workspace consumption
  const crossWsResult = sprint1Storage.verifyAndConsumeOAuthState(state, 'ws_sobha');
  assert(!crossWsResult.valid, 'Cross-workspace OAuth state consumption is blocked');

  // Test valid consumption
  const validResult = sprint1Storage.verifyAndConsumeOAuthState(state, 'ws_mantri');
  assert(validResult.valid && validResult.oauthState?.consumedAt !== null, 'Valid OAuth state consumed successfully');

  // Test double consumption prevention
  const doubleConsumeResult = sprint1Storage.verifyAndConsumeOAuthState(state, 'ws_mantri');
  assert(!doubleConsumeResult.valid, 'Double consumption of OAuth state is blocked');

  // --- 3. Social Account Storage & Isolation Tests ---
  console.log('\n--- 3. Social Account Storage & Workspace Isolation ---');
  const mantriPageToken = 'EAABmantriLiveToken2026Page';
  const mantriCredRef = credentialVault.storeToken(mantriPageToken);

  const mantriAccount = sprint1Storage.createOrUpdateSocialAccount({
    workspaceId: 'ws_mantri',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    displayName: 'Mantri Developers Official Page',
    externalAccountId: '109283745612345',
    credentialRef: mantriCredRef,
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
  });

  assert(mantriAccount.status === SocialAccountStatus.CONNECTED, 'Account created with CONNECTED status');
  assert(mantriAccount.externalAccountIdMasked?.includes('••••'), 'External account ID is masked');
  assert(!(mantriAccount as any).accessToken, 'Account record does NOT store plain access token');

  const sobhaPageToken = 'EAABsobhaLiveToken2026Page';
  const sobhaCredRef = credentialVault.storeToken(sobhaPageToken);

  sprint1Storage.createOrUpdateSocialAccount({
    workspaceId: 'ws_sobha',
    connectedByUserId: 'usr_admin',
    provider: SocialAccountProvider.META,
    platform: SocialSchedulerPlatform.FACEBOOK,
    accountType: SocialAccountType.FACEBOOK_PAGE,
    displayName: 'Sobha Signature Living',
    externalAccountId: '987654321098765',
    credentialRef: sobhaCredRef,
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
  });

  const mantriAccounts = sprint1Storage.getSocialAccounts('ws_mantri');
  const sobhaAccounts = sprint1Storage.getSocialAccounts('ws_sobha');
  assert(mantriAccounts.every((a) => a.workspaceId === 'ws_mantri'), 'ws_mantri query returns only Mantri accounts');
  assert(sobhaAccounts.every((a) => a.workspaceId === 'ws_sobha'), 'ws_sobha query returns only Sobha accounts');
  assert(!mantriAccounts.some((a) => a.id.includes('sobha')), 'Zero cross-tenant social account leak');

  // --- 4. Target Validation & Saving Tests ---
  console.log('\n--- 4. Target Configuration & Saving ---');
  const draftJson: DraftContentJson = {
    version: '1.0',
    source: 'manual_upload',
    postTitle: 'Live Meta Test Post',
    caption: 'Discover luxury living at Mantri Signature Villas. #LuxuryLiving',
    hashtags: ['LuxuryLiving'],
    media: [{ mediaAssetId: 'asset_mantri_01', role: 'primary', order: 0 }],
  };

  const testPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Live Facebook Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 60000).toISOString(), // Due now
    status: SocialSchedulerPostStatus.SCHEDULED,
    mediaAssets: [
      {
        id: 'asset_mantri_01',
        workspaceId: 'ws_mantri',
        uploadedByUserId: 'usr_admin',
        originalFileName: 'villa.jpg',
        safeFileName: 'villa.jpg',
        mimeType: 'image/jpeg',
        byteSize: 2048000,
        bucket: 'sakhaa-forge-clean-media',
        objectKey: 'workspaces/ws_mantri/villa.jpg',
        status: SocialSchedulerMediaStatus.UPLOADED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    targets: [
      {
        id: 'tgt_fb_live_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        publishMode: 'LIVE_META',
        socialAccountId: mantriAccount.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  assert(testPost.targets[0].publishMode === 'LIVE_META', 'Target saved with publishMode: LIVE_META');
  assert(testPost.targets[0].socialAccountId === mantriAccount.id, 'Target saved with linked socialAccountId');

  // --- 5. Live Meta Publishing Execution Tests ---
  console.log('\n--- 5. Worker Live Meta Publishing Execution ---');
  metaFacebookPagePublisherAdapter.setSimulatedScenario('SUCCESS');

  const workerResult = await workerService.processDueTargets({
    workspaceId: 'ws_mantri',
    limit: 10,
  });

  assert(workerResult.succeeded === 1, 'Worker successfully published live Meta target');

  const updatedPost = sprint1Storage.getPostById(testPost.id)!;
  const updatedTarget = updatedPost.targets[0];
  assert(updatedTarget.status === SocialSchedulerTargetStatus.PUBLISHED, 'Target transitioned to PUBLISHED');
  assert(!!updatedTarget.externalPostId, 'Target stored externalPostId');
  assert(updatedTarget.externalPostUrl?.includes('facebook.com'), 'Target stored Facebook permalink URL');
  assert(updatedPost.status === SocialSchedulerPostStatus.PUBLISHED, 'Parent post recalculated to PUBLISHED');

  const attempts = sprint1Storage.getAttempts(testPost.id);
  assert(attempts.length === 1, 'Exactly one publish attempt logged');
  assert(attempts[0].status === SocialPublishAttemptStatus.SUCCEEDED, 'Attempt status is SUCCEEDED');
  assert(attempts[0].provider === SocialAccountProvider.META, 'Attempt provider marked as META');
  assert(attempts[0].socialAccountId === mantriAccount.id, 'Attempt links socialAccountId');

  // --- 6. Payload Sanitization & Token Leak Prevention Tests ---
  console.log('\n--- 6. Payload Sanitization & Security ---');
  const dirtyPayload = {
    accessToken: 'EAABsecretMetaAccessToken1234567890',
    headers: { Authorization: 'Bearer EAABsecretMetaAccessToken1234567890' },
    url: 'https://graph.facebook.com/v23.0/me?access_token=EAABsecretMetaAccessToken1234567890',
    client_secret: 'superSecretMetaAppSecret',
    safeData: 'Mantri Luxury Homes',
  };

  const cleanPayload = sanitizePayload(dirtyPayload);
  assert(cleanPayload.accessToken === '[REDACTED]', 'Access token object key is redacted');
  assert(!JSON.stringify(cleanPayload).includes('EAABsecretMetaAccessToken1234567890'), 'Zero raw token leaks in JSON');
  assert(cleanPayload.safeData === 'Mantri Luxury Homes', 'Non-sensitive data preserved');

  const attemptJsonStr = JSON.stringify(attempts[0]);
  assert(!attemptJsonStr.includes('EAAB'), 'Zero Meta access tokens in logged attempt JSON');

  // --- 7. Re-auth Required & Error Classification Tests ---
  console.log('\n--- 7. Re-auth Required & Error Classification ---');
  // Create second post to test session expiration
  const reauthPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Reauth Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 60000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    mediaAssets: testPost.mediaAssets,
    targets: [
      {
        id: 'tgt_fb_reauth_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        publishMode: 'LIVE_META',
        socialAccountId: mantriAccount.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  metaFacebookPagePublisherAdapter.setSimulatedScenario('EXPIRED_TOKEN');

  await workerService.processDueTargets({ workspaceId: 'ws_mantri' });

  const postAfterReauth = sprint1Storage.getPostById(reauthPost.id)!;
  const targetAfterReauth = postAfterReauth.targets[0];
  assert(targetAfterReauth.status === SocialSchedulerTargetStatus.REAUTH_REQUIRED, 'Target transitioned to REAUTH_REQUIRED');
  assert(postAfterReauth.status === SocialSchedulerPostStatus.REAUTH_REQUIRED, 'Parent post recalculated to REAUTH_REQUIRED');

  const accountAfterReauth = sprint1Storage.getSocialAccountById(mantriAccount.id)!;
  assert(accountAfterReauth.status === SocialAccountStatus.REAUTH_REQUIRED, 'SocialAccount marked as REAUTH_REQUIRED');

  // --- 8. Transient Rate Limit Retry Tests ---
  console.log('\n--- 8. Rate Limit & Transient Retry Handling ---');
  const retryPost = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Retry Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 60000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    mediaAssets: testPost.mediaAssets,
    targets: [
      {
        id: 'tgt_fb_retry_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        publishMode: 'LIVE_META',
        socialAccountId: mantriAccount.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  // Re-connect account after reauth test
  sprint1Storage.updateSocialAccount(mantriAccount.id, 'ws_mantri', {
    status: SocialAccountStatus.CONNECTED,
  });

  metaFacebookPagePublisherAdapter.setSimulatedScenario('RATE_LIMIT');

  await workerService.processDueTargets({ workspaceId: 'ws_mantri' });

  const postAfterRateLimit = sprint1Storage.getPostById(retryPost.id)!;
  const targetAfterRateLimit = postAfterRateLimit.targets[0];
  assert(targetAfterRateLimit.status === SocialSchedulerTargetStatus.RETRYING, 'Rate limit error transitions target to RETRYING');
  assert(!!targetAfterRateLimit.nextRetryAt, 'Target has nextRetryAt scheduled');
  assert(postAfterRateLimit.status === SocialSchedulerPostStatus.RETRYING, 'Parent post recalculated to RETRYING');

  // --- 9. Account Disconnection Tests ---
  console.log('\n--- 9. Account Disconnect Workflow ---');
  const disconnected = sprint1Storage.disconnectSocialAccount(mantriAccount.id, 'ws_mantri');
  assert(disconnected?.status === SocialAccountStatus.DISCONNECTED, 'Account marked DISCONNECTED');
  assert(!!disconnected?.disconnectedAt, 'Disconnected timestamp recorded');

  // Attempt to publish with disconnected account
  const postWithDisconnected = sprint1Storage.createDraftPost({
    workspaceId: 'ws_mantri',
    title: 'Disconnected Post Test',
    draftContentJson: draftJson,
    scheduledAt: new Date(Date.now() - 60000).toISOString(),
    status: SocialSchedulerPostStatus.SCHEDULED,
    mediaAssets: testPost.mediaAssets,
    targets: [
      {
        id: 'tgt_fb_disc_01',
        postId: '',
        workspaceId: 'ws_mantri',
        platform: SocialSchedulerPlatform.FACEBOOK,
        publishMode: 'LIVE_META',
        socialAccountId: mantriAccount.id,
        status: SocialSchedulerTargetStatus.SCHEDULED,
      },
    ],
  });

  metaFacebookPagePublisherAdapter.setSimulatedScenario(undefined); // Reset scenario
  await workerService.processDueTargets({ workspaceId: 'ws_mantri' });

  const postAfterDisc = sprint1Storage.getPostById(postWithDisconnected.id)!;
  assert(postAfterDisc.targets[0].status === SocialSchedulerTargetStatus.FAILED, 'Publishing to disconnected account fails immediately');
  assert(postAfterDisc.targets[0].lastErrorCode === 'SOCIAL_ACCOUNT_DISCONNECTED', 'Failure reason is SOCIAL_ACCOUNT_DISCONNECTED');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprint3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
