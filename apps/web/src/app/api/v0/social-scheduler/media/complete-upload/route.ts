import { NextResponse } from 'next/server';
import { verifyB2Object, createPresignedDownloadUrl, getDefaultB2Bucket } from '@/lib/b2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, mediaAssetId, objectKey, bucket: requestedBucket } = body;

    if (!workspaceId || !mediaAssetId || !objectKey) {
      return NextResponse.json(
        { error: 'workspaceId, mediaAssetId, and objectKey are required' },
        { status: 400 }
      );
    }

    const bucket = requestedBucket || getDefaultB2Bucket();

    // Verify object exists in Backblaze B2
    const verification = await verifyB2Object({ bucket, key: objectKey });

    // Generate real presigned download/view URL valid for 2 hours
    const previewUrl = await createPresignedDownloadUrl({
      bucket,
      key: objectKey,
      expiresIn: 7200,
    });

    return NextResponse.json({
      mediaAssetId,
      status: 'UPLOADED',
      objectKey,
      bucket,
      previewUrl,
      verifiedInB2: verification.exists,
      byteSize: verification.size,
      mimeType: verification.contentType,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
