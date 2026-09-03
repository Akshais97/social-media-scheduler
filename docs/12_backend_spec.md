# Backend Specification — Social Media Scheduler MVP

## 1. Goal

Build a NestJS backend that handles auth, media upload preparation, post scheduling, publishing orchestration, social account connections, and worker processing.

The backend should be modular and easy to integrate into the main application later.

## 2. Recommended Modules

```txt
AuthModule
PostsModule
MediaModule
StorageModule
SchedulerModule
PublisherModule
SocialAccountsModule
PlatformAdaptersModule
```

## 3. Module Responsibilities

## AuthModule

Responsibilities:

- Temporary single-user login
- Session/cookie validation
- Logout
- Auth guard

Do not build:

- Signup
- Password reset
- Team invitations
- RBAC
- Supabase Auth in MVP

## PostsModule

Responsibilities:

- Create draft/scheduled posts
- List posts
- Get post details
- Update editable posts
- Cancel scheduled posts
- Attach media assets
- Create publish targets

## MediaModule

Responsibilities:

- Validate media upload requests
- Generate B2 presigned upload details through StorageModule
- Complete upload
- Save media metadata

## StorageModule

Responsibilities:

- Backblaze B2 integration
- Presigned upload URL creation
- Publishable URL creation
- Optional file stream access later

## SchedulerModule

Responsibilities:

- Find due publish targets
- Claim due targets
- Trigger PublisherService
- Handle retries
- Update status

## PublisherModule

Responsibilities:

- Orchestrate publishing
- Load post/media/account
- Select correct platform adapter
- Create/update publish attempts
- Classify errors

## SocialAccountsModule

Responsibilities:

- Start OAuth flow
- Handle OAuth callback
- Store encrypted tokens
- List connected accounts
- Disconnect account
- Mark account as reauth required

## PlatformAdaptersModule

Responsibilities:

- Provide platform-specific publishing implementations
- Meta adapter
- LinkedIn adapter later
- TikTok adapter later

## 4. Services

```txt
AuthService
PostsService
MediaService
B2StorageService
SchedulerService
PublisherService
SocialAccountsService
TokenEncryptionService
InstagramPublisherAdapter
FacebookPublisherAdapter
LinkedInPublisherAdapter
TikTokPublisherAdapter
```

## 5. Repositories

```txt
users.repository.ts
posts.repository.ts
media-assets.repository.ts
publish-targets.repository.ts
publish-attempts.repository.ts
social-accounts.repository.ts
```

## 6. Repository Rules

- Repositories must be thin.
- Repositories must expose specific query functions.
- Do not create generic CRUD repositories.
- Do not hide query shape behind vague abstractions.

Good:

```ts
findDuePublishTargets(limit: number)
findPostForPublishing(postId: string)
markPublishTargetProcessing(targetId: string)
createPublishAttempt(input)
```

Bad:

```ts
findAll(filters)
genericUpdate(id, data)
BaseRepository<T>
```

## 7. Prisma Rules

- Use a single shared PrismaClient.
- Prisma calls live in repository/data-access files.
- Use `select` by default.
- Use `where`, `take`, and `orderBy` for lists.
- Paginate growing lists.
- No Prisma queries inside loops without review.
- No external API calls inside transactions.

## 8. Controller Rules

Controllers should:

- Parse route params.
- Apply guards.
- Validate DTOs.
- Call services.
- Return DTO responses.

Controllers should not:

- Contain Prisma queries.
- Contain B2 logic.
- Contain platform API calls.
- Contain publishing state-machine logic.

## 9. DTO Validation

Use DTOs for:

```txt
LoginDto
PresignUploadDto
CompleteUploadDto
CreatePostDto
UpdatePostDto
SchedulePostDto
ConnectSocialAccountDto
WorkerPublishDueDto
```

All DTOs must validate:

- Required fields
- String lengths
- MIME types
- Schedule time
- Account IDs
- Media IDs

## 10. Worker Security

If using cron endpoint:

```txt
POST /worker/publish-due
```

Require:

```txt
X-Worker-Secret
```

Reject invalid requests with `401`.

## 11. Error Handling

Use standard API error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Caption is required.",
    "details": {}
  }
}
```

Platform errors must be mapped to app-level error codes.

Do not return raw token-containing platform errors to frontend.

## 12. Logging

Log:

- Request ID
- Publish target ID
- Publish attempt ID
- Platform
- Error code
- High-level failure reason

Do not log:

- Access tokens
- Refresh tokens
- OAuth authorization codes
- B2 secret keys
- Full signed URLs if sensitive

## 13. Backend Folder Structure

```txt
src/
  main.ts
  app.module.ts
  common/
    guards/
    decorators/
    filters/
    errors/
  lib/
    prisma.ts
  modules/
    auth/
    posts/
    media/
    storage/
    scheduler/
    publisher/
    social-accounts/
    platform-adapters/
```

## 14. Completion Criteria

Backend is MVP-ready when:

- Login works.
- B2 upload presign works.
- Media completion works.
- Posts can be created/listed/viewed.
- Due targets can be processed.
- Publish attempts are recorded.
- At least one adapter can be plugged in.
- Errors are mapped clearly.
- No sensitive secrets are exposed.
