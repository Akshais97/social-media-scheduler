import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import {
  SocialAccountProvider,
  SocialSchedulerPlatform,
  SocialAccountType,
} from '@/types/scheduler';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectBase = '/app/social-accounts';

  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=x&error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=x&error=missing_code_or_state`, req.url)
    );
  }

  // 1. Verify and consume CSRF state
  const stateValidation = sprint1Storage.verifyAndConsumeOAuthState(state);
  if (!stateValidation.valid || !stateValidation.oauthState) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=x&error=invalid_or_expired_state`, req.url)
    );
  }

  const { workspaceId, userId } = stateValidation.oauthState;

  try {
    // 2. Mock / exchange X code for tokens with PKCE
    const mockXUserId = `1234567_${Date.now()}`;
    const mockDisplayName = 'Client Brand Official';
    const mockUsername = `clientbrand_${Date.now().toString().slice(-4)}`;
    const mockAccessToken = `mock_x_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 3. Store encrypted token in Credential Vault
    const credentialRef = credentialVault.storeToken(mockAccessToken, {
      tokenType: 'bearer',
      metadata: {
        xUserId: mockXUserId,
        username: mockUsername,
        workspaceId,
        grantedAt: new Date().toISOString(),
      },
    });

    // 4. Create or update SocialAccount
    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    const existing = accounts.find(
      (a) => a.provider === SocialAccountProvider.X && a.externalAccountId === mockXUserId
    );

    const account = sprint1Storage.createOrUpdateSocialAccount({
      id: existing ? existing.id : `acc_x_${workspaceId}_${Date.now()}`,
      workspaceId,
      connectedByUserId: userId,
      provider: SocialAccountProvider.X,
      platform: SocialSchedulerPlatform.X,
      accountType: SocialAccountType.X_USER,
      displayName: mockDisplayName,
      username: mockUsername,
      externalAccountId: mockXUserId,
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
      credentialRef,
      metadataJson: {
        paidPublishingEnabled: true,
        supportsTextPosts: true,
        supportsImagePosts: true,
        supportsVideoPosts: true,
        supportsGifPosts: false,
      },
    });

    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=x&connected=true&accountId=${account.id}`, req.url)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown callback error';
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=x&error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
