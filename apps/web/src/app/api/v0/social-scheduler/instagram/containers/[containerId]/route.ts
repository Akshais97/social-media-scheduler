import { NextRequest, NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ containerId: string }> }
) {
  try {
    const { containerId } = await params;
    const container = sprint1Storage.getInstagramContainer(containerId);

    if (!container) {
      return NextResponse.json({ error: 'Instagram container not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      container,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch container' },
      { status: 500 }
    );
  }
}
