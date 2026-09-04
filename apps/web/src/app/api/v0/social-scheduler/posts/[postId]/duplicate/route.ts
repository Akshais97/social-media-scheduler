import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    const result = sprint1Storage.duplicatePost(postId, workspaceId, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to duplicate post' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
