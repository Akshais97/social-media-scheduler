import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    const comments = sprint1Storage.getReviewComments(postId, workspaceId);
    return NextResponse.json({ comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    if (!body.body || body.body.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
    }

    const comment = sprint1Storage.addReviewComment({
      workspaceId,
      postId,
      authorUserId: body.authorUserId || 'usr_admin',
      commentType: body.commentType || 'GENERAL',
      body: body.body,
      metadataJson: body.metadataJson,
    });

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
