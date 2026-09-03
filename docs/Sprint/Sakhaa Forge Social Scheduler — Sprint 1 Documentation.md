# Sakhaa Forge Social Scheduler — Sprint 1 Documentation  
## Sprint 1: Scheduler Shell, Workspace Isolation, Draft Composer, B2 Upload, and Mock Scheduling Foundation

## 0. Sprint Intent

Sprint 1 creates the **first usable foundation** for the Social Media Scheduler inside Sakhaa Forge.

This sprint does **not** implement real Facebook, Instagram, YouTube, Pinterest, or Twitter/X publishing yet.

Sprint 1 must deliver:

1. Authenticated scheduler entry point.
2. Workspace/client-isolated scheduler area.
3. Homepage or `/brand-extract` inspired step-by-step UX.
4. Manual upload of static/video media to Backblaze B2.
5. Media metadata persisted in Supabase/Postgres.
6. Draft Composer payload persisted as JSONB.
7. Scheduled post draft persisted with target platform selections.
8. Mock platform target selection.
9. Mock schedule confirmation state.
10. Status/history screen foundation for later worker and real platform publishing.

The goal is to build the shell correctly so later sprints can add Meta, Instagram, Pinterest, YouTube, and Twitter/X without rewriting the UX or database foundation.

---

## 1. Source Alignment

This module must be built **inside the current Sakhaa Forge app**, not as a standalone scheduler.

The existing `/brand-extract` page already uses a dark, premium, app-like wrapper and mounts `BrandExtractApp` inside a full-screen dark surface. The route metadata describes it as a brand extraction intake for permitted URLs, approved assets, and evidence-backed candidate review. 

The existing `/brand-extract/_components/BrandExtractApp.tsx` uses:

- Persistent premium header.
- Active brand/client selection.
- Main workflow viewport.
- Dark luxury background.
- Step-like studio surface.
- Modal access pattern.
- Brand state held in an active object. 

The existing `/app/branding` route contract already follows a step-led flow:

```txt
Scan URL
→ Upload brand assets
→ Review candidates
→ Request missing assets
→ Approve this profile
```



The homepage also uses a staged workflow structure with:

- Persistent premium header.
- Hero stage.
- Side-by-side production workspace.
- Progress rail.
- Next/previous stage navigation.
- Animated transitions. 

Sprint 1 Social Scheduler UX must follow the same product language:

```txt
Premium dark app shell
→ Step-by-step guided workflow
→ Persistent header
→ Client/workspace selector
→ Bottom or side stage rail
→ Clear next/back actions
→ Evidence/status panels
→ No cluttered standalone dashboard-first UI
```

---

## 2. Sprint 1 Name

```txt
Sprint 1 — Social Scheduler Intake Shell
```

Alternative internal label:

```txt
Sprint 1 — Manual Upload to Scheduled Draft
```

---

## 3. Sprint 1 Scope

### 3.1 In Scope

Sprint 1 includes:

1. Social Scheduler route creation.
2. Auth-protected page access.
3. Workspace/client isolation.
4. Client/workspace selector in header.
5. Step-by-step scheduler creation flow.
6. Manual media upload UI.
7. Backblaze B2 upload initiation and completion.
8. Media asset metadata persistence.
9. Draft Composer JSONB persistence.
10. Platform target selection using mock accounts.
11. Schedule date/time selection.
12. Timezone selection/defaulting.
13. Scheduled draft creation.
14. Post status page.
15. Draft/scheduled posts list.
16. Mock status states only.
17. Basic validation and error states.
18. Functional tests for the full shell flow.

### 3.2 Out of Scope

Sprint 1 must **not** implement:

1. Real Meta OAuth.
2. Real Facebook publishing.
3. Real Instagram publishing.
4. Real YouTube publishing.
5. Real Pinterest publishing.
6. Real Twitter/X publishing.
7. Token encryption for real social accounts.
8. Worker-based due publishing.
9. Retry logic.
10. Published URL verification.
11. Analytics.
12. Comment inbox.
13. AI caption generation.
14. Campaign planner.
15. Approval workflow.
16. Drag-and-drop calendar.
17. Multi-user invite flow.
18. Billing or platform usage pricing.
19. Real social API rate-limit dashboards.

Sprint 1 can create database fields that support these later, but must not fake live publishing.

---

## 4. Recommended Route Structure

### 4.1 Main Routes

Create these routes:

```txt
/apps/web/app/app/social-scheduler/page.tsx
/apps/web/app/app/social-scheduler/new/page.tsx
/apps/web/app/app/social-scheduler/[postId]/page.tsx
```

Optional if current app route organization prefers shorter root route:

```txt
/apps/web/app/social-scheduler/page.tsx
/apps/web/app/social-scheduler/new/page.tsx
/apps/web/app/social-scheduler/[postId]/page.tsx
```

Preferred route for logged-in app experience:

```txt
/app/social-scheduler
```

Reason: `/app/branding` already exists as an authenticated app route pattern. Sprint 1 scheduler should live beside it.

### 4.2 Route Responsibilities

```txt
/app/social-scheduler
```

Scheduler home/list page.

Shows:

- Page title.
- Current workspace/client.
- Draft posts.
- Scheduled posts.
- Failed/mock status posts.
- Empty state.
- “Create scheduled post” primary CTA.

```txt
/app/social-scheduler/new
```

Step-by-step creation studio.

Stages:

1. Select client/workspace.
2. Upload media.
3. Compose content.
4. Choose platform targets.
5. Schedule.
6. Review and save.

```txt
/app/social-scheduler/[postId]
```

Post details/status page.

Shows:

- Media preview.
- Caption/content.
- Target platforms.
- Schedule time.
- Status.
- Draft Composer JSONB debug panel in development only.
- Attempt timeline placeholder for Sprint 2.

---

## 5. UX Direction

The UX must feel like `/brand-extract`, not like a generic CRUD admin table.

### 5.1 Visual Style

Use the same premium dark visual language:

```txt
Background: #050507
Surface: #0B0A09 / dark translucent cards
Text: zinc/stone/white
Accent: Sakhaa gold, default #D6B46A
Borders: white/10
Glass panels: bg-white/[0.03] or bg-black/40
Hover states: bg-white/[0.05]
Primary CTA: gold background with dark text
```

Use motion lightly, similar to existing homepage and brand atelier:

- Fade between steps.
- Slight y-offset on stage entry.
- No excessive animation.
- No distracting 3D unless already part of existing shared components.

### 5.2 Page Layout

The new creation screen should use this layout:

```txt
----------------------------------------------------
Header
Logo | Sakhaa Forge | Client/Workspace selector | Profile
----------------------------------------------------

Main workspace
Left: Step information, inputs, next/back controls
Right: Live preview / upload preview / validation panel

----------------------------------------------------
Bottom stage rail
Client → Upload → Compose → Targets → Schedule → Review
----------------------------------------------------
```

This mirrors the homepage’s staged workflow and side-by-side production workspace pattern. The homepage currently uses a hero stage, then a left narrative panel plus right mockup simulation area, with a persistent bottom progress rail. 

---

## 6. Navigation Entry Points

### 6.1 Add App Navigation Link

Add a visible navigation item:

```txt
Social Scheduler
```

Possible placement:

- App header dropdown.
- Workspace sidebar if available.
- Dashboard quick action.
- Post-brand-approval next step in future.

Do not bury this under developer/admin pages.

### 6.2 Empty State CTA

On `/app/social-scheduler`, if no posts exist:

Title:

```txt
Plan your first scheduled post
```

Body:

```txt
Upload an approved image or video, prepare the caption, choose the client account, and save it as a scheduled post.
```

Primary button:

```txt
Create scheduled post
```

Secondary button:

```txt
View brand assets
```

Secondary button destination:

```txt
/app/branding
```

Only show “View brand assets” if the route exists and user has access.

---

## 7. Auth and Access Rules

### 7.1 Authentication Required

All scheduler routes must require login.

Unauthenticated users must be redirected to:

```txt
/login
```

or the existing app login route if different.

### 7.2 Workspace Required

Every scheduler record must belong to a workspace/client.

A logged-in user must never see posts, media, or drafts from another workspace.

### 7.3 Access Pattern

Before rendering scheduler data:

```txt
1. Resolve authenticated user.
2. Resolve active workspace/client.
3. Confirm membership/permission.
4. Fetch only records where workspaceId = activeWorkspace.id.
```

### 7.4 Minimum Role Permissions

Sprint 1 should support these permission assumptions:

```txt
Owner/Admin:
- Create scheduled post
- Upload media
- Edit draft
- Schedule post
- Delete draft

Client Manager:
- Create scheduled post
- Upload media
- Edit draft
- Schedule post

Viewer:
- View scheduled posts only
- No create/edit/delete buttons
```

If existing RBAC names differ, map these capabilities to the closest existing role system.

---

## 8. Client / Workspace Isolation

### 8.1 Header Workspace Selector

The scheduler header must include a workspace/client selector.

Label:

```txt
Active workspace
```

Dropdown contents:

```txt
Client/workspace name
Brand name if available
Status badge
```

Dropdown item example:

```txt
Mantri Developers
Brand approved
```

When a workspace is changed:

```txt
1. Clear current unsaved composer state after confirmation.
2. Refetch scheduler posts for selected workspace.
3. Scope upload path/object key to selected workspace.
4. Scope all API calls to selected workspace.
```

### 8.2 Workspace Empty State

If user has no workspace/client:

Title:

```txt
No workspace selected
```

Body:

```txt
Create or select a workspace before scheduling social posts.
```

Button:

```txt
Go to workspace setup
```

Fallback route:

```txt
/app/profile
```

---

## 9. Step-by-Step Creation Flow

The creation flow must be implemented as a guided studio, not one long form.

### Stage Rail

Use six stages:

```txt
1. Client
2. Upload
3. Compose
4. Targets
5. Schedule
6. Review
```

Each stage shows:

```txt
- Number
- Label
- Status: idle | active | complete | blocked
```

Bottom rail behavior:

- Completed steps are clickable.
- Future blocked steps are not clickable.
- Active step is highlighted with gold accent.
- Errors show subtle red marker.

---

# 10. Stage 1 — Client

## Purpose

Confirm the workspace/client before any upload or draft save.

## UI

Left panel:

Title:

```txt
Choose the client workspace
```

Description:

```txt
Every scheduled post, upload, and draft is isolated to one workspace.
```

Fields:

1. Workspace dropdown.
2. Brand profile summary card if available.
3. Workspace permission badge.
4. Storage status badge.

Right panel:

```txt
Workspace preview
```

Shows:

- Workspace/client name.
- Brand name.
- Connected status placeholder.
- Number of draft/scheduled posts.
- Storage bucket status if available.

## Buttons

Primary:

```txt
Continue
```

Disabled until:

```txt
workspaceId exists
user has create permission
```

Secondary:

```txt
Cancel
```

Destination:

```txt
/app/social-scheduler
```

Optional tertiary:

```txt
Manage workspace
```

Destination:

```txt
/app/profile
```

## Validation

Show blocking error if:

```txt
- No active workspace
- User does not have permission
- Workspace is archived/disabled
```

---

# 11. Stage 2 — Upload

## Purpose

Upload approved media manually to Backblaze B2 and persist metadata in Supabase/Postgres.

## Supported Sprint 1 Media Types

```txt
image/jpeg
image/png
image/webp
video/mp4
video/quicktime
```

Use MVP upload limits:

```txt
Images: 10 MB
Videos: 200 MB
```

These match the uploaded scheduler storage guidance for MVP limits.

## UI

Left panel title:

```txt
Upload creative media
```

Description:

```txt
Add the approved image or video that will be scheduled for social publishing.
```

Upload card:

```txt
Drag and drop image or video here
or
Browse files
```

File picker button:

```txt
Browse files
```

Rights checkbox:

```txt
I confirm this media is approved for use by this client.
```

Metadata fields:

1. Internal asset name.
2. Optional notes.
3. Content category dropdown.

Content category options:

```txt
Brand creative
Property showcase
Offer creative
Testimonial
Event
Educational
Other
```

Right panel:

```txt
Media preview
```

For image:

- Image preview.
- Dimensions if available.
- File size.
- MIME type.

For video:

- Video preview.
- Duration if available.
- File size.
- MIME type.
- “Thumbnail generation later” note if not implemented.

## Buttons

Primary:

```txt
Upload and continue
```

Disabled until:

```txt
- File selected
- Rights checkbox checked
- Workspace selected
- File type valid
- File size valid
```

Secondary:

```txt
Back
```

Tertiary:

```txt
Remove file
```

Visible after file selection.

## B2 Upload Flow

Implement:

```txt
1. Frontend calls backend: POST /api/v0/social-scheduler/media/initiate-upload
2. Backend validates workspace access.
3. Backend validates file metadata.
4. Backend creates media asset draft row.
5. Backend returns upload URL or upload instructions.
6. Browser uploads file to B2.
7. Frontend calls backend: POST /api/v0/social-scheduler/media/complete-upload
8. Backend verifies upload completion.
9. Backend stores final media metadata.
10. UI advances to Compose stage.
```

This follows the uploaded scheduler design: frontend requests upload setup, backend validates type/size and creates object key/upload URL, browser uploads to B2, then frontend calls complete-upload.

## B2 Object Key Format

Use a workspace-scoped key:

```txt
workspaces/{workspaceId}/social-scheduler/{yyyy}/{mm}/{mediaAssetId}/{safeFileName}
```

Example:

```txt
workspaces/ws_123/social-scheduler/2026/09/asset_456/project-tour.mp4
```

Do not expose private object keys to unauthorized frontend clients.

## Supabase/Postgres Storage

Do **not** store binary media in Supabase JSONB.

Store only:

```txt
- asset id
- workspace id
- original filename
- safe filename
- mime type
- byte size
- sha256 if available
- object key
- bucket
- upload status
- dimensions/duration if available
- metadata JSONB
```

---

# 12. Stage 3 — Compose

## Purpose

Let the user create the post content and persist the Draft Composer payload as JSONB.

## Important Sprint 1 Requirement

Implement **DC Upload as JSONB onto Supabase/Postgres**.

For Sprint 1, define DC as:

```txt
Draft Composer payload
```

If the internal team already uses “DC” to mean a different term, keep the database field generic enough:

```txt
draftContentJson
```

or:

```txt
composerPayloadJson
```

## UI

Left panel title:

```txt
Compose the post
```

Description:

```txt
Write the caption and save the structured draft that will later be adapted per platform.
```

Fields:

1. Caption textarea.
2. Internal post title.
3. Campaign/topic optional.
4. CTA optional.
5. Hashtags optional.
6. Notes optional.

Caption textarea:

Placeholder:

```txt
Write the main caption for this scheduled post...
```

Internal post title placeholder:

```txt
Example: Weekend property walkthrough
```

CTA placeholder:

```txt
Example: Book a site visit today
```

Hashtags placeholder:

```txt
Example: #LuxuryHomes #BangaloreRealEstate
```

Right panel:

```txt
Draft preview
```

Shows:

- Media preview.
- Caption preview.
- Character count.
- Missing field warnings.
- JSONB save status.

## Draft Composer JSONB Shape

Persist the entire structured draft as JSONB.

Recommended field:

```txt
ScheduledSocialPost.draftContentJson Json
```

Shape:

```json
{
  "version": "1.0",
  "source": "manual_upload",
  "postTitle": "Weekend property walkthrough",
  "caption": "Explore the new tower launch...",
  "cta": "Book a site visit today",
  "hashtags": ["LuxuryHomes", "BangaloreRealEstate"],
  "notes": "Use this for Meta and Instagram first.",
  "campaign": {
    "name": null,
    "type": null
  },
  "media": [
    {
      "mediaAssetId": "asset_456",
      "role": "primary",
      "order": 0
    }
  ],
  "platformOverrides": {},
  "createdFromStage": "compose",
  "lastEditedAt": "2026-09-02T14:00:00.000Z"
}
```

Do not store B2 signed URLs in JSONB.

Only store stable internal IDs and configuration.

## Buttons

Primary:

```txt
Save draft and continue
```

Secondary:

```txt
Back
```

Tertiary:

```txt
Save draft
```

Behavior:

- `Save draft` saves without moving to the next stage.
- `Save draft and continue` saves and advances to Targets.
- Autosave can be added later, but is not required in Sprint 1.

## Validation

Required:

```txt
- postTitle
- caption or media
- at least one uploaded media asset
```

Since Sprint 1 is a media scheduler, block continuation if there is no media.

---

# 13. Stage 4 — Targets

## Purpose

Let the user choose the intended social platforms and mock accounts.

No real OAuth in Sprint 1.

## UI

Left panel title:

```txt
Choose platforms
```

Description:

```txt
Select where this post should be scheduled. Real account connections will be enabled in later sprints.
```

Platform cards:

```txt
Facebook Page
Instagram
Pinterest
YouTube
Twitter/X
```

Each card shows:

- Platform name.
- Supported media in Sprint 1.
- Mock status badge.
- Checkbox/toggle.

### Platform Card Details

Facebook:

```txt
Mock account: Facebook Page · Demo Page
Supports: Image, Video
```

Instagram:

```txt
Mock account: Instagram Business · Demo IG
Supports: Image, Video, Carousel later
```

Pinterest:

```txt
Mock account: Pinterest Business · Demo Board
Supports: Image, Video later
```

YouTube:

```txt
Mock account: YouTube Channel · Demo Channel
Supports: Video only
```

Twitter/X:

```txt
Mock account: X Account · Demo Handle
Supports: Text, image, video
Warning: Paid API integration later
```

Right panel:

```txt
Platform readiness
```

Shows platform validation:

```txt
Facebook: Ready for mock scheduling
Instagram: Ready for mock scheduling
Pinterest: Ready for mock scheduling
YouTube: Blocked if media is image
X: Ready for mock scheduling, paid API later
```

## Buttons

Primary:

```txt
Continue to schedule
```

Disabled until:

```txt
at least one platform target selected
```

Secondary:

```txt
Back
```

Tertiary:

```txt
Select all eligible
```

Behavior:

- Select all platforms compatible with uploaded media.
- If image uploaded, do not select YouTube.
- If video uploaded, all platforms can be selected in mock mode.

## Sprint 1 Platform Handling

Create platform target records, but mark them as mock/unconnected:

```txt
connectionStatus = MOCK
publishMode = MOCK
```

No OAuth token should be requested or stored in Sprint 1.

---

# 14. Stage 5 — Schedule

## Purpose

Let the user choose when the post should be scheduled.

## UI

Left panel title:

```txt
Set publish time
```

Description:

```txt
Choose the date, time, and timezone for this scheduled post.
```

Fields:

1. Date picker.
2. Time picker.
3. Timezone dropdown.
4. Optional “Publish now” disabled placeholder.

Timezone default:

```txt
Asia/Kolkata
```

because the current user timezone is Asia/Kolkata.

Timezone field must still be editable because client accounts may operate in different regions.

Right panel:

```txt
Schedule summary
```

Shows:

- Local date/time.
- UTC date/time.
- Selected platforms.
- Media type.
- Warnings.

## Buttons

Primary:

```txt
Review scheduled post
```

Secondary:

```txt
Back
```

Tertiary:

```txt
Save as unscheduled draft
```

## Validation

Block if:

```txt
- Date missing
- Time missing
- Time is in the past
- Timezone missing
- No platform targets selected
```

For Sprint 1:

```txt
Minimum allowed schedule time = now + 5 minutes
```

This prevents edge cases before the worker exists.

---

# 15. Stage 6 — Review

## Purpose

Final confirmation before creating the scheduled draft.

## UI

Left panel title:

```txt
Review and save
```

Description:

```txt
Confirm the media, caption, platforms, and scheduled time before saving this post.
```

Review sections:

1. Client/workspace.
2. Media.
3. Caption/content.
4. Platform targets.
5. Schedule time.
6. Validation checklist.

Validation checklist:

```txt
Workspace selected
Media uploaded
Draft content saved
At least one target selected
Schedule time valid
Mock publish mode enabled
```

Right panel:

```txt
Scheduled post preview
```

Shows final preview card.

## Buttons

Primary:

```txt
Save scheduled post
```

Secondary:

```txt
Back
```

Tertiary:

```txt
Save as draft
```

After successful save:

Show success state:

```txt
Scheduled draft created
```

Body:

```txt
This post is saved and ready for the publishing worker in the next sprint.
```

Buttons:

```txt
View post
Create another post
Back to scheduler
```

---

# 16. Scheduler Home Page

Route:

```txt
/app/social-scheduler
```

## Header Area

Title:

```txt
Social Scheduler
```

Subtitle:

```txt
Plan approved media posts for each client workspace before they move into real platform publishing.
```

Primary button:

```txt
Create scheduled post
```

Secondary button:

```txt
Social accounts
```

In Sprint 1, Social accounts can route to a placeholder or be disabled with:

```txt
Coming in Sprint 2
```

## Filters

Top filters:

```txt
All
Draft
Scheduled
Mock Ready
Failed
```

Search field:

```txt
Search posts...
```

Workspace selector:

```txt
Active workspace
```

## Post Cards / Table

Each post row/card shows:

```txt
Thumbnail
Post title
Workspace/client
Platforms
Scheduled time
Status
Last edited
```

Actions:

```txt
View
Edit
Duplicate
Cancel
```

Sprint 1 behavior:

- View works.
- Edit works before scheduled/mock-locked state.
- Duplicate can be placeholder if not implemented.
- Cancel marks post as `CANCELLED`.

---

# 17. Post Detail Page

Route:

```txt
/app/social-scheduler/[postId]
```

## Sections

1. Header summary.
2. Media preview.
3. Caption/content.
4. Platform targets.
5. Schedule details.
6. Status timeline.
7. Draft Composer JSONB development panel.
8. Actions.

## Buttons

Primary:

```txt
Edit post
```

Secondary:

```txt
Back to scheduler
```

Tertiary:

```txt
Cancel scheduled post
```

Danger confirmation text:

```txt
Cancel this scheduled post?
```

Confirm button:

```txt
Yes, cancel post
```

Cancel button:

```txt
Keep scheduled
```

## Development JSON Panel

Visible only in development mode or admin/debug mode.

Label:

```txt
Draft Composer JSONB
```

Purpose:

- Confirm the structured DC payload is persisted correctly.
- Avoid silently losing platform/content fields.

Never show raw tokens or credentials here.

---

# 18. Data Model — Sprint 1

Use Supabase Postgres through Prisma/migrations, consistent with the existing repo direction.

## 18.1 Enums

```prisma
enum SocialSchedulerPostStatus {
  DRAFT
  SCHEDULED
  MOCK_READY
  CANCELLED
  FAILED
}

enum SocialSchedulerMediaStatus {
  INITIATED
  UPLOADING
  UPLOADED
  FAILED
}

enum SocialSchedulerPlatform {
  FACEBOOK
  INSTAGRAM
  PINTEREST
  YOUTUBE
  X
}

enum SocialSchedulerTargetStatus {
  SELECTED
  MOCK_READY
  BLOCKED
  CANCELLED
}
```

## 18.2 ScheduledSocialPost

```prisma
model ScheduledSocialPost {
  id                String   @id @default(uuid())
  workspaceId       String
  createdByUserId   String

  title             String
  status            SocialSchedulerPostStatus @default(DRAFT)

  draftContentJson  Json
  scheduledAt       DateTime?
  timezone          String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  cancelledAt       DateTime?

  media             SocialPostMedia[]
  targets           SocialPublishTarget[]

  @@index([workspaceId, status])
  @@index([workspaceId, scheduledAt])
}
```

## 18.3 SocialMediaAsset

```prisma
model SocialMediaAsset {
  id                String   @id @default(uuid())
  workspaceId       String
  uploadedByUserId  String

  originalFileName  String
  safeFileName      String
  mimeType          String
  byteSize          BigInt
  bucket            String
  objectKey         String

  sha256            String?
  width             Int?
  height            Int?
  durationMs        Int?

  status            SocialSchedulerMediaStatus @default(INITIATED)
  metadataJson      Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  posts             SocialPostMedia[]

  @@index([workspaceId])
  @@index([workspaceId, status])
}
```

## 18.4 SocialPostMedia

```prisma
model SocialPostMedia {
  id                String @id @default(uuid())
  postId            String
  mediaAssetId      String
  order             Int    @default(0)
  role              String @default("primary")

  post              ScheduledSocialPost @relation(fields: [postId], references: [id])
  mediaAsset        SocialMediaAsset    @relation(fields: [mediaAssetId], references: [id])

  @@unique([postId, mediaAssetId])
  @@index([postId])
}
```

## 18.5 SocialPublishTarget

```prisma
model SocialPublishTarget {
  id                String @id @default(uuid())
  postId            String
  workspaceId       String

  platform          SocialSchedulerPlatform
  mockAccountName   String?
  externalAccountId String?

  status            SocialSchedulerTargetStatus @default(SELECTED)
  validationJson    Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  post              ScheduledSocialPost @relation(fields: [postId], references: [id])

  @@index([workspaceId, platform])
  @@index([postId])
}
```

## 18.6 Why JSONB Is Used

Use JSONB for:

```txt
draftContentJson
metadataJson
validationJson
```

Do not over-normalize Sprint 1.

JSONB is useful for the Draft Composer payload because platform-specific overrides will evolve in later sprints.

Example future extension:

```json
{
  "platformOverrides": {
    "instagram": {
      "caption": "Instagram-specific caption",
      "hashtags": ["RealEstate", "LuxuryHomes"]
    },
    "youtube": {
      "title": "Full walkthrough",
      "description": "Watch the full project walkthrough..."
    },
    "pinterest": {
      "title": "Luxury apartment inspiration",
      "destinationLink": "https://example.com"
    }
  }
}
```

---

# 19. API Contracts — Sprint 1

Use `/api/v0` naming if the repo already uses it.

## 19.1 Create Draft

```txt
POST /api/v0/social-scheduler/posts
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "title": "Weekend property walkthrough",
  "draftContentJson": {
    "version": "1.0",
    "source": "manual_upload",
    "caption": "Explore the new tower launch...",
    "cta": "Book a site visit today",
    "hashtags": ["LuxuryHomes"],
    "media": []
  }
}
```

Response:

```json
{
  "postId": "post_id",
  "status": "DRAFT"
}
```

## 19.2 Initiate Upload

```txt
POST /api/v0/social-scheduler/media/initiate-upload
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "fileName": "project-tour.mp4",
  "mimeType": "video/mp4",
  "byteSize": 10485760
}
```

Response:

```json
{
  "mediaAssetId": "asset_id",
  "uploadUrl": "signed_or_backend_upload_url",
  "objectKey": "workspaces/workspace_id/social-scheduler/2026/09/asset_id/project-tour.mp4",
  "expiresAt": "2026-09-02T14:10:00.000Z"
}
```

## 19.3 Complete Upload

```txt
POST /api/v0/social-scheduler/media/complete-upload
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "mediaAssetId": "asset_id",
  "sha256": "optional_sha"
}
```

Response:

```json
{
  "mediaAssetId": "asset_id",
  "status": "UPLOADED"
}
```

## 19.4 Attach Media to Post

```txt
POST /api/v0/social-scheduler/posts/{postId}/media
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "mediaAssetId": "asset_id",
  "role": "primary",
  "order": 0
}
```

## 19.5 Save Composer JSONB

```txt
PATCH /api/v0/social-scheduler/posts/{postId}/draft-content
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "draftContentJson": {
    "version": "1.0",
    "source": "manual_upload",
    "postTitle": "Weekend property walkthrough",
    "caption": "Explore the new tower launch...",
    "cta": "Book a site visit today",
    "hashtags": ["LuxuryHomes"],
    "media": [
      {
        "mediaAssetId": "asset_id",
        "role": "primary",
        "order": 0
      }
    ],
    "platformOverrides": {},
    "lastEditedAt": "2026-09-02T14:00:00.000Z"
  }
}
```

## 19.6 Save Targets

```txt
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "FACEBOOK",
      "mockAccountName": "Demo Facebook Page"
    },
    {
      "platform": "INSTAGRAM",
      "mockAccountName": "Demo Instagram Business"
    }
  ]
}
```

## 19.7 Schedule Post

```txt
POST /api/v0/social-scheduler/posts/{postId}/schedule
```

Body:

```json
{
  "workspaceId": "workspace_id",
  "scheduledAt": "2026-09-03T10:30:00.000Z",
  "timezone": "Asia/Kolkata"
}
```

Response:

```json
{
  "postId": "post_id",
  "status": "SCHEDULED",
  "scheduledAt": "2026-09-03T10:30:00.000Z",
  "timezone": "Asia/Kolkata"
}
```

## 19.8 List Posts

```txt
GET /api/v0/social-scheduler/posts?workspaceId=workspace_id&status=SCHEDULED
```

## 19.9 Get Post Details

```txt
GET /api/v0/social-scheduler/posts/{postId}?workspaceId=workspace_id
```

## 19.10 Cancel Post

```txt
POST /api/v0/social-scheduler/posts/{postId}/cancel
```

Body:

```json
{
  "workspaceId": "workspace_id"
}
```

---

# 20. Frontend Components

Recommended folder:

```txt
apps/web/app/app/social-scheduler/_components
```

Components:

```txt
SocialSchedulerApp.tsx
SocialSchedulerHeader.tsx
SocialSchedulerStageRail.tsx
ClientWorkspaceStep.tsx
MediaUploadStep.tsx
ComposerStep.tsx
PlatformTargetsStep.tsx
ScheduleStep.tsx
ReviewStep.tsx
SchedulerPostCard.tsx
SchedulerPostList.tsx
SchedulerPostDetail.tsx
SchedulerStatusChip.tsx
DraftComposerJsonPanel.tsx
MediaPreviewCard.tsx
PlatformTargetCard.tsx
```

Use the existing route style where the page imports a single app/studio component, similar to `/brand-extract` importing `BrandExtractApp`. 

---

# 21. Backend Modules

Recommended API modules:

```txt
apps/api/src/social-scheduler
```

Suggested files:

```txt
social-scheduler.controller.ts
social-scheduler.service.ts
social-scheduler.repository.ts
social-scheduler.dto.ts
social-scheduler.validation.ts
social-scheduler-media.service.ts
social-scheduler-targets.service.ts
```

If the repo uses `.mjs` server modules instead of Nest-style `.ts` modules in the current path, follow the existing repo convention. Do not force Nest conventions if the active API implementation is currently `.mjs`.

---

# 22. Validation Rules

## 22.1 File Validation

Reject upload if:

```txt
- MIME type unsupported
- Image > 10 MB
- Video > 200 MB
- Filename empty
- Workspace missing
- User lacks permission
```

## 22.2 Composer Validation

Reject save/schedule if:

```txt
- No workspaceId
- No post title
- No caption and no media
- No media attached
- draftContentJson missing version
- draftContentJson media references unknown mediaAssetId
```

## 22.3 Target Validation

Reject if:

```txt
- No platform selected
- Platform is YouTube and uploaded media is image
- Platform value unsupported
```

## 22.4 Schedule Validation

Reject if:

```txt
- scheduledAt missing
- timezone missing
- scheduledAt is in the past
- scheduledAt is less than now + 5 minutes
- no publish targets selected
```

---

# 23. Status Model

Sprint 1 post statuses:

```txt
DRAFT
SCHEDULED
MOCK_READY
CANCELLED
FAILED
```

Sprint 1 target statuses:

```txt
SELECTED
MOCK_READY
BLOCKED
CANCELLED
```

Sprint 1 media statuses:

```txt
INITIATED
UPLOADING
UPLOADED
FAILED
```

UI labels:

```txt
DRAFT → Draft
SCHEDULED → Scheduled
MOCK_READY → Mock ready
CANCELLED → Cancelled
FAILED → Failed
```

---

# 24. Error States

## Upload Error

Message:

```txt
Upload failed. Please check the file type, file size, and try again.
```

Actions:

```txt
Retry upload
Choose another file
```

## Workspace Error

Message:

```txt
You do not have access to this workspace.
```

Action:

```txt
Back to scheduler
```

## Schedule Error

Message:

```txt
Choose a future date and time at least 5 minutes from now.
```

## Target Error

Message:

```txt
This media is not eligible for the selected platform.
```

Example:

```txt
YouTube requires video media.
```

---

# 25. Security Requirements

1. Never expose B2 secret keys to frontend.
2. Never store media binaries in Postgres.
3. Never store temporary signed URLs inside JSONB.
4. Never allow cross-workspace media access.
5. Every API call must validate workspace membership.
6. Every media object key must include workspace scope.
7. Draft Composer JSONB must not contain secrets.
8. Mock social accounts must be clearly marked as mock.
9. No real OAuth tokens in Sprint 1.
10. No public object URL unless intentionally generated and short-lived.

The uploaded security docs already state that storage credentials, access tokens, refresh tokens, worker secrets, encryption keys, and platform credentials must not be exposed to the frontend.

---

# 26. UX Copy

## Main Scheduler Page

Title:

```txt
Social Scheduler
```

Subtitle:

```txt
Schedule approved creative media for each client workspace.
```

Primary CTA:

```txt
Create scheduled post
```

Empty state title:

```txt
No scheduled posts yet
```

Empty state body:

```txt
Start by uploading an approved image or video, writing the caption, and choosing where it should be scheduled.
```

## Creation Flow Hero Copy

Title:

```txt
Create scheduled post
```

Subtitle:

```txt
Upload media, compose the caption, choose the platforms, and save the schedule for this client workspace.
```

## Review Confirmation

Success title:

```txt
Scheduled draft created
```

Success body:

```txt
This post is saved in mock-ready scheduling mode. Real publishing will be connected in the platform integration sprints.
```

---

# 27. “Do Not Build” Notes for Sprint 1

Do not implement these in Sprint 1:

```txt
Connect Facebook
Connect Instagram
Connect Pinterest
Connect YouTube
Connect X
Real publish now
Real OAuth callback
Access token storage
Refresh token storage
Real platform post IDs
Real public post URLs
Real retry queue
Real due-post worker
AI caption generation
Analytics
Calendar drag/drop
Approval workflow
```

Buttons for these can appear only if clearly disabled or labeled:

```txt
Coming in later sprint
```

---

# 28. Acceptance Criteria

Sprint 1 is complete when all of the following are true:

## Auth / Workspace

```txt
User cannot access /app/social-scheduler unless logged in.
User cannot access another workspace’s posts.
User can select active workspace/client.
All scheduler API calls require workspaceId and validate membership.
```

## Upload

```txt
User can select an image/video file.
Invalid file type is rejected.
Oversized file is rejected.
User must confirm usage rights before upload.
Upload initiation creates a media asset row.
Upload completion marks media as UPLOADED.
B2 object key is workspace-scoped.
Media metadata is visible in UI.
```

## Composer

```txt
User can write title, caption, CTA, hashtags, and notes.
Composer state is saved into draftContentJson JSONB.
JSONB stores mediaAssetId references, not signed URLs.
User can return to edit the draft.
```

## Targets

```txt
User can select one or more mock platforms.
YouTube is blocked for image-only uploads.
X shows paid-API-later warning.
Selected platforms create SocialPublishTarget rows.
```

## Schedule

```txt
User can choose date, time, and timezone.
Past time is rejected.
Time under now + 5 minutes is rejected.
Valid schedule marks post as SCHEDULED.
```

## Review / Details

```txt
User can review all details before save.
User can view saved scheduled post.
User can cancel a scheduled post.
Scheduler home shows the saved post.
```

---

# 29. Functional Test Cases

## Page Load

```txt
/app/social-scheduler loads without error for logged-in user.
```

## Auth

```txt
Logged-out user is redirected to login.
```

## Workspace Isolation

```txt
User A in Workspace A cannot fetch posts from Workspace B.
```

## Upload

```txt
JPEG under 10 MB uploads successfully.
PNG under 10 MB uploads successfully.
MP4 under 200 MB uploads successfully.
PDF upload is rejected.
MP4 over 200 MB is rejected.
Upload without rights confirmation is blocked.
```

## Composer JSONB

```txt
Saving composer creates valid draftContentJson.
Editing caption updates draftContentJson.
Media references inside JSONB point to existing mediaAssetId.
No signed B2 URL is stored in draftContentJson.
```

## Platform Targets

```txt
Image post can select Facebook, Instagram, Pinterest, and X.
Image post cannot select YouTube.
Video post can select all mock platforms.
At least one platform is required.
```

## Schedule

```txt
Past schedule time is rejected.
Future schedule time is accepted.
Timezone is stored.
Post appears in scheduled list.
```

## Cancel

```txt
Scheduled post can be cancelled.
Cancelled post cannot be edited as scheduled unless restored in future sprint.
```

---

# 30. Sprint 1 Deliverables

## Frontend

```txt
/app/social-scheduler
/app/social-scheduler/new
/app/social-scheduler/[postId]
SocialSchedulerApp
Step rail
Upload step
Composer step
Target step
Schedule step
Review step
Post list
Post detail
Status chips
```

## Backend

```txt
POST create draft
POST initiate upload
POST complete upload
POST attach media
PATCH save composer JSONB
POST save targets
POST schedule post
GET list posts
GET post detail
POST cancel post
```

## Database

```txt
ScheduledSocialPost
SocialMediaAsset
SocialPostMedia
SocialPublishTarget
Required enums
Workspace indexes
JSONB fields
```

## Storage

```txt
Workspace-scoped B2 object keys
No media in Postgres
No public permanent URLs
```

## Tests

```txt
Auth tests
Workspace isolation tests
Upload validation tests
Composer JSONB tests
Target validation tests
Schedule tests
Cancel tests
Page-load smoke tests
```

---

# 31. Sprint 1 Final Implementation Summary

Build this first:

```txt
/app/social-scheduler
→ Create scheduled post
→ Select workspace/client
→ Upload approved media to B2
→ Save media metadata in Supabase/Postgres
→ Save Draft Composer payload as JSONB
→ Select mock target platforms
→ Pick schedule date/time/timezone
→ Review
→ Save scheduled post
→ View scheduled post in list/detail page
```

Do not connect real social APIs yet.

Do not overload the existing generated-video publishing flow.

This sprint’s job is to create the durable scheduler foundation that later sprints can safely connect to Meta, Instagram, Pinterest, YouTube, and Twitter/X.