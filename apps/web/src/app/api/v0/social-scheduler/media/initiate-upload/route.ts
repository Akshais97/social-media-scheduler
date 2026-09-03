import { NextResponse } from 'next/server';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, fileName, mimeType, byteSize } = body;

    if (!workspaceId || !fileName || !mimeType || !byteSize) {
      return NextResponse.json(
        { error: 'workspaceId, fileName, mimeType, and byteSize are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported MIME type: ${mimeType}. Allowed: JPEG, PNG, WEBP, MP4, MOV` },
        { status: 400 }
      );
    }

    const isVideo = mimeType.startsWith('video/');
    const maxLimit = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
    if (byteSize > maxLimit) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${isVideo ? '200 MB' : '10 MB'}` },
        { status: 400 }
      );
    }

    const mediaAssetId = `asset_${Date.now()}`;
    const safeFileName = fileName.replace(/\s+/g, '_');
    const objectKey = `workspaces/${workspaceId}/social-scheduler/2026/09/${mediaAssetId}/${safeFileName}`;
    const uploadUrl = `https://b2.backblazeb2.com/file/sakhaa-media/${objectKey}?uploadToken=mock_token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return NextResponse.json({
      mediaAssetId,
      uploadUrl,
      objectKey,
      expiresAt,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
