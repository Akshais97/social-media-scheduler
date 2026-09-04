import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const ledgers = sprint1Storage.getXCostLedgers(workspaceId);
    return NextResponse.json(ledgers);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query X cost ledgers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
