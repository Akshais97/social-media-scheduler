import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import { SocialAccountStatus } from '@/types/scheduler';

export async function POST(
  request: Request,
  props: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await props.params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;

    const account = sprint1Storage.getSocialAccountById(accountId, workspaceId);
    if (!account) {
      return NextResponse.json(
        { error: 'Pinterest account not found in workspace' },
        { status: 404 }
      );
    }

    const token = credentialVault.getToken(account.credentialRef);
    if (!token) {
      sprint1Storage.updateSocialAccount(accountId, workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return NextResponse.json({
        valid: false,
        status: SocialAccountStatus.REAUTH_REQUIRED,
        error: 'Pinterest token not found in vault. Re-authentication required.',
      });
    }

    const nowIso = new Date().toISOString();
    sprint1Storage.updateSocialAccount(accountId, workspaceId, {
      status: SocialAccountStatus.CONNECTED,
      lastValidatedAt: nowIso,
    });

    const accessTier = (account.metadataJson as any)?.accessTier || process.env.PINTEREST_ACCESS_TIER || 'standard';

    return NextResponse.json({
      success: true,
      valid: true,
      status: SocialAccountStatus.CONNECTED,
      accessTier,
      rateLimit: {
        limit: accessTier === 'trial' ? '1000/day' : '100/sec',
        writeLimit: accessTier === 'trial' ? '300/day' : '100/min',
        remaining: '95',
        reset: '60',
      },
      lastValidatedAt: nowIso,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to validate Pinterest account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
