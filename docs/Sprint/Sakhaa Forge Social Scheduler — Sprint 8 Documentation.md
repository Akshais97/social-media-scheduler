# Sakhaa Forge Social Scheduler — Sprint 8 Documentation  
## Sprint 8: Scheduler Hardening, Platform QA, Calendar View, Account Health, and Production Readiness

## 0. Sprint Intent

Sprint 8 is the production-readiness sprint for the Social Scheduler module.

Sprint 1 created:

```txt id="5x9j7k"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="vys1n6"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="rfiw5q"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped Facebook Page accounts
→ Real Facebook Page publishing
```

Sprint 4 created:

```txt id="e20h03"
Instagram account discovery
→ Instagram target selection
→ Instagram media-container publishing
→ Instagram lifecycle tracking
```

Sprint 5 created:

```txt id="u0mu8m"
Pinterest OAuth
→ Pinterest account wiring
→ Board discovery
→ Image Pin publishing
```

Sprint 6 created:

```txt id="sn4aav"
Google OAuth
→ YouTube channel wiring
→ YouTube quota ledger
→ Video-only YouTube publishing
```

Sprint 7 created:

```txt id="qk6yxm"
X OAuth with PKCE
→ X account wiring
→ Paid API cost acknowledgement
→ X media upload
→ X real post publishing
```

Sprint 8 now hardens everything into a production-safe publishing system:

```txt id="7m8r8f"
Unified calendar view
→ Account health checks
→ Platform readiness checks
→ Quota and cost visibility
→ Retry/cancel/reschedule controls
→ QA matrix
→ Worker observability
→ Release readiness gates
```

Sprint 8 does **not** add a new social platform. It makes the existing scheduler safe enough for real client use.

---

## 1. Sprint 8 Name

```txt id="yhd7l6"
Sprint 8 — Scheduler Production Readiness
```

Alternative internal label:

```txt id="obvwr7"
Sprint 8 — Calendar, QA, Health, and Hardening
```

---

## 2. Sprint 8 Outcome

By the end of Sprint 8:

1. Users can view scheduled posts in a proper calendar view.
2. Users can still use the list/status view from earlier sprints.
3. Every connected account has a visible health state.
4. Every scheduled post has a preflight/readiness check before publishing.
5. Admins can see platform quota, rate-limit, and cost warnings.
6. Failed/retrying posts have clear recovery actions.
7. Reauth-required accounts are surfaced before scheduled posts silently fail.
8. Multi-platform posts show target-level success/failure independently.
9. Worker health is visible to admins/developers.
10. All platform integrations are QA-tested through a structured matrix.
11. Workspace isolation is verified across posts, media, accounts, attempts, costs, boards, quotas, and upload jobs.
12. Production release is blocked unless required readiness gates pass.

The uploaded scheduler workflow already requires explicit status tracking, publish attempts, retry handling, cancellation handling, and worker security. Sprint 8 is where those foundations become user-facing and production-grade.

---

## 3. In Scope

Sprint 8 includes:

```txt id="mz7ogr"
Calendar view
List view hardening
Post status command center
Platform readiness checks
Account health dashboard
Quota and rate-limit dashboard
X cost dashboard
Worker diagnostics dashboard
Retry/reschedule/cancel controls
Preflight validation before schedule and before publish
Production QA matrix
Regression tests
Workspace isolation tests
Security hardening
Release readiness checklist
```

---

## 4. Out of Scope

Sprint 8 must **not** implement:

```txt id="j6h9fe"
New social platforms
Social inbox
Comment moderation
DM management
Advanced analytics
Campaign performance dashboards
AI caption generation
AI hashtag generation
Bulk CSV scheduler
Approval workflow as a new feature
Drag-and-drop calendar rescheduling without confirmation
Recurring post automation
Auto-rescheduling failed posts without user visibility
```

Optional stretch only:

```txt id="4xvx23"
Safe drag-to-reschedule with confirmation modal
Export calendar as CSV
CSV import validation draft only
```

Do not block Sprint 8 completion on stretch features.

---

# 5. Core Product Principle

Sprint 8 must make the scheduler answer four questions clearly:

```txt id="nvnb0v"
What is scheduled?
Is it safe to publish?
What happened when it ran?
What does the user need to fix?
```

The UX must remain consistent with the existing Sakhaa Forge premium/studio style, not become a generic admin table.

The existing `/brand-extract` and homepage flows already use:

```txt id="uf4ksy"
Premium dark app shell
Persistent header
Guided workflow viewport
Stage/status rail
Animated state transitions
Clear CTA hierarchy
```

The Scheduler must continue this design language.

---

# 6. Route Structure

Existing routes from prior sprints remain:

```txt id="ddacfd"
/app/social-scheduler
/app/social-scheduler/new
/app/social-scheduler/[postId]
/app/social-accounts
```

Sprint 8 adds:

```txt id="l67fyk"
/app/social-scheduler/calendar
/app/social-scheduler/health
/app/social-scheduler/qa
/app/social-scheduler/settings
```

Optional admin/developer-only route:

```txt id="twj5aw"
/app/social-scheduler/worker
```

---

# 7. Navigation Updates

Add scheduler sub-navigation inside the Social Scheduler section.

Tabs:

```txt id="7tonvy"
Overview
Calendar
Posts
Accounts
Health
QA
Settings
```

Visibility rules:

```txt id="0as14"
Overview → all permitted users
Calendar → all permitted users
Posts → all permitted users
Accounts → admins/client managers
Health → admins/client managers
QA → admin/developer only
Settings → admin only
```

Button from main app navigation:

```txt id="zplsjg"
Social Scheduler
```

Primary CTA remains:

```txt id="5egbxq"
Create scheduled post
```

---

# 8. Scheduler Overview Page

Route:

```txt id="5mnoqu"
/app/social-scheduler
```

## 8.1 Purpose

The overview page gives a quick operational summary of the scheduler for the active workspace.

## 8.2 Layout

Use a premium dashboard layout:

```txt id="o9gv2w"
Header
→ Workspace selector
→ Summary cards
→ Upcoming schedule
→ Attention required panel
→ Recent publish attempts
```

## 8.3 Header

Title:

```txt id="711hak"
Social Scheduler
```

Subtitle:

```txt id="ca23f8"
Plan, publish, and monitor approved client media across connected social platforms.
```

Primary button:

```txt id="2fahns"
Create scheduled post
```

Secondary button:

```txt id="6p2mj6"
Open calendar
```

Tertiary button:

```txt id="1igvoi"
Account health
```

## 8.4 Summary Cards

Cards:

```txt id="t7k7ed"
Scheduled today
Publishing soon
Needs attention
Published this week
Failed targets
Reauth required
```

Each card must be workspace-scoped.

## 8.5 Attention Required Panel

Title:

```txt id="ncpfte"
Needs attention
```

Items:

```txt id="hlmk4z"
Reauth required
Quota blocked
Cost blocked
Rate limited
Failed permanently
Media validation issue
Account disconnected
```

Each item action:

```txt id="wske9z"
Review
```

---

# 9. Calendar View

Route:

```txt id="a9gigr"
/app/social-scheduler/calendar
```

## 9.1 Purpose

Users need to understand publishing schedule visually.

Sprint 8 adds a calendar view, but it does **not** need unsafe drag-and-drop rescheduling.

## 9.2 Calendar Modes

Top segmented control:

```txt id="8dvawo"
Month
Week
Day
List
```

Default:

```txt id="jk7ji2"
Week
```

## 9.3 Calendar Header

Title:

```txt id="d6hv7s"
Publishing Calendar
```

Subtitle:

```txt id="8xdbpa"
View scheduled posts for the active workspace across all connected platforms.
```

Controls:

```txt id="wjcpqn"
Today
Previous
Next
Month / Week / Day / List selector
Platform filter
Status filter
Create scheduled post
```

## 9.4 Calendar Filters

Platform filter:

```txt id="9v9v8u"
All platforms
Facebook
Instagram
Pinterest
YouTube
X
```

Status filter:

```txt id="s4mxzw"
All statuses
Draft
Scheduled
Processing
Retrying
Published
Partially published
Failed
Reauth required
Cancelled
Cost blocked
Quota blocked
```

Workspace selector:

```txt id="5vynbu"
Active workspace
```

## 9.5 Calendar Event Card

Each calendar item shows:

```txt id="c1p4q0"
Thumbnail
Post title
Time
Platform icons
Status chip
Attention marker if needed
```

Example:

```txt id="3iy68j"
10:30 AM · Weekend Property Walkthrough
Instagram · Facebook
Scheduled
```

## 9.6 Event Click Behavior

Clicking a calendar item opens a side drawer.

Drawer title:

```txt id="7t8ihm"
Scheduled post
```

Drawer sections:

```txt id="4nb1dg"
Media preview
Caption preview
Platform targets
Schedule time
Readiness status
Latest attempt
Actions
```

Drawer buttons:

```txt id="ozt8x6"
View full details
Edit
Reschedule
Cancel
Close
```

Button rules:

### View full details

Always visible.

### Edit

Visible for:

```txt id="05aofk"
DRAFT
SCHEDULED
RETRYING
FAILED
COST_BLOCKED
QUOTA_BLOCKED
```

Disabled for:

```txt id="z5z92s"
PROCESSING
PUBLISHED
PUBLISHED_MOCK
CANCELLED
```

### Reschedule

Visible for:

```txt id="gmi8hf"
SCHEDULED
RETRYING
QUOTA_BLOCKED
COST_BLOCKED
FAILED
```

Disabled for:

```txt id="576zie"
PROCESSING
PUBLISHED
CANCELLED
```

### Cancel

Visible for:

```txt id="ncxkyy"
DRAFT
SCHEDULED
RETRYING
FAILED
QUOTA_BLOCKED
COST_BLOCKED
```

---

# 10. Reschedule Flow

## 10.1 Reschedule Modal

Title:

```txt id="6q6swm"
Reschedule post
```

Body:

```txt id="jk18v2"
Choose a new publish time for this scheduled post. Platform targets will keep their current account selections.
```

Fields:

```txt id="lxmpyd"
Date
Time
Timezone
Reason optional
```

Buttons:

```txt id="la297i"
Save new time
Cancel
```

Validation:

```txt id="9uvfsq"
Date/time must be in the future.
Date/time must be at least now + 5 minutes.
Post must not be processing.
Post must not be published.
Post must belong to active workspace.
```

## 10.2 YouTube Quota Recheck

If post includes YouTube target:

```txt id="qdul19"
1. Release old quota reservation if not consumed.
2. Check quota for new date.
3. Reserve new YouTube quota slot.
4. Block reschedule if quota unavailable.
```

## 10.3 Audit Log

Every reschedule creates an audit event:

```txt id="gbrcl8"
POST_RESCHEDULED
```

Stored fields:

```txt id="6hwg54"
oldScheduledAt
newScheduledAt
oldTimezone
newTimezone
changedByUserId
reason
```

---

# 11. Account Health Dashboard

Route:

```txt id="2rzr68"
/app/social-scheduler/health
```

## 11.1 Purpose

Users must know before schedule time whether connected accounts are healthy.

## 11.2 Layout

Sections:

```txt id="o0ffpu"
Workspace health summary
Connected account cards
Platform warnings
Quota/rate/cost panels
Recent auth failures
```

## 11.3 Header

Title:

```txt id="6a6hho"
Account Health
```

Subtitle:

```txt id="582hhz"
Check whether connected social accounts are ready for scheduled publishing.
```

Buttons:

```txt id="xwq6fj"
Run health check
Refresh accounts
Back to scheduler
```

## 11.4 Account Health Card

Each account card shows:

```txt id="7p2gpa"
Platform
Account name
Status
Connected by
Last validated
Token expiry if known
Permissions/scopes status
Recent failure count
Next scheduled post
```

Actions:

```txt id="jry2ru"
Validate
Reconnect
Disconnect
View scheduled posts
```

## 11.5 Health Statuses

```txt id="6j1xez"
Healthy
Warning
Reconnect required
Permission missing
Rate limited
Quota blocked
Cost blocked
Disconnected
Unknown
```

## 11.6 Platform-Specific Health Checks

### Facebook

Check:

```txt id="1vdiuz"
Page account connected
Required Page permissions present
CredentialRef available
Recent publish failures
```

### Instagram

Check:

```txt id="659jvb"
Instagram account linked to Facebook Page
Instagram publishing permission present
Content publishing limit available
CredentialRef available
```

### Pinterest

Check:

```txt id="8kh0fv"
Pinterest account connected
pins:write scope present
boards:read scope present
Boards synced
Access tier Trial/Standard
```

### YouTube

Check:

```txt id="ysure1"
YouTube channel connected
youtube.upload scope present
Refresh token available
Quota available
Audit/private-mode status known
```

### X

Check:

```txt id="os35zz"
X account connected
tweet.write present
media.write present if media posting enabled
offline.access present
Paid publishing enabled
Cost guard configured
Rate cap available
```

---

# 12. Preflight Readiness Checks

Sprint 8 introduces a formal preflight system.

## 12.1 When Preflight Runs

Run preflight:

```txt id="97cwm8"
Before saving schedule
Before rescheduling
Before worker publish
When user opens post detail page
When admin runs health check
```

## 12.2 Preflight Output

Each post gets a readiness summary:

```json id="m0fw6d"
{
  "status": "READY",
  "checkedAt": "2026-09-03T06:00:00.000Z",
  "blockingIssues": [],
  "warnings": [
    {
      "code": "YOUTUBE_AUDIT_UNVERIFIED",
      "message": "YouTube uploads may be restricted to private."
    }
  ],
  "targets": [
    {
      "platform": "INSTAGRAM",
      "status": "READY",
      "warnings": []
    }
  ]
}
```

## 12.3 Readiness Statuses

```txt id="ihg7bl"
READY
READY_WITH_WARNINGS
BLOCKED
UNKNOWN
```

## 12.4 Blocking Issues

Examples:

```txt id="wxkd1k"
No media uploaded
Unsupported media type
Account disconnected
Credential missing
Permission missing
YouTube quota unavailable
X cost not acknowledged
Pinterest board missing
Instagram account unlinked
Schedule time invalid
```

## 12.5 Non-Blocking Warnings

Examples:

```txt id="ynarfr"
YouTube audit unverified
Pinterest Trial mode
X paid API cost warning
Instagram video may need processing
Platform rate limit near threshold
```

---

# 13. Data Model Additions

## 13.1 New Model — SocialSchedulerReadinessCheck

```prisma id="68in82"
model SocialSchedulerReadinessCheck {
  id                  String @id @default(uuid())

  workspaceId          String
  postId               String
  targetId             String?

  status               String
  checkedAt            DateTime @default(now())

  blockingIssuesJson   Json
  warningsJson         Json
  diagnosticsJson      Json?

  createdByUserId      String?
  source               String

  createdAt            DateTime @default(now())

  @@index([workspaceId, postId])
  @@index([workspaceId, status])
  @@index([checkedAt])
}
```

Possible `source` values:

```txt id="14ty7m"
SCHEDULE_SAVE
RESCHEDULE
WORKER_PREFLIGHT
DETAIL_VIEW
HEALTH_CHECK
QA_RUN
```

---

## 13.2 New Model — SocialAccountHealthSnapshot

```prisma id="v7q67h"
model SocialAccountHealthSnapshot {
  id                  String @id @default(uuid())

  workspaceId          String
  socialAccountId      String
  provider             SocialAccountProvider
  platform             SocialSchedulerPlatform

  status               String
  checkedAt            DateTime @default(now())

  permissionsJson      Json?
  quotaJson            Json?
  rateLimitJson        Json?
  costJson             Json?
  errorsJson           Json?
  diagnosticsJson      Json?

  createdAt            DateTime @default(now())

  @@index([workspaceId, socialAccountId])
  @@index([workspaceId, platform])
  @@index([workspaceId, status])
  @@index([checkedAt])
}
```

---

## 13.3 New Model — SocialSchedulerAuditLog

```prisma id="fhq8tx"
model SocialSchedulerAuditLog {
  id                  String @id @default(uuid())

  workspaceId          String
  actorUserId          String?

  entityType           String
  entityId             String
  action               String

  beforeJson           Json?
  afterJson            Json?
  metadataJson         Json?

  createdAt            DateTime @default(now())

  @@index([workspaceId, entityType, entityId])
  @@index([workspaceId, action])
  @@index([createdAt])
}
```

Audit actions:

```txt id="u3m1sh"
POST_CREATED
POST_UPDATED
POST_SCHEDULED
POST_RESCHEDULED
POST_CANCELLED
TARGET_ADDED
TARGET_REMOVED
ACCOUNT_CONNECTED
ACCOUNT_RECONNECTED
ACCOUNT_DISCONNECTED
WORKER_ATTEMPT_STARTED
WORKER_ATTEMPT_FINISHED
READINESS_CHECK_RUN
```

---

## 13.4 New Model — PlatformQuotaSnapshot

```prisma id="kehs0v"
model PlatformQuotaSnapshot {
  id                  String @id @default(uuid())

  workspaceId          String?
  provider             SocialAccountProvider
  platform             SocialSchedulerPlatform
  socialAccountId      String?

  quotaType            String
  limitValue           Int?
  usedValue            Int?
  remainingValue       Int?
  resetAt              DateTime?

  rawMetadataJson      Json?
  sanitizedJson        Json?

  capturedAt           DateTime @default(now())

  @@index([workspaceId, platform])
  @@index([socialAccountId])
  @@index([capturedAt])
}
```

Use for:

```txt id="qycvx0"
Instagram publishing limit
Pinterest rate-limit snapshot
YouTube project upload quota
X rate-limit/cost guard state
```

---

# 14. API Contracts

## 14.1 Get Scheduler Overview

```txt id="iwcjr1"
GET /api/v0/social-scheduler/overview?workspaceId=workspace_id
```

Response:

```json id="3kd9o8"
{
  "scheduledToday": 4,
  "publishingSoon": 2,
  "needsAttention": 3,
  "publishedThisWeek": 12,
  "failedTargets": 1,
  "reauthRequired": 1,
  "upcoming": [],
  "attentionItems": []
}
```

---

## 14.2 Get Calendar Posts

```txt id="fhqk6k"
GET /api/v0/social-scheduler/calendar?workspaceId=workspace_id&from=2026-09-01&to=2026-09-30&platform=ALL&status=ALL
```

Response:

```json id="xbuumc"
{
  "items": [
    {
      "postId": "post_id",
      "title": "Weekend property walkthrough",
      "thumbnailMediaAssetId": "asset_id",
      "scheduledAt": "2026-09-03T05:00:00.000Z",
      "timezone": "Asia/Kolkata",
      "platforms": ["FACEBOOK", "INSTAGRAM"],
      "status": "SCHEDULED",
      "attentionRequired": false
    }
  ]
}
```

---

## 14.3 Run Readiness Check

```txt id="0v4e06"
POST /api/v0/social-scheduler/posts/{postId}/readiness-check
```

Body:

```json id="we9aog"
{
  "workspaceId": "workspace_id",
  "source": "DETAIL_VIEW"
}
```

Response:

```json id="jvyibr"
{
  "status": "READY_WITH_WARNINGS",
  "blockingIssues": [],
  "warnings": [
    {
      "code": "YOUTUBE_AUDIT_UNVERIFIED",
      "message": "YouTube uploads may be restricted to private."
    }
  ],
  "targets": []
}
```

---

## 14.4 Run Account Health Check

```txt id="ky9lyu"
POST /api/v0/social-scheduler/health/check
```

Body:

```json id="nxgwvc"
{
  "workspaceId": "workspace_id",
  "socialAccountId": "optional_social_account_id"
}
```

Response:

```json id="82h8gb"
{
  "checkedAccounts": 5,
  "healthy": 3,
  "warning": 1,
  "reauthRequired": 1
}
```

---

## 14.5 Get Account Health

```txt id="k9at5c"
GET /api/v0/social-scheduler/health?workspaceId=workspace_id
```

Response:

```json id="fi5tim"
{
  "accounts": [
    {
      "socialAccountId": "account_id",
      "platform": "INSTAGRAM",
      "displayName": "@brand",
      "status": "HEALTHY",
      "lastCheckedAt": "2026-09-03T06:00:00.000Z",
      "warnings": []
    }
  ]
}
```

---

## 14.6 Reschedule Post

```txt id="t2tqvh"
POST /api/v0/social-scheduler/posts/{postId}/reschedule
```

Body:

```json id="g8uynj"
{
  "workspaceId": "workspace_id",
  "scheduledAt": "2026-09-04T05:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "reason": "Client requested a later slot."
}
```

Response:

```json id="g5q8x4"
{
  "postId": "post_id",
  "status": "SCHEDULED",
  "scheduledAt": "2026-09-04T05:00:00.000Z"
}
```

---

## 14.7 Get Platform Quota Summary

```txt id="7gg1sv"
GET /api/v0/social-scheduler/platform-quotas?workspaceId=workspace_id
```

Response:

```json id="j3ilz2"
{
  "instagram": {
    "status": "OK",
    "remaining": 32,
    "limit": 50
  },
  "youtube": {
    "status": "WARNING",
    "remainingUploadsToday": 12,
    "dailyLimit": 100
  },
  "x": {
    "status": "OK",
    "estimatedMonthCostUsd": "4.20"
  },
  "pinterest": {
    "status": "OK",
    "rateLimitRemaining": 94
  }
}
```

---

## 14.8 Get QA Matrix

Admin/developer only.

```txt id="pmxn51"
GET /api/v0/social-scheduler/qa/matrix?workspaceId=workspace_id
```

Response:

```json id="9x3pdx"
{
  "facebook": {
    "accountConnected": true,
    "imagePostTested": true,
    "lastSuccessAt": "2026-09-03T06:00:00.000Z"
  },
  "instagram": {
    "accountConnected": true,
    "imagePostTested": true,
    "videoPostTested": false
  },
  "pinterest": {
    "accountConnected": true,
    "imagePinTested": true
  },
  "youtube": {
    "channelConnected": true,
    "videoUploadTested": true,
    "quotaGuardTested": true
  },
  "x": {
    "accountConnected": true,
    "costGuardTested": true,
    "textPostTested": true
  }
}
```

---

# 15. Worker Hardening

Sprint 8 must harden the worker built in Sprint 2.

## 15.1 Worker Preflight

Before processing any target, worker must run:

```txt id="6h5fya"
Workspace validation
Post validation
Target validation
Media validation
Account validation
CredentialRef validation
Platform-specific validation
Quota/cost/rate-limit validation
Cancellation check
```

## 15.2 Worker Batch Controls

Add or confirm env variables:

```txt id="cjghnn"
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_WORKER_MAX_RUNTIME_MS=240000
SOCIAL_SCHEDULER_WORKER_STALE_LOCK_MINUTES=15
SOCIAL_SCHEDULER_WORKER_RETRY_MAX_ATTEMPTS=3
SOCIAL_SCHEDULER_WORKER_PREFLIGHT_REQUIRED=true
```

## 15.3 Stale Lock Handling

If target is `PROCESSING` too long:

```txt id="on6bup"
Mark target RETRYING
Set nextRetryAt = now()
Create audit log STALE_LOCK_RECOVERED
Show warning in timeline
```

## 15.4 Duplicate Processing Guard

Worker must guarantee:

```txt id="130ypj"
One target cannot have two active processing attempts.
One target cannot be published twice unless explicitly retried after a known failure.
One successful published target must become terminal.
```

## 15.5 Idempotency

All publish operations must carry an idempotency key when provider supports it or when internal request hash can be used.

Internal idempotency key format:

```txt id="xorr0d"
workspaceId:postId:targetId:attemptNumber
```

---

# 16. Retry Controls

## 16.1 Retry Button

Visible on post detail page when at least one target is failed/retryable.

Button:

```txt id="vowx2d"
Retry failed targets
```

Visible for:

```txt id="7cpp3j"
Admin
Owner
Client Manager if permitted
```

Disabled if:

```txt id="gyew6v"
Post is processing
Account requires reconnect
Cost/quota block still unresolved
Media issue still unresolved
```

## 16.2 Retry Modal

Title:

```txt id="dvlt67"
Retry failed targets?
```

Body:

```txt id="nnin4j"
Only retry targets that are safe to run again. Already published targets will not be republished.
```

Checklist:

```txt id="65fmc0"
Accounts are connected
Media is still available
Quota/cost issues are resolved
Already published targets will be skipped
```

Buttons:

```txt id="jlz50h"
Retry safe targets
Cancel
```

---

# 17. Cancel Controls

## 17.1 Cancel Modal

Title:

```txt id="oa4rif"
Cancel scheduled post?
```

Body:

```txt id="d6t1nq"
This stops future publishing attempts for this post. Already published targets will remain in history.
```

Checkbox:

```txt id="le8pm0"
I understand this will cancel all unpublished targets.
```

Buttons:

```txt id="o5r5mj"
Cancel scheduled post
Keep scheduled
```

## 17.2 Cancel Rules

```txt id="n8hr1g"
Unpublished targets → CANCELLED
Published targets → remain PUBLISHED
Processing targets → finish current attempt, then stop future retries
YouTube unconsumed reservation → RELEASED
X unconsumed cost reservation → RELEASED
```

---

# 18. Platform Quota and Cost Dashboard

Route:

```txt id="y8lg7r"
/app/social-scheduler/settings
```

Section:

```txt id="uqg2ca"
Platform Limits
```

## 18.1 Instagram Panel

Shows:

```txt id="u4yo6a"
Publishing limit status
Quota used
Quota remaining
Last checked
Accounts affected
```

Actions:

```txt id="3sn54f"
Refresh Instagram limits
View affected posts
```

---

## 18.2 Pinterest Panel

Shows:

```txt id="dwzp1k"
Access tier: Trial/Standard
Rate-limit remaining
Boards synced
Last board refresh
```

Actions:

```txt id="k5qeh9"
Refresh boards
Refresh limits
```

---

## 18.3 YouTube Panel

Shows:

```txt id="4l8sa2"
Project daily upload limit
Used uploads today
Reserved uploads today
Available uploads today
Audit status
Default privacy policy
```

Actions:

```txt id="jzo622"
Refresh quota
View YouTube reservations
```

---

## 18.4 X Panel

Shows:

```txt id="9mq0b2"
Paid publishing enabled
Pricing version
Estimated month cost
Workspace daily cap
Account daily cap
App daily cap
```

Actions:

```txt id="4l45jh"
View cost ledger
Update product caps
Disable X publishing
```

`Update product caps` and `Disable X publishing` are admin only.

---

# 19. QA Dashboard

Route:

```txt id="vhlhkz"
/app/social-scheduler/qa
```

Admin/developer only.

## 19.1 Purpose

QA dashboard confirms platform integration readiness before production release.

## 19.2 Header

Title:

```txt id="b68jhx"
Scheduler QA
```

Subtitle:

```txt id="3r2vzg"
Verify each platform, status flow, worker path, and workspace isolation rule before production use.
```

Buttons:

```txt id="cqy22i"
Run QA checks
Export QA report
Back to scheduler
```

---

## 19.3 QA Matrix

Rows:

```txt id="kd5p6x"
Facebook Page
Instagram Feed Image
Instagram Reel/Video
Pinterest Image Pin
YouTube Video Upload
X Text Post
X Image Post
X Video Post
```

Columns:

```txt id="1ry4q0"
Account connected
Media validation
Preflight ready
Worker route
Attempt logged
Success tested
Failure tested
Retry tested
Reauth tested
Workspace isolation tested
```

Cell states:

```txt id="h1g4kv"
Passed
Failed
Not tested
Blocked
Not applicable
```

---

## 19.4 QA Detail Drawer

Clicking a QA matrix row opens drawer.

Drawer sections:

```txt id="b4jn5k"
Test summary
Last run
Last success
Last failure
Known blockers
Related accounts
Related attempts
Actions
```

Buttons:

```txt id="jizc5g"
Run this check
View attempts
View account
Mark as reviewed
Close
```

---

# 20. Production Readiness Gates

Sprint 8 must define release gates.

## 20.1 Required Gates

Do not ship production scheduler unless:

```txt id="sxq40u"
Auth protection verified
Workspace isolation verified
Media upload validation verified
B2 signed URL leakage check passed
CredentialRef storage verified
No raw tokens in database/logs
Worker secret protection verified
Duplicate worker claim test passed
Retry logic test passed
Cancel/reschedule test passed
Facebook live publish tested
Instagram image publish tested
Instagram video/Reel flow tested or disabled
Pinterest image Pin tested
YouTube upload quota guard tested
X cost guard tested or X disabled
Account health page functional
Attempt timeline functional
QA matrix exported
```

---

## 20.2 Production Blockers

Mark release as blocked if:

```txt id="fqmb2t"
Any frontend route exposes another workspace’s post/account/media.
Any API endpoint can fetch cross-workspace data.
Any logs contain access tokens.
Any attempt JSON contains access tokens or signed B2 URLs.
Worker endpoint can be called without secret.
YouTube quota reservation can go negative.
X can publish without cost acknowledgement.
Instagram can publish without connected professional account.
Pinterest can publish without selected board.
Published target can be double-published by duplicate worker run.
```

---

# 21. Settings Page

Route:

```txt id="a45thy"
/app/social-scheduler/settings
```

## 21.1 Sections

```txt id="7fvc86"
General
Platform availability
Upload limits
Worker settings
Quota/cost settings
Danger zone
```

---

## 21.2 General

Fields:

```txt id="2p58my"
Default timezone
Default calendar view
Default schedule buffer
```

Default values:

```txt id="j5cys5"
Timezone: Asia/Kolkata
Calendar view: Week
Schedule buffer: 5 minutes
```

Buttons:

```txt id="okj8wy"
Save settings
Reset
```

---

## 21.3 Platform Availability

Toggles:

```txt id="duymgs"
Facebook
Instagram
Pinterest
YouTube
X
```

Rules:

```txt id="dvk20e"
Facebook toggle requires Meta config.
Instagram toggle requires Meta config + Instagram permissions.
Pinterest toggle requires Pinterest config.
YouTube toggle requires Google config.
X toggle requires X config + paid publishing guard.
```

---

## 21.4 Upload Limits

Fields:

```txt id="rjcnri"
Image max size
Video max size
Allowed image types
Allowed video types
```

Sprint 8 defaults:

```txt id="uoeioa"
Image max size: 10 MB
Video max size: 200 MB
Images: jpeg, png, webp
Videos: mp4, quicktime only if supported
```

---

## 21.5 Danger Zone

Actions:

```txt id="1x6fz5"
Disable scheduler for workspace
Disconnect all social accounts
Cancel all future scheduled posts
```

Each requires confirmation modal.

---

# 22. UX Status Copy

## 22.1 Ready

```txt id="c3ulsq"
Ready to publish
```

## 22.2 Ready With Warnings

```txt id="kuwf3p"
Ready with warnings
```

## 22.3 Blocked

```txt id="bpt3e9"
Blocked before publishing
```

## 22.4 Reauth Required

```txt id="19297k"
Reconnect account
```

## 22.5 Quota Blocked

```txt id="ljls7o"
Quota unavailable
```

## 22.6 Cost Blocked

```txt id="ks3gs4"
Cost approval needed
```

## 22.7 Rate Limited

```txt id="ekfgyf"
Retry after rate limit
```

## 22.8 Partial Success

```txt id="4lxq5w"
Some platforms published
```

---

# 23. Frontend Components

Add:

```txt id="mi2nop"
SchedulerOverviewPage.tsx
SchedulerCalendarPage.tsx
SchedulerCalendarGrid.tsx
SchedulerCalendarEventCard.tsx
SchedulerCalendarDrawer.tsx
SchedulerHealthPage.tsx
SocialAccountHealthCard.tsx
AccountHealthSummary.tsx
ReadinessCheckPanel.tsx
ReadinessIssueList.tsx
PlatformQuotaDashboard.tsx
PlatformQuotaCard.tsx
XCostLedgerPanel.tsx
YouTubeQuotaPanel.tsx
InstagramLimitPanel.tsx
PinterestLimitPanel.tsx
SchedulerQaPage.tsx
QaMatrix.tsx
QaMatrixRow.tsx
QaDetailDrawer.tsx
ReschedulePostModal.tsx
RetryTargetsModal.tsx
CancelPostModal.tsx
SchedulerSettingsPage.tsx
```

Update:

```txt id="c6j4kh"
SocialSchedulerApp.tsx
SchedulerPostCard.tsx
SchedulerPostDetail.tsx
AttemptTimeline.tsx
PlatformTargetStatusCard.tsx
SocialAccountsPage.tsx
WorkerDiagnosticsPanel.tsx
SchedulerStatusChip.tsx
```

---

# 24. Backend Services

Add:

```txt id="qc19h6"
SocialSchedulerOverviewService
SocialSchedulerCalendarService
SocialSchedulerReadinessService
SocialAccountHealthService
PlatformQuotaSnapshotService
SchedulerQaService
SchedulerAuditLogService
SchedulerSettingsService
```

Update:

```txt id="qi7xbh"
SocialSchedulerWorkerService
SocialSchedulerStatusService
SocialPublishAttemptService
SocialSchedulerTargetsService
YouTubeQuotaLedgerService
XCostLedgerService
```

---

# 25. Environment Variables

Add or confirm:

```txt id="kbinet"
SOCIAL_SCHEDULER_PRODUCTION_READINESS_REQUIRED=true
SOCIAL_SCHEDULER_PREFLIGHT_REQUIRED=true
SOCIAL_SCHEDULER_HEALTH_CHECK_ENABLED=true
SOCIAL_SCHEDULER_QA_DASHBOARD_ENABLED=true
SOCIAL_SCHEDULER_DEFAULT_TIMEZONE=Asia/Kolkata
SOCIAL_SCHEDULER_DEFAULT_CALENDAR_VIEW=week
SOCIAL_SCHEDULER_MIN_SCHEDULE_BUFFER_MINUTES=5
SOCIAL_SCHEDULER_AUDIT_LOG_ENABLED=true
```

Worker hardening:

```txt id="o4jpry"
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_WORKER_MAX_RUNTIME_MS=240000
SOCIAL_SCHEDULER_WORKER_STALE_LOCK_MINUTES=15
SOCIAL_SCHEDULER_WORKER_PREFLIGHT_REQUIRED=true
```

Security:

```txt id="6ytfxk"
SOCIAL_SCHEDULER_BLOCK_TOKEN_LOGGING=true
SOCIAL_SCHEDULER_BLOCK_SIGNED_URL_LOGGING=true
```

---

# 26. Functional Test Cases

## 26.1 Calendar

```txt id="z99cqp"
Calendar page loads for authenticated user.
```

```txt id="6tgdb5"
Calendar shows only posts from active workspace.
```

```txt id="tvnuss"
Month, Week, Day, and List toggles work.
```

```txt id="o4w9dv"
Platform filter filters calendar items correctly.
```

```txt id="w6f3es"
Status filter filters calendar items correctly.
```

```txt id="wigvkj"
Clicking calendar item opens detail drawer.
```

---

## 26.2 Reschedule

```txt id="n4uhbq"
Scheduled post can be rescheduled to a valid future time.
```

```txt id="izmd08"
Past reschedule time is rejected.
```

```txt id="pdp3zx"
Processing post cannot be rescheduled.
```

```txt id="n1xeve"
YouTube quota reservation is moved when YouTube post is rescheduled.
```

```txt id="40oowh"
Reschedule writes audit log.
```

---

## 26.3 Account Health

```txt id="32sn0r"
Health page shows all connected accounts for active workspace.
```

```txt id="dw4q6n"
Health page does not show accounts from other workspaces.
```

```txt id="k4acw8"
Run health check creates SocialAccountHealthSnapshot.
```

```txt id="fc15gp"
Disconnected account shows reconnect required state.
```

```txt id="zrcjk3"
Permission missing state appears when scope is missing.
```

---

## 26.4 Readiness Checks

```txt id="ge0jpe"
Ready post returns READY.
```

```txt id="8xy51d"
YouTube unverified audit status returns READY_WITH_WARNINGS.
```

```txt id="8gi8sr"
X post without cost acknowledgement returns BLOCKED.
```

```txt id="7jhxcl"
Pinterest post without board returns BLOCKED.
```

```txt id="frq1hq"
Instagram post without connected account returns BLOCKED.
```

```txt id="4g0wdb"
Readiness check persists result.
```

---

## 26.5 Worker Hardening

```txt id="g8o7rc"
Worker runs preflight before publishing.
```

```txt id="mde9wp"
Worker skips blocked target.
```

```txt id="9t1eqz"
Worker recovers stale lock.
```

```txt id="p0ysdd"
Duplicate worker calls do not double-publish a target.
```

```txt id="w9idah"
Published target cannot be republished accidentally.
```

---

## 26.6 Retry

```txt id="x0125c"
Failed retryable target shows Retry failed targets button.
```

```txt id="324rx6"
Retry modal lists only safe retry targets.
```

```txt id="wzyivh"
Already published targets are skipped during retry.
```

```txt id="edmfvw"
Retry creates new attempt row.
```

---

## 26.7 Cancel

```txt id="8ihfkc"
Scheduled post can be cancelled.
```

```txt id="rqmehb"
Cancelling releases unconsumed YouTube quota reservation.
```

```txt id="tqh185"
Cancelling releases unconsumed X cost reservation.
```

```txt id="3m0uru"
Already published targets remain published after cancellation.
```

```txt id="lk6aas"
Cancel writes audit log.
```

---

## 26.8 QA Dashboard

```txt id="muwnwi"
QA dashboard visible only to admin/developer.
```

```txt id="s01fnv"
Normal user cannot access QA route.
```

```txt id="mo3o1k"
QA matrix shows all platform rows.
```

```txt id="u78jfz"
Run QA checks updates row status.
```

```txt id="anszwf"
Export QA report works or clearly shows not implemented.
```

---

## 26.9 Security

```txt id="wygbih"
No API returns raw social tokens.
```

```txt id="078wkh"
No API returns B2 signed URL unless endpoint specifically requires it.
```

```txt id="jvslyq"
Attempt JSON does not contain tokens.
```

```txt id="vqu5e8"
Attempt JSON does not contain signed URLs.
```

```txt id="boh7hc"
User cannot access another workspace’s posts.
```

```txt id="meev88"
User cannot access another workspace’s social accounts.
```

```txt id="t5q1lq"
User cannot access another workspace’s cost ledger.
```

```txt id="89bfcg"
Worker endpoint rejects missing or invalid X-Worker-Secret.
```

---

# 27. Acceptance Criteria

Sprint 8 is complete when:

## Calendar

```txt id="qxtcce"
Calendar view exists.
Month/Week/Day/List modes work.
Calendar items are workspace-scoped.
Calendar drawer shows post summary and actions.
Reschedule works safely.
Cancel works safely.
```

## Account Health

```txt id="aiy0h5"
Account health page exists.
All connected platform accounts show health status.
Health checks create snapshots.
Reconnect-required states are clear.
Permission-missing states are clear.
Platform warnings are visible.
```

## Readiness

```txt id="8h8pne"
Readiness checks run before schedule/reschedule/publish.
Blocking issues prevent unsafe publishing.
Warnings are shown without blocking when appropriate.
Readiness results are stored.
Post detail page displays readiness state.
```

## Worker

```txt id="bxr6ku"
Worker runs preflight before publishing.
Worker handles stale locks.
Worker avoids duplicate publishing.
Worker preserves target-level status.
Worker writes audit events for key actions.
```

## Quota / Cost

```txt id="7hfgtb"
YouTube quota summary is visible.
X cost ledger is visible.
Instagram limit status is visible.
Pinterest access/rate state is visible.
Quota/cost blockers appear in UI.
```

## QA

```txt id="yxczdl"
QA dashboard exists for admin/developer.
QA matrix covers Facebook, Instagram, Pinterest, YouTube, and X.
Platform success/failure/retry/reauth paths can be checked.
Production blockers are visible.
```

## Security

```txt id="qf8nf1"
Workspace isolation verified.
No token leakage verified.
No signed URL leakage verified.
Worker secret verified.
Cross-workspace account/media/attempt/cost access blocked.
```

---

# 28. Sprint 8 Deliverables

## Frontend

```txt id="4t38ny"
Scheduler overview page
Calendar page
Calendar event drawer
Reschedule modal
Retry modal
Cancel modal
Account health page
Readiness check panel
Platform quota dashboard
X cost ledger panel
QA dashboard
Scheduler settings page
Updated post detail page
Updated scheduler cards
Updated account cards
```

## Backend

```txt id="p6ob88"
Overview endpoint
Calendar endpoint
Readiness check endpoint
Account health endpoint
Quota summary endpoint
QA matrix endpoint
Reschedule endpoint
Audit log service
Worker preflight integration
Stale lock recovery
Retry-safe target selection
Cancel cleanup for quota/cost reservations
```

## Database

```txt id="ec9wwy"
SocialSchedulerReadinessCheck model
SocialAccountHealthSnapshot model
SocialSchedulerAuditLog model
PlatformQuotaSnapshot model
Additional indexes for calendar/status queries
Audit fields for reschedule/cancel/retry
```

## Tests

```txt id="bdp153"
Calendar tests
Reschedule tests
Cancel tests
Retry tests
Readiness tests
Account health tests
Worker hardening tests
Quota/cost tests
QA dashboard tests
Workspace isolation tests
Token leakage tests
Signed URL leakage tests
Production readiness tests
```

---

# 29. Final Sprint 8 Implementation Summary

Build this in Sprint 8:

```txt id="0eh78v"
Existing Social Scheduler
→ Calendar view
→ Calendar drawer
→ Reschedule/cancel/retry controls
→ Account health dashboard
→ Post readiness checks
→ Platform quota/cost dashboard
→ Worker preflight hardening
→ QA matrix
→ Production readiness gates
```

Do not add new platforms.

Do not add social inbox.

Do not add analytics dashboards.

Do not add AI caption generation.

Do not bypass the Sprint 2 worker.

Sprint 8’s job is to make the Social Scheduler production-safe, visible, auditable, and trustworthy across all integrations built in Sprints 1–7.

After Sprint 8, the next logical sprint is:

```txt id="6gqgsy"
Sprint 9 — Advanced Scheduling UX, Calendar Editing, Bulk Drafts, and Optional Approval Workflow
```

Optional alternative:

```txt id="c8afwv"
Sprint 9 — Platform Hardening: YouTube Thumbnails, Pinterest Video Pins, X Alt Text, and Instagram Carousel
```