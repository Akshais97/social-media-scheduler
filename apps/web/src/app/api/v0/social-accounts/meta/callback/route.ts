import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault, DiscoveredMetaPage } from '@/lib/credential-vault';

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

    let discoveredPages: DiscoveredMetaPage[] = [];

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';

    if (metaAppId && metaAppSecret && !code.startsWith('mock_')) {
      // Live Meta Graph API code exchange & page discovery
      const redirectUri =
        process.env.META_REDIRECT_URI ||
        new URL('/api/v0/social-accounts/meta/callback', request.url).toString();

      const tokenUrl = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
      tokenUrl.searchParams.set('client_id', metaAppId);
      tokenUrl.searchParams.set('client_secret', metaAppSecret);
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);

      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        return NextResponse.redirect(
          new URL(`/app/social-accounts?error=${encodeURIComponent(tokenData.error?.message || 'Token exchange failed')}`, request.url)
        );
      }

      // Fetch user's managed Facebook Pages
      const accountsRes = await fetch(
        `https://graph.facebook.com/${graphVersion}/me/accounts?access_token=${tokenData.access_token}&fields=id,name,category,access_token,tasks`
      );
      const accountsData = await accountsRes.json();

      if (accountsData.data && Array.isArray(accountsData.data)) {
        discoveredPages = accountsData.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          accessToken: item.access_token,
          tasks: item.tasks,
        }));
      }
    } else {
      // Sandbox / development mock discovery
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      discoveredPages = [
        {
          id: `${Date.now()}${randomSuffix}`,
          name: `${workspaceName} Official Page`,
          category: 'Real Estate / Developer',
          accessToken: `EAABmockDiscoveredToken${workspaceId}${Date.now()}`,
          tasks: ['MANAGE', 'CREATE_CONTENT', 'MODERATE'],
        },
        {
          id: `${Date.now() + 1}${randomSuffix}`,
          name: `${workspaceName} Luxury Living Showcase`,
          category: 'Brand / Architecture',
          accessToken: `EAABmockDiscoveredTokenShowcase${workspaceId}${Date.now()}`,
          tasks: ['MANAGE', 'CREATE_CONTENT'],
        },
      ];
    }

    // Save pending discovery session in vault
    const connectionId = credentialVault.savePendingConnection({
      workspaceId,
      userId,
      provider: 'META',
      pages: discoveredPages,
    });

    return NextResponse.redirect(
      new URL(
        `/app/social-accounts/meta/select-pages?connectionId=${connectionId}&workspaceId=${workspaceId}`,
        request.url
      )
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Meta OAuth callback failed';
    return NextResponse.redirect(
      new URL(`/app/social-accounts?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
