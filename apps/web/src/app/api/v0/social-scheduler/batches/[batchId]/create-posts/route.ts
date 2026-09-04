import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const result = sprint1Storage.createPostsFromBatch({
      workspaceId,
      batchId,
      items: body.items,
      userId: body.userId || 'usr_admin',
    });

    if (!result.success && result.createdPosts === 0) {
      return NextResponse.json({ error: 'Failed to create posts from batch', errors: result.errors }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
