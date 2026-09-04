import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { SocialAccountProvider } from '@/types/scheduler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, returnPath = '/app/social-accounts' } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const userId = 'usr_admin';

    // 1. Generate single-use CSRF state bound to workspace, user, and GOOGLE provider
    const { state } = sprint1Storage.createOAuthState({
      workspaceId,
      userId,
      provider: SocialAccountProvider.GOOGLE,
      redirectPath: returnPath,
    });

    // 2. Build Google OAuth authorization URL
    const clientId = process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id_2026';
    const redirectUri =
      process.env.GOOGLE_YOUTUBE_REDIRECT_URI ||
      'http://localhost:3000/api/v0/social-accounts/google/youtube/callback';

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      state,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
