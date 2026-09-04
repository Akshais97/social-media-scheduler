import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(
  request: Request,
  props: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await props.params;
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;

    // Validate account belongs to workspace
    const account = sprint1Storage.getSocialAccountById(accountId, workspaceId);
    if (!account) {
      return NextResponse.json(
        { error: 'Pinterest account not found in workspace' },
        { status: 404 }
      );
    }

    const boards = sprint1Storage.getPinterestBoards(workspaceId, accountId);

    return NextResponse.json({
      success: true,
      boards,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch Pinterest boards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
