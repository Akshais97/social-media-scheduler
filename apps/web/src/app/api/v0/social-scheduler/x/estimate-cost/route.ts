import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, text, containsUrl } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const estimate = sprint1Storage.estimateXCost(workspaceId, text || '', containsUrl);
    return NextResponse.json(estimate);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to estimate X cost';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
