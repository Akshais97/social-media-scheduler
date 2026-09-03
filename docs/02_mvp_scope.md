# MVP Scope — Social Media Scheduler

## 1. Scope Principle

The MVP should validate the scheduling and publishing workflow without becoming a complete SaaS product.

Build the smallest version that proves:

```txt
Upload → Store → Schedule → Worker → Publish Attempt → Status
```

## 2. MVP Includes

### Core App

- Single login page
- Dashboard/post list
- Create post page
- Post details page
- Social accounts page

### Post Creation

- Caption field
- Media upload
- Date/time picker
- Platform/account selector
- Save scheduled post

### Storage

- Backblaze B2 presigned upload URL
- Direct browser upload to B2
- Media metadata saved in Postgres

### Scheduling

- `scheduled_for` timestamp
- Due post detection
- Railway cron or lightweight worker
- Status updates

### Publishing

- Platform adapter interface
- At least one initial real adapter
- Publish attempt records
- Error capture

### Status Handling

- Draft
- Scheduled
- Processing
- Published
- Failed
- Cancelled
- Retrying
- Reauth required

## 3. MVP Excludes

Do not build:

- Signup flow
- Multi-user auth
- Team management
- Tenant/workspace management
- RBAC
- Billing
- Subscription plans
- Usage metering
- Analytics
- Campaign folders
- Approval workflows
- Client review links
- AI captions
- AI hashtags
- Social inbox
- Comments/replies
- Notification emails
- X/Twitter integration
- Mobile app

## 4. Build Phases

## Phase 1 — Scheduler Shell

Goal: prove upload and scheduled post persistence.

Tasks:

- Create project structure.
- Configure database.
- Add temporary login.
- Add post composer UI.
- Add B2 upload flow.
- Save post metadata.
- Show post list.

Expected result:

```txt
User can create scheduled posts, but they are not posted to real social platforms yet.
```

## Phase 2 — Worker and State Machine

Goal: prove due post detection.

Tasks:

- Add worker endpoint or worker process.
- Query scheduled posts where `scheduled_for <= now`.
- Mark due posts as `PROCESSING`.
- Write publish attempt row.
- Mark test result as `PUBLISHED` or `FAILED` using a mock adapter.

Expected result:

```txt
The system can reliably process scheduled posts using the database state machine.
```

## Phase 3 — First Real Platform Adapter

Goal: publish to one real platform.

Recommended first integration:

- Instagram/Facebook via Meta

Tasks:

- Add social account connect flow.
- Store encrypted access token.
- Add platform adapter.
- Publish using stored media URL.
- Store platform response.

Expected result:

```txt
One real scheduled post can be published successfully.
```

## Phase 4 — Reliability

Goal: prevent duplicate and silent failures.

Tasks:

- Add idempotency key.
- Add retryable/non-retryable error categories.
- Add retry button.
- Add reauth-required handling.
- Add publish attempt drawer in UI.

Expected result:

```txt
Failures are explainable and safe to retry where appropriate.
```

## Phase 5 — Additional Platforms

Add only after the first real adapter is stable.

Order:

1. LinkedIn
2. TikTok
3. Other platforms only if needed

## 5. Completion Definition

The MVP is complete when:

- A post can be scheduled.
- The media is saved in B2.
- Metadata is saved in Supabase Postgres.
- The worker detects due posts.
- At least one platform publish path works or is adapter-ready.
- Failed posts are visible with error details.
- The codebase remains reusable for later integration.
