import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import {
  SocialAccountProvider,
  SocialSchedulerPlatform,
  SocialAccountType,
  SocialAccountStatus,
} from '@/types/scheduler';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectBase = '/app/social-accounts';

  if (error) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=youtube&error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=youtube&error=missing_code_or_state`, req.url)
    );
  }

  // 1. Verify and consume CSRF state
  const stateValidation = sprint1Storage.verifyAndConsumeOAuthState(state);
  if (!stateValidation.valid || !stateValidation.oauthState) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=youtube&error=invalid_or_expired_state`, req.url)
    );
  }

  const { workspaceId, userId } = stateValidation.oauthState;

  try {
    // 2. Mock / exchange Google code for tokens
    const mockChannelId = `UC_channel_${Date.now()}`;
    const mockChannelTitle = 'Workspace YouTube Channel';
    const mockChannelHandle = '@workspacechannel';
    const mockAccessToken = `ya29.liveGoogleToken_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 3. Store encrypted token in Credential Vault
    const credentialRef = credentialVault.storeToken(mockAccessToken, {
      tokenType: 'bearer',
      metadata: {
        channelId: mockChannelId,
        channelTitle: mockChannelTitle,
        workspaceId,
        grantedAt: new Date().toISOString(),
      },
    });

    // 4. Create or update SocialAccount
    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    const existing = accounts.find(
      (a) => a.provider === SocialAccountProvider.GOOGLE && a.externalAccountId === mockChannelId
    );

    const account = sprint1Storage.createOrUpdateSocialAccount({
      id: existing ? existing.id : `acc_yt_${workspaceId}_${Date.now()}`,
      workspaceId,
      connectedByUserId: userId,
      provider: SocialAccountProvider.GOOGLE,
      platform: SocialSchedulerPlatform.YOUTUBE,
      accountType: SocialAccountType.YOUTUBE_CHANNEL,
      displayName: mockChannelTitle,
      username: mockChannelHandle,
      externalAccountId: mockChannelId,
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      credentialRef,
      metadataJson: {
        auditStatus: process.env.YOUTUBE_AUDIT_STATUS || 'unverified',
        supportsVideoUpload: true,
        publicUploadsAllowed: false,
        defaultPrivacyStatus: 'private',
      },
    });

    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=youtube&connected=true&accountId=${account.id}`, req.url)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown callback error';
    return NextResponse.redirect(
      new URL(`${redirectBase}?provider=youtube&error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
