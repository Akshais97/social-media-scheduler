import { NextResponse } from 'next/server';
import { createPresignedDownloadUrl, getDefaultB2Bucket } from '@/lib/b2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const bucket = searchParams.get('bucket') || getDefaultB2Bucket();

  if (!key) {
    return NextResponse.json({ error: 'key parameter is required' }, { status: 400 });
  }

  try {
    const signedUrl = await createPresignedDownloadUrl({
      bucket,
      key,
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate preview URL';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
