import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const { workspaceId = 'ws_mantri', source = 'DETAIL_VIEW', userId = 'usr_admin' } = body;

    const check = sprint1Storage.runReadinessCheck(workspaceId, postId, source, userId);
    return NextResponse.json(check);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to run readiness check';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
