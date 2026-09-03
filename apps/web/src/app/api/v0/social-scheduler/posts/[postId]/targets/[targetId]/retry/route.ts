import { NextResponse } from 'next/server';
import { workerService } from '@/lib/worker-service';
import { MockAdapterMode } from '@/lib/mock-publisher-adapter';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string; targetId: string }> }
) {
  try {
    const { postId, targetId } = await params;
    const body = await request.json().catch(() => ({}));
    const { mockMode = 'success' } = body;

    const attempt = await workerService.retryTargetNow(
      postId,
      targetId,
      mockMode as MockAdapterMode
    );

    if (!attempt) {
      return NextResponse.json(
        { error: 'Post or target not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      targetId,
      attempt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retry target';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
