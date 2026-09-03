import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const posts = sprint1Storage.getPosts(workspaceId, status, search);
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, title, draftContentJson } = body;

    if (!workspaceId || !title || !draftContentJson) {
      return NextResponse.json(
        { error: 'workspaceId, title, and draftContentJson are required' },
        { status: 400 }
      );
    }

    const post = sprint1Storage.createDraftPost({
      workspaceId,
      title,
      draftContentJson,
    });

    return NextResponse.json({ postId: post.id, status: post.status }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
