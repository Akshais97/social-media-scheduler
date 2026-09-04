import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import { SocialAccountStatus } from '@/types/scheduler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const body = await req.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const account = sprint1Storage.getSocialAccountById(accountId, workspaceId);
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or access denied for this workspace' },
        { status: 404 }
      );
    }

    // Validate credentials in vault
    try {
      credentialVault.getDecryptedSecret(account.credentialRef);
    } catch {
      sprint1Storage.updateSocialAccount(account.id, workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return NextResponse.json({
        valid: false,
        status: SocialAccountStatus.REAUTH_REQUIRED,
        error: 'Stored token could not be decrypted. Re-authentication required.',
      });
    }

    return NextResponse.json({
      valid: true,
      status: account.status,
      accountId: account.id,
      displayName: account.displayName,
      username: account.username,
      canPost: true,
      canUploadMedia: true,
      missingPermissions: [],
      paidPublishingEnabled: account.metadataJson?.paidPublishingEnabled ?? true,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
