import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { workspaceId, targets } = body;

    if (!workspaceId || !targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: 'workspaceId and at least one target are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      postId,
      savedTargetsCount: targets.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
