# Upload and Storage Flow — Backblaze B2

## 1. Goal

The app must upload image/video media to Backblaze B2 without routing large files through the backend server.

The backend should create secure upload instructions. The browser should upload directly to B2.

## 2. Storage Principles

- Store media files in Backblaze B2.
- Store metadata in Supabase Postgres.
- Do not store media binaries in Postgres.
- Do not expose B2 master credentials to the frontend.
- Do not make all files permanently public by default.
- Generate platform-accessible media URLs only when needed for publishing.

## 3. Upload Flow

```txt
Frontend
 ↓
POST /media/presign-upload
 ↓
Backend validates filename, MIME type, size
 ↓
Backend creates B2 object key and presigned upload URL
 ↓
Frontend uploads file directly to B2
 ↓
Frontend calls POST /media/complete-upload
 ↓
Backend creates media_assets row
```

## 4. Object Key Format

Recommended B2 key format:

```txt
social-scheduler/uploads/{yyyy}/{mm}/{post-or-upload-id}/{safe-filename}
```

Example:

```txt
social-scheduler/uploads/2026/08/upload_cuid123/post-video.mp4
```

## 5. Allowed Media Types

Initial MVP:

```txt
image/jpeg
image/png
image/webp
video/mp4
video/quicktime
```

Optional later:

```txt
image/gif
video/webm
```

## 6. Size Limits

Recommended MVP limits:

```txt
Images: 10 MB
Videos: 200 MB
```

Adjust after platform-specific validation is implemented.

## 7. Upload Validation

Backend must validate:

- Filename exists.
- MIME type is allowed.
- Size is within configured limit.
- Upload object key is generated server-side.

Frontend should validate early for UX, but backend validation is authoritative.

## 8. `presign-upload` Response

```json
{
  "uploadUrl": "https://...",
  "method": "PUT",
  "headers": {
    "Content-Type": "video/mp4"
  },
  "b2Bucket": "social-posts",
  "b2Key": "social-scheduler/uploads/2026/08/upload_123/post-video.mp4"
}
```

## 9. `complete-upload` Request

```json
{
  "b2Bucket": "social-posts",
  "b2Key": "social-scheduler/uploads/2026/08/upload_123/post-video.mp4",
  "originalFilename": "post-video.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 10485760,
  "width": 1080,
  "height": 1920,
  "durationMs": 30000
}
```

## 10. Media Metadata

Save the following in `media_assets`:

```txt
b2_bucket
b2_key
original_filename
mime_type
size_bytes
width
height
duration_ms
status
created_at
updated_at
```

## 11. Publishing URL Strategy

Some platforms need a URL they can fetch from their servers.

Do not permanently expose all media files.

Use one of these strategies:

### Option A — Temporary Signed URL

Generate a temporary URL when publishing.

Use when platform accepts signed URLs and can fetch the object.

### Option B — Temporary Public Copy

Copy media to a temporary public publishing prefix and delete later.

Use only if signed URLs are not accepted.

### Option C — Direct Upload to Platform

Download/read the file server-side and upload it to the platform API.

Use only when the platform requires direct transfer.

## 12. Recommended Abstraction

```ts
interface MediaProvider {
  createPresignedUpload(input: PresignUploadInput): Promise<PresignUploadResult>;
  completeUpload(input: CompleteUploadInput): Promise<MediaAsset>;
  getPublishableUrl(mediaAssetId: string, platform: SocialPlatform): Promise<string>;
  getFileStream?(mediaAssetId: string): Promise<NodeJS.ReadableStream>;
}
```

## 13. Failure Cases

Handle:

- Unsupported file type
- File too large
- B2 presign failure
- Browser upload failure
- Incomplete upload
- B2 object not found after completion
- Platform cannot fetch media URL

## 14. Cleanup Rules

Later improvement:

- Delete orphan uploads not attached to posts.
- Delete failed temporary publishing copies.
- Expire old test uploads if storage grows.

Do not build complex retention logic in initial MVP unless storage starts becoming an issue.
