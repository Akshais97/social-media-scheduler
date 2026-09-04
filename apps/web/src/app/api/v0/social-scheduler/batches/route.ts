import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';
    const batches = sprint1Storage.getBatches(workspaceId);
    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Batch name is required' }, { status: 400 });
    }

    const batch = sprint1Storage.createBatch({
      workspaceId,
      name: body.name,
      createdByUserId: body.createdByUserId || 'usr_admin',
      settingsJson: body.settingsJson,
    });

    return NextResponse.json({ success: true, batchId: batch.id, batch });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
