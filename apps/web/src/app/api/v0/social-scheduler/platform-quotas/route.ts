import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;
    const quotas = sprint1Storage.getPlatformQuotas(workspaceId);
    return NextResponse.json(quotas);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch platform quotas';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
