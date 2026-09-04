import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;

    const accounts = sprint1Storage.getSocialAccounts(workspaceId);

    // Return sanitized accounts (tokens are never returned)
    const sanitized = accounts.map((acc) => ({
      id: acc.id,
      provider: acc.provider,
      platform: acc.platform,
      accountType: acc.accountType,
      displayName: acc.displayName,
      username: acc.username,
      externalAccountIdMasked: acc.externalAccountIdMasked || `${acc.externalAccountId.slice(0, 4)}••••${acc.externalAccountId.slice(-4)}`,
      status: acc.status,
      scopes: acc.scopes,
      lastConnectedAt: acc.lastConnectedAt,
      lastValidatedAt: acc.lastValidatedAt,
      disconnectedAt: acc.disconnectedAt,
    }));

    return NextResponse.json({ accounts: sanitized });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list social accounts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
