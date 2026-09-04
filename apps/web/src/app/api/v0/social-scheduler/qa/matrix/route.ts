import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;
    const matrix = sprint1Storage.getQaMatrix(workspaceId);
    return NextResponse.json(matrix);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch QA matrix';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
