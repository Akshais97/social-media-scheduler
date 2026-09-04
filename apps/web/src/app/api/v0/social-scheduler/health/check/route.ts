import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { workspaceId = sprint1Storage.getActiveWorkspace().id, socialAccountId } = body;

    const result = sprint1Storage.runAccountHealthCheck(workspaceId, socialAccountId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to run health check';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
