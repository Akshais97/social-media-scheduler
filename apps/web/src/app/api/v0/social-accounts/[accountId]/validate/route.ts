import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || sprint1Storage.getActiveWorkspace().id;

    const validation = sprint1Storage.validateSocialAccount(accountId, workspaceId);
    return NextResponse.json(validation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to validate account';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
