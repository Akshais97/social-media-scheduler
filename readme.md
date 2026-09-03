# Social Media Scheduler MVP

A standalone Social Media Scheduler MVP for validating the complete publishing flow before integrating the scheduler into the main Sakhaa Forge application.

The MVP is intentionally small. It is designed to prove one core workflow:

```txt
Login → Upload Media → Store in B2 → Create Post → Schedule → Worker → Publish Attempt → Status
```

This repository currently contains documentation for the MVP architecture and a frontend app shell under `sakhaa-forge-app/`.

---

## Project Purpose

The goal of this project is to validate whether scheduled social publishing can work reliably as an independent module before it is merged into a larger application.

The standalone app should act as a temporary wrapper around a reusable publisher core.

```txt
Standalone scheduler app now
        ↓
Reusable publisher core
        ↓
Integrated feature inside main application later
```

---

## MVP Scope

This project is not meant to become a full SaaS product at this stage.

The MVP should prove:

* Media upload works.
* Media is stored in Backblaze B2.
* Post metadata is stored in Supabase Postgres.
* Scheduled posts can be detected later.
* A Railway cron/worker can process due posts.
* A platform adapter can attempt publishing.
* Publishing attempts are stored.
* The UI clearly shows scheduled, processing, published, failed, cancelled, retrying, and reauth-required states.
* The publisher core can later be reused inside the main app.

---

## What This MVP Is Not

Do not add these features in the MVP unless explicitly approved:

* Multi-user signup
* Team management
* RBAC
* Agency workspaces
* Billing
* Subscription plans
* Social analytics
* Social inbox
* Comment replies
* Campaign management
* AI captions
* AI hashtags
* Calendar drag/drop
* X/Twitter integration
* Notification emails
* Mobile app

---

## Current Repository Structure

```txt
social-media-scheduler/
  docs/
    00_project_overview.md
    01_prd.md
    02_mvp_scope.md
    03_architecture.md
    04_tech_stack_decisions.md
    05_data_models.md
    06_api_contracts.md
    07_upload_and_storage_flow.md
    08_scheduling_and_publishing_workflow.md
    09_social_platform_integrations.md
    10_status_enums_and_error_states.md
    11_frontend_spec.md
    12_backend_spec.md
    13_security_and_env_guardrails.md
    14_testing_checklist.md
    15_setup_runbook.md
    16_ai_coding_guardrails.md

  sakhaa-forge-app/
    src/
    package.json
    vite.config.ts
    tsconfig.json
    index.html
    .env.example
```

Recommended future structure:

```txt
social-media-scheduler/
  apps/
    web/
    api/
  packages/
    publisher-core/
  docs/
```

---

## Planned Deployment Stack

| Layer         | Service                           |
| ------------- | --------------------------------- |
| Frontend      | Vercel                            |
| Backend/API   | Railway                           |
| Database      | Supabase Postgres                 |
| Media Storage | Backblaze B2                      |
| Scheduler     | Railway Cron or Railway Worker    |
| Queue         | Postgres-backed job/status tables |
| Auth          | Temporary single-user login       |

---

## Recommended Tech Stack

| Area       | Decision                                   |
| ---------- | ------------------------------------------ |
| Language   | TypeScript                                 |
| Frontend   | React + Vite or Next.js                    |
| UI         | TailwindCSS + shadcn/ui                    |
| Forms      | React Hook Form                            |
| Validation | Zod                                        |
| Backend    | NestJS                                     |
| Database   | Supabase Postgres                          |
| ORM        | Prisma                                     |
| Storage    | Backblaze B2                               |
| Worker     | Railway Cron or lightweight Railway worker |
| Queue      | Postgres-backed status/job tables          |
| Auth       | Temporary single-user session              |
| Redis      | Not used in MVP                            |
| Email      | Not used in MVP                            |

The current frontend app under `sakhaa-forge-app/` uses React, Vite, TypeScript, Tailwind, Motion, Lucide icons, Express, and dotenv.

---

## Core User Journey

```txt
1. User logs in with the configured test credential.
2. User uploads image/video media.
3. Browser uploads media directly to Backblaze B2 using a presigned URL.
4. Backend stores media metadata in Supabase Postgres.
5. User writes a caption.
6. User selects connected platform/account.
7. User selects scheduled date and time.
8. Backend creates post and publish target rows.
9. Worker or Railway cron checks for due posts.
10. Worker claims due target safely.
11. Worker creates publish attempt row.
12. Worker calls the correct platform adapter.
13. Adapter returns success or failure.
14. Worker updates target and post status.
15. User can view status, history, attempts, and error details.
```

---

## Architecture

```txt
User
 ↓
Frontend App
 ↓ HTTPS
Backend API
 ├── Supabase Postgres
 ├── Backblaze B2
 └── Social Platform APIs

Railway Cron / Worker
 ↓
Supabase Postgres
 ↓
Due publish targets
 ↓
Publisher Service
 ↓
Platform Adapter
 ↓
Social Platform API
```

The database is the source of truth for post state.

The frontend must never publish directly to social platform APIs.

---

## Main Backend Modules

The backend should be built as a modular monolith.

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

### AuthModule

Handles temporary single-user login, logout, session validation, and auth guards.

### PostsModule

Handles draft/scheduled post creation, listing, detail view, updates, cancellation, media attachment, and target creation.

### MediaModule

Validates upload requests, requests B2 presigned URLs, completes uploads, and stores media metadata.

### StorageModule

Owns Backblaze B2 integration, presigned upload generation, publishable URL generation, and optional file stream access.

### SchedulerModule

Finds due publish targets, claims targets, handles retry state, and triggers publishing.

### PublisherModule

Loads post/media/account data, creates publish attempts, calls platform adapters, and maps platform errors.

### SocialAccountsModule

Starts OAuth, handles callbacks, stores encrypted tokens, lists connected accounts, disconnects accounts, and marks accounts as reauth required.

### PlatformAdaptersModule

Keeps platform-specific behavior isolated behind adapters.

---

## Core Data Models

The MVP data model should include:

```txt
users
social_accounts
posts
media_assets
publish_targets
publish_attempts
```

### users

Temporary single-user login table.

### social_accounts

Stores connected social accounts and encrypted platform tokens.

### posts

Represents the main draft or scheduled post.

### media_assets

Stores uploaded media metadata and B2 object keys.

Media binaries must never be stored in Postgres.

### publish_targets

Represents one platform/account destination for a post.

A single post can have multiple publish targets.

### publish_attempts

Stores every attempt to publish a target.

Attempts are required for debugging and safe retries.

---

## Status Model

### Post Statuses

```txt
DRAFT
SCHEDULED
PROCESSING
PUBLISHED
PARTIALLY_PUBLISHED
FAILED
CANCELLED
```

### Publish Target Statuses

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

### Publish Attempt Statuses

```txt
STARTED
SUCCESS
FAILED
SKIPPED
```

### Social Account Statuses

```txt
CONNECTED
EXPIRED
REAUTH_REQUIRED
REVOKED
ERROR
```

### Media Asset Statuses

```txt
UPLOADING
UPLOADED
FAILED
DELETED
```

Do not invent new status strings casually. Update the status enum documentation first if a new state is required.

---

## Upload and Storage Flow

Media upload must not route large files through the backend server.

Correct flow:

```txt
Frontend
 ↓
POST /media/presign-upload
 ↓
Backend validates filename, MIME type, and size
 ↓
Backend creates B2 object key and presigned upload URL
 ↓
Frontend uploads file directly to B2
 ↓
Frontend calls POST /media/complete-upload
 ↓
Backend creates media_assets row
```

Recommended B2 key format:

```txt
social-scheduler/uploads/{yyyy}/{mm}/{post-or-upload-id}/{safe-filename}
```

Example:

```txt
social-scheduler/uploads/2026/08/upload_cuid123/post-video.mp4
```

---

## Allowed Media Types

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

Recommended MVP limits:

```txt
Images: 10 MB
Videos: 200 MB
```

---

## Publishing URL Strategy

Some platforms need a URL that their servers can fetch.

Do not make all media files permanently public.

Use one of these strategies:

### Option A — Temporary Signed URL

Generate a short-lived URL at publish time.

Use this when the platform accepts signed URLs.

### Option B — Temporary Public Copy

Copy media to a temporary public publishing prefix and delete later.

Use only when the platform cannot fetch signed URLs.

### Option C — Direct Upload to Platform

Stream the media server-side into the platform API.

Use only when the platform requires direct file transfer.

---

## Scheduling and Worker Flow

The worker must reliably publish due posts without duplicates.

```txt
1. Worker finds publish targets where status is SCHEDULED or RETRYING.
2. Worker checks scheduled_for <= now.
3. Worker claims the target atomically.
4. Worker creates a publish_attempt row.
5. Worker loads post, media, and social account.
6. Worker validates account, token, media, and platform constraints.
7. Worker calls PublisherService.
8. PublisherService calls the platform adapter.
9. Worker stores success or failure.
10. Worker updates publish target and parent post status.
```

Worker claim rule:

```sql
UPDATE publish_targets
SET status = 'PROCESSING', processing_started_at = now()
WHERE id = :target_id
AND status IN ('SCHEDULED', 'RETRYING');
```

If zero rows are updated, another worker already claimed the target.

---

## Retry Rules

Retryable errors:

```txt
NETWORK_ERROR
RATE_LIMITED
TEMPORARY_PLATFORM_ERROR
TIMEOUT
```

Non-retryable errors:

```txt
TOKEN_EXPIRED
PERMISSION_MISSING
MEDIA_REJECTED
UNSUPPORTED_FORMAT
PLATFORM_VALIDATION_FAILED
ACCOUNT_REVOKED
```

Recommended MVP retry backoff:

```txt
Attempt 1: 5 minutes
Attempt 2: 15 minutes
Attempt 3: 60 minutes
After 3 attempts: FAILED
```

Unknown timeout rule:

```txt
Never blindly retry after an unknown timeout without recording duplicate risk.
```

Use an error like:

```txt
UNKNOWN_AFTER_TIMEOUT
```

and require manual review if duplicate publishing is possible.

---

## Platform Integrations

Initial platform priority:

```txt
V1:
- Instagram
- Facebook Pages

V1.5:
- LinkedIn

Later:
- TikTok
```

Excluded from zero-cost MVP:

```txt
X/Twitter
```

Reason:

```txt
Zero API cost cannot be assumed.
```

Platform-specific behavior must stay inside adapters.

Do not put Instagram, Facebook, LinkedIn, or TikTok logic inside `PostsService`.

---

## Adapter Interface

Recommended adapter interface:

```ts
export interface SocialPublisherAdapter {
  platform: SocialPlatform;

  validatePost(input: PublishInput): Promise<ValidationResult>;

  publish(input: PublishInput): Promise<PublishResult>;

  refreshToken?(input: RefreshTokenInput): Promise<TokenRefreshResult>;
}
```

Shared input shape:

```ts
export interface PublishInput {
  postId: string;
  publishTargetId: string;
  caption: string;
  media: PublishMediaAsset[];
  account: ConnectedSocialAccount;
  idempotencyKey: string;
}
```

Shared result shape:

```ts
export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  rawResponse?: unknown;
  error?: PublishError;
}
```

---

## API Overview

### Auth

```txt
POST /auth/login
POST /auth/logout
GET /auth/me
```

### Media

```txt
POST /media/presign-upload
POST /media/complete-upload
```

### Posts

```txt
POST /posts
GET /posts
GET /posts/:id
PATCH /posts/:id
DELETE /posts/:id
POST /posts/:id/schedule
POST /posts/:id/publish-now
POST /posts/:id/cancel
GET /posts/:id/status
```

### Worker

```txt
POST /worker/publish-due
```

This endpoint must require:

```txt
X-Worker-Secret: <secret>
```

### Social Accounts

```txt
GET /social-accounts
POST /social-accounts/:platform/connect
GET /social-accounts/:platform/callback
DELETE /social-accounts/:id
```

---

## Frontend Routes

Recommended MVP routes:

```txt
/login
/dashboard
/posts
/posts/new
/posts/:id
/social-accounts
/settings
```

### `/login`

Temporary test-user login.

### `/dashboard`

Minimal overview of scheduled, published, failed, and recent posts.

### `/posts`

Post list with status filter, pagination, status badges, scheduled time, and platform icons.

### `/posts/new`

Post composer with caption, media upload, platform selector, and schedule picker.

### `/posts/:id`

Post details, media preview, target statuses, publish attempts, errors, retry, and cancel actions.

### `/social-accounts`

Connect, reconnect, and disconnect social accounts.

### `/settings`

Basic MVP environment/status settings only.

No billing, team, SaaS, or workspace settings in the MVP.

---

## Local Setup

### Prerequisites

Install:

```txt
Node.js LTS
pnpm or npm
Git
```

Optional:

```txt
PostgreSQL client tools
```

Required accounts for full MVP:

```txt
Vercel
Railway
Supabase
Backblaze B2
Meta Developer Account
```

Later:

```txt
LinkedIn Developer Account
TikTok Developer Account
```

---

## Running the Current Frontend App

The current frontend app is located in:

```txt
sakhaa-forge-app/
```

Install dependencies:

```bash
cd sakhaa-forge-app
npm install
```

Run locally:

```bash
npm run dev
```

The configured Vite dev command runs on port `3000`.

```bash
vite --port=3000 --host=0.0.0.0
```

Build:

```bash
npm run build
```

Type-check/lint:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

---

## Environment Variables

Create environment files locally.

### Current frontend app variables

```txt
GEMINI_API_KEY=
APP_URL=
```

### Planned MVP backend variables

```txt
NODE_ENV=
APP_BASE_URL=
FRONTEND_URL=
API_PORT=
SESSION_SECRET=
TEST_USERNAME=
TEST_PASSWORD_HASH=
WORKER_SECRET=

DATABASE_URL=
DIRECT_URL=

B2_APPLICATION_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
B2_REGION=

TOKEN_ENCRYPTION_KEY=

META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
```

Only add variables for platforms actually being implemented.

Do not commit `.env` files.

---

## Security Rules

Never expose these to the frontend:

```txt
B2_APPLICATION_KEY
B2 application secret
Platform client secrets
Access tokens
Refresh tokens
Worker secret
Token encryption key
```

Never log:

```txt
Access tokens
Refresh tokens
OAuth authorization codes
B2 secret keys
Sensitive signed URLs
Full OAuth callback URLs
```

Auth rules:

```txt
Use password hash, not plain password.
Use HTTP-only cookies.
Use secure cookies in production.
Use same-site cookie protection.
Do not store session tokens in localStorage.
```

CORS rules:

```txt
Allow only known frontend origins.
Do not use wildcard origins in production.
```

---

## Backend Development Rules

Controllers should:

```txt
Parse route params
Apply guards
Validate DTOs
Call services
Return DTO responses
```

Controllers should not:

```txt
Contain Prisma queries
Contain B2 logic
Contain platform API calls
Contain publishing state-machine logic
```

Repositories should be thin and specific.

Good examples:

```ts
findDuePublishTargets(limit: number)
findPostForPublishing(postId: string)
markPublishTargetProcessing(targetId: string)
createPublishAttempt(input)
```

Avoid:

```ts
findAll(filters)
genericUpdate(id, data)
BaseRepository<T>
```

---

## Prisma Rules

```txt
Use a single shared PrismaClient.
Keep Prisma queries in repository/data-access files.
Use select by default.
Paginate growing lists.
Avoid unbounded findMany.
Avoid Prisma queries inside loops without review.
Keep transactions short and database-only.
Never call social APIs inside DB transactions.
```

---

## Testing Checklist

Before calling the MVP stable, verify:

### Auth

```txt
[ ] Valid login succeeds.
[ ] Invalid login fails.
[ ] Logout clears session.
[ ] Protected routes reject unauthenticated requests.
```

### Media

```txt
[ ] Image upload presign succeeds.
[ ] Video upload presign succeeds.
[ ] Unsupported MIME type is rejected.
[ ] Oversized media is rejected.
[ ] Browser can upload directly to B2.
[ ] Complete upload creates media_assets row.
```

### Posts

```txt
[ ] Draft post can be created.
[ ] Scheduled post can be created.
[ ] Past scheduled time is rejected.
[ ] Post list shows created posts.
[ ] Post detail shows media and target status.
```

### Scheduler

```txt
[ ] Worker finds due scheduled targets.
[ ] Worker ignores future targets.
[ ] Worker ignores cancelled targets.
[ ] Worker ignores already published targets.
[ ] Worker claims target atomically.
[ ] Worker creates publish_attempt row.
[ ] Worker does not duplicate processing if called twice.
```

### Publishing

```txt
[ ] Adapter validates media.
[ ] Adapter validates account token.
[ ] Missing token returns REAUTH_REQUIRED.
[ ] Platform rejection is mapped clearly.
[ ] Rate limit is mapped clearly.
[ ] Success stores platform_post_id.
[ ] Success stores platform_post_url when available.
[ ] Failure stores error code and message.
```

### Security

```txt
[ ] B2 keys are not exposed in frontend bundle.
[ ] Platform secrets are not exposed in frontend bundle.
[ ] Access tokens are not returned to frontend.
[ ] Worker endpoint rejects missing secret.
[ ] Worker endpoint rejects invalid secret.
[ ] CORS allows only configured origins.
```

---

## Deployment Plan

### Frontend: Vercel

1. Import the frontend app.
2. Set the frontend root directory.
3. Add frontend environment variables.
4. Deploy.
5. Confirm login and API connectivity.

### Backend/API: Railway

1. Create Railway project.
2. Connect repository.
3. Set backend root directory.
4. Add backend environment variables.
5. Deploy.
6. Confirm health/API endpoints work.

### Database: Supabase Postgres

1. Create Supabase project.
2. Copy database connection strings.
3. Set `DATABASE_URL` for runtime.
4. Set `DIRECT_URL` for migrations.
5. Run Prisma migrations.

### Storage: Backblaze B2

1. Create B2 bucket.
2. Create application key.
3. Configure CORS for local and production frontend origins.
4. Add B2 credentials to backend environment variables.
5. Test direct browser upload.

### Scheduler: Railway Cron or Worker

Option A:

```txt
Railway Cron → POST /worker/publish-due
```

Option B:

```txt
Railway Worker → Poll Postgres every N seconds
```

For the MVP, Railway Cron is acceptable.

For more accurate scheduling, use a lightweight Railway worker loop.

---

## Manual Worker Test

Example local worker call:

```bash
curl -X POST http://localhost:4000/worker/publish-due \
  -H "Content-Type: application/json" \
  -H "X-Worker-Secret: your-worker-secret" \
  -d '{"limit":10}'
```

Expected response:

```json
{
  "processed": 3,
  "published": 2,
  "failed": 1
}
```

---

## Common Issues

### B2 CORS failure

Symptoms:

```txt
Browser upload blocked by CORS/preflight.
```

Fix:

```txt
Allow local and production frontend origins.
Allow required HTTP methods.
Allow required headers.
```

### Invalid database connection

Symptoms:

```txt
Prisma cannot connect.
```

Fix:

```txt
Check DATABASE_URL.
Check DIRECT_URL for migrations.
Do not use migration URL at runtime.
```

### Worker unauthorized

Symptoms:

```txt
401 from /worker/publish-due.
```

Fix:

```txt
Check WORKER_SECRET.
Check X-Worker-Secret header.
```

### Platform cannot access media

Symptoms:

```txt
Publishing fails after upload succeeded.
```

Fix:

```txt
Ensure publishable URL is accessible from platform servers.
Use temporary public copy or direct upload if signed URLs fail.
```

---

## Development Guardrails

Before marking any task complete:

```txt
[ ] Relevant docs were followed.
[ ] API contract was not silently changed.
[ ] DB schema change is documented.
[ ] Status values come from the enum document.
[ ] No unapproved dependency was added.
[ ] No secret is exposed to frontend.
[ ] No unbounded Prisma query was added.
[ ] Error states are handled.
[ ] Loading, empty, and error UI states exist where needed.
[ ] Manual verification steps are provided.
```

---

## MVP Completion Definition

The MVP is complete when:

```txt
[ ] Login works.
[ ] Media upload to B2 works.
[ ] Scheduled posts can be created.
[ ] Scheduled posts are stored in Postgres.
[ ] Worker/cron detects due posts.
[ ] Publish attempt rows are created.
[ ] Status transitions are correct.
[ ] UI shows post history.
[ ] Failed posts show actionable error messages.
[ ] At least one real platform adapter works or is clearly adapter-ready.
[ ] No secrets leak to frontend or logs.
[ ] Publisher logic can be reused later.
```

---

## Documentation Index

Read the docs in this order:

```txt
docs/00_project_overview.md
docs/01_prd.md
docs/02_mvp_scope.md
docs/03_architecture.md
docs/04_tech_stack_decisions.md
docs/05_data_models.md
docs/06_api_contracts.md
docs/07_upload_and_storage_flow.md
docs/08_scheduling_and_publishing_workflow.md
docs/09_social_platform_integrations.md
docs/10_status_enums_and_error_states.md
docs/11_frontend_spec.md
docs/12_backend_spec.md
docs/13_security_and_env_guardrails.md
docs/14_testing_checklist.md
docs/15_setup_runbook.md
docs/16_ai_coding_guardrails.md
```

---

## Current Status

This repository currently contains:

```txt
Documentation for the Social Media Scheduler MVP
Frontend app shell under sakhaa-forge-app/
```

The backend, database schema, B2 upload flow, worker, and real social platform adapters should be implemented according to the documents in `docs/`.

---

## License

No License / All Rights Reserved
