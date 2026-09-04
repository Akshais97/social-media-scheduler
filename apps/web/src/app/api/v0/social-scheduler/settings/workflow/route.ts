import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';
    const settings = sprint1Storage.getWorkflowSettings(workspaceId);
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId') || 'ws_mantri';

    const settings = sprint1Storage.updateWorkflowSettings(workspaceId, body, body.userId);
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
