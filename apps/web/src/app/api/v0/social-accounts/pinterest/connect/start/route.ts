import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { SocialAccountProvider } from '@/types/scheduler';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;
    const returnPath = body.returnPath || '/app/social-accounts';

    // 1. Generate CSRF OAuth State bound to workspace & admin
    const { state } = sprint1Storage.createOAuthState({
      workspaceId,
      userId: 'usr_admin',
      provider: SocialAccountProvider.PINTEREST,
      redirectPath: returnPath,
    });

    const pinterestAppId = process.env.PINTEREST_APP_ID;
    const redirectUri =
      process.env.PINTEREST_REDIRECT_URI ||
      new URL('/api/v0/social-accounts/pinterest/callback', request.url).toString();

    let redirectUrl: string;

    if (pinterestAppId && pinterestAppId !== 'placeholder') {
      const scopes = ['user_accounts:read', 'boards:read', 'pins:read', 'pins:write'].join(',');
      redirectUrl = `https://www.pinterest.com/oauth/?client_id=${pinterestAppId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
    } else {
      // Sandbox/Dev bypass
      const callbackUrl = new URL('/api/v0/social-accounts/pinterest/callback', request.url);
      callbackUrl.searchParams.set('code', 'mock_pinterest_code_dev');
      callbackUrl.searchParams.set('state', state);
      redirectUrl = callbackUrl.toString();
    }

    return NextResponse.json({
      success: true,
      state,
      redirectUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to start Pinterest connection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
