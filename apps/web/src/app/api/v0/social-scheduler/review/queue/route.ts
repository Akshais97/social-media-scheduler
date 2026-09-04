import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';
    const tab = request.nextUrl.searchParams.get('tab') || 'all';

    const posts = sprint1Storage.getReviewQueue(workspaceId, tab);
    return NextResponse.json({ posts, tab, workspaceId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
