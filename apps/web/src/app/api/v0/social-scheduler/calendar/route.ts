import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const platform = searchParams.get('platform') || 'ALL';
    const status = searchParams.get('status') || 'ALL';

    const result = sprint1Storage.getCalendarPosts(workspaceId, from, to, platform, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch calendar posts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
