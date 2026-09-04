import { NextResponse } from 'next/server';
import { workerService } from '@/lib/worker-service';
import { MockAdapterMode } from '@/lib/mock-publisher-adapter';

const EXPECTED_SECRET = process.env.WORKER_SECRET || 'sakhaa_worker_secret_sprint2';

export async function POST(request: Request) {
  try {
    const workerSecret = request.headers.get('X-Worker-Secret');
    const isDev = process.env.NODE_ENV !== 'production';

    if (workerSecret && workerSecret !== EXPECTED_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid X-Worker-Secret' },
        { status: 401 }
      );
    }

    if (!isDev && !workerSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing X-Worker-Secret' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { limit = 25, mockMode = 'success', workspaceId } = body;

    const allowedModes = ['success', 'retryable_failure', 'permanent_failure', 'timeout', 'mixed', 'random'];
    if (mockMode && !allowedModes.includes(mockMode)) {
      return NextResponse.json(
        { error: `Invalid mockMode. Allowed: ${allowedModes.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await workerService.processDueTargets({
      limit: Number(limit),
      mockMode: mockMode as MockAdapterMode,
      workspaceId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process due targets';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
