import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const discoveredAccounts = sprint1Storage.discoverInstagramAccounts(workspaceId);

    return NextResponse.json({
      success: true,
      accounts: discoveredAccounts,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to discover Instagram accounts' },
      { status: 500 }
    );
  }
}
