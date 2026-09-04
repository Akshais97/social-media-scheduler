import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import {
  SocialSchedulerPlatform,
  SocialAccountProvider,
  SocialAccountType,
  SocialAccountStatus,
} from '@/types/scheduler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, facebookPageId, instagramUserId, username } = body;

    if (!workspaceId || !facebookPageId || !instagramUserId) {
      return NextResponse.json(
        { error: 'workspaceId, facebookPageId, and instagramUserId are required' },
        { status: 400 }
      );
    }

    // Find the linked Facebook Page in storage to borrow the vaulted credentials
    const workspaceAccounts = sprint1Storage.getSocialAccounts(workspaceId);
    const fbAccount = workspaceAccounts.find(
      (a) => a.externalAccountId === facebookPageId && a.platform === SocialSchedulerPlatform.FACEBOOK
    );

    if (!fbAccount) {
      return NextResponse.json(
        { error: 'Linked Facebook Page not found or not connected to this workspace' },
        { status: 404 }
      );
    }

    const igUsername = username || (fbAccount.username ? fbAccount.username.replace(/\.facebook|\.page/g, '') : 'instagram_business');
    const igDisplayName = `${fbAccount.displayName} (@${igUsername})`;
    const maskedId = `${instagramUserId.slice(0, 4)}••••${instagramUserId.slice(-4)}`;

    const newAccount = sprint1Storage.createOrUpdateSocialAccount({
      workspaceId,
      connectedByUserId: fbAccount.connectedByUserId || 'usr_admin',
      provider: SocialAccountProvider.META,
      platform: SocialSchedulerPlatform.INSTAGRAM,
      accountType: SocialAccountType.INSTAGRAM_BUSINESS,
      displayName: igDisplayName,
      username: igUsername,
      externalAccountId: instagramUserId,
      externalAccountIdMasked: maskedId,
      externalParentId: facebookPageId,
      credentialRef: fbAccount.credentialRef,
      scopes: [
        'instagram_business_basic',
        'instagram_business_content_publish',
        'pages_show_list',
        'pages_read_engagement',
      ],
      metadataJson: {
        linkedFacebookPageName: fbAccount.displayName,
        accountKind: 'business',
        supportsPublishing: true,
      },
    });

    return NextResponse.json({
      success: true,
      socialAccountId: newAccount.id,
      platform: 'INSTAGRAM',
      status: SocialAccountStatus.CONNECTED,
      account: {
        id: newAccount.id,
        displayName: newAccount.displayName,
        username: newAccount.username,
        maskedId,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save Instagram account' },
      { status: 500 }
    );
  }
}
