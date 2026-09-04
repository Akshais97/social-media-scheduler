import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { SocialAccountProvider } from '@/types/scheduler';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;
    const returnPath = body.returnPath || '/app/social-accounts';

    // 1. Generate CSRF OAuth State bound to workspace
    const { state } = sprint1Storage.createOAuthState({
      workspaceId,
      userId: 'usr_admin',
      provider: SocialAccountProvider.META,
      redirectPath: returnPath,
    });

    const metaAppId = process.env.META_APP_ID;
    const graphVersion = process.env.META_GRAPH_VERSION || 'v23.0';
    const redirectUri =
      process.env.META_REDIRECT_URI ||
      new URL('/api/v0/social-accounts/meta/callback', request.url).toString();

    let redirectUrl: string;

    if (metaAppId && metaAppId !== 'placeholder') {
      const scopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'].join(',');
      redirectUrl = `https://www.facebook.com/${graphVersion}/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${state}&scope=${scopes}&response_type=code`;
    } else {
      // Local development/sandbox bypass: redirect directly to our callback endpoint
      const callbackUrl = new URL('/api/v0/social-accounts/meta/callback', request.url);
      callbackUrl.searchParams.set('code', 'mock_meta_code_dev');
      callbackUrl.searchParams.set('state', state);
      redirectUrl = callbackUrl.toString();
    }

    return NextResponse.json({
      success: true,
      state,
      redirectUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start Meta connection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
