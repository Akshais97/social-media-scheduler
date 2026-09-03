import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const { workspaceId } = body;

    const cancelled = sprint1Storage.cancelPost(postId);
    if (!cancelled) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      postId: cancelled.id,
      status: 'CANCELLED',
      cancelledAt: cancelled.cancelledAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
