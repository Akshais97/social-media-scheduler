import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;

    const disconnected = sprint1Storage.disconnectSocialAccount(accountId, workspaceId);
    if (!disconnected) {
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      account: {
        id: disconnected.id,
        status: disconnected.status,
        disconnectedAt: disconnected.disconnectedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to disconnect account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
