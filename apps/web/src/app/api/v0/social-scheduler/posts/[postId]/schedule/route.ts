import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { workspaceId, scheduledAt, timezone } = body;

    if (!workspaceId || !scheduledAt) {
      return NextResponse.json(
        { error: 'workspaceId and scheduledAt are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt).getTime();
    const minTime = Date.now() + 5 * 60 * 1000;
    if (isNaN(scheduledDate) || scheduledDate < minTime) {
      return NextResponse.json(
        { error: 'scheduledAt must be at least 5 minutes in the future' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      postId,
      status: 'SCHEDULED',
      scheduledAt,
      timezone: timezone || 'Asia/Kolkata',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
