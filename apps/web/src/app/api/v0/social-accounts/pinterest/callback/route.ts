import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import {
  SocialAccountProvider,
  SocialSchedulerPlatform,
  SocialAccountType,
  SocialAccountStatus,
} from '@/types/scheduler';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error_description') || url.searchParams.get('error');

    if (errorParam) {
      return NextResponse.redirect(
        new URL(`/app/social-accounts?error=${encodeURIComponent(errorParam)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/app/social-accounts?error=Missing+code+or+state+parameter', request.url)
      );
    }

    // 1. Verify and consume OAuth CSRF state
    const validation = sprint1Storage.verifyAndConsumeOAuthState(state);
    if (!validation.valid || !validation.oauthState) {
      return NextResponse.redirect(
        new URL(`/app/social-accounts?error=${encodeURIComponent(validation.error || 'Invalid OAuth state')}`, request.url)
      );
    }

    const { workspaceId, userId } = validation.oauthState;
    const ws = sprint1Storage.getWorkspaces().find((w) => w.id === workspaceId);
    const workspaceName = ws ? ws.name : 'Client Workspace';

    let accessToken = `pina_mockToken_${workspaceId}_${Date.now()}`;
    let pinterestUser = {
      username: ws?.id === 'ws_sobha' ? 'sobharealty' : 'mantridevelopers',
      displayName: ws?.id === 'ws_sobha' ? 'Sobha Signature Living' : 'Mantri Developers',
      id: ws?.id === 'ws_sobha' ? 'pin_usr_sobha_456' : 'pin_usr_mantri_123',
    };

    const pinterestAppId = process.env.PINTEREST_APP_ID;
    const pinterestAppSecret = process.env.PINTEREST_APP_SECRET;

    if (pinterestAppId && pinterestAppSecret && !code.startsWith('mock_')) {
      const redirectUri =
        process.env.PINTEREST_REDIRECT_URI ||
        new URL('/api/v0/social-accounts/pinterest/callback', request.url).toString();

      const basicAuth = Buffer.from(`${pinterestAppId}:${pinterestAppSecret}`).toString('base64');
      const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return NextResponse.redirect(
          new URL(`/app/social-accounts?error=${encodeURIComponent(tokenData.message || 'Pinterest token exchange failed')}`, request.url)
        );
      }

      accessToken = tokenData.access_token;

      // Query connected user account details
      const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        pinterestUser = {
          username: userData.username || pinterestUser.username,
          displayName: userData.business_name || userData.username || pinterestUser.displayName,
          id: userData.id || pinterestUser.id,
        };
      }
    }

    // 2. Secure Token Storage in Credential Vault
    const credentialRef = credentialVault.storeToken(accessToken, {
      tokenType: 'bearer',
      metadata: {
        workspaceId,
        userId,
        pinterestUserId: pinterestUser.id,
        username: pinterestUser.username,
      },
    });

    // 3. Save or Update SocialAccount
    const accounts = sprint1Storage.getSocialAccounts(workspaceId);
    const existing = accounts.find(
      (a) => a.provider === SocialAccountProvider.PINTEREST && a.externalAccountId === pinterestUser.id
    );

    const nowIso = new Date().toISOString();
    const account = sprint1Storage.createOrUpdateSocialAccount({
      id: existing ? existing.id : `acc_pin_${workspaceId}_${Date.now()}`,
      workspaceId,
      connectedByUserId: userId,
      provider: SocialAccountProvider.PINTEREST,
      platform: SocialSchedulerPlatform.PINTEREST,
      accountType: SocialAccountType.PINTEREST_ACCOUNT,
      displayName: pinterestUser.displayName,
      username: pinterestUser.username,
      externalAccountId: pinterestUser.id,
      scopes: ['user_accounts:read', 'boards:read', 'pins:read', 'pins:write'],
      credentialRef,
      metadataJson: {
        accessTier: process.env.PINTEREST_ACCESS_TIER || 'standard',
        boardCount: 2,
        supportsImagePins: true,
        supportsVideoPins: false,
      },
    });
    const accountId = account.id;

    // Ensure default boards exist
    const currentBoards = sprint1Storage.getPinterestBoards(workspaceId, accountId);
    if (currentBoards.length === 0) {
      sprint1Storage.createOrUpdatePinterestBoard({
        workspaceId,
        socialAccountId: accountId,
        externalBoardId: `board_ext_${Date.now()}_1`,
        name: `${workspaceName} Inspiration`,
        description: `Official inspirations for ${workspaceName}`,
        privacy: 'PUBLIC',
      });
      sprint1Storage.createOrUpdatePinterestBoard({
        workspaceId,
        socialAccountId: accountId,
        externalBoardId: `board_ext_${Date.now()}_2`,
        name: `${workspaceName} Property Walkthroughs`,
        description: `Detailed project walkthroughs and layouts`,
        privacy: 'PUBLIC',
      });
    }

    return NextResponse.redirect(
      new URL('/app/social-accounts?provider=pinterest&connected=true', request.url)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Pinterest OAuth callback failed';
    return NextResponse.redirect(
      new URL(`/app/social-accounts?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
