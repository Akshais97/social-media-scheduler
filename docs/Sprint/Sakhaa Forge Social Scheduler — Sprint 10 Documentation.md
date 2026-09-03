# Sakhaa Forge Social Scheduler — Sprint 10 Documentation  
## Sprint 10: Platform Feature Deepening, Missed Capability Closeout, Media Compatibility, and Final Polish

## 0. Sprint Intent

Sprint 10 exists because Sprints 1–9 built the core scheduler, real platform integrations, production hardening, bulk workflows, and approvals — but several important platform-specific capabilities were intentionally deferred.

Sprint 10 is **not a new-platform sprint**.

Sprint 10 is the cleanup and deepening sprint for things that were missed, deferred, or only partially covered:

```txt id="1zp79e"
Instagram carousel publishing
Pinterest video Pins
YouTube thumbnail upload
YouTube captions/subtitles foundation
X media alt text / accessibility metadata
Platform preview improvements
Media compatibility/transcoding checks
Link validation and UTM handling
Cover image handling
Post-publish verification foundation
Notification hooks for scheduler events
Final UX polish
```

Sprint 10 must preserve the full foundation from earlier sprints:

```txt id="yk8ncu"
Sprint 1 → Upload, Draft Composer JSONB, workspace scheduler shell
Sprint 2 → Worker, attempts, retry-safe state machine
Sprint 3 → Facebook Page publishing
Sprint 4 → Instagram publishing
Sprint 5 → Pinterest image Pins
Sprint 6 → YouTube video publishing
Sprint 7 → X paid publishing
Sprint 8 → Calendar, readiness, account health, QA
Sprint 9 → Bulk drafts, calendar editing, approval workflow
```

The base scheduler principle remains:

```txt id="dzg685"
Upload
→ Store
→ Schedule
→ Worker
→ Publish Attempt
→ Status
```

This matches the original scheduler MVP principle.

---

## 1. Sprint 10 Name

```txt id="2joawg"
Sprint 10 — Platform Deepening and Missed Feature Closeout
```

Alternative internal label:

```txt id="4z3t6u"
Sprint 10 — Advanced Platform Publishing Polish
```

---

## 2. What Was Missed or Deferred Earlier

The previous sprints were correctly phased, but these items were either skipped, marked later, or not detailed deeply enough:

## 2.1 Instagram

Deferred:

```txt id="g41syk"
Carousel publishing
Per-platform Instagram caption override
Carousel child container tracking
Carousel preview UI
Carousel validation
```

Instagram publishing supports posts containing multiple images and videos as carousel posts through the Instagram Platform. Instagram video/media containers also support an `is_carousel_item` flag for carousel media items.

## 2.2 Pinterest

Deferred:

```txt id="fzkwgr"
Video Pin publishing
Pinterest media upload lifecycle
Cover image requirement
Video processing tracking
Board section polishing
```

Pinterest’s developer docs describe video upload for Pins, including uploading the video file to Pinterest’s media bucket and creating a Pin after media upload.

## 2.3 YouTube

Deferred:

```txt id="slfcnh"
Custom thumbnail upload
Captions/subtitles foundation
Processing checks after upload
Visibility correction after audit status changes
Better quota dashboard details
```

The YouTube Data API includes `thumbnails.set` for uploading and setting a custom video thumbnail, and `captions.insert` for uploading caption tracks.

## 2.4 Twitter/X

Deferred:

```txt id="btbdzw"
Image alt text
Media metadata
Quote/reply support as optional
Better post character/media preview
Cost ledger polishing
```

X’s API documentation confirms posts can attach media via `media_id`, and the X changelog notes that the `alt_text` field is available in the X API v2 media object. X’s own help docs also describe image descriptions/alt text as an accessibility feature for images.

## 2.5 Cross-Platform

Deferred:

```txt id="jxf0lt"
Universal media compatibility checker
Automatic thumbnail/cover frame extraction
Link validation
UTM builder
Per-platform preview renderer
Notification events
Post-publish verification baseline
Final settings cleanup
```

---

# 3. Sprint 10 Outcome

By the end of Sprint 10:

1. Instagram carousel posts can be scheduled and published.
2. Pinterest video Pins can be scheduled and published.
3. YouTube custom thumbnails can be uploaded and attached.
4. YouTube captions/subtitles foundation exists.
5. X image alt text/media metadata support is implemented where API access allows it.
6. Users can preview posts more accurately per platform.
7. Media compatibility validation is centralized.
8. Cover images/thumbnails are first-class scheduler assets.
9. Links can be validated before scheduling.
10. UTM parameters can be added safely.
11. Post-publish verification foundation exists.
12. Notifications/events exist for review, approval, failure, reconnect, quota, cost, and publish completion.
13. Existing worker/attempt/status/approval architecture remains unchanged.

---

# 4. In Scope

Sprint 10 includes:

```txt id="m0737v"
Instagram carousel publishing
Pinterest video Pin publishing
YouTube thumbnail upload
YouTube caption/subtitle upload foundation
X image alt text / media metadata support
Central media compatibility checker
Cover image and thumbnail asset handling
Platform-specific preview renderer
Link validation
UTM builder
Post-publish verification baseline
Scheduler notification event hooks
Final platform settings polish
Regression test suite
```

---

# 5. Out of Scope

Sprint 10 must **not** implement:

```txt id="2x83qy"
New social platforms
Full analytics dashboard
Social inbox
DM management
Comment moderation
AI caption generation as required acceptance
Ad campaign publishing
Paid ad manager integration
Automated trend discovery
Recurring evergreen automation
Autonomous posting without approval/governance
```

Optional stretch only:

```txt id="lm3lsb"
X quote posts
X reply posts
YouTube playlist assignment
Instagram first comment
Pinterest board creation
```

Do not block Sprint 10 completion on stretch items.

---

# 6. Product Principle

Sprint 10’s product principle:

```txt id="5f7aw1"
Close the capability gaps without destabilizing the scheduler.
```

Every new feature must still follow:

```txt id="6tohnz"
Workspace isolation
Approval rules
Readiness checks
Worker preflight
Attempt logging
Retry classification
Audit logging
Token safety
Signed URL safety
```

Do not add any direct “publish now” shortcut that skips the Sprint 2 worker and attempt system.

---

# 7. Route Structure

Existing routes remain:

```txt id="pfciqs"
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

Sprint 10 adds no mandatory top-level route.

Optional admin/developer route:

```txt id="s8djbl"
/app/social-scheduler/media-lab
```

Purpose:

```txt id="ixb51u"
Debug platform compatibility, thumbnail extraction, captions, and media transformations before publishing.
```

This route is optional and should be admin/developer only.

---

# 8. Instagram Carousel Publishing

## 8.1 Purpose

Sprint 4 added Instagram image and video/Reel publishing.

Sprint 10 adds Instagram carousel publishing.

## 8.2 Supported Carousel Types

Sprint 10 should support:

```txt id="9yiv97"
Image carousel
Mixed image/video carousel only if tested
```

Recommended strict Sprint 10 MVP:

```txt id="s0dgtq"
Image carousel first
Mixed carousel second
```

Do not enable mixed image/video carousel until media validation and container tracking are reliable.

## 8.3 UX Updates

In Scheduler Target step, Instagram format selector becomes:

```txt id="s16kw9"
Feed image
Reel / video
Carousel
Story — Coming later
```

When Carousel is selected:

Fields:

```txt id="fo5mw3"
Carousel media order
Caption
Alt text per image optional
Cover/first slide selection
```

Buttons:

```txt id="bsiija"
Reorder media
Remove from carousel
Add media
Continue
```

Validation:

```txt id="v9yrdy"
At least 2 media assets
No unsupported media
All media uploaded and ready
Instagram account connected
Content publishing limit available
```

## 8.4 Database Updates

Add to `platformOptionsJson`:

```json id="z4oxhq"
{
  "instagram": {
    "format": "CAROUSEL",
    "carousel": {
      "items": [
        {
          "mediaAssetId": "asset_1",
          "order": 0,
          "type": "IMAGE"
        },
        {
          "mediaAssetId": "asset_2",
          "order": 1,
          "type": "IMAGE"
        }
      ],
      "coverMediaAssetId": "asset_1"
    }
  }
}
```

Add model:

```prisma id="rg7tjb"
model InstagramCarouselItem {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String
  targetId          String
  attemptId         String?

  mediaAssetId      String
  childContainerId  String?
  order             Int
  mediaType         String

  status            String @default("PENDING")
  errorCode         String?
  errorMessage      String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([attemptId])
}
```

Statuses:

```txt id="0h1xva"
PENDING
CONTAINER_CREATED
FAILED
ATTACHED
PUBLISHED
```

## 8.5 Worker Flow

```txt id="0moakr"
1. Worker claims due Instagram carousel target.
2. Worker validates all media assets.
3. Worker checks Instagram publishing limit.
4. Worker creates child containers for each carousel item.
5. Worker stores child container IDs.
6. Worker creates parent carousel container.
7. Worker publishes parent carousel container.
8. Worker stores Instagram post ID/permalink.
9. Worker updates attempt timeline.
```

## 8.6 Error Handling

```txt id="wx8s38"
One child container fails → target FAILED or RETRYING depending error
Parent container fails → target RETRYING/FAILED
Limit reached → target RETRYING or LIMIT_REACHED
Unsupported mixed media → target FAILED_PERMANENT
```

---

# 9. Pinterest Video Pin Publishing

## 9.1 Purpose

Sprint 5 added Pinterest image Pins.

Sprint 10 adds video Pins.

## 9.2 UX Updates

Pinterest target card Pin type selector becomes:

```txt id="dhb5xf"
Image Pin
Video Pin
```

When Video Pin is selected, required fields:

```txt id="gx1y8b"
Video media
Cover image
Board
Optional board section
Pin title
Pin description
Destination link optional
```

Buttons:

```txt id="42lpu6"
Choose cover image
Use frame from video
Upload cover image
Continue
```

## 9.3 Cover Image Rule

Sprint 10 must support two cover paths:

```txt id="m0q64y"
Manual cover upload
Auto-extracted video frame
```

Default:

```txt id="i8gq22"
Auto-extract frame at 1 second if no manual cover is provided.
```

If extraction fails:

```txt id="sbb669"
Ask user to upload cover image manually.
```

## 9.4 Database Updates

Add model:

```prisma id="aewimv"
model PinterestVideoUploadJob {
  id                  String @id @default(uuid())

  workspaceId          String
  postId               String
  targetId             String
  attemptId            String?

  socialAccountId      String
  mediaAssetId         String
  coverMediaAssetId    String?

  externalMediaId      String?
  uploadStatus         String @default("CREATED")

  uploadStartedAt      DateTime?
  uploadFinishedAt     DateTime?
  processingCheckedAt  DateTime?
  publishedAt          DateTime?

  errorCode            String?
  errorMessage         String?
  diagnosticsJson      Json?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([attemptId])
  @@index([uploadStatus])
}
```

Statuses:

```txt id="k2fn3z"
CREATED
REGISTERED
UPLOADING
UPLOADED
PROCESSING
READY
PUBLISHED
FAILED
RATE_LIMITED
REAUTH_REQUIRED
```

## 9.5 Worker Flow

```txt id="3ffqmq"
1. Worker claims due Pinterest video target.
2. Worker validates Pinterest account, board, and media.
3. Worker validates video file and cover image.
4. Worker registers media upload.
5. Worker uploads video to Pinterest-provided upload location.
6. Worker waits/polls until video is ready if required.
7. Worker creates Pin using video media ID and cover image.
8. Worker stores Pin ID and URL.
9. Worker updates attempt timeline.
```

## 9.6 Error Handling

```txt id="iy13wn"
Video upload timeout → RETRYING
Video processing pending → PLATFORM_PROCESSING
Invalid cover image → FAILED_PERMANENT
Board missing → FAILED_PERMANENT
Rate limit → RATE_LIMITED / RETRYING
Token invalid → REAUTH_REQUIRED
```

---

# 10. YouTube Custom Thumbnail Upload

## 10.1 Purpose

Sprint 6 added YouTube video upload.

Sprint 10 adds custom thumbnails.

YouTube’s API supports uploading and setting a custom thumbnail for a video via the `thumbnails.set` method.

## 10.2 UX Updates

In YouTube platform options, add:

```txt id="l2osx5"
Custom thumbnail
```

Options:

```txt id="m4vysb"
Upload thumbnail
Use generated video frame
No custom thumbnail
```

Recommended default:

```txt id="31lspm"
Use generated video frame
```

Thumbnail controls:

```txt id="n4z2kg"
Upload image
Choose video frame
Replace thumbnail
Remove thumbnail
```

## 10.3 Database Updates

Update `YouTubeUploadJob`:

```prisma id="hvzcby"
thumbnailMediaAssetId String?
thumbnailUploadStatus String?
thumbnailUploadedAt   DateTime?
thumbnailErrorCode    String?
thumbnailErrorMessage String?
```

Statuses:

```txt id="nzkv6x"
NOT_REQUIRED
PENDING
UPLOADED
FAILED
SKIPPED
```

## 10.4 Worker Flow

```txt id="0rmemo"
1. Worker uploads YouTube video.
2. Worker receives YouTube video ID.
3. If thumbnail selected, worker validates thumbnail asset.
4. Worker uploads thumbnail through YouTube thumbnail endpoint.
5. Worker stores thumbnail upload result.
6. Attempt timeline shows video upload and thumbnail result separately.
```

## 10.5 Timeline Copy

Success:

```txt id="m8czws"
Custom thumbnail uploaded
```

Failure:

```txt id="rqis7f"
Video uploaded, but thumbnail upload failed
```

Rule:

```txt id="fo49q3"
Thumbnail failure should not mark the whole YouTube video upload failed if the video itself published successfully.
```

Mark post:

```txt id="f1e7aq"
PUBLISHED_WITH_WARNINGS
```

or target:

```txt id="l1ecms"
PUBLISHED_WITH_WARNINGS
```

---

# 11. YouTube Captions/Subtitles Foundation

## 11.1 Purpose

Sprint 10 adds caption/subtitle file support as a foundation.

The YouTube Data API reference includes `captions.insert`, which uploads a caption track.

## 11.2 Sprint 10 Scope

Sprint 10 should implement:

```txt id="sh892g"
Upload caption file
Attach caption file to YouTube target options
Validate caption file type
Store metadata
Optional upload after video publish
Show status in timeline
```

## 11.3 Supported Caption Files

Strict Sprint 10 MVP:

```txt id="9c81iz"
.srt
.vtt
```

## 11.4 UX Fields

YouTube caption section:

```txt id="uegr5t"
Captions / subtitles
```

Options:

```txt id="8zqgxa"
No captions
Upload captions
```

Fields:

```txt id="2xbdqn"
Caption file
Language
Track name
Draft/public flag if supported
```

Buttons:

```txt id="v00pxo"
Upload caption file
Remove caption file
```

## 11.5 Database Updates

Create model:

```prisma id="fhp4ro"
model YouTubeCaptionTrack {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String
  targetId          String
  attemptId         String?

  mediaAssetId      String
  language          String
  trackName         String?
  uploadStatus      String @default("PENDING")

  youtubeCaptionId  String?

  uploadedAt        DateTime?
  errorCode         String?
  errorMessage      String?

  diagnosticsJson   Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([uploadStatus])
}
```

Statuses:

```txt id="c1rerx"
PENDING
UPLOADED
FAILED
SKIPPED
```

## 11.6 Worker Flow

```txt id="pi1l00"
1. Upload YouTube video.
2. Store YouTube video ID.
3. If caption track exists, upload caption file.
4. Store YouTube caption ID if returned.
5. Show caption upload result in timeline.
```

Rule:

```txt id="t26aif"
Caption failure should not fail the whole video if video upload succeeded.
```

---

# 12. X Alt Text and Media Metadata

## 12.1 Purpose

Sprint 7 added X posting and media upload.

Sprint 10 adds accessibility metadata support where available.

X image descriptions/alt text are an accessibility feature for images on X. X’s API changelog also notes `alt_text` support in the v2 media object.

## 12.2 UX Updates

When X target has image media, show:

```txt id="vvqeau"
Image descriptions
```

For each image:

```txt id="ahg4ng"
Image thumbnail
Alt text textarea
Character guidance
```

Buttons:

```txt id="dfxf0u"
Apply same description to all
Clear description
Continue
```

Helper copy:

```txt id="6mpjsq"
Describe the image for accessibility. Do not add promotional claims that are not visible in the image.
```

## 12.3 Product Rule

Alt text is recommended but not mandatory.

Validation:

```txt id="ii069v"
Warn if missing alt text.
Do not block publishing unless workspace setting requires accessibility metadata.
```

Workspace setting:

```txt id="h1bmsu"
Require image alt text before publishing
```

Default:

```txt id="ij00z4"
false
```

Recommended for accessibility-conscious clients:

```txt id="5b678u"
true
```

## 12.4 Database Update

Store in `platformOptionsJson`:

```json id="cbi0ka"
{
  "x": {
    "mediaAltText": [
      {
        "mediaAssetId": "asset_1",
        "altText": "Front elevation of a luxury residential tower at dusk."
      }
    ]
  }
}
```

Create optional model:

```prisma id="hmblh0"
model SocialMediaAccessibilityMetadata {
  id                String @id @default(uuid())

  workspaceId       String
  mediaAssetId      String
  platform          SocialSchedulerPlatform
  targetId          String?

  altText           String?
  metadataStatus    String @default("DRAFT")

  createdByUserId   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, mediaAssetId])
  @@index([workspaceId, platform])
}
```

## 12.5 Worker Flow

```txt id="f8dk7x"
1. Worker uploads media to X.
2. If alt text exists and API/tier supports metadata creation, attach metadata.
3. If metadata fails but post can publish, continue based on workspace setting.
4. If workspace requires alt text and metadata fails, block or fail target.
5. Attempt timeline shows metadata step.
```

## 12.6 Timeline Copy

Success:

```txt id="rqw7og"
Image description attached
```

Warning:

```txt id="7nzme4"
Published without image description
```

Failure:

```txt id="lm3xyo"
Image description failed
```

---

# 13. Central Media Compatibility Checker

## 13.1 Purpose

Earlier sprints repeated media validation platform by platform.

Sprint 10 must centralize this.

Create:

```txt id="nfxa51"
SocialMediaCompatibilityService
```

## 13.2 Compatibility Matrix

The service checks:

```txt id="py9t5d"
Platform
Post type
MIME type
File size
Duration
Dimensions
Media count
Media combination
Caption/title fields
Thumbnail/cover requirements
Accessibility metadata requirements
```

## 13.3 API Contract

```txt id="wsmygz"
POST /api/v0/social-scheduler/media/compatibility-check
```

Body:

```json id="4j0zbm"
{
  "workspaceId": "workspace_id",
  "mediaAssetIds": ["asset_1", "asset_2"],
  "targets": [
    {
      "platform": "INSTAGRAM",
      "format": "CAROUSEL"
    },
    {
      "platform": "YOUTUBE",
      "format": "VIDEO"
    }
  ]
}
```

Response:

```json id="ajzeb8"
{
  "status": "READY_WITH_WARNINGS",
  "results": [
    {
      "platform": "INSTAGRAM",
      "format": "CAROUSEL",
      "status": "READY",
      "blockingIssues": [],
      "warnings": []
    },
    {
      "platform": "YOUTUBE",
      "format": "VIDEO",
      "status": "BLOCKED",
      "blockingIssues": [
        {
          "code": "YOUTUBE_REQUIRES_SINGLE_VIDEO",
          "message": "YouTube requires exactly one video file."
        }
      ],
      "warnings": []
    }
  ]
}
```

## 13.4 UI Placement

Run compatibility check:

```txt id="pd12vo"
After upload
When selecting targets
Before review
During readiness check
Before worker publishing
```

---

# 14. Cover Image and Thumbnail System

## 14.1 Purpose

Pinterest video Pins, YouTube videos, Instagram Reels, and scheduler cards all need better thumbnail/cover handling.

## 14.2 Supported Cover Sources

```txt id="k113we"
Uploaded image
Auto-extracted video frame
Existing media asset
Platform default
```

## 14.3 New Model — SocialMediaDerivative

```prisma id="i0j8ej"
model SocialMediaDerivative {
  id                String @id @default(uuid())

  workspaceId       String
  sourceMediaAssetId String
  derivedMediaAssetId String?

  derivativeType    String
  status            String @default("PENDING")

  frameTimestampMs  Int?
  width             Int?
  height            Int?

  errorCode         String?
  errorMessage      String?
  metadataJson      Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([workspaceId, sourceMediaAssetId])
  @@index([derivativeType])
  @@index([status])
}
```

Derivative types:

```txt id="tvlwvn"
VIDEO_THUMBNAIL
PINTEREST_COVER
YOUTUBE_THUMBNAIL
INSTAGRAM_REEL_COVER
PREVIEW_THUMBNAIL
```

## 14.4 UI

Component:

```txt id="cl55k1"
CoverImagePicker
```

Buttons:

```txt id="7amc5x"
Upload cover
Choose video frame
Use first frame
Remove cover
```

---

# 15. Link Validation and UTM Builder

## 15.1 Purpose

Pinterest, X, YouTube descriptions, Facebook captions, and Instagram captions may include links. Earlier sprints did not deeply handle link safety or UTM tracking.

## 15.2 Link Validation

Create:

```txt id="95pg3e"
SocialLinkValidationService
```

Checks:

```txt id="w31lsc"
URL format
HTTPS preferred
Reachability
Blocked/private localhost URL
Known unsafe schemes
Client domain allowlist if configured
```

Blocked schemes:

```txt id="3gtajd"
javascript:
file:
data:
localhost/internal IPs
```

## 15.3 UTM Builder

Fields:

```txt id="3venkg"
utm_source
utm_medium
utm_campaign
utm_content
utm_term optional
```

Platform defaults:

```txt id="qspuf4"
Facebook → utm_source=facebook
Instagram → utm_source=instagram
Pinterest → utm_source=pinterest
YouTube → utm_source=youtube
X → utm_source=x
```

## 15.4 UI

Section:

```txt id="strmu5"
Links and tracking
```

Buttons:

```txt id="in3wid"
Validate links
Add UTM tags
Preview final URL
Remove UTM tags
```

Validation copy:

```txt id="30gx2n"
This link is valid and reachable.
```

Error copy:

```txt id="y4y0gd"
This link cannot be used because it points to a private or unsupported location.
```

---

# 16. Platform Preview Renderer

## 16.1 Purpose

Sprint 10 adds better previews so users can see platform-specific output before publishing.

Create:

```txt id="2drrpc"
PlatformPreviewRenderer
```

## 16.2 Preview Types

```txt id="kaj7x8"
Facebook Page preview
Instagram Feed preview
Instagram Reel preview
Instagram Carousel preview
Pinterest Pin preview
YouTube video card preview
X post preview
```

## 16.3 UX Rules

Preview must clearly show:

```txt id="h0smsv"
Media crop approximation
Caption/title/description
Platform account
Warnings
Missing fields
```

Do not claim pixel-perfect rendering.

UI copy:

```txt id="6x8mi9"
Preview is approximate. Final display may vary by platform.
```

---

# 17. Post-Publish Verification Baseline

## 17.1 Purpose

Earlier sprints stored external post IDs/URLs but did not deeply define post-publish verification.

Sprint 10 adds a simple baseline.

## 17.2 Verification Checks

For each published target:

```txt id="cwyo3s"
External post ID exists
External URL exists if provider returns one
Provider status fetch works if API supports it
Stored target remains terminal
Attempt timeline matches target status
```

## 17.3 New Model — SocialPostVerificationCheck

```prisma id="ow0z8s"
model SocialPostVerificationCheck {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String
  targetId          String
  attemptId         String?

  platform          SocialSchedulerPlatform
  status            String

  externalPostId    String?
  externalPostUrl   String?

  checkedAt         DateTime @default(now())
  errorCode         String?
  errorMessage      String?
  diagnosticsJson   Json?

  createdAt         DateTime @default(now())

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([platform, status])
}
```

Statuses:

```txt id="8d314s"
VERIFIED
UNVERIFIED
FAILED
SKIPPED
NOT_SUPPORTED
```

## 17.4 UI

Post detail page adds:

```txt id="f032pj"
Verification
```

Fields:

```txt id="0r6gdg"
Last checked
Verification status
External post URL
Provider status
Errors
```

Button:

```txt id="c5ou43"
Verify now
```

Admin/developer or manager only.

---

# 18. Notification Event Hooks

## 18.1 Purpose

Sprint 9 added review and approval workflow, but notifications were not deeply specified.

Sprint 10 adds internal event hooks.

## 18.2 Events

```txt id="gt3aky"
POST_SENT_FOR_REVIEW
POST_APPROVED
CHANGES_REQUESTED
POST_REJECTED
POST_PUBLISHED
POST_PARTIALLY_FAILED
POST_FAILED
ACCOUNT_REAUTH_REQUIRED
QUOTA_BLOCKED
COST_BLOCKED
READINESS_BLOCKED
```

## 18.3 Notification Channels

Sprint 10 foundation:

```txt id="pii43h"
In-app notifications
Email notification hook placeholder
Webhook/outbox event placeholder
```

Do not build full email/SMS/Slack delivery unless already available in the repo.

## 18.4 Data Model

Create:

```prisma id="96cyvr"
model SocialSchedulerNotificationEvent {
  id                String @id @default(uuid())

  workspaceId       String
  postId            String?
  targetId          String?
  socialAccountId   String?

  eventType         String
  severity          String
  title             String
  body              String

  status            String @default("PENDING")
  metadataJson      Json?

  createdAt         DateTime @default(now())
  deliveredAt       DateTime?
  readAt            DateTime?

  @@index([workspaceId, eventType])
  @@index([workspaceId, status])
  @@index([createdAt])
}
```

---

# 19. API Contracts

## 19.1 Media Compatibility Check

```txt id="plz7w6"
POST /api/v0/social-scheduler/media/compatibility-check
```

## 19.2 Generate Video Thumbnail

```txt id="ecqsuv"
POST /api/v0/social-scheduler/media/{mediaAssetId}/generate-thumbnail
```

Body:

```json id="gluqhp"
{
  "workspaceId": "workspace_id",
  "timestampMs": 1000,
  "purpose": "YOUTUBE_THUMBNAIL"
}
```

## 19.3 Validate Links

```txt id="kpuwc7"
POST /api/v0/social-scheduler/links/validate
```

Body:

```json id="k1wsc5"
{
  "workspaceId": "workspace_id",
  "urls": ["https://example.com/project"]
}
```

## 19.4 Build UTM URL

```txt id="t5da8p"
POST /api/v0/social-scheduler/links/build-utm
```

Body:

```json id="wz1ot3"
{
  "workspaceId": "workspace_id",
  "url": "https://example.com/project",
  "platform": "PINTEREST",
  "campaign": "september_launch",
  "content": "video_pin"
}
```

## 19.5 Verify Published Target

```txt id="y4xv2v"
POST /api/v0/social-scheduler/targets/{targetId}/verify
```

Body:

```json id="jfnwew"
{
  "workspaceId": "workspace_id"
}
```

## 19.6 Upload YouTube Thumbnail

```txt id="3imxvu"
POST /api/v0/social-scheduler/youtube/upload-thumbnail
```

Body:

```json id="j551v8"
{
  "workspaceId": "workspace_id",
  "targetId": "target_id",
  "thumbnailMediaAssetId": "asset_id"
}
```

## 19.7 Upload YouTube Caption Track

```txt id="etbmc0"
POST /api/v0/social-scheduler/youtube/captions
```

Body:

```json id="gfmm9g"
{
  "workspaceId": "workspace_id",
  "targetId": "target_id",
  "captionMediaAssetId": "asset_id",
  "language": "en",
  "trackName": "English"
}
```

---

# 20. Worker Updates

Update adapter routing from earlier sprints.

## 20.1 Instagram

```txt id="w5cw3m"
if platform = INSTAGRAM and format = CAROUSEL:
  use InstagramCarouselPublisherFlow
```

## 20.2 Pinterest

```txt id="v29s71"
if platform = PINTEREST and pinType = VIDEO:
  use PinterestVideoPinPublisherFlow
```

## 20.3 YouTube

```txt id="rxwjpu"
After successful video upload:
  upload thumbnail if selected
  upload captions if selected
  mark target PUBLISHED_WITH_WARNINGS if secondary assets fail
```

## 20.4 X

```txt id="l0ftg7"
After media upload:
  attach media metadata / alt text if enabled and supported
  continue or block based on workspace accessibility setting
```

## 20.5 Verification

```txt id="zm54mb"
After target PUBLISHED:
  create verification check job/event
```

---

# 21. State Machine Updates

Add statuses if missing:

```txt id="esufky"
PUBLISHED_WITH_WARNINGS
VERIFICATION_PENDING
VERIFIED
UNVERIFIED
SECONDARY_ASSET_FAILED
```

Target status enum should support:

```prisma id="azgcvg"
enum SocialSchedulerTargetStatus {
  SELECTED
  SCHEDULED
  DUE
  PROCESSING
  PLATFORM_PROCESSING
  PUBLISHED_MOCK
  PUBLISHED
  PUBLISHED_WITH_WARNINGS
  VERIFICATION_PENDING
  VERIFIED
  UNVERIFIED
  PRIVATE_RESTRICTED
  RETRYING
  REAUTH_REQUIRED
  LIMIT_REACHED
  QUOTA_BLOCKED
  COST_BLOCKED
  APPROVAL_BLOCKED
  FAILED
  SKIPPED
  CANCELLED
}
```

Attempt status enum should support:

```prisma id="0f0xzr"
enum SocialPublishAttemptStatus {
  STARTED
  CONTAINER_CREATED
  PLATFORM_PROCESSING
  SECONDARY_ASSET_FAILED
  SUCCEEDED
  SUCCEEDED_WITH_WARNINGS
  FAILED_RETRYABLE
  FAILED_PERMANENT
  REAUTH_REQUIRED
  RATE_LIMITED
  LIMIT_REACHED
  QUOTA_BLOCKED
  COST_BLOCKED
  APPROVAL_BLOCKED
  PRIVATE_RESTRICTED
  TIMED_OUT
  SKIPPED
}
```

---

# 22. Frontend Components

Add:

```txt id="w623p6"
InstagramCarouselBuilder.tsx
InstagramCarouselPreview.tsx
InstagramCarouselItemCard.tsx
PinterestVideoPinFields.tsx
PinterestVideoCoverPicker.tsx
YouTubeThumbnailPicker.tsx
YouTubeCaptionUploadPanel.tsx
XAltTextPanel.tsx
XMediaMetadataPanel.tsx
MediaCompatibilityPanel.tsx
PlatformPreviewRenderer.tsx
FacebookPreview.tsx
InstagramPreview.tsx
PinterestPreview.tsx
YouTubePreview.tsx
XPreview.tsx
LinkValidationPanel.tsx
UtmBuilderPanel.tsx
PostVerificationPanel.tsx
SchedulerNotificationPanel.tsx
CoverImagePicker.tsx
VideoFrameSelector.tsx
```

Update:

```txt id="kd2vjv"
PlatformTargetsStep.tsx
ComposerStep.tsx
ReviewStep.tsx
SchedulerPostDetail.tsx
AttemptTimeline.tsx
ReadinessCheckPanel.tsx
SchedulerSettingsPage.tsx
BulkDraftDetailsStep.tsx
BulkPlatformAssignmentStep.tsx
BulkReviewStep.tsx
```

---

# 23. Backend Services

Add:

```txt id="6wq1k8"
InstagramCarouselService
PinterestVideoPinService
YouTubeThumbnailService
YouTubeCaptionService
XMediaMetadataService
SocialMediaCompatibilityService
SocialMediaDerivativeService
SocialLinkValidationService
UtmBuilderService
PlatformPreviewService
SocialPostVerificationService
SocialSchedulerNotificationService
```

Update:

```txt id="syfe9m"
MetaInstagramPublisherAdapter
PinterestPublisherAdapter
GoogleYouTubePublisherAdapter
XPublisherAdapter
SocialSchedulerWorkerService
SocialSchedulerReadinessService
SocialSchedulerAuditLogService
SocialSchedulerQaService
```

---

# 24. Environment Variables

Add:

```txt id="77ir10"
SOCIAL_SCHEDULER_INSTAGRAM_CAROUSEL_ENABLED=true
SOCIAL_SCHEDULER_PINTEREST_VIDEO_PINS_ENABLED=true
SOCIAL_SCHEDULER_YOUTUBE_CUSTOM_THUMBNAIL_ENABLED=true
SOCIAL_SCHEDULER_YOUTUBE_CAPTIONS_ENABLED=true
SOCIAL_SCHEDULER_X_ALT_TEXT_ENABLED=true
SOCIAL_SCHEDULER_MEDIA_COMPATIBILITY_REQUIRED=true
SOCIAL_SCHEDULER_LINK_VALIDATION_ENABLED=true
SOCIAL_SCHEDULER_UTM_BUILDER_ENABLED=true
SOCIAL_SCHEDULER_POST_VERIFICATION_ENABLED=true
SOCIAL_SCHEDULER_NOTIFICATIONS_ENABLED=true
```

Optional:

```txt id="njdx5g"
SOCIAL_SCHEDULER_REQUIRE_ALT_TEXT=false
SOCIAL_SCHEDULER_AUTO_GENERATE_VIDEO_THUMBNAILS=true
SOCIAL_SCHEDULER_THUMBNAIL_FRAME_DEFAULT_MS=1000
SOCIAL_SCHEDULER_ALLOW_MIXED_INSTAGRAM_CAROUSEL=false
SOCIAL_SCHEDULER_ENABLE_PLATFORM_PREVIEW=true
```

---

# 25. Settings Page Updates

Route:

```txt id="twwang"
/app/social-scheduler/settings
```

Add sections:

```txt id="mncr6v"
Platform Feature Flags
Media Compatibility
Accessibility
Links and Tracking
Verification
Notifications
```

## 25.1 Platform Feature Flags

Toggles:

```txt id="sgg1u3"
Instagram carousel
Pinterest video Pins
YouTube thumbnails
YouTube captions
X alt text
```

## 25.2 Accessibility

Toggle:

```txt id="s0180b"
Require alt text for image posts
```

## 25.3 Links and Tracking

Toggles:

```txt id="qpy3qj"
Validate links before scheduling
Enable UTM builder
Block private/internal URLs
```

## 25.4 Verification

Toggle:

```txt id="kfep14"
Verify published posts after publishing
```

## 25.5 Notifications

Toggles:

```txt id="pvpooe"
Notify when review requested
Notify when post approved
Notify when post published
Notify when post fails
Notify when reconnect required
Notify when quota/cost blocked
```

---

# 26. UX Copy

## 26.1 Instagram Carousel

```txt id="lw667l"
Build carousel
```

Helper:

```txt id="ahz0vu"
Arrange the media in the order it should appear on Instagram.
```

## 26.2 Pinterest Video Pin

```txt id="cpe699"
Video Pin
```

Helper:

```txt id="ea9vs3"
Pinterest video Pins require a video and a cover image.
```

## 26.3 YouTube Thumbnail

```txt id="lplhqv"
Custom thumbnail
```

Helper:

```txt id="tiwp13"
Upload a thumbnail or choose a frame from the video.
```

## 26.4 YouTube Captions

```txt id="qze9sp"
Captions / subtitles
```

Helper:

```txt id="mt60tm"
Add an SRT or VTT file to improve accessibility.
```

## 26.5 X Alt Text

```txt id="l2ikw5"
Image description
```

Helper:

```txt id="ha207o"
Describe the image for accessibility.
```

## 26.6 Link Validation

```txt id="y3achl"
Validate links
```

Helper:

```txt id="cfgrhf"
Check links before scheduling to avoid broken or unsafe destination URLs.
```

## 26.7 Verification

```txt id="0p7qwa"
Verify published post
```

Helper:

```txt id="6jp9z9"
Check whether the platform accepted and returned a valid published post reference.
```

---

# 27. Functional Test Cases

## 27.1 Instagram Carousel

```txt id="tsrc9k"
User can select Instagram Carousel format.
```

```txt id="du358z"
Carousel requires at least two media items.
```

```txt id="lroqp2"
User can reorder carousel media.
```

```txt id="dqzgx8"
Worker creates child containers before parent carousel container.
```

```txt id="obv67k"
Failed child container blocks carousel publish safely.
```

---

## 27.2 Pinterest Video Pin

```txt id="ydcltg"
User can select Pinterest Video Pin.
```

```txt id="cltt19"
Video Pin requires video media.
```

```txt id="ivyynh"
Video Pin requires cover image or generated cover.
```

```txt id="fc3pgu"
Worker uploads video before creating Pin.
```

```txt id="lmcofy"
Processing video enters PLATFORM_PROCESSING instead of failing immediately.
```

---

## 27.3 YouTube Thumbnail

```txt id="jgor13"
User can upload custom thumbnail.
```

```txt id="kxf7wn"
User can generate thumbnail from video frame.
```

```txt id="lpyw24"
Worker uploads thumbnail after video upload succeeds.
```

```txt id="d6tny0"
Thumbnail failure marks target PUBLISHED_WITH_WARNINGS, not FAILED.
```

---

## 27.4 YouTube Captions

```txt id="i0564w"
User can upload SRT file.
```

```txt id="m5w5y5"
User can upload VTT file.
```

```txt id="z7d6tj"
Invalid caption file type is rejected.
```

```txt id="l0pzyw"
Caption upload result appears in timeline.
```

---

## 27.5 X Alt Text

```txt id="yl7u1h"
X image post shows alt text fields.
```

```txt id="oljqeo"
Missing alt text shows warning when accessibility setting is optional.
```

```txt id="jnpo0s"
Missing alt text blocks publishing when accessibility setting is required.
```

```txt id="3qi4et"
Alt text is stored without tokens or signed URLs.
```

---

## 27.6 Media Compatibility

```txt id="3svmi6"
Compatibility check runs after upload.
```

```txt id="n4xc73"
Compatibility check blocks YouTube image post.
```

```txt id="90ij4z"
Compatibility check blocks Pinterest video Pin without cover.
```

```txt id="d8qrhj"
Compatibility check warns about missing X alt text.
```

---

## 27.7 Links and UTM

```txt id="8k94zh"
Valid HTTPS link passes validation.
```

```txt id="t7gg6e"
localhost/internal URL is blocked.
```

```txt id="dwl52c"
UTM builder creates platform-specific source values.
```

```txt id="7vcb5f"
Final URL preview is shown before schedule.
```

---

## 27.8 Verification

```txt id="9cnam9"
Published target creates verification check.
```

```txt id="1dtjs4"
Verified target shows VERIFIED status.
```

```txt id="0nurlx"
Provider fetch failure shows UNVERIFIED, not automatic FAILED.
```

---

## 27.9 Notifications

```txt id="gxuixl"
Review request creates notification event.
```

```txt id="9q1tbf"
Publish success creates notification event.
```

```txt id="rnay36"
Publish failure creates notification event.
```

```txt id="qz9kxk"
Reconnect required creates notification event.
```

---

## 27.10 Security

```txt id="m9moe2"
No tokens appear in derivative metadata.
```

```txt id="wmgy1w"
No signed URLs appear in notification metadata.
```

```txt id="36ivsq"
No cross-workspace media derivative access.
```

```txt id="94lvl9"
No cross-workspace verification access.
```

```txt id="518jrg"
No cross-workspace notification access.
```

---

# 28. Acceptance Criteria

Sprint 10 is complete when:

## Instagram

```txt id="cp8vop"
Instagram carousel format is available.
Carousel media can be ordered.
Carousel validation works.
Worker publishes carousel through existing attempt system.
Timeline shows child/parent container lifecycle.
```

## Pinterest

```txt id="ud8mvl"
Pinterest video Pin option is available.
Video Pin requires video and cover.
Worker uploads video and creates Pin.
Video processing is tracked.
Timeline shows upload/processing/publish state.
```

## YouTube

```txt id="6lojam"
User can attach thumbnail.
User can generate thumbnail from video frame.
Worker uploads thumbnail after video upload.
User can attach caption/subtitle file.
Caption upload result is tracked.
Secondary asset failure does not incorrectly fail successful video upload.
```

## X

```txt id="zfvwws"
X image posts support alt text fields.
Alt text warning/blocking follows workspace settings.
Worker attaches media metadata where available.
Timeline shows metadata result.
```

## Cross-Platform

```txt id="0d7qw7"
Central media compatibility checker exists.
Platform previews are available.
Link validation exists.
UTM builder exists.
Post-publish verification baseline exists.
Notification event hooks exist.
All new actions preserve workspace isolation.
All new actions use audit logs where appropriate.
No tokens or signed URLs leak.
```

---

# 29. Sprint 10 Deliverables

## Frontend

```txt id="zdgj97"
Instagram carousel builder
Pinterest video Pin fields
Pinterest cover picker
YouTube thumbnail picker
YouTube caption upload panel
X alt text panel
Media compatibility panel
Platform preview renderer
Link validation panel
UTM builder panel
Post verification panel
Notification panel
Settings toggles
Updated review step
Updated bulk draft flow
Updated attempt timeline
```

## Backend

```txt id="qjyief"
Instagram carousel service
Pinterest video Pin service
YouTube thumbnail service
YouTube caption service
X media metadata service
Media compatibility service
Media derivative service
Link validation service
UTM builder service
Post verification service
Notification event service
Worker routing updates
Readiness updates
QA updates
```

## Database

```txt id="fc9fxh"
InstagramCarouselItem model
PinterestVideoUploadJob model
YouTubeCaptionTrack model
SocialMediaDerivative model
SocialMediaAccessibilityMetadata model
SocialPostVerificationCheck model
SocialSchedulerNotificationEvent model
New published-with-warnings statuses
Verification statuses
Secondary asset statuses
```

## Tests

```txt id="pgag14"
Instagram carousel tests
Pinterest video Pin tests
YouTube thumbnail tests
YouTube caption tests
X alt text tests
Media compatibility tests
Link validation tests
UTM builder tests
Post verification tests
Notification event tests
Workspace isolation tests
Token leakage tests
Signed URL leakage tests
Regression tests across Sprints 1–9
```

---

# 30. Final Sprint 10 Implementation Summary

Build this in Sprint 10:

```txt id="h8eyk0"
Existing production scheduler
→ Instagram carousel support
→ Pinterest video Pin support
→ YouTube thumbnail support
→ YouTube captions foundation
→ X alt text/media metadata support
→ Central media compatibility checker
→ Cover/thumbnail derivative system
→ Platform previews
→ Link validation and UTM builder
→ Post-publish verification baseline
→ Scheduler notification events
→ Final regression and UX polish
```

Do not add new social platforms.

Do not build analytics yet.

Do not build social inbox yet.

Do not build DM/comment management yet.

Do not bypass the Sprint 2 worker.

Sprint 10’s job is to close the major feature gaps left from Sprints 1–9 and make each platform integration feel complete enough for serious client use.

After Sprint 10, the next logical sprint is:

```txt id="koqwqm"
Sprint 11 — Reporting, Analytics, Post Performance Sync, and Client-Facing Publishing Insights
```

Optional alternative:

```txt id="3xv9i4"
Sprint 11 — Social Inbox, Comments, Replies, and Community Management
```