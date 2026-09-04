import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import {
  SocialAccountProvider,
  SocialSchedulerPlatform,
  SocialAccountType,
} from '@/types/scheduler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId query parameter is required' }, { status: 400 });
    }

    const pending = credentialVault.getPendingConnection(connectionId);
    if (!pending) {
      return NextResponse.json(
        { error: 'Connection session not found or expired. Please re-initiate connection.' },
        { status: 404 }
      );
    }

    // Return sanitized discovered pages list (without sensitive access tokens)
    const pages = pending.pages.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      tasks: p.tasks,
      maskedId: `${p.id.slice(0, 4)}••••${p.id.slice(-4)}`,
    }));

    return NextResponse.json({
      connectionId: pending.connectionId,
      workspaceId: pending.workspaceId,
      pages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve connection pages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, connectionId, selectedPageIds } = body;

    if (!connectionId || !selectedPageIds || !Array.isArray(selectedPageIds) || selectedPageIds.length === 0) {
      return NextResponse.json(
        { error: 'connectionId and selectedPageIds (array) are required' },
        { status: 400 }
      );
    }

    const pending = credentialVault.getPendingConnection(connectionId);
    if (!pending) {
      return NextResponse.json(
        { error: 'Connection session not found or expired. Please re-initiate connection.' },
        { status: 404 }
      );
    }

    if (workspaceId && pending.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workspace mismatch for connection session' },
        { status: 403 }
      );
    }

    const connectedAccounts = [];

    for (const pageId of selectedPageIds) {
      const page = pending.pages.find((p) => p.id === pageId);
      if (!page) continue;

      // 1. Store token in Credential Vault
      const credentialRef = credentialVault.storeToken(page.accessToken, {
        tokenType: 'page_access_token',
        metadata: { pageId: page.id, pageName: page.name, category: page.category },
      });

      // 2. Persist SocialAccount record
      const account = sprint1Storage.createOrUpdateSocialAccount({
        workspaceId: pending.workspaceId,
        connectedByUserId: pending.userId,
        provider: SocialAccountProvider.META,
        platform: SocialSchedulerPlatform.FACEBOOK,
        accountType: SocialAccountType.FACEBOOK_PAGE,
        displayName: page.name,
        externalAccountId: page.id,
        credentialRef,
        scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
      });

      connectedAccounts.push({
        id: account.id,
        displayName: account.displayName,
        externalAccountIdMasked: account.externalAccountIdMasked,
        status: account.status,
      });
    }

    // 3. Mark pending connection as consumed
    credentialVault.consumePendingConnection(connectionId);

    return NextResponse.json({
      success: true,
      workspaceId: pending.workspaceId,
      connectedAccounts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save selected pages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
