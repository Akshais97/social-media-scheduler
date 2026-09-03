import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { workspaceId, mediaAssetId, role = 'primary', order = 0 } = body;

    if (!workspaceId || !mediaAssetId) {
      return NextResponse.json(
        { error: 'workspaceId and mediaAssetId are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      postId,
      mediaAssetId,
      role,
      order,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
