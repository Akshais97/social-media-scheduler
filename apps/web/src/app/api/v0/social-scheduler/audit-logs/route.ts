import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || sprint1Storage.getActiveWorkspace().id;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;

    const logs = sprint1Storage.getAuditLogs(workspaceId, entityType, entityId);
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
