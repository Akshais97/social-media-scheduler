import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sprint1Storage } from '@/lib/mock-storage';
import { SocialAccountProvider } from '@/types/scheduler';

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, returnPath = '/app/social-accounts' } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const userId = 'usr_admin';

    // 1. Generate PKCE Code Verifier & Challenge
    const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
    const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

    // 2. Generate single-use CSRF state bound to workspace, user, and X provider
    const { state } = sprint1Storage.createOAuthState({
      workspaceId,
      userId,
      provider: SocialAccountProvider.X,
      redirectPath: returnPath,
    });

    // 3. Build Twitter/X OAuth 2.0 PKCE authorization URL
    const clientId = process.env.X_CLIENT_ID || 'mock_x_client_id_2026';
    const redirectUri =
      process.env.X_REDIRECT_URI ||
      'http://localhost:3000/api/v0/social-accounts/x/callback';

    const scopes = [
      'tweet.read',
      'tweet.write',
      'users.read',
      'media.write',
      'offline.access',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const redirectUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

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
