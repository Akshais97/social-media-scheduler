# Sakhaa Forge Social Scheduler — Sprint 9 Documentation  
## Sprint 9: Advanced Scheduling UX, Calendar Editing, Bulk Drafts, Duplication, and Approval Workflow

## 0. Sprint Intent

Sprint 9 continues directly from Sprints 1–8.

Sprint 1 created:

```txt id="fh81hn"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="cod9e3"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="x1py7o"
Meta OAuth
→ Facebook Page discovery
→ Real Facebook Page publishing
```

Sprint 4 created:

```txt id="k8gd57"
Instagram account discovery
→ Instagram media-container publishing
```

Sprint 5 created:

```txt id="6zq2zm"
Pinterest OAuth
→ Board discovery
→ Image Pin publishing
```

Sprint 6 created:

```txt id="1yfr6m"
Google OAuth
→ YouTube channel wiring
→ YouTube quota ledger
→ Video publishing
```

Sprint 7 created:

```txt id="frqh5w"
X OAuth with PKCE
→ Paid API cost acknowledgement
→ X publishing
```

Sprint 8 created:

```txt id="tbckof"
Calendar view
→ Account health
→ Readiness checks
→ Quota/cost dashboard
→ QA matrix
→ Production readiness gates
```

Sprint 9 now improves the scheduler’s real-world agency workflow:

```txt id="gp4fiv"
Calendar editing
→ Safe drag/reschedule
→ Duplicate posts
→ Bulk draft creation
→ Batch upload planning
→ Optional approval workflow
→ Publishing governance
```

Sprint 9 does **not** add a new platform.  
Sprint 9 improves speed, safety, and client-ready workflow management.

---

## 1. Sprint 9 Name

```txt id="lw1o8n"
Sprint 9 — Advanced Scheduling UX and Approval Workflow
```

Alternative internal label:

```txt id="tddfhd"
Sprint 9 — Calendar Operations, Bulk Drafts, and Publishing Governance
```

---

## 2. Sprint 9 Outcome

By the end of Sprint 9:

1. Users can safely drag calendar posts to reschedule them.
2. Users can duplicate an existing scheduled post.
3. Users can copy one post to multiple dates.
4. Users can bulk upload multiple media files for one workspace.
5. Users can create multiple draft posts from uploaded media.
6. Users can save bulk drafts without immediately scheduling.
7. Users can batch assign platforms, captions, and schedule slots.
8. Users can send posts for review.
9. Approvers can approve, request changes, or reject posts.
10. Publishing can be blocked until approval is complete if workspace settings require it.
11. The worker respects approval status before publishing.
12. All bulk actions preserve workspace isolation.
13. Every calendar edit, approval, duplicate, bulk create, and schedule action is audit-logged.

---

## 3. In Scope

Sprint 9 includes:

```txt id="dj2n3t"
Safe drag-to-reschedule
Calendar quick edit drawer
Duplicate post action
Copy post to multiple dates
Bulk media upload intake
Bulk draft builder
Batch platform assignment
Batch schedule assignment
Approval workflow
Review request flow
Approve / request changes / reject actions
Approval-gated publishing setting
Approval comments
Audit logs for advanced actions
Worker approval preflight
Functional tests
```

---

## 4. Out of Scope

Sprint 9 must **not** implement:

```txt id="ulfgbm"
New social platforms
Social inbox
DMs
Comment moderation
Advanced analytics
AI caption generation as required acceptance
AI image/video generation
Recurring evergreen automation
Auto-posting without user review
External client portal as a separate app
Billing
Ad campaign performance tracking
```

Optional stretch only:

```txt id="mi6t4s"
CSV import for drafts
Approval email notifications
Slack approval notifications
Bulk calendar export
```

Do not block Sprint 9 completion on stretch features.

---

# 5. Product Principle

Sprint 9 must make the scheduler faster without making it dangerous.

The core rule:

```txt id="2lwc6h"
Fast actions must still be confirmable, reversible where possible, workspace-scoped, and audit-logged.
```

The user must never accidentally publish because they dragged a card, duplicated a post, or bulk-created drafts.

---

# 6. Route Structure

Existing routes remain:

```txt id="8klqvp"
/app/social-scheduler
/app/social-scheduler/new
/app/social-scheduler/[postId]
/app/social-scheduler/calendar
/app/social-scheduler/health
/app/social-scheduler/qa
/app/social-scheduler/settings
/app/social-accounts
```

Sprint 9 adds:

```txt id="wjiqjm"
/app/social-scheduler/bulk
/app/social-scheduler/review
/app/social-scheduler/approvals
```

Recommended route purposes:

```txt id="1ox4ia"
/app/social-scheduler/bulk
Bulk media upload and draft creation

/app/social-scheduler/review
Posts waiting for review, changes, or approval

/app/social-scheduler/approvals
Approval queue for approvers/admins
```

---

# 7. Navigation Updates

Scheduler sub-navigation from Sprint 8 becomes:

```txt id="sox7aj"
Overview
Calendar
Posts
Bulk Drafts
Review
Accounts
Health
QA
Settings
```

Visibility rules:

```txt id="i80cb0"
Overview → all permitted users
Calendar → all permitted users
Posts → all permitted users
Bulk Drafts → creators/admins/client managers
Review → creators/admins/client managers/approvers
Accounts → admins/client managers
Health → admins/client managers
QA → admin/developer only
Settings → admin only
```

Primary CTA dropdown:

```txt id="fylsay"
Create
```

Dropdown options:

```txt id="yrwztp"
Create scheduled post
Bulk create drafts
Upload media
```

---

# 8. Calendar Editing

Route:

```txt id="fy29sn"
/app/social-scheduler/calendar
```

Sprint 8 added calendar view.  
Sprint 9 adds safe editing.

---

## 8.1 Drag-to-Reschedule

Users can drag a scheduled post from one time slot to another.

Important rule:

```txt id="jxfbfw"
Dragging does not immediately save.
Dragging opens a confirmation modal.
```

## 8.2 Drag Confirmation Modal

Title:

```txt id="63xd5j"
Reschedule this post?
```

Body:

```txt id="6aop7k"
You moved this post to a new time. Confirm before updating the schedule.
```

Summary rows:

```txt id="hv35ef"
Original time
New time
Workspace
Platforms
Quota/cost impact
```

Buttons:

```txt id="lbgmxv"
Confirm reschedule
Undo move
Cancel
```

Validation before confirm:

```txt id="h4x2zu"
New time must be in the future.
New time must be at least now + 5 minutes.
Post must not be processing.
Post must not be published.
Post must not be cancelled.
User must have edit permission.
Readiness check must pass or warn.
```

If YouTube target exists:

```txt id="gwmmch"
Recheck YouTube quota for new date.
```

If X target exists:

```txt id="oo1rp2"
Preserve cost acknowledgement if content/platform unchanged.
Recalculate cost if text/link/media changed.
```

---

## 8.3 Calendar Quick Edit Drawer

Clicking a calendar post opens drawer.

Sprint 9 drawer adds quick edit mode.

Sections:

```txt id="uy56ph"
Post summary
Media preview
Schedule block
Platform target block
Approval block
Readiness block
Latest attempt
Actions
```

Buttons:

```txt id="32gkt5"
Edit content
Reschedule
Duplicate
Copy to dates
Send for review
Approve
Request changes
Cancel post
View full details
Close
```

Button visibility:

```txt id="v8jdtq"
Edit content → draft/scheduled/changes requested only
Reschedule → scheduled/retrying/failed/quota blocked/cost blocked
Duplicate → always except deleted/unavailable
Copy to dates → draft/scheduled/approved only
Send for review → draft/changes requested
Approve → approver/admin only
Request changes → approver/admin only
Cancel post → unpublished targets only
```

---

# 9. Duplicate Post Flow

## 9.1 Purpose

Agencies often reuse the same creative across multiple dates or platforms. Sprint 9 adds safe duplication.

## 9.2 Duplicate Button

Button:

```txt id="8j6mer"
Duplicate
```

Available from:

```txt id="e8slw9"
Post card
Post detail page
Calendar drawer
```

## 9.3 Duplicate Modal

Title:

```txt id="k26erx"
Duplicate scheduled post
```

Body:

```txt id="i848kr"
Create a new draft using this post’s media, caption, platform settings, and composer data.
```

Options:

```txt id="i3dw12"
Duplicate as draft
Duplicate with schedule
Duplicate without platform targets
Duplicate for another workspace
```

Sprint 9 rule:

```txt id="g9ou8a"
Duplicate for another workspace must be disabled unless media/account ownership transfer is explicitly implemented.
```

Default selected option:

```txt id="w7j6pr"
Duplicate as draft
```

Buttons:

```txt id="x6zqpp"
Create duplicate
Cancel
```

## 9.4 Duplicate Behavior

When duplicating:

```txt id="gjt91c"
Create new ScheduledSocialPost.
Copy draftContentJson.
Copy linked media references only if media belongs to same workspace.
Copy platformOptionsJson.
Do not copy attempt history.
Do not copy external post IDs.
Do not copy published status.
Do not copy consumed YouTube reservation.
Do not copy consumed X cost ledger.
Set new post status = DRAFT.
```

If duplicating with schedule:

```txt id="fsqs5u"
Run readiness check.
Reserve YouTube quota if required.
Require X cost acknowledgement if required.
Set status = SCHEDULED only after validations pass.
```

---

# 10. Copy to Multiple Dates

## 10.1 Purpose

This is different from simple duplication. It creates many drafts or scheduled posts from one source post.

## 10.2 Button

```txt id="zllmst"
Copy to dates
```

## 10.3 Modal

Title:

```txt id="2dnsrj"
Copy post to multiple dates
```

Body:

```txt id="pbng77"
Create multiple copies of this post for different publish times.
```

Fields:

```txt id="kvwn5h"
Date/time list
Timezone
Copy as draft or scheduled
Platform targets
Caption suffix optional
```

Date/time input modes:

```txt id="m50r1f"
Manual add
Pick from calendar
Paste date/time list
```

Buttons:

```txt id="wvnlhm"
Add date
Remove date
Create copies
Cancel
```

Validation:

```txt id="q8997l"
At least one date/time required.
No date/time in the past.
No duplicate date/time entries.
Maximum 30 copies per action in Sprint 9.
Workspace permission required.
```

If scheduled mode is selected:

```txt id="k3lsph"
Run readiness check for each copy.
Reserve YouTube quota per YouTube target.
Estimate/acknowledge X cost per X target.
Show failure list before creation.
```

---

# 11. Bulk Drafts

Route:

```txt id="yxs8c1"
/app/social-scheduler/bulk
```

## 11.1 Purpose

Bulk Drafts lets users upload several approved creatives and turn them into draft/scheduled posts quickly.

Flow:

```txt id="o57xn2"
Select workspace
→ Upload multiple media files
→ Review uploaded assets
→ Add captions/titles
→ Assign platforms
→ Assign schedule times
→ Review batch
→ Create drafts or scheduled posts
```

---

## 11.2 Bulk Draft Stage Rail

Use step-led UX like earlier sprints:

```txt id="oenmmd"
1. Workspace
2. Upload
3. Drafts
4. Platforms
5. Schedule
6. Review
7. Create
```

Each stage status:

```txt id="oxax0o"
Idle
Active
Complete
Blocked
Warning
```

---

## 11.3 Stage 1 — Workspace

Title:

```txt id="6v9h18"
Choose workspace
```

Description:

```txt id="nisuxp"
Bulk drafts are isolated to one client workspace.
```

Fields:

```txt id="c878ix"
Workspace dropdown
Brand profile summary
Permission badge
Storage status
```

Button:

```txt id="xf7dxh"
Continue
```

Disabled until workspace and permission are valid.

---

## 11.4 Stage 2 — Upload

Title:

```txt id="8v6jsd"
Upload approved media
```

Description:

```txt id="v0vdys"
Upload multiple approved images or videos for this workspace.
```

Upload card:

```txt id="0v9pff"
Drag and drop files here
or
Browse files
```

Buttons:

```txt id="qjws33"
Browse files
Upload selected files
Remove all
Back
```

Rules:

```txt id="8iood9"
Maximum 50 files per bulk upload action.
Images max 10 MB each.
Videos max 200 MB each.
Supported files follow Sprint 1 media rules.
Every object key must be workspace-scoped.
```

Rights checkbox:

```txt id="m9r4ty"
I confirm these media files are approved for use by this client.
```

---

## 11.5 Stage 3 — Drafts

Title:

```txt id="iu5fh4"
Create draft details
```

Description:

```txt id="7ad7ne"
Add a title and caption for each uploaded creative.
```

Display as editable rows/cards.

Each draft row:

```txt id="s42ugh"
Thumbnail
Internal post title
Caption
CTA optional
Hashtags optional
Notes optional
Validation status
```

Buttons:

```txt id="usncm9"
Apply caption to all
Apply hashtags to all
Clear empty rows
Continue
Back
```

Bulk action:

```txt id="8lbjh6"
Apply to all
```

Modal fields:

```txt id="vgtgmt"
Caption
CTA
Hashtags
Notes
```

Options:

```txt id="c6ni9p"
Replace existing values
Only fill empty values
Append hashtags
```

---

## 11.6 Stage 4 — Platforms

Title:

```txt id="pg6fqn"
Assign platforms
```

Description:

```txt id="jhg65x"
Choose where each draft should be scheduled.
```

View modes:

```txt id="dk90bb"
Apply same platforms to all
Customize per draft
```

Platform options:

```txt id="qfy5tk"
Facebook
Instagram
Pinterest
YouTube
X
Mock mode
```

Validation examples:

```txt id="k2u1cy"
YouTube requires video.
Pinterest Sprint 5 supports image Pins.
X requires cost acknowledgement.
Instagram requires connected professional account.
```

Buttons:

```txt id="29vnxr"
Apply platforms
Customize
Continue
Back
```

---

## 11.7 Stage 5 — Schedule

Title:

```txt id="td0p0a"
Assign schedule times
```

Description:

```txt id="ast59t"
Choose when each draft should publish, or save all as unscheduled drafts.
```

Modes:

```txt id="9ic8vv"
Save all as drafts
Manual schedule per post
Auto-spread across dates
```

Auto-spread fields:

```txt id="djymwo"
Start date
End date
Preferred posting times
Timezone
Maximum posts per day
Skip weekends toggle
```

Buttons:

```txt id="sb5g1n"
Generate schedule
Clear schedule
Continue
Back
```

Sprint 9 rule:

```txt id="paxn5k"
Auto-spread only proposes times.
User must review before creation.
```

---

## 11.8 Stage 6 — Review

Title:

```txt id="w3hn9q"
Review batch
```

Summary:

```txt id="h2i2ti"
Total drafts
Scheduled posts
Unscheduled drafts
Media count
Platform targets
Warnings
Blocking issues
```

Buttons:

```txt id="rjp28e"
Create batch
Back
Cancel batch
```

If approval is enabled:

```txt id="ln6v78"
Create and send for review
Create as drafts
```

---

## 11.9 Stage 7 — Create

Success title:

```txt id="17hp8x"
Bulk drafts created
```

Body:

```txt id="eax44v"
Your batch has been saved to this workspace.
```

Buttons:

```txt id="if6xxh"
View batch
Open calendar
Create another batch
Back to scheduler
```

---

# 12. Bulk Batch Data Model

## 12.1 New Model — SocialSchedulerBatch

```prisma id="v0imxj"
model SocialSchedulerBatch {
  id                String @id @default(uuid())

  workspaceId       String
  createdByUserId   String

  name              String
  status            String @default("DRAFTING")

  totalPosts         Int @default(0)
  createdPosts       Int @default(0)
  failedPosts        Int @default(0)

  source             String @default("BULK_UI")
  settingsJson       Json?
  summaryJson        Json?
  errorJson          Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  completedAt       DateTime?

  @@index([workspaceId, status])
  @@index([createdAt])
}
```

Possible statuses:

```txt id="k9a9kb"
DRAFTING
VALIDATING
CREATING
COMPLETED
PARTIAL_FAILED
FAILED
CANCELLED
```

---

## 12.2 Update ScheduledSocialPost

Add:

```prisma id="05a2ji"
batchId             String?
sourcePostId        String?
approvalStatus      String @default("NOT_REQUIRED")
reviewRequestedAt   DateTime?
approvedAt          DateTime?
approvedByUserId    String?
changesRequestedAt  DateTime?
rejectedAt          DateTime?
```

---

# 13. Approval Workflow

Route:

```txt id="oe12tb"
/app/social-scheduler/review
```

and:

```txt id="z7x1e7"
/app/social-scheduler/approvals
```

## 13.1 Approval Setting

Workspace setting:

```txt id="uik8y0"
Require approval before publishing
```

Internal field:

```txt id="ffxy95"
socialSchedulerApprovalRequired: boolean
```

Default:

```txt id="wway29"
false
```

Recommended for client-facing production:

```txt id="axg98x"
true
```

---

## 13.2 Approval Statuses

```txt id="3vg9h3"
NOT_REQUIRED
DRAFT
IN_REVIEW
CHANGES_REQUESTED
APPROVED
REJECTED
AUTO_APPROVED
```

Publishing rule:

```txt id="a5cxbl"
If workspace requires approval, worker must not publish unless approvalStatus = APPROVED or AUTO_APPROVED.
```

---

## 13.3 Review Queue Page

Route:

```txt id="8vqkot"
/app/social-scheduler/review
```

Title:

```txt id="vavfkc"
Review Queue
```

Subtitle:

```txt id="d0o10m"
Track posts waiting for review, approval, or changes.
```

Tabs:

```txt id="8ol8yx"
Drafts
In review
Changes requested
Approved
Rejected
All
```

Post review card shows:

```txt id="pcj5mg"
Thumbnail
Post title
Workspace
Platforms
Scheduled time
Approval status
Readiness status
Last comment
```

Actions:

```txt id="ittnt0"
Open review
Send for review
Edit
Cancel
```

---

## 13.4 Approval Detail Panel

Inside post detail page, add:

```txt id="grho9f"
Approval panel
```

Fields:

```txt id="u3m7oc"
Approval status
Requested by
Requested at
Approved by
Approved at
Latest review comment
Change requests
```

Buttons:

```txt id="s0q39p"
Send for review
Approve
Request changes
Reject
Edit post
View audit trail
```

Button visibility:

```txt id="uw5hk7"
Send for review → creator/admin on DRAFT or CHANGES_REQUESTED
Approve → approver/admin on IN_REVIEW
Request changes → approver/admin on IN_REVIEW
Reject → approver/admin on IN_REVIEW
Edit post → creator/admin when not PROCESSING/PUBLISHED
```

---

## 13.5 Send for Review Modal

Title:

```txt id="gg5k5m"
Send post for review?
```

Body:

```txt id="3co3c3"
Reviewers will check the media, caption, platforms, and schedule before this post can publish.
```

Fields:

```txt id="56uex4"
Reviewer optional
Message optional
```

Buttons:

```txt id="r5s0xg"
Send for review
Cancel
```

On submit:

```txt id="czgd3a"
approvalStatus = IN_REVIEW
reviewRequestedAt = now()
audit action = POST_SENT_FOR_REVIEW
```

---

## 13.6 Approve Modal

Title:

```txt id="93r7oq"
Approve this post?
```

Body:

```txt id="ag94yk"
Approved posts can be published when their scheduled time arrives.
```

Checklist:

```txt id="hlbnni"
Media is approved
Caption is approved
Platform targets are correct
Schedule time is correct
Readiness check has no blocking issues
```

Buttons:

```txt id="cs9vuw"
Approve post
Cancel
```

On submit:

```txt id="pn2jx4"
approvalStatus = APPROVED
approvedAt = now()
approvedByUserId = current user
audit action = POST_APPROVED
```

---

## 13.7 Request Changes Modal

Title:

```txt id="pg9kz1"
Request changes
```

Body:

```txt id="ggmgrc"
Explain what needs to be corrected before this post can be approved.
```

Required field:

```txt id="yszkq3"
Change request
```

Buttons:

```txt id="eaiup1"
Request changes
Cancel
```

On submit:

```txt id="uwkum0"
approvalStatus = CHANGES_REQUESTED
changesRequestedAt = now()
audit action = CHANGES_REQUESTED
```

---

## 13.8 Reject Modal

Title:

```txt id="8zth29"
Reject this post?
```

Body:

```txt id="jc9j9h"
Rejected posts will not be published unless edited and sent for review again.
```

Required field:

```txt id="8i1y1b"
Reason
```

Buttons:

```txt id="4ggrgm"
Reject post
Cancel
```

On submit:

```txt id="hbe7vi"
approvalStatus = REJECTED
rejectedAt = now()
audit action = POST_REJECTED
```

---

# 14. Approval Comments

## 14.1 New Model — SocialSchedulerReviewComment

```prisma id="2h9x88"
model SocialSchedulerReviewComment {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String
  authorUserId      String

  commentType       String
  body              String

  metadataJson      Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([authorUserId])
}
```

Comment types:

```txt id="5iqxmh"
GENERAL
REVIEW_REQUEST
APPROVAL
CHANGE_REQUEST
REJECTION
SYSTEM
```

---

# 15. Worker Approval Preflight

Sprint 8 added worker preflight.

Sprint 9 extends it.

Before publishing:

```txt id="zevpzy"
If workspace approval required:
  approvalStatus must be APPROVED or AUTO_APPROVED
Else:
  approvalStatus may be NOT_REQUIRED, APPROVED, or AUTO_APPROVED
```

If blocked:

```txt id="2c1q17"
target.status = APPROVAL_BLOCKED
attempt.status = APPROVAL_BLOCKED
post.status = APPROVAL_BLOCKED
```

Add statuses if needed:

```prisma id="gnod7p"
enum SocialSchedulerTargetStatus {
  APPROVAL_BLOCKED
}
```

```prisma id="t3ig3o"
enum SocialPublishAttemptStatus {
  APPROVAL_BLOCKED
}
```

Post-level status:

```txt id="6ptddx"
APPROVAL_BLOCKED
```

UI copy:

```txt id="52bdwb"
Approval required before publishing
```

---

# 16. API Contracts

## 16.1 Duplicate Post

```txt id="xtb2bg"
POST /api/v0/social-scheduler/posts/{postId}/duplicate
```

Body:

```json id="83cu4n"
{
  "workspaceId": "workspace_id",
  "mode": "DRAFT",
  "copyTargets": true,
  "copySchedule": false
}
```

Response:

```json id="y3ichp"
{
  "sourcePostId": "source_post_id",
  "newPostId": "new_post_id",
  "status": "DRAFT"
}
```

---

## 16.2 Copy to Multiple Dates

```txt id="8w92ru"
POST /api/v0/social-scheduler/posts/{postId}/copy-to-dates
```

Body:

```json id="w2x7yd"
{
  "workspaceId": "workspace_id",
  "mode": "SCHEDULED",
  "timezone": "Asia/Kolkata",
  "dates": [
    "2026-09-05T10:30:00.000Z",
    "2026-09-07T10:30:00.000Z"
  ],
  "copyTargets": true
}
```

Response:

```json id="dghwd2"
{
  "createdCount": 2,
  "failedCount": 0,
  "createdPostIds": ["post_1", "post_2"],
  "failures": []
}
```

---

## 16.3 Create Bulk Batch

```txt id="0cq5wx"
POST /api/v0/social-scheduler/batches
```

Body:

```json id="u95z81"
{
  "workspaceId": "workspace_id",
  "name": "September real estate posts",
  "settingsJson": {
    "mode": "DRAFTS_ONLY",
    "timezone": "Asia/Kolkata"
  }
}
```

Response:

```json id="hmbetn"
{
  "batchId": "batch_id",
  "status": "DRAFTING"
}
```

---

## 16.4 Create Posts from Batch

```txt id="mwtsdq"
POST /api/v0/social-scheduler/batches/{batchId}/create-posts
```

Body:

```json id="yocvjt"
{
  "workspaceId": "workspace_id",
  "items": [
    {
      "mediaAssetId": "asset_id",
      "title": "Project walkthrough 1",
      "draftContentJson": {
        "version": "1.0",
        "caption": "Explore this premium project...",
        "cta": "Book a site visit",
        "hashtags": ["LuxuryHomes"]
      },
      "targets": [],
      "scheduledAt": null,
      "timezone": "Asia/Kolkata"
    }
  ]
}
```

Response:

```json id="h6tqbs"
{
  "batchId": "batch_id",
  "createdPosts": 10,
  "failedPosts": 0,
  "postIds": []
}
```

---

## 16.5 Send for Review

```txt id="nzbypd"
POST /api/v0/social-scheduler/posts/{postId}/send-for-review
```

Body:

```json id="c4wte2"
{
  "workspaceId": "workspace_id",
  "reviewerUserId": "optional_user_id",
  "message": "Please review this before Friday."
}
```

---

## 16.6 Approve Post

```txt id="1o30fh"
POST /api/v0/social-scheduler/posts/{postId}/approve
```

Body:

```json id="vfriw3"
{
  "workspaceId": "workspace_id",
  "comment": "Approved for publishing."
}
```

---

## 16.7 Request Changes

```txt id="mpedlc"
POST /api/v0/social-scheduler/posts/{postId}/request-changes
```

Body:

```json id="omprv2"
{
  "workspaceId": "workspace_id",
  "comment": "Please change the CTA before scheduling."
}
```

---

## 16.8 Reject Post

```txt id="7p01ul"
POST /api/v0/social-scheduler/posts/{postId}/reject
```

Body:

```json id="amlae0"
{
  "workspaceId": "workspace_id",
  "reason": "Creative not approved by client."
}
```

---

# 17. Frontend Components

Add:

```txt id="234xfl"
BulkDraftsPage.tsx
BulkDraftStageRail.tsx
BulkWorkspaceStep.tsx
BulkMediaUploadStep.tsx
BulkDraftDetailsStep.tsx
BulkPlatformAssignmentStep.tsx
BulkScheduleAssignmentStep.tsx
BulkReviewStep.tsx
BulkCreateResult.tsx
BulkDraftRow.tsx
BulkApplyToAllModal.tsx
DuplicatePostModal.tsx
CopyToDatesModal.tsx
DragRescheduleConfirmModal.tsx
ReviewQueuePage.tsx
ApprovalQueuePage.tsx
ApprovalPanel.tsx
SendForReviewModal.tsx
ApprovePostModal.tsx
RequestChangesModal.tsx
RejectPostModal.tsx
ReviewCommentThread.tsx
ApprovalStatusChip.tsx
```

Update:

```txt id="k1eg46"
SchedulerCalendarPage.tsx
SchedulerCalendarGrid.tsx
SchedulerCalendarEventCard.tsx
SchedulerCalendarDrawer.tsx
SchedulerPostCard.tsx
SchedulerPostDetail.tsx
ReadinessCheckPanel.tsx
WorkerDiagnosticsPanel.tsx
SchedulerSettingsPage.tsx
```

---

# 18. Backend Services

Add:

```txt id="e75wbw"
SocialSchedulerBulkService
SocialSchedulerDuplicateService
SocialSchedulerApprovalService
SocialSchedulerReviewCommentService
SocialSchedulerCalendarEditService
```

Update:

```txt id="820k6p"
SocialSchedulerReadinessService
SocialSchedulerWorkerService
SocialSchedulerAuditLogService
YouTubeQuotaReservationService
XCostLedgerService
SocialSchedulerStatusService
```

---

# 19. Environment Variables

Add:

```txt id="itxa8u"
SOCIAL_SCHEDULER_BULK_DRAFTS_ENABLED=true
SOCIAL_SCHEDULER_MAX_BULK_UPLOAD_FILES=50
SOCIAL_SCHEDULER_MAX_COPY_TO_DATES=30
SOCIAL_SCHEDULER_DRAG_RESCHEDULE_ENABLED=true
SOCIAL_SCHEDULER_DRAG_RESCHEDULE_REQUIRES_CONFIRMATION=true
SOCIAL_SCHEDULER_APPROVAL_WORKFLOW_ENABLED=true
SOCIAL_SCHEDULER_APPROVAL_REQUIRED_DEFAULT=false
SOCIAL_SCHEDULER_APPROVAL_BLOCKS_WORKER=true
```

Security:

```txt id="l5a8c7"
SOCIAL_SCHEDULER_AUDIT_LOG_ENABLED=true
SOCIAL_SCHEDULER_WORKSPACE_ISOLATION_STRICT=true
```

---

# 20. Settings Page Updates

Route:

```txt id="qmknpe"
/app/social-scheduler/settings
```

Add section:

```txt id="9nbqfx"
Workflow Controls
```

Fields/toggles:

```txt id="7xee96"
Require approval before publishing
Allow drag-to-reschedule
Require confirmation after drag
Allow bulk draft creation
Maximum bulk upload files
Maximum copy-to-date count
```

Save button:

```txt id="cdz7vz"
Save workflow settings
```

Reset button:

```txt id="1mz7ty"
Reset to defaults
```

Danger note:

```txt id="0lze17"
If approval is required, posts will not publish until approved.
```

---

# 21. Audit Log Requirements

Sprint 9 must audit:

```txt id="334la5"
POST_DUPLICATED
POST_COPIED_TO_DATES
BULK_BATCH_CREATED
BULK_POSTS_CREATED
POST_SENT_FOR_REVIEW
POST_APPROVED
CHANGES_REQUESTED
POST_REJECTED
POST_DRAG_RESCHEDULED
POST_QUICK_EDITED
WORKFLOW_SETTING_CHANGED
```

Audit payload must include:

```txt id="ydgg9f"
workspaceId
actorUserId
entityType
entityId
beforeJson
afterJson
metadataJson
createdAt
```

Never store:

```txt id="8g88x8"
tokens
signed URLs
provider auth headers
B2 secrets
```

---

# 22. Validation Rules

## 22.1 Drag Reschedule

Reject if:

```txt id="6cc94e"
Post is processing
Post is published
Post is cancelled
New time is in the past
New time is under schedule buffer
User lacks permission
Readiness has blocking issue
YouTube quota unavailable
```

---

## 22.2 Duplicate

Reject if:

```txt id="96d7sg"
Source post not found
Source post belongs to another workspace
Source media unavailable
User lacks create permission
Copying to another workspace without explicit supported flow
```

---

## 22.3 Bulk Drafts

Reject if:

```txt id="xm6fjj"
More than max file count
Unsupported media type
Oversized media
Missing rights confirmation
Invalid workspace
User lacks create permission
Draft row missing title/caption if scheduling
Platform target invalid
Schedule time invalid
```

---

## 22.4 Approval

Reject approve if:

```txt id="epqzsh"
User lacks approver/admin permission
Post not in review
Readiness has blocking issues
Post belongs to another workspace
```

Reject worker publish if:

```txt id="zjv1n0"
Workspace requires approval
AND post approvalStatus is not APPROVED or AUTO_APPROVED
```

---

# 23. UX Status Copy

## Approval Statuses

```txt id="6aj5nm"
Draft
In review
Changes requested
Approved
Rejected
Approval required
Approval blocked
```

## Bulk Statuses

```txt id="2o20ov"
Drafting batch
Validating batch
Creating posts
Batch completed
Partially failed
Batch failed
```

## Calendar Edit

```txt id="uzhm6w"
Move pending confirmation
Rescheduled
Unable to reschedule
Quota unavailable
Approval required
```

---

# 24. Functional Test Cases

## 24.1 Drag Reschedule

```txt id="12l5b5"
Dragging a scheduled post opens confirmation modal.
```

```txt id="kalkla"
Dragging does not persist until user confirms.
```

```txt id="z2eo37"
Undo move returns post to original slot.
```

```txt id="ti7q6s"
Reschedule to past time is rejected.
```

```txt id="s5fmtz"
Processing post cannot be dragged/rescheduled.
```

```txt id="gpk44r"
YouTube quota is rechecked after drag reschedule.
```

---

## 24.2 Duplicate

```txt id="vdpn2h"
Duplicate creates new post with status DRAFT.
```

```txt id="33i62x"
Duplicate copies draftContentJson.
```

```txt id="gw95gu"
Duplicate does not copy attempt history.
```

```txt id="hhyr19"
Duplicate does not copy external post IDs.
```

```txt id="85q76g"
Duplicate does not copy consumed YouTube quota reservation.
```

```txt id="xjfsde"
Duplicate does not copy consumed X cost ledger.
```

---

## 24.3 Copy to Dates

```txt id="tna1a9"
Copy to multiple dates creates one post per date.
```

```txt id="j2u4rl"
Duplicate dates are rejected.
```

```txt id="8fov6u"
More than 30 dates is rejected.
```

```txt id="1ii9d2"
Invalid date produces item-level failure, not silent success.
```

```txt id="0hzxap"
Created posts appear in calendar.
```

---

## 24.4 Bulk Drafts

```txt id="221urq"
Bulk page loads for permitted user.
```

```txt id="ash64r"
Bulk upload requires rights confirmation.
```

```txt id="d9mo0h"
Uploading over max file count is rejected.
```

```txt id="6bd8qp"
Valid files create SocialMediaAsset records.
```

```txt id="6nz34v"
Bulk draft rows save Draft Composer JSONB.
```

```txt id="d81649"
Apply to all fills empty captions only when selected.
```

```txt id="t97svt"
Batch creation creates SocialSchedulerBatch record.
```

```txt id="yv5bsk"
Batch result shows created and failed counts.
```

---

## 24.5 Approval

```txt id="8v1i54"
User can send draft for review.
```

```txt id="si5z7d"
Approver can approve in-review post.
```

```txt id="nhfnrr"
Approver can request changes with required comment.
```

```txt id="6zuvmt"
Approver can reject with required reason.
```

```txt id="tpdvxi"
Non-approver cannot approve post.
```

```txt id="fj3kur"
Worker blocks unapproved post when approval is required.
```

```txt id="eg09ic"
Approved post can publish when scheduled.
```

---

## 24.6 Workspace Isolation

```txt id="8mjc7e"
Bulk batch from Workspace A is not visible in Workspace B.
```

```txt id="qzes4a"
Review queue shows only active workspace posts.
```

```txt id="at1nw3"
Approval comments from Workspace A cannot be fetched through Workspace B.
```

```txt id="gng781"
Duplicate cannot copy media from another workspace.
```

---

## 24.7 Audit Logs

```txt id="jxgg32"
Duplicate writes audit log.
```

```txt id="imexcy"
Bulk create writes audit log.
```

```txt id="1hjzbn"
Approval writes audit log.
```

```txt id="g7s22z"
Request changes writes audit log.
```

```txt id="jy8l60"
Drag reschedule writes audit log.
```

```txt id="vxdjh5"
Audit log does not contain tokens or signed URLs.
```

---

# 25. Acceptance Criteria

Sprint 9 is complete when:

## Calendar Editing

```txt id="39j1wr"
Users can drag posts to new times.
Drag changes require confirmation.
Undo works before confirmation.
Invalid reschedules are blocked.
Reschedule writes audit log.
YouTube/X constraints are rechecked when relevant.
```

## Duplicate / Copy

```txt id="w5dkmd"
Users can duplicate a post as draft.
Users can copy a post to multiple dates.
Copied posts preserve safe draft/platform data.
Copied posts do not copy attempts, external IDs, consumed quota, or consumed cost.
```

## Bulk Drafts

```txt id="1ld6ip"
Users can bulk upload media.
Users can create multiple draft rows.
Users can apply common caption/hashtags/platforms.
Users can save batch as drafts.
Users can schedule batch after validation.
Batch result clearly shows created and failed items.
```

## Approval Workflow

```txt id="gr3s1b"
Users can send posts for review.
Approvers can approve, request changes, or reject.
Approval comments are stored.
Approval status appears on cards/detail/calendar.
Worker blocks unapproved posts when approval is required.
```

## Security

```txt id="8kq17s"
All new APIs validate workspace access.
No cross-workspace bulk/approval/calendar leakage.
No tokens or signed URLs in audit logs.
No unsafe drag-to-publish behavior.
```

---

# 26. Sprint 9 Deliverables

## Frontend

```txt id="nmo1tm"
Safe drag-to-reschedule calendar behavior
Drag confirmation modal
Duplicate post modal
Copy to dates modal
Bulk Drafts page
Bulk stage rail
Bulk upload step
Bulk draft editing table/cards
Bulk platform assignment
Bulk schedule assignment
Bulk review/create result
Review queue page
Approval queue page
Approval panel
Approval modals
Review comment thread
Approval status chips
Settings workflow controls
```

## Backend

```txt id="15fy5j"
Duplicate post endpoint
Copy to dates endpoint
Bulk batch endpoints
Bulk post creation service
Approval endpoints
Review comments service
Worker approval preflight update
Calendar edit service
Audit log events
Quota/cost reservation adjustments
```

## Database

```txt id="n88w4x"
SocialSchedulerBatch model
SocialSchedulerReviewComment model
ScheduledSocialPost approval fields
ScheduledSocialPost batch/source fields
Approval statuses
Approval blocked statuses
Audit log action additions
Indexes for review queues and batches
```

## Tests

```txt id="wdau5l"
Drag reschedule tests
Duplicate tests
Copy-to-dates tests
Bulk upload tests
Bulk draft JSONB tests
Batch creation tests
Approval workflow tests
Worker approval-block tests
Workspace isolation tests
Audit log tests
Quota/cost adjustment tests
```

---

# 27. Final Sprint 9 Implementation Summary

Build this in Sprint 9:

```txt id="jmdnry"
Existing production-ready scheduler
→ Safe calendar drag/reschedule
→ Duplicate posts
→ Copy post to multiple dates
→ Bulk upload media
→ Create bulk drafts
→ Batch assign platforms and schedules
→ Send posts for review
→ Approve / request changes / reject
→ Worker blocks unapproved posts when required
→ Audit every advanced action
```

Do not add new platforms.

Do not add analytics.

Do not add social inbox.

Do not add AI caption generation as a required feature.

Do not bypass the Sprint 2 worker.

Sprint 9’s job is to make the Social Scheduler practical for real agency operations where many posts are created, reviewed, edited, rescheduled, and approved before publishing.

After Sprint 9, the next logical sprint is:

```txt id="uhrpv6"
Sprint 10 — Platform Feature Deepening: Instagram Carousel, Pinterest Video Pins, YouTube Thumbnails, X Alt Text, and Final Polish
```