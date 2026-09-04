import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const date = searchParams.get('date') || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const quotaSummary = sprint1Storage.getYouTubeQuotaSummary(workspaceId, date);
    return NextResponse.json(quotaSummary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query YouTube quota';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
