import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const { workspaceId = 'ws_mantri', scheduledAt, timezone, reason, userId, isDrag } = body;

    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt is required' }, { status: 400 });
    }

    const result = sprint1Storage.reschedulePost({
      workspaceId,
      postId,
      scheduledAt,
      timezone,
      reason,
      userId,
      isDrag: !!isDrag,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reschedule post';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
