import { NextResponse } from 'next/server';
import { workerService } from '@/lib/worker-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;

    const summary = workerService.getWorkerSummary(workspaceId);
    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to get worker summary';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
