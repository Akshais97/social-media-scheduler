import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, mediaAssetId } = body;

    if (!workspaceId || !mediaAssetId) {
      return NextResponse.json(
        { error: 'workspaceId and mediaAssetId are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mediaAssetId,
      status: 'UPLOADED',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
