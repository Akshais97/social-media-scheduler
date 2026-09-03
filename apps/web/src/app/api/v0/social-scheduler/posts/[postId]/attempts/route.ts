import { NextResponse } from 'next/server';
import { sprint1Storage } from '@/lib/mock-storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const post = sprint1Storage.getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const attempts = sprint1Storage.getAttempts(postId);
    return NextResponse.json({
      postId,
      attempts,
      totalAttempts: attempts.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attempts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
