# Sakhaa Forge Social Scheduler — Sprint 11 Documentation  
## Sprint 11: Post-Publishing Checks, Verification, Reconciliation, Recovery, and Gap Closure

## 0. Sprint Intent

Sprint 11 exists to make sure the Social Scheduler does not merely “send” posts to platforms, but can prove what happened after publishing.

By Sprint 10, the system has:

```txt id="zg5h2a"
Sprint 1 → Scheduler shell, workspace isolation, B2 upload, Draft Composer JSONB
Sprint 2 → Worker, mock publishing, attempts, retries, state machine
Sprint 3 → Facebook Page publishing
Sprint 4 → Instagram publishing
Sprint 5 → Pinterest image Pins
Sprint 6 → YouTube video uploads
Sprint 7 → Twitter/X publishing with cost guardrails
Sprint 8 → Calendar, health, readiness, QA, production hardening
Sprint 9 → Bulk drafts, approvals, safe calendar editing
Sprint 10 → Platform feature deepening, thumbnails, captions, carousel, video Pins, alt text, verification foundation
```

Sprint 11 now adds the missing final layer:

```txt id="vd6jbt"
Publish attempt completed
→ External platform checked
→ Published URL verified
→ Platform status reconciled
→ Mismatches detected
→ User sees proof or action required
→ Recovery path exists
```

The core Sprint 11 principle:

```txt id="oe0oik"
A post is not fully trusted until the system verifies the external platform result or clearly explains why verification was skipped, failed, delayed, or unsupported.
```

---

# 1. Sprint 11 Name

```txt id="yxrxh2"
Sprint 11 — Post-Publishing Verification and Gap Closure
```

Alternative internal label:

```txt id="2e17yw"
Sprint 11 — Publishing Proof, Reconciliation, and Recovery
```

---

# 2. Sprint 11 Outcome

By the end of Sprint 11:

1. Every successful publish attempt creates a post-publishing verification job.
2. The system stores external platform status snapshots.
3. The UI shows whether each target is externally verified.
4. The system can detect missing live URLs, deleted external posts, private/restricted posts, processing delays, media mismatches, account mismatch, and metadata mismatch.
5. Users can manually run “Verify now”.
6. Admins can manually attach or correct a live URL when a platform does not return one.
7. Reconciliation jobs periodically re-check recent published posts.
8. Publishing history becomes audit-proof.
9. Platform-specific verification rules exist for Facebook, Instagram, Pinterest, YouTube, and X.
10. Gaps across Sprints 1–10 are closed or explicitly deferred.

---

# 3. In Scope

Sprint 11 includes:

```txt id="eh2hua"
Post-publish verification jobs
External status snapshots
Verification timeline
Platform-specific verification adapters
Manual verify now action
Manual live URL attach/correct action
Reconciliation runs
External deletion/mismatch detection
Published-with-warning handling
Verification skipped states
Cost-aware X verification
YouTube processing checks
Instagram container/post checks
Pinterest Pin checks
Facebook Page post checks
Unified error taxonomy
Enum/status cleanup
Publish mode normalization
OAuth/account model cleanup
Credential safety review
Final gap register
Functional tests
```

---

# 4. Out of Scope

Sprint 11 must **not** implement:

```txt id="xlfs3h"
New social platforms
Full analytics dashboard
Social inbox
Comment moderation
DM management
Ad campaign manager
Automated creative generation
Autonomous reposting
Auto-deletion of external posts
Bulk destructive actions
```

Optional stretch only:

```txt id="tbsftr"
Post analytics sync
Comment count snapshot
Like/view/share snapshot
Client-facing verification certificate PDF
```

Do not block Sprint 11 completion on stretch features.

---

# 5. Product Principle

Sprint 11 must make publishing transparent.

A user should be able to open any scheduled/published post and answer:

```txt id="e6vjnd"
Was it actually published?
Which platform accepted it?
What external ID did the platform return?
Is there a live URL?
Was the live URL verified?
Is the post still available?
Did any platform force private/restricted visibility?
Did media/title/caption mismatch?
What should I do if verification failed?
```

---

# 6. Key Gap Closure From Sprints 1–10

## 6.1 Gap: Success Was Too Provider-Response Dependent

Earlier sprints marked targets as `PUBLISHED` after provider success.

Problem:

```txt id="6se019"
Provider success does not always mean the public post is visible, accessible, correctly linked, or final.
```

Sprint 11 fix:

```txt id="qpmzbu"
PUBLISHED means provider accepted the operation.
VERIFIED means Sakhaa Forge checked the external result.
UNVERIFIED means provider accepted it but external proof is missing or failed.
```

---

## 6.2 Gap: Too Many Statuses Were Added Over Time

Sprints 1–10 added many statuses:

```txt id="dwxz85"
PUBLISHED
PUBLISHED_MOCK
PUBLISHED_WITH_WARNINGS
PRIVATE_RESTRICTED
VERIFICATION_PENDING
VERIFIED
UNVERIFIED
QUOTA_BLOCKED
COST_BLOCKED
APPROVAL_BLOCKED
LIMIT_REACHED
RATE_LIMITED
```

Problem:

```txt id="hl44ke"
Status sprawl can make UI, worker logic, and database transitions inconsistent.
```

Sprint 11 fix:

Use canonical grouped status logic.

Post/target primary status:

```txt id="21msfu"
DRAFT
SCHEDULED
PROCESSING
PUBLISHED
PARTIALLY_PUBLISHED
FAILED
CANCELLED
BLOCKED
RETRYING
```

Secondary reason/status detail:

```txt id="uk6485"
MOCK_ONLY
PRIVATE_RESTRICTED
VERIFICATION_PENDING
VERIFIED
UNVERIFIED
PUBLISHED_WITH_WARNINGS
REAUTH_REQUIRED
QUOTA_BLOCKED
COST_BLOCKED
APPROVAL_BLOCKED
RATE_LIMITED
LIMIT_REACHED
MEDIA_PROCESSING
SECONDARY_ASSET_FAILED
```

Recommended schema:

```txt id="ykhnjd"
primaryStatus
statusReason
verificationStatus
platformLifecycleStatus
```

This avoids stuffing every possible detail into one enum.

---

## 6.3 Gap: Publish Mode Was Sometimes a String

Earlier docs used values like:

```txt id="nxx99a"
MOCK
LIVE_META
LIVE_PINTEREST
LIVE_GOOGLE
LIVE_X
```

Problem:

```txt id="gqn2j7"
String publish modes are error-prone.
```

Sprint 11 fix:

Create canonical enum:

```prisma id="flyqu1"
enum SocialPublishMode {
  MOCK
  LIVE_META
  LIVE_PINTEREST
  LIVE_GOOGLE
  LIVE_X
}
```

Every `SocialPublishTarget` must use this enum.

---

## 6.4 Gap: Verification Was Mentioned but Not Fully Operational

Sprint 10 introduced verification foundation, but not the full operational system.

Sprint 11 fix:

```txt id="xrxz4d"
Add verification queue
Add verification adapters
Add reconciliation runs
Add external status snapshots
Add manual recovery actions
Add UI proof panel
```

---

## 6.5 Gap: Platform-Specific Secondary Assets Were Not Unified

Sprint 10 added:

```txt id="jozztz"
YouTube thumbnails
YouTube captions
Pinterest covers
Instagram carousel children
X alt text
```

Problem:

```txt id="tahcmr"
Each platform has secondary assets, but there was no unified way to track them.
```

Sprint 11 fix:

Create:

```txt id="x5ceec"
SocialPlatformAssetAttachment
```

to track thumbnails, covers, captions, carousel children, and alt-text metadata against a post/target.

---

## 6.6 Gap: Reauth, Permission, Quota, Cost, and Approval Blocks Were Repeated Differently

Sprint 11 fix:

Create unified blocked reason taxonomy:

```txt id="bo83z4"
AUTH_REQUIRED
PERMISSION_MISSING
QUOTA_UNAVAILABLE
RATE_LIMITED
COST_APPROVAL_REQUIRED
APPROVAL_REQUIRED
MEDIA_INVALID
ACCOUNT_UNHEALTHY
PLATFORM_UNSUPPORTED
PLATFORM_PROCESSING
EXTERNAL_VERIFICATION_FAILED
```

Use these across readiness checks, worker preflight, UI banners, attempts, and QA.

---

## 6.7 Gap: Post-Publish Deletion/Drift Was Not Tracked

Problem:

```txt id="e9vj8z"
A post can be published successfully, then later deleted or changed externally.
```

Sprint 11 fix:

```txt id="02ix7n"
Reconciliation checks recent published posts and flags external deletion, missing URL, privacy mismatch, and metadata drift.
```

---

## 6.8 Gap: Manual Recovery Was Missing

Problem:

```txt id="jb6qbb"
When provider APIs do not return a permalink or verification fails, users need a safe manual recovery path.
```

Sprint 11 fix:

Add actions:

```txt id="zty21c"
Verify now
Attach live URL
Correct live URL
Mark as manually verified
Mark issue resolved
Retry verification
```

All manual recovery actions must be audit-logged.

---

# 7. Route Structure

Existing routes remain:

```txt id="5by5hq"
/app/social-scheduler
/app/social-scheduler/new
/app/social-scheduler/[postId]
/app/social-scheduler/calendar
/app/social-scheduler/bulk
/app/social-scheduler/review
/app/social-scheduler/approvals
/app/social-scheduler/health
/app/social-scheduler/qa
/app/social-scheduler/settings
/app/social-accounts
```

Sprint 11 adds:

```txt id="epgca3"
/app/social-scheduler/verification
/app/social-scheduler/reconciliation
```

Visibility:

```txt id="cxkw66"
Verification → admins, managers, creators with access
Reconciliation → admin/developer only
```

---

# 8. Post Detail Page Updates

Route:

```txt id="p7p7p7"
/app/social-scheduler/[postId]
```

Add a dedicated section:

```txt id="mr3ia1"
Publishing Proof
```

## 8.1 Publishing Proof Panel

Shows per target:

```txt id="fbsf7b"
Platform
Account
Primary status
Verification status
External post ID
External URL
Last verified at
Verification issue
Manual recovery state
```

Buttons:

```txt id="ogbv8v"
Verify now
Open live post
Attach live URL
Correct live URL
Retry verification
Mark as manually verified
View verification history
```

Button rules:

### Verify now

Visible if:

```txt id="1nvbi0"
target status is PUBLISHED / PUBLISHED_WITH_WARNINGS / UNVERIFIED
```

Disabled if:

```txt id="n8zyrk"
target is PROCESSING
target is CANCELLED
account is REAUTH_REQUIRED
X read verification cost is not approved
```

### Open live post

Visible if:

```txt id="fey0ai"
externalPostUrl exists
```

### Attach live URL

Visible if:

```txt id="m25s7t"
externalPostId exists but externalPostUrl missing
OR platform does not reliably return URL
```

### Mark as manually verified

Visible only for:

```txt id="2orc60"
admin / manager
```

Requires reason.

---

# 9. Verification Center

Route:

```txt id="nm72na"
/app/social-scheduler/verification
```

## 9.1 Purpose

A focused operational page for all posts needing publishing proof.

## 9.2 Header

Title:

```txt id="63naqj"
Publishing Verification
```

Subtitle:

```txt id="sp7b8o"
Review published posts that need proof, verification, or manual recovery.
```

Buttons:

```txt id="kq9qt8"
Run verification check
Export issues
Back to scheduler
```

## 9.3 Tabs

```txt id="uj72kv"
All
Verification pending
Verified
Unverified
Manual review needed
Deleted externally
URL missing
Private/restricted
```

## 9.4 Verification Item Card

Each card shows:

```txt id="1zhil6"
Thumbnail
Post title
Workspace
Platform
Account
Published at
Verification status
Issue reason
External URL
Last checked
```

Actions:

```txt id="77q3bc"
Open post
Verify now
Attach URL
Resolve issue
View attempts
```

---

# 10. Reconciliation Dashboard

Route:

```txt id="7tirdt"
/app/social-scheduler/reconciliation
```

Admin/developer only.

## 10.1 Purpose

Track scheduled reconciliation jobs that periodically check already-published posts.

## 10.2 Header

Title:

```txt id="8ppewf"
Publishing Reconciliation
```

Subtitle:

```txt id="fy86he"
Check whether published posts are still available and correctly recorded.
```

Buttons:

```txt id="xqd9yd"
Run reconciliation
View latest run
Export report
```

## 10.3 Summary Cards

```txt id="jfb4d1"
Checked targets
Verified
Unverified
Deleted externally
URL missing
Permission blocked
Cost skipped
```

---

# 11. Data Model Additions

## 11.1 Verification Status Enum

```prisma id="u3z9vv"
enum SocialVerificationStatus {
  NOT_REQUIRED
  PENDING
  VERIFIED
  VERIFIED_MANUAL
  UNVERIFIED
  FAILED
  SKIPPED
  UNSUPPORTED
}
```

## 11.2 Verification Issue Enum

```prisma id="56z18b"
enum SocialVerificationIssueCode {
  NONE
  EXTERNAL_URL_MISSING
  EXTERNAL_POST_NOT_FOUND
  EXTERNAL_POST_DELETED
  EXTERNAL_POST_PRIVATE
  EXTERNAL_POST_RESTRICTED
  EXTERNAL_STATUS_PROCESSING
  EXTERNAL_ACCOUNT_MISMATCH
  EXTERNAL_MEDIA_MISMATCH
  EXTERNAL_TEXT_MISMATCH
  PROVIDER_READ_PERMISSION_MISSING
  PROVIDER_RATE_LIMITED
  PROVIDER_COST_NOT_APPROVED
  PROVIDER_UNSUPPORTED
  PROVIDER_TIMEOUT
  UNKNOWN
}
```

## 11.3 Update SocialPublishTarget

Add:

```prisma id="cxt3db"
verificationStatus       SocialVerificationStatus @default(PENDING)
verificationIssueCode    SocialVerificationIssueCode @default(NONE)
lastVerifiedAt           DateTime?
nextVerificationAt       DateTime?
manualVerifiedAt         DateTime?
manualVerifiedByUserId   String?
manualVerificationReason String?
externalDeletedAt        DateTime?
externalDriftDetectedAt  DateTime?
```

## 11.4 New Model — SocialPostVerificationCheck

If Sprint 10 already added this, Sprint 11 finalizes it.

```prisma id="jss6az"
model SocialPostVerificationCheck {
  id                  String @id @default(uuid())

  workspaceId          String
  postId               String
  targetId             String
  attemptId            String?

  platform             SocialSchedulerPlatform
  provider             SocialAccountProvider?
  socialAccountId      String?

  verificationStatus   SocialVerificationStatus
  issueCode            SocialVerificationIssueCode @default(NONE)

  externalPostId       String?
  externalPostUrl      String?

  checkedAt            DateTime @default(now())
  checkedByUserId      String?
  source               String

  providerStatus       String?
  providerVisibility   String?
  providerCreatedAt    DateTime?
  providerUpdatedAt    DateTime?

  matchedAccount       Boolean?
  matchedMedia         Boolean?
  matchedText          Boolean?

  errorCode            String?
  errorMessage         String?

  diagnosticsJson      Json?

  createdAt            DateTime @default(now())

  @@index([workspaceId, postId])
  @@index([workspaceId, targetId])
  @@index([workspaceId, verificationStatus])
  @@index([platform, verificationStatus])
  @@index([checkedAt])
}
```

Possible `source` values:

```txt id="r6fcqq"
POST_PUBLISH_AUTO
DELAYED_VERIFY
MANUAL_VERIFY
RECONCILIATION
QA_RUN
ADMIN_OVERRIDE
```

---

## 11.5 New Model — SocialPublishingReconciliationRun

```prisma id="ubdfim"
model SocialPublishingReconciliationRun {
  id                  String @id @default(uuid())

  workspaceId          String?
  startedByUserId      String?

  status               String @default("STARTED")
  source               String

  checkedTargets       Int @default(0)
  verifiedTargets      Int @default(0)
  unverifiedTargets    Int @default(0)
  failedChecks         Int @default(0)
  skippedChecks        Int @default(0)

  startedAt            DateTime @default(now())
  finishedAt           DateTime?

  summaryJson          Json?
  errorJson            Json?

  createdAt            DateTime @default(now())

  @@index([workspaceId])
  @@index([status])
  @@index([startedAt])
}
```

Possible statuses:

```txt id="gq2q3x"
STARTED
COMPLETED
PARTIAL_FAILED
FAILED
CANCELLED
```

---

## 11.6 New Model — SocialPublishingIntegrityIssue

```prisma id="g4e2bs"
model SocialPublishingIntegrityIssue {
  id                  String @id @default(uuid())

  workspaceId          String
  postId               String
  targetId             String
  verificationCheckId  String?

  platform             SocialSchedulerPlatform
  issueCode            SocialVerificationIssueCode

  severity             String
  status               String @default("OPEN")

  title                String
  description          String

  detectedAt           DateTime @default(now())
  resolvedAt           DateTime?
  resolvedByUserId     String?
  resolutionNote       String?

  metadataJson         Json?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([workspaceId, status])
  @@index([workspaceId, severity])
  @@index([postId, targetId])
}
```

Severity values:

```txt id="hfqr20"
INFO
WARNING
ERROR
CRITICAL
```

Issue statuses:

```txt id="fj921o"
OPEN
ACKNOWLEDGED
RESOLVED
IGNORED
```

---

## 11.7 New Model — SocialPlatformAssetAttachment

This closes the secondary asset tracking gap from Sprint 10.

```prisma id="lv3h7o"
model SocialPlatformAssetAttachment {
  id                  String @id @default(uuid())

  workspaceId          String
  postId               String
  targetId             String
  mediaAssetId         String

  platform             SocialSchedulerPlatform
  attachmentType       String
  status               String @default("PENDING")

  externalAssetId      String?
  externalAssetUrl     String?

  errorCode            String?
  errorMessage         String?

  metadataJson         Json?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([workspaceId, targetId])
  @@index([platform, attachmentType])
}
```

Attachment types:

```txt id="t9j9db"
YOUTUBE_THUMBNAIL
YOUTUBE_CAPTION
PINTEREST_COVER
INSTAGRAM_CAROUSEL_CHILD
INSTAGRAM_REEL_COVER
X_ALT_TEXT
PREVIEW_THUMBNAIL
```

---

# 12. Platform-Specific Verification Rules

## 12.1 Facebook Page Verification

Check:

```txt id="hithpq"
External Facebook post ID exists
External URL/permalink exists if available
Connected Page account still matches target
Post can be fetched if permission allows
Post is not deleted externally
Post is not unavailable due permission/privacy
```

Verification outcomes:

```txt id="p5k5m1"
Verified → external post exists and account matches
Unverified → provider cannot confirm
Failed → API/check failed unexpectedly
Skipped → permission/cost/config does not allow check
```

Common issues:

```txt id="9cw9fl"
EXTERNAL_URL_MISSING
EXTERNAL_POST_NOT_FOUND
PROVIDER_READ_PERMISSION_MISSING
PROVIDER_TIMEOUT
```

---

## 12.2 Instagram Verification

Check:

```txt id="slxxtk"
Instagram media ID exists
Permalink exists if returned
Container lifecycle completed
Media/post can be fetched if permission allows
Instagram account ID matches target
Post is not deleted externally
```

Special handling:

```txt id="fc9hu9"
If media is still processing, mark verification PENDING with issue EXTERNAL_STATUS_PROCESSING.
Do not mark failed immediately.
```

Common issues:

```txt id="7b7eeq"
EXTERNAL_STATUS_PROCESSING
EXTERNAL_POST_NOT_FOUND
EXTERNAL_URL_MISSING
EXTERNAL_ACCOUNT_MISMATCH
```

---

## 12.3 Pinterest Verification

Check:

```txt id="snbqxv"
Pin ID exists
Pin URL exists if returned
Pin can be fetched if permission allows
Board ID matches intended board
Board section matches if used
Pin is not deleted externally
```

Common issues:

```txt id="emlqkx"
EXTERNAL_POST_NOT_FOUND
EXTERNAL_URL_MISSING
EXTERNAL_ACCOUNT_MISMATCH
EXTERNAL_MEDIA_MISMATCH
```

---

## 12.4 YouTube Verification

Check:

```txt id="g0kumz"
YouTube video ID exists
Video status can be fetched
Upload processing state is known
Privacy status matches expected or documented restriction
Thumbnail status if thumbnail was selected
Caption status if captions were selected
Video URL exists
```

Special statuses:

```txt id="rdc4wx"
PRIVATE_RESTRICTED
PROCESSING
PUBLISHED_WITH_WARNINGS
```

Common issues:

```txt id="1solx1"
EXTERNAL_STATUS_PROCESSING
EXTERNAL_POST_PRIVATE
EXTERNAL_POST_RESTRICTED
SECONDARY_ASSET_FAILED
EXTERNAL_URL_MISSING
```

---

## 12.5 Twitter/X Verification

X verification must be cost-aware.

Check only if:

```txt id="kay7kg"
X read verification is enabled
Cost guard permits read operation
Required read scope exists
User/admin has approved verification cost if applicable
```

If not:

```txt id="0wk2bi"
verificationStatus = SKIPPED
issueCode = PROVIDER_COST_NOT_APPROVED
```

Check:

```txt id="flx57m"
X post ID exists
X URL can be formed
Post can be fetched if read check allowed
Account ID matches
Media attachment IDs exist if media was used
```

Common issues:

```txt id="1r1s2r"
PROVIDER_COST_NOT_APPROVED
PROVIDER_READ_PERMISSION_MISSING
EXTERNAL_POST_NOT_FOUND
EXTERNAL_URL_MISSING
```

---

# 13. Verification Timing

## 13.1 Immediate Verification

After successful provider response:

```txt id="uqgxpg"
Create SocialPostVerificationCheck with source POST_PUBLISH_AUTO.
Set verificationStatus = PENDING.
Schedule delayed verification.
```

Do not block publish success on immediate verification unless the platform response is obviously invalid.

## 13.2 Delayed Verification

Default delay:

```txt id="8ce2s9"
5 minutes after publish
```

Reason:

```txt id="o931q9"
Some platforms need processing time before a post is fully visible or fetchable.
```

## 13.3 Follow-Up Reconciliation

Recommended schedule:

```txt id="31agcg"
Check published posts:
- 5 minutes after publish
- 1 hour after publish
- 24 hours after publish
- Optional weekly check for last 30 days
```

## 13.4 Maximum Verification Attempts

```txt id="q56jvr"
Max verification attempts per target: 5
```

After max attempts:

```txt id="05dywp"
verificationStatus = UNVERIFIED
Create integrity issue
Show manual recovery action
```

---

# 14. Verification Worker Flow

Sprint 11 adds verification work to the existing worker system.

## 14.1 Flow

```txt id="37pwzg"
1. Publish adapter returns success.
2. Target becomes PUBLISHED or PUBLISHED_WITH_WARNINGS.
3. Verification job is created.
4. Verification worker claims due verification checks.
5. Verification adapter checks external result.
6. SocialPostVerificationCheck is stored.
7. Target verificationStatus updates.
8. Integrity issue is created if needed.
9. Notification event is emitted if needed.
10. UI timeline updates.
```

## 14.2 Worker Must Not Republish

Verification worker must never call publish endpoints.

Rule:

```txt id="vtsq1b"
Verification checks are read-only or URL-check-only.
```

For X:

```txt id="e8p0k6"
If verification read would create paid cost and cost is not approved, skip verification.
```

---

# 15. API Contracts

## 15.1 Verify Target Now

```txt id="u48xvy"
POST /api/v0/social-scheduler/targets/{targetId}/verify
```

Body:

```json id="vs1m3p"
{
  "workspaceId": "workspace_id",
  "reason": "Manual check after client asked for proof."
}
```

Response:

```json id="16u0n9"
{
  "targetId": "target_id",
  "verificationStatus": "VERIFIED",
  "issueCode": "NONE",
  "checkedAt": "2026-09-03T06:37:00.000Z"
}
```

---

## 15.2 Get Verification History

```txt id="ncd3fm"
GET /api/v0/social-scheduler/targets/{targetId}/verification-history?workspaceId=workspace_id
```

Response:

```json id="sgd11i"
{
  "targetId": "target_id",
  "checks": [
    {
      "id": "check_id",
      "verificationStatus": "VERIFIED",
      "issueCode": "NONE",
      "source": "DELAYED_VERIFY",
      "checkedAt": "2026-09-03T06:37:00.000Z"
    }
  ]
}
```

---

## 15.3 Attach Live URL

```txt id="fl5z61"
POST /api/v0/social-scheduler/targets/{targetId}/attach-live-url
```

Body:

```json id="2d5cz7"
{
  "workspaceId": "workspace_id",
  "externalPostUrl": "https://platform.example/post/123",
  "reason": "Provider did not return permalink, manually attached from platform."
}
```

Behavior:

```txt id="g2bwxs"
Validate workspace.
Validate user permission.
Validate URL shape.
Store URL.
Create audit log.
Create verification check with source ADMIN_OVERRIDE or MANUAL_VERIFY.
```

---

## 15.4 Mark Manually Verified

```txt id="vvh1bh"
POST /api/v0/social-scheduler/targets/{targetId}/mark-manually-verified
```

Body:

```json id="xhnqv1"
{
  "workspaceId": "workspace_id",
  "reason": "Client confirmed the live post manually."
}
```

Rules:

```txt id="d7ctfh"
Reason required.
Only admin/manager can perform.
Audit log required.
Does not fake provider response.
Sets verificationStatus = VERIFIED_MANUAL.
```

---

## 15.5 Run Reconciliation

```txt id="m6w6d0"
POST /api/v0/social-scheduler/reconciliation/run
```

Body:

```json id="pzqlco"
{
  "workspaceId": "workspace_id",
  "lookbackDays": 30,
  "platforms": ["FACEBOOK", "INSTAGRAM", "PINTEREST", "YOUTUBE", "X"]
}
```

Response:

```json id="cw4wt6"
{
  "runId": "reconciliation_run_id",
  "checkedTargets": 42,
  "verifiedTargets": 38,
  "unverifiedTargets": 3,
  "skippedChecks": 1,
  "failedChecks": 0
}
```

---

## 15.6 Resolve Integrity Issue

```txt id="wou2t7"
POST /api/v0/social-scheduler/integrity-issues/{issueId}/resolve
```

Body:

```json id="83efmy"
{
  "workspaceId": "workspace_id",
  "resolutionNote": "Live URL corrected and verified manually."
}
```

---

# 16. Frontend Components

Add:

```txt id="yc4mzu"
PublishingProofPanel.tsx
VerificationStatusChip.tsx
VerificationIssueCard.tsx
VerificationHistoryDrawer.tsx
VerifyNowButton.tsx
AttachLiveUrlModal.tsx
ManualVerificationModal.tsx
IntegrityIssueList.tsx
IntegrityIssueCard.tsx
ReconciliationDashboard.tsx
ReconciliationRunSummary.tsx
PostPublishCheckTimelineItem.tsx
PlatformVerificationDetails.tsx
```

Update:

```txt id="i09o2x"
SchedulerPostDetail.tsx
AttemptTimeline.tsx
SchedulerPostCard.tsx
SchedulerCalendarDrawer.tsx
SchedulerOverviewPage.tsx
SchedulerHealthPage.tsx
SchedulerQaPage.tsx
SchedulerSettingsPage.tsx
```

---

# 17. UX Copy

## 17.1 Verified

```txt id="p3o9eq"
Verified live
```

Helper:

```txt id="irl7r0"
Sakhaa Forge checked the external platform result.
```

## 17.2 Verification Pending

```txt id="epzdvl"
Verification pending
```

Helper:

```txt id="y209oc"
The platform accepted the post. Sakhaa Forge will check the external result shortly.
```

## 17.3 Unverified

```txt id="pqm2ly"
Unable to verify
```

Helper:

```txt id="37qd21"
The post may be published, but the external result could not be confirmed.
```

## 17.4 Manually Verified

```txt id="vhp58n"
Manually verified
```

Helper:

```txt id="52lt64"
A permitted user confirmed this post manually.
```

## 17.5 Deleted Externally

```txt id="gowwak"
Deleted externally
```

Helper:

```txt id="8e0xf2"
This post was previously published but could not be found during reconciliation.
```

## 17.6 Cost-Skipped X Verification

```txt id="v0137o"
Verification skipped due X cost guard
```

Helper:

```txt id="noypi8"
X read verification was skipped because cost approval was not available.
```

---

# 18. Settings Updates

Route:

```txt id="my7nfs"
/app/social-scheduler/settings
```

Add section:

```txt id="kvf2j6"
Post-Publishing Checks
```

Settings:

```txt id="9d2orw"
Enable post-publish verification
Run delayed verification after publish
Delayed verification minutes
Run reconciliation for recent posts
Reconciliation lookback days
Allow manual verification
Require reason for manual verification
Allow manual live URL attachment
Enable X read verification
Require X verification cost approval
```

Defaults:

```txt id="xii8fz"
Enable post-publish verification: true
Delayed verification minutes: 5
Reconciliation lookback days: 30
Allow manual verification: true
Require reason: true
Enable X read verification: false
Require X verification cost approval: true
```

---

# 19. Environment Variables

Add:

```txt id="qr1tyh"
SOCIAL_SCHEDULER_POST_VERIFY_ENABLED=true
SOCIAL_SCHEDULER_DELAYED_VERIFY_MINUTES=5
SOCIAL_SCHEDULER_MAX_VERIFY_ATTEMPTS=5
SOCIAL_SCHEDULER_RECONCILIATION_ENABLED=true
SOCIAL_SCHEDULER_RECONCILIATION_LOOKBACK_DAYS=30
SOCIAL_SCHEDULER_MANUAL_VERIFICATION_ENABLED=true
SOCIAL_SCHEDULER_REQUIRE_MANUAL_VERIFY_REASON=true
SOCIAL_SCHEDULER_ALLOW_MANUAL_LIVE_URL_ATTACH=true
SOCIAL_SCHEDULER_X_READ_VERIFY_ENABLED=false
SOCIAL_SCHEDULER_X_VERIFY_COST_ACK_REQUIRED=true
```

Worker:

```txt id="p35jkr"
SOCIAL_SCHEDULER_VERIFY_WORKER_BATCH_SIZE=50
SOCIAL_SCHEDULER_VERIFY_WORKER_MAX_RUNTIME_MS=240000
```

Security:

```txt id="b324ai"
SOCIAL_SCHEDULER_BLOCK_TOKEN_LOGGING=true
SOCIAL_SCHEDULER_BLOCK_SIGNED_URL_LOGGING=true
```

---

# 20. Worker Updates

## 20.1 Publish Worker Update

After successful publish:

```txt id="v6usdu"
Create verification check/job.
Set target.verificationStatus = PENDING.
Set target.nextVerificationAt = now + delayed verification interval.
Emit notification event if enabled.
```

## 20.2 Verification Worker

New worker responsibility:

```txt id="7lzhka"
Find targets with verificationStatus = PENDING or UNVERIFIED
AND nextVerificationAt <= now
AND attempt count under max
```

Then:

```txt id="toh9et"
Claim verification task
Call platform verification adapter
Store SocialPostVerificationCheck
Update target verificationStatus
Create integrity issue if needed
Emit notification if issue found
```

## 20.3 Reconciliation Worker

Periodic/admin-triggered:

```txt id="xf1w6a"
Find published targets within lookback window.
Skip unsupported/cost-blocked checks.
Run verification adapter.
Compare latest external state with stored publish state.
Create or resolve integrity issues.
```

---

# 21. Verification Adapter Interface

Create common interface:

```ts id="cf57f4"
type VerifyPublishedTargetInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "PINTEREST" | "YOUTUBE" | "X";
  provider?: "META" | "PINTEREST" | "GOOGLE" | "X";
  socialAccountId?: string;
  externalPostId?: string;
  externalPostUrl?: string;
  expectedAccountId?: string;
  expectedMediaAssetIds?: string[];
  expectedTextHash?: string;
  costApproved?: boolean;
};

type VerifyPublishedTargetResult = {
  verificationStatus:
    | "VERIFIED"
    | "UNVERIFIED"
    | "FAILED"
    | "SKIPPED"
    | "UNSUPPORTED";

  issueCode:
    | "NONE"
    | "EXTERNAL_URL_MISSING"
    | "EXTERNAL_POST_NOT_FOUND"
    | "EXTERNAL_POST_DELETED"
    | "EXTERNAL_POST_PRIVATE"
    | "EXTERNAL_POST_RESTRICTED"
    | "EXTERNAL_STATUS_PROCESSING"
    | "EXTERNAL_ACCOUNT_MISMATCH"
    | "EXTERNAL_MEDIA_MISMATCH"
    | "EXTERNAL_TEXT_MISMATCH"
    | "PROVIDER_READ_PERMISSION_MISSING"
    | "PROVIDER_RATE_LIMITED"
    | "PROVIDER_COST_NOT_APPROVED"
    | "PROVIDER_UNSUPPORTED"
    | "PROVIDER_TIMEOUT"
    | "UNKNOWN";

  externalPostId?: string;
  externalPostUrl?: string;
  providerStatus?: string;
  providerVisibility?: string;
  retryAfterMs?: number;
  diagnostics?: Record<string, unknown>;
};
```

---

# 22. Error Taxonomy Cleanup

Use one shared error taxonomy across:

```txt id="igvfda"
Readiness checks
Worker preflight
Publish attempts
Verification checks
Account health
QA dashboard
Notifications
Audit logs
```

## 22.1 Error Categories

```txt id="h2mqiv"
AUTH
PERMISSION
VALIDATION
MEDIA
PLATFORM
RATE_LIMIT
QUOTA
COST
APPROVAL
WORKER
STORAGE
VERIFICATION
UNKNOWN
```

## 22.2 Error Object Shape

```json id="ln0kth"
{
  "category": "VERIFICATION",
  "code": "EXTERNAL_POST_NOT_FOUND",
  "message": "The platform accepted the publish attempt, but the external post could not be found during verification.",
  "retryable": true,
  "userAction": "Retry verification or attach the live URL manually."
}
```

---

# 23. Audit Log Additions

Sprint 11 must audit:

```txt id="rxot4a"
POST_VERIFY_REQUESTED
POST_VERIFY_COMPLETED
POST_VERIFY_FAILED
POST_VERIFY_SKIPPED
POST_MANUALLY_VERIFIED
LIVE_URL_ATTACHED
LIVE_URL_CORRECTED
INTEGRITY_ISSUE_CREATED
INTEGRITY_ISSUE_RESOLVED
RECONCILIATION_RUN_STARTED
RECONCILIATION_RUN_COMPLETED
RECONCILIATION_RUN_FAILED
```

Audit payload must not contain:

```txt id="nt1ql3"
tokens
signed URLs
raw provider auth headers
B2 secrets
client secrets
PKCE verifier
```

---

# 24. Notifications

Sprint 10 introduced notification hooks. Sprint 11 uses them for verification.

Events:

```txt id="v57wtq"
POST_VERIFIED
POST_UNVERIFIED
POST_VERIFICATION_FAILED
POST_DELETED_EXTERNALLY
POST_PRIVATE_RESTRICTED
LIVE_URL_MISSING
MANUAL_VERIFICATION_REQUIRED
RECONCILIATION_ISSUE_FOUND
```

Notification severity:

```txt id="9muwkq"
INFO
WARNING
ERROR
CRITICAL
```

Examples:

```txt id="3lxald"
Published post verified
Instagram post is still processing
YouTube uploaded as private
X verification skipped due cost guard
Pinterest Pin URL missing
Facebook post could not be verified
```

---

# 25. QA Dashboard Updates

Route:

```txt id="6fyzj0"
/app/social-scheduler/qa
```

Add QA rows:

```txt id="ojwqff"
Facebook verification
Instagram verification
Pinterest verification
YouTube verification
X cost-aware verification
Manual live URL attach
Manual verification
External deletion detection
Reconciliation run
Token/signed URL leakage check
```

Columns:

```txt id="gmmo3v"
Platform
Publish success tested
Verification success tested
Verification failure tested
Manual recovery tested
Reconciliation tested
Workspace isolation tested
Leakage test passed
```

---

# 26. Functional Test Cases

## 26.1 Post-Publish Verification

```txt id="ske3h4"
Successful publish creates verification pending state.
```

```txt id="gqxkhn"
Delayed verification creates SocialPostVerificationCheck.
```

```txt id="4z955d"
Verified external post updates target verificationStatus to VERIFIED.
```

```txt id="eebqeu"
Failed verification creates integrity issue.
```

```txt id="cjocqv"
Verification history appears on post detail page.
```

---

## 26.2 Manual Verification

```txt id="q9ubdi"
Admin can attach live URL when missing.
```

```txt id="o6jb5k"
Invalid live URL is rejected.
```

```txt id="28mggo"
Manual verification requires reason.
```

```txt id="2azpo0"
Manual verification writes audit log.
```

```txt id="s2gpgv"
Normal viewer cannot manually verify.
```

---

## 26.3 Reconciliation

```txt id="kb7390"
Admin can run reconciliation for last 30 days.
```

```txt id="gq9h9s"
Reconciliation creates run record.
```

```txt id="op3e6a"
Deleted external post creates integrity issue.
```

```txt id="99h332"
Verified target remains verified after successful reconciliation.
```

```txt id="3uwvbr"
Unsupported verification is marked SKIPPED, not FAILED.
```

---

## 26.4 Platform-Specific Checks

```txt id="3getic"
Facebook post with external ID verifies successfully.
```

```txt id="4ya8r5"
Instagram processing post remains PENDING instead of FAILED.
```

```txt id="j8owwk"
Pinterest Pin missing board match creates mismatch issue.
```

```txt id="tbtx3a"
YouTube private restriction shows PRIVATE_RESTRICTED warning.
```

```txt id="m7577u"
X verification is skipped when read verification cost is not approved.
```

---

## 26.5 Workspace Isolation

```txt id="ow86kq"
Workspace A cannot view Workspace B verification history.
```

```txt id="1es374"
Workspace A cannot resolve Workspace B integrity issue.
```

```txt id="p8f236"
Workspace A cannot attach URL to Workspace B target.
```

```txt id="mdg8fd"
Reconciliation run respects workspace filter.
```

---

## 26.6 Security

```txt id="g2nc6o"
Verification diagnostics do not contain tokens.
```

```txt id="u4v8yh"
Verification diagnostics do not contain signed B2 URLs.
```

```txt id="eqqhqp"
Audit logs do not contain tokens.
```

```txt id="onvmut"
Notification metadata does not contain signed URLs.
```

```txt id="0n8z36"
Manual URL attach blocks javascript/file/data/private URLs.
```

---

# 27. Acceptance Criteria

Sprint 11 is complete when:

## Verification

```txt id="n9lohi"
Every successful publish creates verification pending state.
Verification worker checks due published targets.
Verification results are stored.
Verification status appears in post detail page.
Verification history is visible.
```

## Reconciliation

```txt id="vrsh8w"
Admin can run reconciliation.
Reconciliation records checked/verified/failed/skipped counts.
External deletion/missing URL/private restriction issues are detected.
Integrity issues are created and resolvable.
```

## Manual Recovery

```txt id="qldtrk"
Admin/manager can attach live URL.
Admin/manager can manually verify with reason.
Manual recovery actions are audit-logged.
Normal viewers cannot perform recovery actions.
```

## Gap Closure

```txt id="jbrfmq"
Publish mode is enum-based.
Status model is normalized into primary status + reason + verification status.
Secondary platform assets are tracked consistently.
Blocked reason taxonomy is shared.
Error object shape is shared.
Verification does not republish content.
X verification is cost-aware.
```

## Security

```txt id="juqf3f"
No token leakage.
No signed URL leakage.
No cross-workspace verification leakage.
No unsafe manual URL injection.
All recovery actions are permission-checked and audit-logged.
```

---

# 28. Sprint 11 Deliverables

## Frontend

```txt id="ue3qn4"
Publishing proof panel
Verification status chips
Verification history drawer
Verification center page
Reconciliation dashboard
Integrity issue cards
Verify now button
Attach live URL modal
Manual verification modal
Updated attempt timeline
Updated scheduler cards
Updated QA matrix
Updated settings page
```

## Backend

```txt id="7krawb"
Verification worker
Reconciliation worker
Verification adapter interface
Facebook verification adapter
Instagram verification adapter
Pinterest verification adapter
YouTube verification adapter
X cost-aware verification adapter
Manual live URL endpoint
Manual verification endpoint
Integrity issue service
Shared error taxonomy
Status normalization update
Audit log additions
Notification event additions
```

## Database

```txt id="kvz4hh"
SocialVerificationStatus enum
SocialVerificationIssueCode enum
SocialPostVerificationCheck model
SocialPublishingReconciliationRun model
SocialPublishingIntegrityIssue model
SocialPlatformAssetAttachment model
SocialPublishMode enum
Status reason fields
Verification fields on SocialPublishTarget
Indexes for verification and reconciliation queries
```

## Tests

```txt id="cyqjmk"
Post-publish verification tests
Delayed verification tests
Platform-specific verification tests
Manual verification tests
Live URL attach tests
Reconciliation tests
Integrity issue tests
Workspace isolation tests
Token leakage tests
Signed URL leakage tests
X cost-aware verification tests
Status normalization tests
Regression tests across Sprints 1–10
```

---

# 29. Final Sprint 11 Implementation Summary

Build this in Sprint 11:

```txt id="sblsj2"
Published target
→ Verification pending
→ Delayed verification worker
→ Platform-specific external check
→ Verification history
→ Integrity issue if mismatch/failure
→ Manual recovery if needed
→ Reconciliation for recent published posts
→ Audit and notification trail
```

Also close these gaps:

```txt id="7f9guz"
Normalize status model
Convert publishMode to enum
Centralize blocked reasons
Centralize error taxonomy
Track secondary platform assets
Make X verification cost-aware
Add manual verification and live URL correction
Add reconciliation dashboard
Add final leakage/security checks
```

Do not add new platforms.

Do not build analytics yet unless treated as stretch.

Do not build social inbox.

Do not bypass the Sprint 2 worker.

Sprint 11’s job is to make the scheduler trustworthy after publishing: not just “we sent it,” but “we checked it, recorded proof, flagged issues, and gave recovery actions.”