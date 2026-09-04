import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;
    const health = sprint1Storage.getAccountHealth(workspaceId);
    return NextResponse.json(health);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch account health';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
