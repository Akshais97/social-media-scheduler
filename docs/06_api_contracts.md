# API Contracts — Social Media Scheduler MVP

## 1. API Principles

- REST API over HTTPS.
- JSON request/response bodies.
- Backend validates every request.
- Frontend validation is not enough.
- API contracts must not change silently.
- Platform API details must stay behind backend adapters.

## 2. Auth Endpoints

## `POST /auth/login`

Logs in the single MVP test user.

### Request

```json
{
  "username": "admin",
  "password": "password"
}
```

### Response

```json
{
  "user": {
    "id": "user_123",
    "username": "admin"
  }
}
```

### Errors

- `401 INVALID_CREDENTIALS`
- `400 VALIDATION_ERROR`

## `POST /auth/logout`

Clears session cookie.

### Response

```json
{
  "success": true
}
```

## `GET /auth/me`

Returns active session user.

### Response

```json
{
  "user": {
    "id": "user_123",
    "username": "admin"
  }
}
```

### Errors

- `401 UNAUTHENTICATED`

## 3. Media Endpoints

## `POST /media/presign-upload`

Creates a Backblaze B2 presigned upload URL.

### Request

```json
{
  "filename": "post-video.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 10485760
}
```

### Response

```json
{
  "uploadUrl": "https://...",
  "method": "PUT",
  "headers": {
    "Content-Type": "video/mp4"
  },
  "b2Bucket": "social-posts",
  "b2Key": "uploads/2026/08/file-id.mp4"
}
```

### Errors

- `400 UNSUPPORTED_FORMAT`
- `400 MEDIA_TOO_LARGE`
- `401 UNAUTHENTICATED`

## `POST /media/complete-upload`

Confirms upload and stores metadata.

### Request

```json
{
  "b2Bucket": "social-posts",
  "b2Key": "uploads/2026/08/file-id.mp4",
  "originalFilename": "post-video.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 10485760,
  "width": 1080,
  "height": 1920,
  "durationMs": 30000
}
```

### Response

```json
{
  "mediaAsset": {
    "id": "media_123",
    "status": "UPLOADED",
    "b2Key": "uploads/2026/08/file-id.mp4"
  }
}
```

## 4. Post Endpoints

## `POST /posts`

Creates a draft or scheduled post.

### Request

```json
{
  "caption": "New launch post caption",
  "mediaAssetIds": ["media_123"],
  "scheduledFor": "2026-08-25T18:00:00+05:30",
  "targetAccountIds": ["social_123"]
}
```

### Response

```json
{
  "post": {
    "id": "post_123",
    "caption": "New launch post caption",
    "status": "SCHEDULED",
    "scheduledFor": "2026-08-25T18:00:00+05:30"
  },
  "publishTargets": [
    {
      "id": "target_123",
      "platform": "instagram",
      "status": "SCHEDULED"
    }
  ]
}
```

### Errors

- `400 VALIDATION_ERROR`
- `400 INVALID_SCHEDULE_TIME`
- `400 MISSING_MEDIA`
- `400 MISSING_TARGET_ACCOUNT`

## `GET /posts`

Lists posts with pagination.

### Query Params

```txt
status optional
cursor optional
limit optional, default 20, max 50
```

### Response

```json
{
  "items": [
    {
      "id": "post_123",
      "caption": "New launch post caption",
      "status": "SCHEDULED",
      "scheduledFor": "2026-08-25T18:00:00+05:30",
      "createdAt": "2026-08-25T12:00:00+05:30"
    }
  ],
  "nextCursor": null
}
```

## `GET /posts/:id`

Returns full post details.

### Response

```json
{
  "post": {
    "id": "post_123",
    "caption": "New launch post caption",
    "status": "SCHEDULED",
    "scheduledFor": "2026-08-25T18:00:00+05:30",
    "mediaAssets": [],
    "publishTargets": []
  }
}
```

## `PATCH /posts/:id`

Updates a draft or scheduled post.

### Request

```json
{
  "caption": "Updated caption",
  "scheduledFor": "2026-08-25T19:00:00+05:30"
}
```

### Rules

- Cannot edit after processing starts.
- Cannot edit published posts.
- Cannot edit cancelled posts.

## `DELETE /posts/:id`

Deletes a draft post or cancels a scheduled post depending on status.

For MVP, prefer soft cancellation over hard delete once scheduling is involved.

## 5. Publishing Endpoints

## `POST /posts/:id/schedule`

Schedules an existing draft.

### Request

```json
{
  "scheduledFor": "2026-08-25T18:00:00+05:30",
  "targetAccountIds": ["social_123"]
}
```

### Response

```json
{
  "postId": "post_123",
  "status": "SCHEDULED"
}
```

## `POST /posts/:id/publish-now`

Queues or immediately processes a post.

### Response

```json
{
  "postId": "post_123",
  "status": "PROCESSING"
}
```

## `POST /posts/:id/cancel`

Cancels a scheduled post before processing.

### Response

```json
{
  "postId": "post_123",
  "status": "CANCELLED"
}
```

## `GET /posts/:id/status`

Returns post and target status.

### Response

```json
{
  "postId": "post_123",
  "status": "SCHEDULED",
  "targets": [
    {
      "id": "target_123",
      "platform": "instagram",
      "status": "SCHEDULED",
      "lastErrorCode": null,
      "lastErrorMessage": null
    }
  ]
}
```

## 6. Worker Endpoint

## `POST /worker/publish-due`

Internal endpoint called by Railway cron.

### Request

```json
{
  "limit": 10
}
```

### Response

```json
{
  "processed": 3,
  "published": 2,
  "failed": 1
}
```

### Security

Must require internal worker secret header.

```txt
X-Worker-Secret: <secret>
```

## 7. Social Account Endpoints

## `GET /social-accounts`

Lists connected accounts.

### Response

```json
{
  "items": [
    {
      "id": "social_123",
      "platform": "instagram",
      "displayName": "Brand Instagram",
      "status": "CONNECTED"
    }
  ]
}
```

## `POST /social-accounts/:platform/connect`

Starts OAuth connection.

### Response

```json
{
  "authorizationUrl": "https://platform-auth-url..."
}
```

## `GET /social-accounts/:platform/callback`

OAuth callback endpoint.

### Response

Redirects to frontend social accounts page.

## `DELETE /social-accounts/:id`

Disconnects account.

### Response

```json
{
  "success": true
}
```

## 8. Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Caption is required.",
    "details": {}
  }
}
```

## 9. Contract Rule

If any endpoint request or response changes, update this document before coding the change.
