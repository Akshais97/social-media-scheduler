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

    if (!body.dates || !Array.isArray(body.dates) || body.dates.length === 0) {
      return NextResponse.json({ error: 'Array of target dates is required' }, { status: 400 });
    }

    const result = sprint1Storage.copyPostToDates(postId, workspaceId, {
      ...body,
      workspaceId,
    });

    if (!result.success && result.createdCount === 0) {
      return NextResponse.json({ error: result.error || 'Failed to copy post to dates', failures: result.failures }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
