# Sakhaa Forge Social Scheduler — Sprint 2 Documentation  
## Sprint 2: Worker Processing, Mock Publishing Adapter, Attempt Timeline, Retry-Safe State Machine

## 0. Sprint Intent

Sprint 2 turns the Sprint 1 scheduler shell into an operational scheduling system.

Sprint 1 created:

```txt id="g2lhda"
Manual upload
→ Draft Composer JSONB
→ Mock platform targets
→ Schedule date/time/timezone
→ Scheduled post list/detail page
```

Sprint 2 adds the missing execution layer:

```txt id="k3y5d7"
Scheduled post
→ Due detection
→ Worker claim
→ Mock publish adapter
→ Publish attempt logging
→ Target status updates
→ Post status recalculation
→ Retry/failure visibility
```

This sprint still does **not** connect real Facebook, Instagram, Pinterest, YouTube, or Twitter/X APIs.

Sprint 2 proves that the scheduler can reliably process due posts and show users exactly what happened.

The uploaded scheduler workflow already defines the core state flow as:

```txt id="9qmcgg"
SCHEDULED
→ PROCESSING
→ PUBLISHED / FAILED / RETRYING
```

and requires due detection, atomic claim, attempt logging, retry classification, and final status updates.

---

## 1. Sprint 2 Name

```txt id="2xevqi"
Sprint 2 — Mock Publishing Worker & Attempt Timeline
```

Alternative internal label:

```txt id="ocnkqe"
Sprint 2 — Scheduler Execution Engine
```

---

## 2. Sprint 2 Outcome

By the end of Sprint 2:

1. A post scheduled in Sprint 1 can become due.
2. A backend worker can find due scheduled targets.
3. The worker can safely claim targets without double-publishing.
4. Each target creates a publish attempt row.
5. A mock platform adapter simulates success, failure, timeout, and retryable errors.
6. The UI shows post-level and platform-level processing status.
7. The detail page shows an attempt timeline.
8. Users can manually run mock processing in development/admin mode.
9. Cancelled posts are skipped.
10. Workspace isolation remains enforced.

---

## 3. In Scope

Sprint 2 includes:

1. Worker route/API endpoint for due scheduled targets.
2. Worker secret protection.
3. Due-target query.
4. Atomic claim/locking logic.
5. Platform target state machine.
6. Post state recalculation.
7. `SocialPublishAttempt` database model.
8. Mock publisher adapter.
9. Mock result simulator.
10. Retryable vs non-retryable error classification.
11. Attempt timeline UI.
12. Scheduler dashboard status refresh.
13. Manual “Process due posts” developer/admin button.
14. Basic worker logs.
15. Functional tests for due processing and attempt history.

---

## 4. Out of Scope

Sprint 2 must **not** implement:

```txt id="uwuo7n"
Meta OAuth
Facebook real publishing
Instagram real publishing
Pinterest real publishing
YouTube real publishing
Twitter/X real publishing
Real access token storage
Refresh token rotation
Real external post IDs
Real public social URLs
Real platform rate-limit handling
Real analytics
Post verification
Social inbox
Comment fetching
Approval workflow
Drag-and-drop calendar
AI caption generation
```

Real platform connections start only after the mock worker proves the scheduler state machine.

---

## 5. Existing System Alignment

The current repository already contains a worker area under `workers/queue`, including queue processor files, so Sprint 2 should extend the existing worker pattern instead of inventing a separate standalone worker app. 

The root package already includes a queue script through `dev:queue`, meaning local development should be able to run the scheduler worker beside the web and API processes. 

The existing database already has job/outbox-style infrastructure concepts such as jobs, job attempts, dependencies, events, outbox events, inbox events, leases, statuses, and retry scheduling. 

Sprint 2 should reuse the existing design philosophy:

```txt id="mnx1xx"
Durable database state
Idempotent operations
Attempt records
Explicit status transitions
No hidden simulated success
No cross-workspace leakage
```

---

# 6. Sprint 2 User Experience

## 6.1 UX Principle

Sprint 1 gave the user a way to create a scheduled post.

Sprint 2 must make the user confident that the system knows:

```txt id="v4rwsw"
What is waiting
What is due
What is processing
What succeeded
What failed
What will retry
What was cancelled
```

The UX must remain consistent with the existing `/brand-extract`, `/app/branding`, and homepage flow:

```txt id="gjqs7w"
Dark premium app shell
Step-led status panels
Timeline visibility
Clear state chips
No generic admin-only queue table
```

The existing app already uses a persistent premium header, main workflow viewport, active brand/workspace object, and guided studio layout in `/brand-extract`.  Sprint 2 should extend that pattern into scheduler status visibility.

---

# 7. Updated Routes

Sprint 1 routes remain:

```txt id="7ugqdn"
/app/social-scheduler
/app/social-scheduler/new
/app/social-scheduler/[postId]
```

Sprint 2 adds:

```txt id="ep6h6w"
/app/social-scheduler/worker
```

This page is optional and should be visible only in development/admin mode.

Recommended purpose:

```txt id="ovx2ie"
Internal worker control and diagnostics page
```

If you do not want a separate page, add an admin-only diagnostics drawer inside:

```txt id="c13ziq"
/app/social-scheduler
```

---

# 8. Scheduler Home Page Updates

Route:

```txt id="wou4cf"
/app/social-scheduler
```

## 8.1 New Status Tabs

Existing Sprint 1 tabs:

```txt id="cyp9mq"
All
Draft
Scheduled
Mock Ready
Failed
```

Sprint 2 updates tabs to:

```txt id="zrt6y6"
All
Draft
Scheduled
Due
Processing
Published Mock
Retrying
Failed
Cancelled
```

## 8.2 Post Card Updates

Each post card must now show:

```txt id="vq8ri7"
Thumbnail
Post title
Workspace/client
Platform chips
Scheduled time
Post status
Target status summary
Last attempt time
Next retry time if any
```

Example card:

```txt id="q7y2zz"
Weekend property walkthrough
Mantri Developers
Instagram · Facebook · Pinterest
Scheduled: 03 Sep 2026, 10:30 AM IST
Status: Processing
2 targets processing · 1 waiting
```

## 8.3 New Card Actions

Each post card should have:

```txt id="ml8f9i"
View
Edit
Cancel
Run mock publish
```

Button rules:

### View

Always visible.

```txt id="yls204"
View
```

### Edit

Visible only if post is not processing and not terminal.

```txt id="ca77f6"
Edit
```

Disabled when:

```txt id="f1m4h4"
PROCESSING
PUBLISHED_MOCK
CANCELLED
```

Tooltip:

```txt id="8e8ws9"
This post is locked while publishing is in progress.
```

### Cancel

Visible for:

```txt id="p47j18"
DRAFT
SCHEDULED
RETRYING
```

Button text:

```txt id="igpkxr"
Cancel
```

### Run mock publish

Visible only in development/admin mode.

```txt id="qmntq4"
Run mock publish
```

Disabled if:

```txt id="1bvpm2"
post has no due targets
post is cancelled
post is already terminal
```

---

# 9. Post Detail Page Updates

Route:

```txt id="44b15q"
/app/social-scheduler/[postId]
```

Sprint 2 transforms this from a static detail page into a status command center.

## 9.1 Page Sections

The detail page must contain:

```txt id="1s6ho7"
1. Post summary header
2. Media preview
3. Composer content
4. Platform target status panel
5. Attempt timeline
6. Worker diagnostics panel
7. Actions
```

## 9.2 Header Summary

Show:

```txt id="uqdt85"
Post title
Workspace/client
Overall status chip
Scheduled date/time
Timezone
Created by
Last updated
```

Example:

```txt id="bln9is"
Weekend property walkthrough
Workspace: Mantri Developers
Status: Retrying
Scheduled for: 03 Sep 2026, 10:30 AM IST
```

## 9.3 Platform Target Status Panel

Each platform target card shows:

```txt id="7jsao2"
Platform icon/name
Mock account name
Target status
Last attempt result
Attempt count
Next retry time
Last error message
```

Example:

```txt id="0p8mn1"
Instagram
Demo Instagram Business
Status: Retry scheduled
Attempts: 1/3
Next retry: 10:45 AM IST
Reason: Mock timeout
```

## 9.4 Attempt Timeline

Title:

```txt id="ka9fu2"
Publishing timeline
```

Empty state:

```txt id="g9wg2y"
No publishing attempts yet. This post will appear here once the worker processes it.
```

Attempt item fields:

```txt id="f4sy5v"
Attempt number
Platform
Started at
Finished at
Result
Error code
Error message
Mock external ID if success
Worker run ID
```

Timeline visual states:

```txt id="ef6xul"
Success: green chip
Retrying: amber chip
Failed: red chip
Processing: blue/purple chip
Skipped: grey chip
```

## 9.5 Worker Diagnostics Panel

Visible only to admin/developer mode.

Title:

```txt id="0nh862"
Worker diagnostics
```

Fields:

```txt id="04lm8v"
Last worker checked at
Claimed target count
Attempt count
Last worker run ID
Mock adapter mode
```

Buttons:

```txt id="ou16a7"
Process due targets
Simulate success
Simulate retryable failure
Simulate permanent failure
Refresh status
```

These buttons must never be visible to normal client users.

---

# 10. State Machine

## 10.1 Post Statuses

Update Sprint 1 enum.

```prisma id="f0mktv"
enum SocialSchedulerPostStatus {
  DRAFT
  SCHEDULED
  PROCESSING
  PUBLISHED_MOCK
  PARTIALLY_FAILED
  RETRYING
  FAILED
  CANCELLED
}
```

## 10.2 Target Statuses

Update Sprint 1 enum.

```prisma id="82ogn5"
enum SocialSchedulerTargetStatus {
  SELECTED
  SCHEDULED
  DUE
  PROCESSING
  PUBLISHED_MOCK
  RETRYING
  FAILED
  SKIPPED
  CANCELLED
}
```

## 10.3 Attempt Statuses

Create new enum:

```prisma id="gndwai"
enum SocialPublishAttemptStatus {
  STARTED
  SUCCEEDED
  FAILED_RETRYABLE
  FAILED_PERMANENT
  TIMED_OUT
  SKIPPED
}
```

## 10.4 Status Transition Rules

Target transition flow:

```txt id="rctz71"
SCHEDULED
→ DUE
→ PROCESSING
→ PUBLISHED_MOCK
```

Retry flow:

```txt id="vxeiqn"
SCHEDULED
→ DUE
→ PROCESSING
→ RETRYING
→ DUE
→ PROCESSING
→ PUBLISHED_MOCK
```

Failure flow:

```txt id="jgrhn9"
SCHEDULED
→ DUE
→ PROCESSING
→ FAILED
```

Cancellation flow:

```txt id="q96mmk"
SCHEDULED
→ CANCELLED
```

Skipped flow:

```txt id="qe7z9a"
DUE
→ SKIPPED
```

Target must be skipped when:

```txt id="kwqetg"
- Parent post is CANCELLED
- Media asset is missing
- Workspace is inaccessible
- Target platform is incompatible with media
```

## 10.5 Parent Post Status Recalculation

After each worker run:

```txt id="8n1bse"
If all targets PUBLISHED_MOCK → post PUBLISHED_MOCK
If at least one target PROCESSING → post PROCESSING
If at least one target RETRYING and none PROCESSING → post RETRYING
If some targets PUBLISHED_MOCK and some FAILED → post PARTIALLY_FAILED
If all targets FAILED → post FAILED
If all targets CANCELLED → post CANCELLED
Otherwise → post SCHEDULED
```

---

# 11. Database Additions

## 11.1 Add SocialPublishAttempt

```prisma id="ew6ia8"
model SocialPublishAttempt {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String
  targetId          String

  platform          SocialSchedulerPlatform
  attemptNumber     Int

  status            SocialPublishAttemptStatus

  workerRunId       String?
  mockMode          String?

  startedAt         DateTime @default(now())
  finishedAt        DateTime?

  errorCode         String?
  errorMessage      String?
  retryable         Boolean @default(false)
  nextRetryAt       DateTime?

  requestJson       Json?
  responseJson      Json?
  diagnosticsJson   Json?

  externalPostId    String?
  externalPostUrl   String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  post              ScheduledSocialPost @relation(fields: [postId], references: [id])
  target            SocialPublishTarget @relation(fields: [targetId], references: [id])

  @@index([workspaceId, postId])
  @@index([targetId, attemptNumber])
  @@index([workspaceId, status])
  @@index([nextRetryAt])
}
```

## 11.2 Update SocialPublishTarget

Add:

```prisma id="rqsryy"
attemptCount       Int      @default(0)
lastAttemptAt      DateTime?
nextRetryAt        DateTime?
lastErrorCode      String?
lastErrorMessage   String?
lockedAt           DateTime?
lockedBy           String?
mockExternalId     String?
mockExternalUrl    String?
```

## 11.3 Update ScheduledSocialPost

Add:

```prisma id="j3o2l6"
lastProcessedAt    DateTime?
publishedMockAt    DateTime?
failedAt           DateTime?
```

## 11.4 JSON Storage Rules

`requestJson`, `responseJson`, and `diagnosticsJson` are allowed because Sprint 2 uses a mock adapter.

But they must never contain:

```txt id="5tk8fk"
B2 secret keys
Signed upload URLs
Private object keys exposed to client users
OAuth tokens
Refresh tokens
Provider secrets
```

In later real platform sprints, raw provider responses must be sanitized before storage.

---

# 12. Worker API

## 12.1 Process Due Targets Endpoint

Create:

```txt id="u8vpfl"
POST /api/v0/social-scheduler/worker/process-due
```

Headers:

```txt id="inle99"
X-Worker-Secret: <secret>
```

The uploaded workflow explicitly requires worker protection using `X-Worker-Secret`.

Body:

```json id="k0zik8"
{
  "limit": 25,
  "mockMode": "success"
}
```

Allowed `mockMode` values:

```txt id="j2qoq4"
success
retryable_failure
permanent_failure
timeout
mixed
random
```

Response:

```json id="tejd77"
{
  "workerRunId": "worker_run_id",
  "claimedTargets": 5,
  "succeeded": 4,
  "retrying": 1,
  "failed": 0,
  "skipped": 0
}
```

## 12.2 Get Worker Summary Endpoint

Create:

```txt id="sn02k5"
GET /api/v0/social-scheduler/worker/summary?workspaceId=workspace_id
```

Response:

```json id="hs4ots"
{
  "dueTargets": 3,
  "processingTargets": 0,
  "retryingTargets": 2,
  "failedTargets": 1,
  "lastWorkerRunAt": "2026-09-02T15:00:00.000Z"
}
```

Admin/developer only.

---

# 13. Worker Processing Logic

## 13.1 Due Detection

A target is due if:

```txt id="xxjrlk"
target.status IN (SCHEDULED, RETRYING)
AND parentPost.status NOT IN (CANCELLED, DRAFT)
AND parentPost.scheduledAt <= now()
AND target.nextRetryAt IS NULL OR target.nextRetryAt <= now()
```

## 13.2 Atomic Claim

The worker must avoid double-processing.

Use one of:

```txt id="3xieop"
SELECT ... FOR UPDATE SKIP LOCKED
```

or existing repo job/lease mechanism if already available.

Claim update:

```txt id="20h59f"
target.status = PROCESSING
target.lockedAt = now()
target.lockedBy = workerRunId
post.status = PROCESSING
```

## 13.3 Attempt Creation

For every claimed target:

```txt id="vuv1wd"
1. Increment attempt number.
2. Create SocialPublishAttempt with STARTED.
3. Build sanitized mock request payload.
4. Call mock adapter.
5. Update attempt with result.
6. Update target.
7. Recalculate post status.
```

## 13.4 No External Calls Inside DB Transaction

Claim records in a transaction.

Release transaction.

Then call adapter.

Then update result.

Do not call even mock adapter inside the same DB transaction.

This preserves the later real-provider design.

---

# 14. Mock Publisher Adapter

## 14.1 Interface

Create a common adapter interface now.

```ts id="qtfa9i"
type PublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "PINTEREST" | "YOUTUBE" | "X";
  caption: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  scheduledAt: string;
  draftContentJson: unknown;
};

type PublishResult = {
  status: "SUCCEEDED" | "FAILED_RETRYABLE" | "FAILED_PERMANENT" | "TIMED_OUT" | "SKIPPED";
  externalPostId?: string;
  externalPostUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;
  diagnostics?: Record<string, unknown>;
};
```

## 14.2 Mock Adapter File

Recommended path:

```txt id="rro9zn"
apps/api/src/social-scheduler/adapters/mock-social-publisher.adapter.ts
```

or `.mjs` equivalent if API currently uses `.mjs`.

## 14.3 Mock Success Result

```json id="2xelxj"
{
  "status": "SUCCEEDED",
  "externalPostId": "mock_facebook_123",
  "externalPostUrl": "https://mock.social/facebook/mock_facebook_123",
  "diagnostics": {
    "provider": "mock",
    "mode": "success"
  }
}
```

## 14.4 Mock Retryable Failure

```json id="3r0xs6"
{
  "status": "FAILED_RETRYABLE",
  "errorCode": "MOCK_TIMEOUT",
  "errorMessage": "Mock platform timeout. This target will retry.",
  "retryAfterMs": 900000
}
```

## 14.5 Mock Permanent Failure

```json id="866ivy"
{
  "status": "FAILED_PERMANENT",
  "errorCode": "MOCK_INVALID_MEDIA",
  "errorMessage": "Mock platform rejected this media as invalid."
}
```

## 14.6 Mock Timeout

```json id="zjoxut"
{
  "status": "TIMED_OUT",
  "errorCode": "MOCK_PROVIDER_TIMEOUT",
  "errorMessage": "Mock provider did not return in time.",
  "retryAfterMs": 900000
}
```

---

# 15. Retry Rules

Sprint 2 should implement basic retry scheduling.

## 15.1 Retry Attempts

```txt id="r8wd6q"
Max automatic mock attempts: 3
```

## 15.2 Retry Backoff

```txt id="vsvy9d"
Attempt 1 failure → retry after 5 minutes
Attempt 2 failure → retry after 15 minutes
Attempt 3 failure → mark FAILED
```

This matches the uploaded scheduler workflow expectation of controlled retry handling instead of infinite retries.

## 15.3 Retryable Errors

Sprint 2 retryable mock errors:

```txt id="ubnxfr"
MOCK_TIMEOUT
MOCK_RATE_LIMIT
MOCK_TEMPORARY_UNAVAILABLE
```

## 15.4 Permanent Errors

Sprint 2 permanent mock errors:

```txt id="lu6yzt"
MOCK_INVALID_MEDIA
MOCK_UNSUPPORTED_PLATFORM
MOCK_MISSING_MEDIA
MOCK_CANCELLED_POST
```

---

# 16. Scheduled Worker Execution

## 16.1 Local Development

Add or extend local queue command:

```txt id="7mw3l9"
pnpm dev:queue
```

The existing root package already has a queue worker script, so use that pattern rather than introducing a second unrelated process. 

## 16.2 Production

Production can run one of two ways:

### Option A — Railway Cron Hits API Endpoint

```txt id="o5qrf0"
Railway cron
→ POST /api/v0/social-scheduler/worker/process-due
→ X-Worker-Secret
```

### Option B — Dedicated Queue Worker Process

```txt id="08k8xg"
workers/queue
→ wakes on interval
→ calls internal service
→ processes due targets
```

Preferred Sprint 2 option:

```txt id="3csp5u"
Option B if existing worker deployment is already active.
Option A if faster to wire safely.
```

Do not use browser-side timers to process due posts.

---

# 17. Frontend Components Added in Sprint 2

Extend Sprint 1 components.

## New Components

```txt id="gqb5zp"
AttemptTimeline.tsx
AttemptTimelineItem.tsx
PlatformTargetStatusPanel.tsx
PlatformTargetStatusCard.tsx
WorkerDiagnosticsPanel.tsx
WorkerSummaryCard.tsx
RunMockPublishButton.tsx
RetryScheduleBadge.tsx
ProcessingStatusBanner.tsx
```

## Updated Components

```txt id="8srwfj"
SchedulerPostCard.tsx
SchedulerPostList.tsx
SchedulerPostDetail.tsx
SchedulerStatusChip.tsx
SocialSchedulerApp.tsx
```

---

# 18. UX Details — Buttons and States

## 18.1 Processing Banner

Show on detail page if post is processing.

Text:

```txt id="5wsck8"
Publishing worker is processing this scheduled post.
```

Subtext:

```txt id="kty5ba"
The post is locked until the current attempt finishes.
```

Button:

```txt id="k7zw9t"
Refresh status
```

## 18.2 Retrying Banner

Show when at least one target is retrying.

Text:

```txt id="hmr56l"
Some targets will retry automatically.
```

Subtext:

```txt id="mu2ovu"
Temporary mock failures are retried before the post is marked failed.
```

Button:

```txt id="fq8y4l"
View attempts
```

## 18.3 Failed Banner

Text:

```txt id="fg15jm"
Publishing failed for one or more targets.
```

Subtext:

```txt id="95e822"
Open the timeline to review the exact attempt and reason.
```

Buttons:

```txt id="psro5u"
Retry now
Cancel post
```

Sprint 2 rule:

```txt id="x2wbvv"
Retry now is admin/developer only unless product decides otherwise.
```

## 18.4 Published Mock Banner

Text:

```txt id="cog5yk"
Mock publishing completed
```

Subtext:

```txt id="ytt7pr"
This confirms the scheduler flow works. Real platform publishing will be connected in later sprints.
```

Button:

```txt id="rbcd4b"
View timeline
```

---

# 19. Worker Diagnostics Page

Optional route:

```txt id="ce205g"
/app/social-scheduler/worker
```

Visible only to admin/developer.

## 19.1 Page Title

```txt id="hs709x"
Scheduler Worker
```

Subtitle:

```txt id="j9y4dp"
Process due scheduled targets and inspect mock publishing results.
```

## 19.2 Summary Cards

Cards:

```txt id="2ihhph"
Due targets
Processing
Retrying
Failed
Last worker run
```

## 19.3 Controls

Primary button:

```txt id="rl45yp"
Process due targets
```

Dropdown:

```txt id="gapj83"
Mock mode
```

Options:

```txt id="3qfjb8"
Success
Mixed
Retryable failure
Permanent failure
Timeout
Random
```

Limit field:

```txt id="6y94zq"
Batch size
```

Default:

```txt id="tawhbq"
25
```

Secondary button:

```txt id="3zh1dz"
Refresh summary
```

## 19.4 Worker Run Result

After processing, show:

```txt id="ddjvzu"
Worker run ID
Claimed targets
Succeeded
Retrying
Failed
Skipped
Started at
Finished at
```

---

# 20. API Contracts

## 20.1 Process Due Targets

```txt id="n6msrz"
POST /api/v0/social-scheduler/worker/process-due
```

Headers:

```txt id="vfjz4j"
X-Worker-Secret: <secret>
```

Body:

```json id="s3nxl2"
{
  "limit": 25,
  "mockMode": "mixed"
}
```

Response:

```json id="lu2pt9"
{
  "workerRunId": "run_123",
  "claimedTargets": 5,
  "succeeded": 3,
  "retrying": 1,
  "failed": 1,
  "skipped": 0
}
```

## 20.2 Get Post Attempts

```txt id="sn0zq1"
GET /api/v0/social-scheduler/posts/{postId}/attempts?workspaceId=workspace_id
```

Response:

```json id="sjwx4r"
{
  "postId": "post_id",
  "attempts": [
    {
      "id": "attempt_id",
      "platform": "INSTAGRAM",
      "attemptNumber": 1,
      "status": "FAILED_RETRYABLE",
      "startedAt": "2026-09-03T05:00:00.000Z",
      "finishedAt": "2026-09-03T05:00:03.000Z",
      "errorCode": "MOCK_TIMEOUT",
      "errorMessage": "Mock platform timeout. This target will retry.",
      "nextRetryAt": "2026-09-03T05:15:00.000Z"
    }
  ]
}
```

## 20.3 Retry Target Now

Admin/developer only.

```txt id="qifvef"
POST /api/v0/social-scheduler/targets/{targetId}/retry-now
```

Body:

```json id="he8ehl"
{
  "workspaceId": "workspace_id"
}
```

Behavior:

```txt id="w28gyk"
Set target.nextRetryAt = now()
Set target.status = DUE
```

## 20.4 Get Worker Summary

```txt id="2cp9y1"
GET /api/v0/social-scheduler/worker/summary?workspaceId=workspace_id
```

Response:

```json id="08iefy"
{
  "dueTargets": 2,
  "processingTargets": 0,
  "retryingTargets": 1,
  "failedTargets": 1,
  "lastWorkerRunAt": "2026-09-03T05:10:00.000Z"
}
```

---

# 21. Backend Services

Recommended services:

```txt id="kpf9yr"
SocialSchedulerWorkerService
SocialPublishAttemptService
MockSocialPublisherAdapter
SocialSchedulerStatusService
SocialSchedulerLockService
```

## 21.1 SocialSchedulerWorkerService

Responsibilities:

```txt id="ljsv3x"
Find due targets
Claim targets
Create attempts
Call adapter
Persist results
Recalculate post status
Return worker summary
```

## 21.2 SocialPublishAttemptService

Responsibilities:

```txt id="rixf1w"
Create attempt
Update attempt success
Update attempt failure
Fetch post attempt timeline
Calculate attempt number
```

## 21.3 MockSocialPublisherAdapter

Responsibilities:

```txt id="6rft7u"
Validate mock input
Simulate provider result
Return sanitized success/failure
Never call external platform APIs
```

## 21.4 StatusService

Responsibilities:

```txt id="gntzal"
Recalculate post status
Recalculate target status
Apply retry rules
Apply terminal status rules
```

---

# 22. Environment Variables

Add:

```txt id="lvb52x"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_MOCK_MODE=success
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Optional:

```txt id="ek8b2j"
SOCIAL_SCHEDULER_ENABLE_WORKER_DIAGNOSTICS=true
```

Security rule:

```txt id="m3z184"
SOCIAL_SCHEDULER_WORKER_SECRET must never be exposed to frontend.
```

---

# 23. Workspace Isolation Rules

Every worker query must preserve workspace boundaries.

The worker can process across workspaces only if running internally, but every attempt row must still include:

```txt id="8kd6t1"
workspaceId
postId
targetId
```

Frontend APIs must always filter by:

```txt id="bvp0e5"
workspaceId + authenticated user membership
```

A user viewing Workspace A must not see attempts from Workspace B.

---

# 24. Locking Rules

## 24.1 Target Claim Lock

When worker claims a target:

```txt id="av88zm"
status = PROCESSING
lockedAt = now()
lockedBy = workerRunId
```

## 24.2 Stale Lock Recovery

If a target remains processing too long:

```txt id="jwf3ka"
PROCESSING for more than 15 minutes
→ mark RETRYING
→ nextRetryAt = now()
→ lastErrorCode = STALE_WORKER_LOCK
```

Sprint 2 should implement stale recovery either:

1. Inside each worker run before claiming new targets.
2. As a separate helper function called by the worker.

## 24.3 Cancel Protection

If a user cancels a post while targets are queued:

```txt id="10tjsh"
Parent post → CANCELLED
All non-terminal targets → CANCELLED
Worker must skip cancelled targets
```

If a target is already PROCESSING:

```txt id="ip2rzz"
Do not interrupt current attempt.
After attempt finishes, parent post cancellation should prevent future retries.
```

---

# 25. Validation Rules

## 25.1 Before Claim

Reject or skip target if:

```txt id="y71zhz"
Parent post missing
Parent post cancelled
No media attached
Media status is not UPLOADED
Target platform incompatible with media
Workspace missing
Target already terminal
```

## 25.2 Before Mock Publish

Validate:

```txt id="5dtfvy"
draftContentJson exists
draftContentJson.version exists
caption or media exists
media array exists
platform exists
target exists
```

## 25.3 Attempt Request JSON

Store sanitized `requestJson`:

```json id="vdbwq3"
{
  "platform": "INSTAGRAM",
  "postId": "post_id",
  "targetId": "target_id",
  "mediaCount": 1,
  "mimeTypes": ["video/mp4"],
  "captionLength": 126,
  "mockMode": "mixed"
}
```

Do not store private B2 object key in user-visible response payloads.

---

# 26. UI Status Copy

## 26.1 Scheduled

```txt id="b9814k"
Scheduled and waiting for worker
```

## 26.2 Processing

```txt id="c10wlh"
Publishing attempt in progress
```

## 26.3 Retrying

```txt id="4qb7iz"
Temporary issue. Retry scheduled.
```

## 26.4 Failed

```txt id="iqr9cc"
Publishing failed. Review attempt details.
```

## 26.5 Published Mock

```txt id="9rebjv"
Mock published successfully
```

## 26.6 Cancelled

```txt id="4445ph"
This scheduled post was cancelled
```

---

# 27. Buttons and Actions

## 27.1 Detail Page Buttons

```txt id="r09zus"
Back to scheduler
Refresh status
Edit post
Cancel post
Run mock publish
Retry failed targets
```

### Back to scheduler

Always visible.

### Refresh status

Always visible.

### Edit post

Visible only for:

```txt id="7zgchy"
DRAFT
SCHEDULED
RETRYING
FAILED
```

Disabled for:

```txt id="rbydst"
PROCESSING
PUBLISHED_MOCK
CANCELLED
```

### Cancel post

Visible for:

```txt id="ozo5g2"
DRAFT
SCHEDULED
RETRYING
FAILED
```

### Run mock publish

Visible only for admin/developer.

### Retry failed targets

Visible only for admin/developer in Sprint 2.

---

# 28. Functional Test Cases

## 28.1 Due Detection

```txt id="ki57yh"
Create scheduled post with scheduledAt in the future.
Run worker.
Verify no target is claimed.
```

```txt id="siiz04"
Create scheduled post with scheduledAt in the past.
Run worker.
Verify target is claimed and processed.
```

## 28.2 Success Path

```txt id="n9h44a"
Create post with two targets.
Run worker with mockMode=success.
Verify:
- two attempt rows created
- both targets PUBLISHED_MOCK
- parent post PUBLISHED_MOCK
```

## 28.3 Retryable Failure

```txt id="i331pr"
Run worker with mockMode=retryable_failure.
Verify:
- attempt status FAILED_RETRYABLE
- target status RETRYING
- nextRetryAt is set
- parent post RETRYING
```

## 28.4 Permanent Failure

```txt id="tk5kit"
Run worker with mockMode=permanent_failure.
Verify:
- attempt status FAILED_PERMANENT
- target status FAILED
- parent post FAILED if all targets failed
```

## 28.5 Mixed Result

```txt id="jxgol0"
Create post with three platform targets.
Run worker with mockMode=mixed.
Verify:
- some targets PUBLISHED_MOCK
- some targets RETRYING or FAILED
- parent post PARTIALLY_FAILED or RETRYING according to rules
```

## 28.6 Cancelled Post

```txt id="t08aa2"
Cancel scheduled post before worker run.
Run worker.
Verify no publish attempts are created.
```

## 28.7 Workspace Isolation

```txt id="wgfz6p"
User in Workspace A opens post from Workspace B.
Verify 403 or not found.
```

```txt id="l8vj7l"
Worker creates attempts for Workspace A and Workspace B.
User A sees only Workspace A attempts.
```

## 28.8 Duplicate Worker Protection

```txt id="nebc06"
Trigger process-due twice at the same time.
Verify each target has only one active attempt.
```

## 28.9 Stale Lock Recovery

```txt id="g6st9v"
Force target to PROCESSING with lockedAt older than 15 minutes.
Run worker.
Verify target becomes RETRYING or due for retry.
```

## 28.10 UI Timeline

```txt id="ppvnr9"
Run mock publish.
Open post detail page.
Verify attempt timeline displays:
- platform
- attempt number
- status
- error if any
- timestamp
```

---

# 29. Acceptance Criteria

Sprint 2 is complete when:

## Worker

```txt id="4ge0vr"
Worker can find due scheduled targets.
Worker can claim due targets safely.
Worker does not process future targets.
Worker does not process cancelled targets.
Worker creates publish attempt rows.
Worker updates target statuses.
Worker recalculates parent post status.
Worker supports mock success, retryable failure, permanent failure, timeout, and mixed mode.
```

## UI

```txt id="q4ugba"
Scheduler list shows processing/retrying/failed/published mock states.
Post detail page shows platform target statuses.
Post detail page shows attempt timeline.
Admin/developer can manually run mock publish.
Normal users cannot see worker secret or diagnostics controls.
```

## Security

```txt id="xxl7g8"
Worker route requires X-Worker-Secret.
Frontend never receives worker secret.
Users cannot access other workspace attempts.
No real social tokens are introduced.
No external platform APIs are called.
```

## Data

```txt id="xmpe96"
SocialPublishAttempt table exists.
Attempt rows are linked to workspace, post, and target.
Attempt request/response JSON is sanitized.
Retry fields are stored correctly.
Target attempt counts are updated.
```

---

# 30. Sprint 2 Deliverables

## Frontend Deliverables

```txt id="0hwfyd"
Updated scheduler home status tabs
Updated scheduler post cards
Updated post detail status command center
Attempt timeline component
Platform target status panel
Worker diagnostics panel for admin/developer
Run mock publish button
Refresh status action
Retry status badges
Failure/retry banners
```

## Backend Deliverables

```txt id="hgvij6"
Process due targets endpoint
Worker summary endpoint
Get post attempts endpoint
Retry target now endpoint
Mock publisher adapter
Worker service
Attempt service
Status recalculation service
Stale lock recovery helper
```

## Database Deliverables

```txt id="t0a1xl"
SocialPublishAttempt model
Updated SocialPublishTarget fields
Updated ScheduledSocialPost fields
New/updated status enums
Workspace/status indexes
Retry indexes
```

## Testing Deliverables

```txt id="m22iaj"
Due detection tests
Mock success tests
Retryable failure tests
Permanent failure tests
Mixed-result tests
Cancelled-post tests
Workspace isolation tests
Duplicate worker claim tests
Stale lock recovery tests
UI timeline tests
```

---

# 31. Sprint 2 Final Implementation Summary

Build this in Sprint 2:

```txt id="0584py"
ScheduledSocialPost from Sprint 1
→ Worker detects due targets
→ Worker claims target safely
→ SocialPublishAttempt row is created
→ Mock adapter simulates result
→ Target status updates
→ Parent post status recalculates
→ UI shows timeline and status
```

Do **not** connect real social APIs yet.

Do **not** create real OAuth flows yet.

Do **not** store real platform tokens yet.

Sprint 2’s job is to prove the scheduler execution engine before adding Meta, Instagram, Pinterest, YouTube, or Twitter/X.

After Sprint 2, the system should be ready for Sprint 3:

```txt id="hdeczf"
Real Social Account Wiring + Meta OAuth + Facebook Page Publishing
```