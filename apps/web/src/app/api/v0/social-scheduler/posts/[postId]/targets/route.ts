import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';
import { SocialSchedulerTargetStatus, SocialSchedulerPlatform } from '@/types/scheduler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { workspaceId, targets } = body;

    if (!workspaceId || !targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: 'workspaceId and at least one target are required' },
        { status: 400 }
      );
    }

    const post = sprint1Storage.getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: `Post ${postId} not found` }, { status: 404 });
    }

    if (post.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: `Workspace mismatch for post ${postId}` },
        { status: 403 }
      );
    }

    // Validate and normalize targets
    const validatedTargets = [];

    for (let idx = 0; idx < targets.length; idx++) {
      const rawTarget = targets[idx];
      const targetId = rawTarget.id || `tgt_${Date.now()}_${idx}`;
      const platform = rawTarget.platform as SocialSchedulerPlatform;
      const publishMode = rawTarget.publishMode || 'MOCK';
      const socialAccountId = rawTarget.socialAccountId || null;

      if (publishMode === 'LIVE_META' && (platform === SocialSchedulerPlatform.FACEBOOK || platform === SocialSchedulerPlatform.INSTAGRAM)) {
        if (!socialAccountId) {
          return NextResponse.json(
            { error: `${platform} live target requires a selected socialAccountId` },
            { status: 400 }
          );
        }

        const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
        if (!account) {
          return NextResponse.json(
            { error: `Social account ${socialAccountId} not found in workspace ${workspaceId}` },
            { status: 400 }
          );
        }

        if (account.status !== 'CONNECTED') {
          return NextResponse.json(
            { error: `Social account ${account.displayName} is not connected (${account.status})` },
            { status: 400 }
          );
        }
      }

      if (publishMode === 'LIVE_PINTEREST' && platform === SocialSchedulerPlatform.PINTEREST) {
        if (!socialAccountId) {
          return NextResponse.json(
            { error: 'Pinterest live target requires a selected socialAccountId' },
            { status: 400 }
          );
        }

        const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
        if (!account) {
          return NextResponse.json(
            { error: `Pinterest account ${socialAccountId} not found in workspace ${workspaceId}` },
            { status: 400 }
          );
        }

        if (account.status !== 'CONNECTED') {
          return NextResponse.json(
            { error: `Pinterest account ${account.displayName} is not connected (${account.status})` },
            { status: 400 }
          );
        }

        const opts = rawTarget.platformOptions || rawTarget.platformOptionsJson || {};
        const boardId = rawTarget.pinterestBoardId || opts.boardId;
        if (!boardId) {
          return NextResponse.json(
            { error: 'Pinterest live target requires a selected boardId' },
            { status: 400 }
          );
        }

        const board = sprint1Storage.getPinterestBoardById(boardId);
        if (!board || board.workspaceId !== workspaceId || board.socialAccountId !== account.id) {
          return NextResponse.json(
            { error: `Pinterest board ${boardId} is invalid or does not belong to this workspace` },
            { status: 400 }
          );
        }

        const title = opts.title || post.title;
        if (!title || title.trim().length === 0) {
          return NextResponse.json(
            { error: 'Pinterest live target requires a Pin title' },
            { status: 400 }
          );
        }

        // Validate media: no video Pins in Sprint 5
        const hasVideo = post.mediaAssets?.some((m) => m.mimeType.startsWith('video/'));
        if (hasVideo) {
          return NextResponse.json(
            { error: 'Video Pins are not supported in Sprint 5. Please use an image.' },
            { status: 400 }
          );
        }
      }

      let youtubeReservationId: string | null = null;
      if (publishMode === 'LIVE_GOOGLE' && platform === SocialSchedulerPlatform.YOUTUBE) {
        if (!socialAccountId) {
          return NextResponse.json(
            { error: 'YouTube live target requires a selected socialAccountId' },
            { status: 400 }
          );
        }

        const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
        if (!account) {
          return NextResponse.json(
            { error: `YouTube account ${socialAccountId} not found in workspace ${workspaceId}` },
            { status: 400 }
          );
        }

        if (account.status !== 'CONNECTED') {
          return NextResponse.json(
            { error: `YouTube channel ${account.displayName} is not connected (${account.status})` },
            { status: 400 }
          );
        }

        // Validate media: must have MP4 video
        const hasMp4 = post.mediaAssets?.some((m) => m.mimeType === 'video/mp4');
        if (!hasMp4) {
          return NextResponse.json(
            { error: 'YouTube requires an MP4 video. Image posts cannot be scheduled to YouTube.' },
            { status: 400 }
          );
        }

        const opts = rawTarget.platformOptions || rawTarget.platformOptionsJson || {};
        const title = opts.title || post.title;
        if (!title || title.trim().length === 0) {
          return NextResponse.json(
            { error: 'YouTube live target requires a video title' },
            { status: 400 }
          );
        }
        if (title.length > 100) {
          return NextResponse.json(
            { error: 'YouTube video title exceeds 100 characters' },
            { status: 400 }
          );
        }

        if (opts.madeForKids === undefined || opts.madeForKids === null) {
          return NextResponse.json(
            { error: 'YouTube live target requires declaring whether the video is made for kids' },
            { status: 400 }
          );
        }

        // Reserve quota
        const quotaReserve = sprint1Storage.reserveYouTubeQuota(workspaceId, postId, targetId, socialAccountId);
        if (!quotaReserve.success) {
          return NextResponse.json(
            { error: quotaReserve.error || 'YouTube upload quota exhausted for today' },
            { status: 400 }
          );
        }
        youtubeReservationId = quotaReserve.reservation?.id || null;
      }

      let xCostAcknowledgedAt: string | null = null;
      let xCostAcknowledgedBy: string | null = null;

      if (publishMode === 'LIVE_X' && platform === SocialSchedulerPlatform.X) {
        if (!socialAccountId) {
          return NextResponse.json(
            { error: 'X live target requires a selected socialAccountId' },
            { status: 400 }
          );
        }

        const account = sprint1Storage.getSocialAccountById(socialAccountId, workspaceId);
        if (!account) {
          return NextResponse.json(
            { error: `X account ${socialAccountId} not found in workspace ${workspaceId}` },
            { status: 400 }
          );
        }

        if (account.status !== 'CONNECTED') {
          return NextResponse.json(
            { error: `X account @${account.username || account.displayName} is not connected (${account.status})` },
            { status: 400 }
          );
        }

        const opts = rawTarget.platformOptions || rawTarget.platformOptionsJson || {};
        if (!opts.costAcknowledged && !rawTarget.xCostAcknowledgedAt) {
          return NextResponse.json(
            { error: 'Publishing to X requires explicit user cost acknowledgement for paid API actions.' },
            { status: 400 }
          );
        }

        xCostAcknowledgedAt = new Date().toISOString();
        xCostAcknowledgedBy = 'usr_admin';

        // Validate media: max 4 images, max 1 video, no mixed media
        const media = post.mediaAssets || [];
        const hasImages = media.some((m) => m.mimeType.startsWith('image/'));
        const hasVideos = media.some((m) => m.mimeType.startsWith('video/'));

        if (hasImages && hasVideos) {
          return NextResponse.json(
            { error: 'X does not allow mixing images and videos in the same post.' },
            { status: 400 }
          );
        }

        if (hasImages && media.length > 4) {
          return NextResponse.json(
            { error: `X allows a maximum of 4 images per post (found ${media.length}).` },
            { status: 400 }
          );
        }

        if (hasVideos && media.length > 1) {
          return NextResponse.json(
            { error: 'X allows only 1 video per post.' },
            { status: 400 }
          );
        }

        // Validate text length
        const text = opts.text || post.title || post.draftContentJson?.caption || '';
        if (text.length > 280) {
          return NextResponse.json(
            { error: `X post text exceeds standard 280-character limit (current: ${text.length}).` },
            { status: 400 }
          );
        }
      }

      const platformOpts = rawTarget.platformOptions || rawTarget.platformOptionsJson || null;

      validatedTargets.push({
        id: targetId,
        postId,
        workspaceId,
        platform,
        publishMode,
        socialAccountId,
        instagramFormat: rawTarget.instagramFormat || rawTarget.platformOptions?.instagramFormat || null,
        pinterestBoardId: rawTarget.pinterestBoardId || platformOpts?.boardId || null,
        pinterestBoardSectionId: rawTarget.pinterestBoardSectionId || platformOpts?.boardSectionId || null,
        youtubeUploadReservationId: youtubeReservationId,
        xCostAcknowledgedAt,
        xCostAcknowledgedBy,
        platformOptionsJson: platformOpts,
        platformOptions: platformOpts,
        mockAccountName: rawTarget.mockAccountName || rawTarget.accountName,
        status: rawTarget.status || SocialSchedulerTargetStatus.SCHEDULED,
        createdAt: rawTarget.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedPost = sprint1Storage.savePostTargets(postId, workspaceId, validatedTargets);

    return NextResponse.json({
      success: true,
      postId,
      savedTargetsCount: validatedTargets.length,
      targets: validatedTargets,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
