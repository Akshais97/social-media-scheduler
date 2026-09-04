import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  props: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await props.params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;

    // Validate account belongs to workspace
    const account = sprint1Storage.getSocialAccountById(accountId, workspaceId);
    if (!account) {
      return NextResponse.json(
        { error: 'Pinterest account not found in workspace' },
        { status: 404 }
      );
    }

    const syncResult = sprint1Storage.syncPinterestBoards(workspaceId, accountId);

    return NextResponse.json({
      success: true,
      syncedBoards: syncResult.syncedBoards,
      syncedSections: syncResult.syncedSections,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to refresh Pinterest boards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
