import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { credentialVault } from '@/lib/credential-vault';
import { metaInstagramPublisherAdapter } from '@/lib/meta-instagram-publisher-adapter';
import { SocialSchedulerPlatform, SocialAccountStatus } from '@/types/scheduler';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const account = sprint1Storage.getSocialAccountById(accountId);

    if (!account) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 });
    }

    if (account.platform !== SocialSchedulerPlatform.INSTAGRAM) {
      return NextResponse.json(
        { error: 'Account is not an Instagram account' },
        { status: 400 }
      );
    }

    const token = credentialVault.getToken(account.credentialRef);
    if (!token) {
      sprint1Storage.updateSocialAccount(account.id, account.workspaceId, {
        status: SocialAccountStatus.REAUTH_REQUIRED,
      });
      return NextResponse.json({
        status: 'REAUTH_REQUIRED',
        canPublish: false,
        missingPermissions: ['token_expired'],
        error: 'Access token expired or missing from vault',
      });
    }

    // Check publishing limit
    const publishingLimit = await metaInstagramPublisherAdapter.checkPublishingLimit(
      account.externalAccountId,
      token
    );

    sprint1Storage.validateSocialAccount(accountId, account.workspaceId);

    return NextResponse.json({
      status: SocialAccountStatus.CONNECTED,
      canPublish: true,
      missingPermissions: [],
      publishingLimit: {
        quotaUsage: publishingLimit.quotaUsage,
        quotaTotal: publishingLimit.quotaTotal,
        quotaDuration: publishingLimit.quotaDuration || 86400,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Validation failed' },
      { status: 500 }
    );
  }
}
