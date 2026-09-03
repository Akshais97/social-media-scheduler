# Data Models — Social Media Scheduler MVP

## 1. Data Model Principles

The schema must support the standalone MVP now and future integration later.

MVP should not implement full SaaS tenancy, but tables should include nullable future ownership fields where useful.

Important rules:

- Store media files in Backblaze B2, not Postgres.
- Store only metadata and object keys in Postgres.
- Store one row per publish target/platform.
- Store every publish attempt.
- Keep status values explicit.
- Do not hard-code future user/workspace assumptions.

## 2. Core Tables

```txt
users
social_accounts
posts
media_assets
publish_targets
publish_attempts
```

## 3. `users`

Temporary MVP user table.

```txt
id
username
password_hash
created_at
updated_at
```

Notes:

- Only one test user is required.
- Password must be hashed.
- This table can be removed or replaced later by main app auth.

## 4. `social_accounts`

Stores connected social accounts.

```txt
id
owner_id nullable
workspace_id nullable
platform
display_name
platform_account_id
access_token_encrypted
refresh_token_encrypted nullable
expires_at nullable
scopes_json nullable
status
metadata_json nullable
created_at
updated_at
```

### Status values

```txt
CONNECTED
EXPIRED
REAUTH_REQUIRED
REVOKED
ERROR
```

### Notes

- Tokens must be encrypted before storage.
- Do not log access tokens.
- `owner_id` and `workspace_id` remain nullable in MVP.
- Later integration can map accounts to real users/workspaces.

## 5. `posts`

Represents the main scheduled post draft.

```txt
id
owner_id nullable
workspace_id nullable
caption
scheduled_for nullable
status
created_at
updated_at
cancelled_at nullable
```

### Status values

```txt
DRAFT
SCHEDULED
PROCESSING
PUBLISHED
FAILED
CANCELLED
PARTIALLY_PUBLISHED
```

### Notes

- A post can have one or more media assets.
- A post can have one or more publish targets.
- Overall post status is derived from publish target statuses where needed.

## 6. `media_assets`

Stores uploaded media metadata.

```txt
id
post_id nullable
b2_bucket
b2_key
original_filename
mime_type
size_bytes
width nullable
height nullable
duration_ms nullable
checksum nullable
status
created_at
updated_at
```

### Status values

```txt
UPLOADING
UPLOADED
FAILED
DELETED
```

### Notes

- `post_id` can be nullable during upload before the post is saved.
- `b2_key` is the storage object key.
- Do not store binary media in this table.

## 7. `publish_targets`

Represents one target platform/account for a post.

```txt
id
post_id
social_account_id
platform
status
scheduled_for
processing_started_at nullable
published_at nullable
platform_post_id nullable
platform_post_url nullable
idempotency_key
last_error_code nullable
last_error_message nullable
retry_count
next_retry_at nullable
created_at
updated_at
```

### Status values

```txt
PENDING
SCHEDULED
PROCESSING
PUBLISHED
FAILED
RETRYING
REAUTH_REQUIRED
CANCELLED
```

### Notes

- A single post can be published to multiple accounts/platforms.
- Each target has its own status.
- `idempotency_key` helps prevent duplicate publishing.

## 8. `publish_attempts`

Stores every attempt to publish a target.

```txt
id
publish_target_id
attempt_number
status
request_payload_json nullable
response_payload_json nullable
error_code nullable
error_message nullable
started_at
finished_at nullable
created_at
```

### Status values

```txt
STARTED
SUCCESS
FAILED
SKIPPED
```

### Notes

- This table is required for debugging.
- Never store raw tokens in payload logs.
- Sanitize platform responses before storing if they include sensitive data.

## 9. Prisma Schema Draft

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model SocialAccount {
  id                    String    @id @default(cuid())
  ownerId               String?   @map("owner_id")
  workspaceId           String?   @map("workspace_id")
  platform              String
  displayName           String?   @map("display_name")
  platformAccountId     String    @map("platform_account_id")
  accessTokenEncrypted  String    @map("access_token_encrypted")
  refreshTokenEncrypted String?   @map("refresh_token_encrypted")
  expiresAt             DateTime? @map("expires_at")
  scopesJson            Json?     @map("scopes_json")
  status                String
  metadataJson          Json?     @map("metadata_json")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  publishTargets PublishTarget[]

  @@index([platform, status])
  @@index([ownerId])
  @@index([workspaceId])
  @@map("social_accounts")
}

model Post {
  id          String    @id @default(cuid())
  ownerId     String?   @map("owner_id")
  workspaceId String?   @map("workspace_id")
  caption     String
  scheduledFor DateTime? @map("scheduled_for")
  status      String
  cancelledAt DateTime? @map("cancelled_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  mediaAssets    MediaAsset[]
  publishTargets PublishTarget[]

  @@index([status, scheduledFor])
  @@index([ownerId, createdAt])
  @@index([workspaceId, createdAt])
  @@map("posts")
}

model MediaAsset {
  id               String   @id @default(cuid())
  postId           String?  @map("post_id")
  b2Bucket         String   @map("b2_bucket")
  b2Key            String   @map("b2_key")
  originalFilename String   @map("original_filename")
  mimeType         String   @map("mime_type")
  sizeBytes        Int      @map("size_bytes")
  width            Int?
  height           Int?
  durationMs       Int?     @map("duration_ms")
  checksum         String?
  status           String
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  post Post? @relation(fields: [postId], references: [id], onDelete: SetNull)

  @@index([postId])
  @@index([status, createdAt])
  @@unique([b2Bucket, b2Key])
  @@map("media_assets")
}

model PublishTarget {
  id                  String    @id @default(cuid())
  postId              String    @map("post_id")
  socialAccountId     String    @map("social_account_id")
  platform            String
  status              String
  scheduledFor        DateTime  @map("scheduled_for")
  processingStartedAt DateTime? @map("processing_started_at")
  publishedAt         DateTime? @map("published_at")
  platformPostId      String?   @map("platform_post_id")
  platformPostUrl     String?   @map("platform_post_url")
  idempotencyKey      String    @unique @map("idempotency_key")
  lastErrorCode       String?   @map("last_error_code")
  lastErrorMessage    String?   @map("last_error_message")
  retryCount          Int       @default(0) @map("retry_count")
  nextRetryAt         DateTime? @map("next_retry_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  post          Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  socialAccount SocialAccount @relation(fields: [socialAccountId], references: [id])
  attempts      PublishAttempt[]

  @@index([status, scheduledFor])
  @@index([postId])
  @@index([socialAccountId])
  @@index([platform, status])
  @@map("publish_targets")
}

model PublishAttempt {
  id              String    @id @default(cuid())
  publishTargetId String    @map("publish_target_id")
  attemptNumber   Int       @map("attempt_number")
  status          String
  requestPayloadJson  Json? @map("request_payload_json")
  responsePayloadJson Json? @map("response_payload_json")
  errorCode       String?   @map("error_code")
  errorMessage    String?   @map("error_message")
  startedAt       DateTime  @map("started_at")
  finishedAt      DateTime? @map("finished_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  publishTarget PublishTarget @relation(fields: [publishTargetId], references: [id], onDelete: Cascade)

  @@index([publishTargetId, createdAt])
  @@index([status, createdAt])
  @@map("publish_attempts")
}
```

## 10. Query Rules

- List posts with pagination.
- List attempts only for one target/post.
- Use `select` by default.
- Never use unbounded `findMany`.
- Never instantiate PrismaClient outside the shared Prisma file.
- No external social API calls inside transactions.
