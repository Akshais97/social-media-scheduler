import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const { workspaceId = 'ws_mantri', userId } = body;

    const result = sprint1Storage.retryFailedTargets(workspaceId, postId, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retry targets';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
