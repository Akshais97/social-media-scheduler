# Sakhaa Forge Social Scheduler — Sprint 4 Documentation  
## Sprint 4: Instagram Business/Creator Account Wiring and Instagram Publishing

## 0. Sprint Intent

Sprint 4 continues directly from Sprint 3.

Sprint 1 created:

```txt id="p0l1d4"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="q2m8za"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="b2v3pf"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped Facebook Page accounts
→ Real Facebook Page publishing through the Sprint 2 worker
```

Sprint 4 now adds Instagram using the existing Sprint 3 Meta foundation:

```txt id="u4c8th"
Connected Meta account / Facebook Page
→ Discover linked Instagram Professional account
→ Save Instagram Business/Creator account to workspace
→ Select Instagram target in Scheduler
→ Worker creates Instagram media container
→ Worker waits/polls for container readiness
→ Worker publishes container
→ Attempt timeline shows real Instagram result
```

Instagram must **not** bypass the Sprint 2 worker, attempt system, or status timeline.

---

## 1. Sprint 4 Name

```txt id="hcdj1y"
Sprint 4 — Instagram Account Connection and Publishing
```

Alternative internal label:

```txt id="9lwf4n"
Sprint 4 — Instagram Container Publishing Adapter
```

---

## 2. Sprint 4 Outcome

By the end of Sprint 4:

1. A workspace admin can connect or reuse Meta connection from Sprint 3.
2. The app can discover Instagram Business/Creator accounts linked to connected Facebook Pages.
3. The user can select which Instagram account belongs to the workspace.
4. Instagram appears as a real selectable target in the Scheduler target step.
5. The user can schedule an Instagram image post.
6. The user can schedule an Instagram video/Reel post.
7. The worker can create an Instagram media container.
8. The worker can wait/poll for media processing readiness.
9. The worker can publish the Instagram container.
10. The attempt timeline shows container creation, processing, publish success, retry, or failure.
11. Instagram publishing limits are checked before attempting to publish.
12. Reconnect/permission-missing states are shown clearly.

Meta’s official Instagram content publishing guide supports publishing single images, videos, Reels, and carousel posts through the Instagram platform. The official IG User Media reference confirms that apps create IG media containers for image, carousel, story, or Reel publishing.

---

## 3. In Scope

Sprint 4 includes:

```txt id="q01dpz"
Instagram Business/Creator account discovery
Linked Facebook Page → Instagram account mapping
Instagram social account persistence
Instagram target selector in Scheduler
Instagram image publishing
Instagram video/Reel publishing
Instagram media-container creation
Instagram container readiness polling
Instagram media publish step
Instagram content publishing limit check
Instagram attempt timeline integration
Instagram-specific validation
Reconnect required state
Permission missing state
Functional tests
```

---

## 4. Out of Scope

Sprint 4 must **not** implement:

```txt id="zzs89h"
Pinterest publishing
YouTube publishing
Twitter/X publishing
Instagram Stories
Instagram carousel publishing as required acceptance
Instagram comment inbox
Instagram analytics
Instagram insights dashboard
Instagram DM handling
AI caption generation
Approval workflow
Drag-and-drop calendar
Bulk recurring schedules
```

Optional stretch:

```txt id="nkq4i5"
Instagram carousel publishing
```

But do not block Sprint 4 completion on carousel support.

---

## 5. Important Platform Decision

Sprint 4 should use:

```txt id="xwts4b"
Instagram Graph API through Meta/Facebook Login
```

because Sprint 3 already implemented Meta OAuth and Facebook Page connection.

Instagram also has an Instagram Login API path, and Meta notes that the Instagram Login setup does not require a Facebook Page to be linked. However, Sprint 4 must not pivot to a second OAuth architecture. Keep the implementation connected to Sprint 3’s Meta/Facebook Login flow.

Sprint 4 account assumption:

```txt id="cl15zz"
The Instagram account must be a Professional account, Business or Creator, and linked to a Facebook Page already available through Meta.
```

Meta’s Instagram platform documentation states that the platform works with Instagram professional accounts and references Business/Creator account access. The platform documentation also states that some Instagram/Facebook API use requires an Instagram Business or Creator account linked to a Facebook Page.

---

# 6. Sprint 4 Supported Instagram Formats

## 6.1 Required Support

Required for Sprint 4 acceptance:

```txt id="e9hq7a"
Single image feed post
Single video/Reel post
```

## 6.2 Optional Stretch

```txt id="mmr6zs"
Carousel post
```

## 6.3 Not Supported in Sprint 4

```txt id="m7b6ds"
Stories
Collab posts
Shopping/product tagging
Music/audio selection
First comment automation
DM automation
Comment moderation
```

---

# 7. Permissions

Sprint 3 already requested Facebook Page permissions:

```txt id="grd6zk"
pages_show_list
pages_read_engagement
pages_manage_posts
```

Sprint 4 adds Instagram publishing permissions:

```txt id="x5odpk"
instagram_business_basic
instagram_business_content_publish
```

Recommended final Meta permission set after Sprint 4:

```txt id="px92ic"
pages_show_list
pages_read_engagement
pages_manage_posts
instagram_business_basic
instagram_business_content_publish
```

For UI copy, do not show raw permission names as the main text. Show user-friendly labels first.

Permission checklist:

```txt id="j0xbpn"
View connected Facebook Pages
Find linked Instagram professional accounts
Publish Instagram feed posts and Reels
Read Page connection details
```

Technical mapping:

```txt id="c18wtd"
View connected Facebook Pages → pages_show_list
Find linked Instagram professional accounts → instagram_business_basic
Publish Instagram content → instagram_business_content_publish
Read Page connection details → pages_read_engagement
```

---

# 8. Environment Variables

Reuse Sprint 3 Meta variables:

```txt id="dj1xpx"
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=
META_REDIRECT_URI=
META_OAUTH_STATE_SECRET=
META_APP_MODE=
```

Add Instagram-specific feature flags:

```txt id="pmfh9t"
SOCIAL_SCHEDULER_INSTAGRAM_ENABLED=true
SOCIAL_SCHEDULER_INSTAGRAM_IMAGE_ENABLED=true
SOCIAL_SCHEDULER_INSTAGRAM_REELS_ENABLED=true
SOCIAL_SCHEDULER_INSTAGRAM_CAROUSEL_ENABLED=false
SOCIAL_SCHEDULER_INSTAGRAM_STORIES_ENABLED=false
SOCIAL_SCHEDULER_INSTAGRAM_CONTAINER_POLL_LIMIT=12
SOCIAL_SCHEDULER_INSTAGRAM_CONTAINER_POLL_INTERVAL_MS=10000
```

Keep Sprint 2 worker variables:

```txt id="c06aas"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Security rule:

```txt id="cc3q6z"
No Meta or Instagram secret may be exposed to frontend.
```

---

# 9. Data Model Updates

Sprint 3 already introduced:

```txt id="t52i0t"
SocialAccount
SocialOAuthState
SocialAccountStatus
SocialAccountProvider
SocialAccountType
SocialPublishTarget.socialAccountId
SocialPublishTarget.publishMode
SocialPublishAttempt.provider
SocialPublishAttempt.socialAccountId
```

Sprint 4 extends those models for Instagram.

---

## 9.1 Extend SocialAccountType

```prisma id="o1rz5o"
enum SocialAccountType {
  FACEBOOK_PAGE
  INSTAGRAM_BUSINESS
  INSTAGRAM_CREATOR
  YOUTUBE_CHANNEL
  PINTEREST_ACCOUNT
  X_USER
}
```

---

## 9.2 Instagram SocialAccount Shape

A connected Instagram account must be saved as:

```txt id="dtrdvz"
provider = META
platform = INSTAGRAM
accountType = INSTAGRAM_BUSINESS or INSTAGRAM_CREATOR
externalAccountId = ig_user_id
externalParentId = facebook_page_id
credentialRef = Meta/Page credential reference
```

Example:

```json id="ll20x9"
{
  "provider": "META",
  "platform": "INSTAGRAM",
  "accountType": "INSTAGRAM_BUSINESS",
  "displayName": "Mantri Developers",
  "username": "mantridevelopers",
  "externalAccountId": "17841400000000000",
  "externalParentId": "123456789",
  "status": "CONNECTED",
  "scopesJson": [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "pages_show_list",
    "pages_read_engagement"
  ],
  "metadataJson": {
    "linkedFacebookPageName": "Mantri Developers",
    "accountKind": "business",
    "supportsPublishing": true
  },
  "credentialRef": "secret_ref"
}
```

---

## 9.3 New Enum — InstagramContainerStatus

```prisma id="zuv7h9"
enum InstagramContainerStatus {
  CREATED
  IN_PROGRESS
  FINISHED
  ERROR
  EXPIRED
  PUBLISHED
}
```

---

## 9.4 New Model — InstagramPublishContainer

Instagram publishing is container-based, so do not hide this completely inside a generic attempt JSON field.

Create a dedicated model:

```prisma id="iir4t9"
model InstagramPublishContainer {
  id                    String @id @default(uuid())

  workspaceId           String
  postId                String
  targetId              String
  attemptId             String?

  socialAccountId       String

  igUserId              String
  containerId           String

  mediaType             String
  status                InstagramContainerStatus @default(CREATED)

  statusCode            String?
  errorCode             String?
  errorMessage          String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  lastPolledAt          DateTime?
  publishedAt           DateTime?

  diagnosticsJson       Json?

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([containerId])
  @@index([status])
}
```

Reason:

```txt id="q4hgdl"
Instagram has a multi-step publish lifecycle.
The system needs to know whether it has created a container, is waiting for processing, or has already published it.
```

---

## 9.5 Update SocialPublishTarget

Add Instagram lifecycle fields:

```prisma id="vrjd7r"
instagramContainerId     String?
platformProcessingAt     DateTime?
platformReadyAt          DateTime?
platformPublishAttemptedAt DateTime?
```

---

## 9.6 Update SocialPublishAttempt

Add:

```prisma id="d2qski"
platformLifecycleStage String?
```

Possible values:

```txt id="ii2ebi"
CREATE_CONTAINER
POLL_CONTAINER
PUBLISH_CONTAINER
```

---

# 10. Social Accounts UX Updates

Route remains:

```txt id="o3o8tb"
/app/social-accounts
```

Sprint 3 added Meta/Facebook connection.

Sprint 4 extends the same page.

---

## 10.1 Social Accounts Page Sections

Sections:

```txt id="qsd3ro"
1. Active workspace card
2. Facebook Pages
3. Instagram Accounts
4. Connection health
```

Do not create a totally separate Instagram settings page.

---

## 10.2 Instagram Empty State

Title:

```txt id="epxncd"
No Instagram account connected
```

Body:

```txt id="9g0fh3"
Connect Meta and select a Facebook Page that has an Instagram professional account linked to it.
```

Buttons:

```txt id="v111o2"
Connect Meta
Refresh linked accounts
```

---

## 10.3 Connected Instagram Account Card

Each card shows:

```txt id="yxq21v"
Instagram username
Account type: Business or Creator
Linked Facebook Page
Status
Publishing permission
Last connected
Last validated
```

Actions:

```txt id="spqqba"
Validate
Reconnect Meta
Disconnect
```

Status badges:

```txt id="giwb63"
Connected
Permission missing
Reconnect required
Page link missing
Disconnected
```

---

## 10.4 Meta Reconnect Modal Update

Sprint 3 connect modal said:

```txt id="n5t9km"
Connect Meta for this workspace?
```

Sprint 4 version:

```txt id="xmf5cm"
Connect Meta and Instagram for this workspace?
```

Body:

```txt id="mj5zmn"
This connection lets Sakhaa Forge discover Facebook Pages and linked Instagram professional accounts for the active workspace only.
```

Checklist:

```txt id="qa6iug"
Active workspace is correct
You manage the Facebook Page
The Instagram account is Business or Creator
The Instagram account is linked to the Facebook Page
You approve publishing permissions
```

Buttons:

```txt id="d466rk"
Continue to Meta
Cancel
```

---

# 11. Instagram Discovery Flow

Sprint 4 must reuse the Meta connection from Sprint 3.

## 11.1 Discovery Flow

```txt id="c3hd8s"
1. User connects/reconnects Meta.
2. Backend fetches accessible Facebook Pages.
3. For each Page, backend checks for linked Instagram professional account.
4. Backend returns Page + Instagram account pair.
5. User selects Instagram account(s) to connect to workspace.
6. Backend stores SocialAccount rows for Instagram.
```

## 11.2 Discovery Result Shape

```json id="anfg6d"
{
  "facebookPageId": "123456789",
  "facebookPageName": "Mantri Developers",
  "instagramAccount": {
    "id": "17841400000000000",
    "username": "mantridevelopers",
    "accountType": "BUSINESS",
    "profilePictureUrl": null
  },
  "permissions": {
    "canPublish": true,
    "missing": []
  }
}
```

## 11.3 No Linked Account State

If a Facebook Page has no linked Instagram professional account:

Title:

```txt id="c0l50a"
Instagram account not linked
```

Body:

```txt id="g15oq1"
This Facebook Page does not have a linked Instagram Business or Creator account.
```

Action:

```txt id="fqto5g"
Open Meta account settings
```

Do not invent a direct fix inside Sakhaa Forge. The actual link must be fixed in Meta/Instagram settings.

---

# 12. Scheduler Target Step Updates

Route:

```txt id="uqqiq8"
/app/social-scheduler/new
```

Stage:

```txt id="vfcmxv"
Targets
```

Sprint 3 made Facebook live.

Sprint 4 makes Instagram live.

---

## 12.1 Instagram Card — Connected State

Card title:

```txt id="mq54jx"
Instagram
```

Badge:

```txt id="q8eduz"
Live connected
```

Dropdown label:

```txt id="rgifca"
Choose Instagram account
```

Dropdown option format:

```txt id="z4dj2t"
@username · Business · linked to <Facebook Page>
```

Post type selector:

```txt id="d1vdfr"
Instagram format
```

Options:

```txt id="fg4zcr"
Feed image
Reel / video
Carousel — Coming later
Story — Coming later
```

Helper text:

```txt id="or43ph"
Instagram publishing uses Meta’s media-container flow. Videos may take time to process before publishing.
```

---

## 12.2 Instagram Card — Not Connected State

Badge:

```txt id="o06625"
Not connected
```

Body:

```txt id="knj2yj"
Connect an Instagram Business or Creator account before enabling live Instagram publishing.
```

Buttons:

```txt id="pcddf9"
Connect Meta
Use mock mode
```

---

## 12.3 Instagram Validation in Target Step

Rules:

```txt id="r9nlus"
If uploaded media is image → allow Feed image.
If uploaded media is video → allow Reel / video.
If multiple media assets → carousel is blocked unless stretch flag enabled.
If no Instagram account connected → block live mode.
If permission missing → show reconnect required.
```

---

# 13. Review Step Updates

Sprint 4 review checklist for Instagram:

```txt id="l0pr9h"
Workspace selected
Media uploaded
Draft content saved
Instagram account connected
Instagram format selected
Instagram content publishing limit checked
Schedule time valid
Live Instagram publish mode enabled
```

Live confirmation checkbox:

```txt id="r2mzpp"
I understand this post will publish to the selected Instagram account.
```

Warning copy:

```txt id="wfw5ya"
Instagram videos and Reels may require processing before they appear as published.
```

If both Facebook and Instagram are selected:

```txt id="qxohgn"
This post has multiple live targets. Each platform will be processed separately and may succeed or fail independently.
```

---

# 14. Instagram Publishing Flow

Instagram is not a direct “upload and post” flow.

Officially, apps create media containers for publishing and then use the content publishing process. The official content publishing guide covers single images, videos, Reels, and carousel posts.

## 14.1 Image Feed Post Flow

```txt id="qe9lst"
1. Worker claims due Instagram target.
2. Worker creates SocialPublishAttempt with stage CREATE_CONTAINER.
3. Worker generates temporary platform-readable B2 media URL.
4. Adapter calls Instagram create media container endpoint.
5. Store container ID in InstagramPublishContainer.
6. Worker polls container status if required.
7. Worker calls media publish endpoint.
8. Store Instagram media ID / permalink if available.
9. Mark target PUBLISHED.
10. Recalculate parent post status.
11. Timeline shows success.
```

## 14.2 Reel / Video Flow

```txt id="a78vum"
1. Worker claims due Instagram target.
2. Worker creates media container with video URL and Reel/video media type.
3. Store container ID.
4. Mark target as platform processing.
5. Poll container status until ready, failed, or poll limit reached.
6. When ready, publish container.
7. If still processing, release target into RETRYING with short retry.
8. If failed, classify error.
9. Update attempt timeline.
```

## 14.3 Why Video Is Different

Video/Reel publishing may require Meta-side processing after container creation.

Therefore Sprint 4 must support:

```txt id="qojw5t"
Container created but not yet ready
Container processing
Container ready
Container failed
Container published
```

Do not mark video posts as failed just because the first worker run did not finish instantly.

---

# 15. Content Publishing Limit Check

Before publishing an Instagram target, check:

```txt id="qes3xm"
GET /{ig-user-id}/content_publishing_limit
```

The official `content_publishing_limit` reference exposes `quota_total`, currently 50, as the maximum number of IG containers the app user can publish within the quota duration.

## 15.1 Required Product Behavior

Before creating an Instagram container:

```txt id="luh3dl"
1. Fetch current publishing limit.
2. Read quota_total.
3. Read quota_usage.
4. If quota_usage >= quota_total, do not publish.
5. Mark target RETRYING or FAILED according to reset window.
6. Show clear UI reason.
```

## 15.2 UI Copy for Limit Hit

Timeline title:

```txt id="g70dzw"
Instagram publishing limit reached
```

Body:

```txt id="we1r96"
This Instagram account has reached its current content publishing limit. The target will retry later.
```

Target status:

```txt id="x5o4f3"
Retrying after Instagram limit
```

---

# 16. Instagram Adapter

Create:

```txt id="ghs20a"
MetaInstagramPublisherAdapter
```

Recommended path:

```txt id="oa90sn"
apps/api/src/social-scheduler/adapters/meta-instagram-publisher.adapter.ts
```

or `.mjs` equivalent if the current API remains `.mjs`.

---

## 16.1 Adapter Input

Reuse Sprint 2/Sprint 3 adapter input, extended for Instagram:

```ts id="jls43j"
type InstagramPublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "INSTAGRAM";
  publishMode: "LIVE_META";
  socialAccountId: string;
  igUserId: string;
  caption: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  instagramFormat: "FEED_IMAGE" | "REEL_VIDEO";
  draftContentJson: unknown;
};
```

---

## 16.2 Adapter Result

```ts id="ej7rch"
type InstagramPublishResult = {
  status:
    | "CONTAINER_CREATED"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "REAUTH_REQUIRED"
    | "LIMIT_REACHED"
    | "TIMED_OUT";

  containerId?: string;
  externalPostId?: string;
  externalPostUrl?: string;

  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;

  diagnostics?: Record<string, unknown>;
};
```

---

# 17. Worker Updates

Sprint 4 must modify Sprint 2/Sprint 3 worker routing.

## 17.1 Adapter Routing

```txt id="th1ngv"
if target.publishMode = MOCK:
  use MockSocialPublisherAdapter

if target.publishMode = LIVE_META and platform = FACEBOOK:
  use MetaFacebookPagePublisherAdapter

if target.publishMode = LIVE_META and platform = INSTAGRAM:
  use MetaInstagramPublisherAdapter

else:
  mark FAILED_PERMANENT or BLOCKED
```

---

## 17.2 Instagram Worker Lifecycle

Pseudo-flow:

```txt id="mm0yu8"
1. Claim due Instagram target.
2. Validate connected Instagram SocialAccount.
3. Check content publishing limit.
4. Create publish attempt.
5. Generate temporary B2 media URL.
6. Create Instagram media container.
7. Store InstagramPublishContainer.
8. Poll status.
9. If ready, publish container.
10. If processing, schedule retry.
11. If failed, classify error.
12. Update attempt, target, post status.
```

---

## 17.3 Polling Rule

Do not block the worker forever.

Use:

```txt id="rjjrjq"
SOCIAL_SCHEDULER_INSTAGRAM_CONTAINER_POLL_LIMIT=12
SOCIAL_SCHEDULER_INSTAGRAM_CONTAINER_POLL_INTERVAL_MS=10000
```

This gives roughly 2 minutes of polling if needed.

If still processing:

```txt id="p3i3kf"
target.status = RETRYING
target.nextRetryAt = now + 5 minutes
attempt.status = FAILED_RETRYABLE or TIMED_OUT
errorCode = INSTAGRAM_CONTAINER_PROCESSING
```

Alternative accepted implementation:

```txt id="e0w2pc"
Store container as IN_PROGRESS.
Create a follow-up worker cycle to poll and publish.
```

Preferred:

```txt id="pve685"
Follow-up worker cycle, because video processing can exceed one API request lifecycle.
```

---

# 18. State Machine Updates

Sprint 3 statuses remain, but Instagram needs platform-processing states.

## 18.1 Target Status Enum

Extend if needed:

```prisma id="ziuf91"
enum SocialSchedulerTargetStatus {
  SELECTED
  SCHEDULED
  DUE
  PROCESSING
  PLATFORM_PROCESSING
  PUBLISHED_MOCK
  PUBLISHED
  RETRYING
  REAUTH_REQUIRED
  LIMIT_REACHED
  FAILED
  SKIPPED
  CANCELLED
}
```

---

## 18.2 Attempt Status Enum

Extend:

```prisma id="h70200"
enum SocialPublishAttemptStatus {
  STARTED
  CONTAINER_CREATED
  PLATFORM_PROCESSING
  SUCCEEDED
  FAILED_RETRYABLE
  FAILED_PERMANENT
  REAUTH_REQUIRED
  LIMIT_REACHED
  TIMED_OUT
  SKIPPED
}
```

---

## 18.3 Container Status Flow

```txt id="nt54xe"
CREATED
→ IN_PROGRESS
→ FINISHED
→ PUBLISHED
```

Failure flow:

```txt id="zo3n3n"
CREATED
→ IN_PROGRESS
→ ERROR
```

Expiry flow:

```txt id="opyd6c"
CREATED
→ EXPIRED
```

---

## 18.4 Parent Post Recalculation

Update Sprint 3 logic:

```txt id="z0ldxq"
If any target PROCESSING → post PROCESSING
If any target PLATFORM_PROCESSING → post PROCESSING
If all live targets PUBLISHED → post PUBLISHED
If some live targets PUBLISHED and some PLATFORM_PROCESSING → post PROCESSING
If some live targets PUBLISHED and some RETRYING → post PARTIALLY_PUBLISHED
If any target LIMIT_REACHED and none processing → post RETRYING
If any target REAUTH_REQUIRED and none processing → post REAUTH_REQUIRED
If all targets FAILED → post FAILED
If some targets PUBLISHED and some FAILED → post PARTIALLY_FAILED
If all targets CANCELLED → post CANCELLED
```

---

# 19. Platform Validation Rules

## 19.1 Image Feed Post

Allow:

```txt id="bp29zm"
image/jpeg
image/png if converted/accepted by platform flow
```

Recommended strict MVP:

```txt id="kpd4um"
Only allow image/jpeg for live Instagram image publishing unless conversion is implemented.
```

If user uploads PNG/WebP:

```txt id="qflv7d"
Allow mock mode.
Block live Instagram mode unless image conversion pipeline exists.
```

## 19.2 Reel / Video

Allow:

```txt id="dx43y9"
video/mp4
video/quicktime only if conversion/compatibility handling exists
```

Recommended strict MVP:

```txt id="cgdwbk"
Only allow video/mp4 for live Instagram video/Reel publishing.
```

If MOV/QuickTime is uploaded:

```txt id="sk676o"
Block live Instagram mode unless transcoding/compatibility validation exists.
```

## 19.3 Caption

Required:

```txt id="ghb0gh"
Caption can be empty only if product allows media-only post.
```

Recommended:

```txt id="da9zs0"
Require caption for Sprint 4 to avoid accidental blank posts.
```

## 19.4 Media Count

Sprint 4 required modes:

```txt id="i0b8hw"
Feed image → exactly 1 image
Reel/video → exactly 1 video
```

If multiple assets:

```txt id="cmr9q4"
Show carousel coming later.
```

---

# 20. Media URL Handling

Instagram container creation requires a media URL accessible by Meta.

Worker flow:

```txt id="n7bj1g"
1. Load SocialMediaAsset.
2. Generate short-lived platform-readable B2 URL or temporary publish copy.
3. Pass URL to Instagram container creation.
4. Store only sanitized URL metadata.
5. Expire URL after use.
```

Do not store:

```txt id="a3zgad"
Signed B2 URL
B2 secret
Private object key in frontend payload
Meta token
```

Allowed diagnostics:

```json id="bboe6c"
{
  "mediaAssetId": "asset_123",
  "mimeType": "video/mp4",
  "byteSize": 18392031,
  "temporaryMediaUrlGenerated": true,
  "temporaryMediaUrlExpiresAt": "2026-09-03T06:00:00.000Z",
  "instagramFormat": "REEL_VIDEO"
}
```

---

# 21. API Contracts

## 21.1 Discover Instagram Accounts

```txt id="xrdowd"
POST /api/v0/social-accounts/meta/discover-instagram
```

Body:

```json id="lqwv07"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="otsayc"
{
  "accounts": [
    {
      "facebookPageId": "123456789",
      "facebookPageName": "Mantri Developers",
      "instagramUserId": "17841400000000000",
      "username": "mantridevelopers",
      "accountType": "BUSINESS",
      "canPublish": true,
      "missingPermissions": []
    }
  ]
}
```

---

## 21.2 Save Instagram Account

```txt id="dqqpjx"
POST /api/v0/social-accounts/meta/select-instagram
```

Body:

```json id="dw6scx"
{
  "workspaceId": "workspace_id",
  "facebookPageId": "123456789",
  "instagramUserId": "17841400000000000"
}
```

Response:

```json id="rgt6s0"
{
  "socialAccountId": "social_account_id",
  "platform": "INSTAGRAM",
  "status": "CONNECTED"
}
```

---

## 21.3 Validate Instagram Account

```txt id="eq9g60"
POST /api/v0/social-accounts/{socialAccountId}/validate-instagram
```

Body:

```json id="cl74hm"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="tf03rn"
{
  "status": "CONNECTED",
  "canPublish": true,
  "missingPermissions": [],
  "publishingLimit": {
    "quotaUsage": 12,
    "quotaTotal": 50
  }
}
```

---

## 21.4 Save Instagram Target

Update existing target endpoint:

```txt id="o44cml"
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json id="p24xcg"
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "INSTAGRAM",
      "publishMode": "LIVE_META",
      "socialAccountId": "social_account_id",
      "platformOptions": {
        "instagramFormat": "REEL_VIDEO"
      }
    }
  ]
}
```

---

## 21.5 Get Instagram Container Status

Admin/developer or internal UI only:

```txt id="mpivby"
GET /api/v0/social-scheduler/instagram/containers/{containerId}?workspaceId=workspace_id
```

Response:

```json id="hy4bz6"
{
  "containerId": "ig_container_id",
  "status": "IN_PROGRESS",
  "lastPolledAt": "2026-09-03T06:10:00.000Z",
  "errorCode": null,
  "errorMessage": null
}
```

---

# 22. Frontend Components

Add:

```txt id="jj5jxf"
InstagramAccountCard.tsx
InstagramDiscoveryPanel.tsx
InstagramPermissionChecklist.tsx
InstagramTargetSelector.tsx
InstagramFormatSelector.tsx
InstagramPublishingLimitBadge.tsx
InstagramContainerTimelineItem.tsx
InstagramProcessingBanner.tsx
```

Update:

```txt id="gh95t3"
SocialAccountsPage.tsx
PlatformTargetsStep.tsx
ReviewStep.tsx
AttemptTimeline.tsx
PlatformTargetStatusCard.tsx
SchedulerPostDetail.tsx
SchedulerPostCard.tsx
WorkerDiagnosticsPanel.tsx
```

---

# 23. UX Copy

## 23.1 Social Accounts Page

Instagram section title:

```txt id="ubc5hg"
Instagram Accounts
```

Subtitle:

```txt id="sa4kao"
Connect Instagram Business or Creator accounts linked to this workspace’s Facebook Pages.
```

Button:

```txt id="6rk3sn"
Find linked Instagram accounts
```

---

## 23.2 Instagram Connected

Badge:

```txt id="r5ezhe"
Instagram connected
```

Helper text:

```txt id="ghbhid"
This account can be used for live Instagram scheduling.
```

---

## 23.3 Permission Missing

Title:

```txt id="w7gg9u"
Instagram permission missing
```

Body:

```txt id="jck2mu"
Reconnect Meta and approve Instagram publishing permissions.
```

Button:

```txt id="hlmx67"
Reconnect Meta
```

---

## 23.4 Container Processing

Banner title:

```txt id="hxjarr"
Instagram is processing this media
```

Body:

```txt id="sa5xem"
Videos and Reels can take extra time before they are ready to publish.
```

Button:

```txt id="v4d17m"
Refresh status
```

---

## 23.5 Published

Timeline title:

```txt id="gth0ha"
Published to Instagram
```

Body:

```txt id="zmbllg"
The scheduled post was successfully published to the selected Instagram account.
```

Button:

```txt id="bibjzm"
View on Instagram
```

Only show this button if a real permalink is stored.

---

# 24. Attempt Timeline Updates

Sprint 4 timeline must show Instagram lifecycle steps clearly.

Example image post timeline:

```txt id="hlwdet"
Attempt 1 · Instagram · Live Meta
Container created
Container ready
Published to Instagram
```

Example video/Reel timeline:

```txt id="xppkau"
Attempt 1 · Instagram · Live Meta
Container created
Instagram processing media
Retry scheduled to check container readiness
```

Second worker run:

```txt id="jsgpfc"
Attempt 2 · Instagram · Live Meta
Container ready
Published to Instagram
```

Failure example:

```txt id="zviqgi"
Attempt 1 · Instagram · Live Meta
Failed: Instagram rejected the media format
```

Limit example:

```txt id="q5q420"
Attempt 1 · Instagram · Live Meta
Instagram publishing limit reached
Retry scheduled
```

---

# 25. Error Handling

## 25.1 No Linked Instagram Account

```txt id="df2bxl"
No linked Instagram professional account was found for this Facebook Page.
```

Action:

```txt id="sf2w7y"
Reconnect after linking Instagram in Meta settings
```

---

## 25.2 Missing Permission

```txt id="vluwbb"
Instagram publishing permission was not granted.
```

Action:

```txt id="u6uxo2"
Reconnect Meta
```

---

## 25.3 Publishing Limit Reached

```txt id="kx9edd"
Instagram publishing limit reached for this account.
```

Action:

```txt id="uff4i4"
Retry later
```

---

## 25.4 Container Still Processing

```txt id="vrr6e9"
Instagram is still processing the media.
```

Action:

```txt id="jmfwi4"
Check again later
```

---

## 25.5 Unsupported Media

```txt id="nyajy2"
This media is not eligible for live Instagram publishing.
```

Details examples:

```txt id="iny670"
Use a JPEG image for feed image posts.
Use an MP4 video for Reels/video posts.
```

---

## 25.6 Media URL Inaccessible

```txt id="ni7mo9"
Instagram could not access the uploaded media.
```

Action:

```txt id="al7cc5"
Retry with a new media URL
```

---

# 26. Retry Rules

Use Sprint 2 retry foundation.

## 26.1 Retryable

Retry:

```txt id="s4djvr"
Container still processing
Meta timeout
Meta 5xx
Temporary rate limit
Publishing limit hit with retry window
Temporary media fetch failure
```

## 26.2 Permanent

Fail permanently:

```txt id="nqgq8m"
Invalid media format
Missing permission
Invalid Instagram account
Unlinked Facebook Page
Unsupported post type
Container error from Meta
Caption/content rejected
```

## 26.3 Reauth

Mark reauth required:

```txt id="y5g8sv"
Expired token
Revoked token
Permission removed
Page access removed
Instagram account disconnected
```

---

# 27. Security Requirements

Sprint 4 must preserve all Sprint 3 security rules.

## 27.1 Token Safety

Never expose:

```txt id="cqh5q3"
Meta access token
Page access token
Instagram credential material
App secret
OAuth state raw secret
```

Never store tokens in:

```txt id="ojkczx"
SocialAccount plain columns
SocialPublishAttempt requestJson
SocialPublishAttempt responseJson
diagnosticsJson
frontend local state
browser storage
logs
URL query params
```

## 27.2 Workspace Isolation

Must enforce:

```txt id="xsfiqg"
Instagram account connected to Workspace A cannot be selected in Workspace B.
User without Workspace A access cannot view its Instagram accounts.
Worker validates target.workspaceId, post.workspaceId, and socialAccount.workspaceId before publishing.
```

## 27.3 Media Safety

Must enforce:

```txt id="g8upnw"
Temporary media URLs must expire.
Temporary URLs must not be shown to normal users.
Private B2 object keys must not be exposed.
Only uploaded and completed media assets can be published.
```

---

# 28. Functional Test Cases

## 28.1 Instagram Discovery

```txt id="x4f94z"
User with connected Meta account can click Find linked Instagram accounts.
```

```txt id="l0bmuk"
System returns linked Instagram account for a Facebook Page.
```

```txt id="ukh2t1"
System shows no-linked-account state when Page has no Instagram account.
```

```txt id="mldjon"
User can save selected Instagram account to active workspace.
```

```txt id="w5wlxa"
Saved Instagram account creates SocialAccount with provider META and platform INSTAGRAM.
```

---

## 28.2 Workspace Isolation

```txt id="m0572a"
Workspace A Instagram account does not appear in Workspace B target selector.
```

```txt id="luqo7j"
User without access to Workspace A cannot fetch Workspace A Instagram account.
```

```txt id="imoh4r"
Worker refuses to publish if target workspace and social account workspace do not match.
```

---

## 28.3 Target Selection

```txt id="gzfg5x"
Instagram live target appears only when account is connected.
```

```txt id="zvdb6i"
Image upload allows Feed image option.
```

```txt id="asmkvd"
Video upload allows Reel/video option.
```

```txt id="em90j4"
YouTube-style or unsupported media is blocked for Instagram.
```

```txt id="v6778l"
Carousel option is visible as Coming later unless feature flag is enabled.
```

---

## 28.4 Worker Image Publish

```txt id="bz40iw"
Create scheduled Instagram image post.
Run worker after scheduledAt.
Verify:
- target claimed
- attempt created
- content publishing limit checked
- container created
- media published
- target marked PUBLISHED
- parent post status recalculated
```

---

## 28.5 Worker Video/Reel Publish

```txt id="m85hnr"
Create scheduled Instagram MP4 video post.
Run worker.
Verify:
- container created
- container status stored
- processing state handled
- final publish occurs after readiness
```

---

## 28.6 Limit Handling

```txt id="wlx7h9"
Mock/stub content_publishing_limit where quota_usage >= quota_total.
Run worker.
Verify:
- no container is created
- target marked LIMIT_REACHED or RETRYING
- attempt timeline shows limit reason
```

---

## 28.7 Error Handling

```txt id="hjotzt"
Simulate expired token.
Verify:
- SocialAccount becomes REAUTH_REQUIRED
- target becomes REAUTH_REQUIRED
- timeline shows reconnect required
```

```txt id="isafvu"
Simulate unsupported media format.
Verify:
- target becomes FAILED
- attempt status FAILED_PERMANENT
- UI shows unsupported media message
```

```txt id="zmzh5f"
Simulate container still processing.
Verify:
- target becomes PLATFORM_PROCESSING or RETRYING
- nextRetryAt is set
- parent post remains PROCESSING/RETRYING
```

---

## 28.8 Security

```txt id="v7ra39"
No Meta token is returned to frontend.
```

```txt id="qpz8zs"
No signed B2 URL is stored in Draft Composer JSONB.
```

```txt id="i9dzs2"
No signed B2 URL is visible in normal attempt timeline.
```

```txt id="uvo0ta"
Attempt diagnostics are sanitized.
```

---

# 29. Acceptance Criteria

Sprint 4 is complete when:

## Account Connection

```txt id="x9zdbd"
System can discover Instagram professional accounts linked to connected Facebook Pages.
User can save an Instagram account to the active workspace.
Instagram SocialAccount is stored with provider META and platform INSTAGRAM.
Instagram account appears on Social Accounts page.
```

## Scheduler UX

```txt id="u083wz"
Instagram appears as live connected in Target step.
User can choose Instagram account.
User can choose Feed image or Reel/video based on uploaded media.
Review step warns about live Instagram publishing.
Review step requires confirmation before scheduling live Instagram target.
```

## Worker + Publishing

```txt id="ehrl33"
Sprint 2 worker processes due Instagram targets.
Worker checks Instagram publishing limit before container creation.
Worker creates Instagram media container.
Worker handles container processing.
Worker publishes ready container.
Worker updates attempt timeline.
Worker marks target PUBLISHED, RETRYING, FAILED, LIMIT_REACHED, or REAUTH_REQUIRED correctly.
```

## Security

```txt id="hlua16"
No token leakage.
No cross-workspace account access.
No permanent public B2 URL exposure.
No raw signed URL stored in JSONB.
Worker validates workspace/account/target before publishing.
```

## Data

```txt id="p9rjj4"
InstagramPublishContainer records exist.
Container ID is stored.
Container status is tracked.
Attempt lifecycle stage is tracked.
External Instagram post ID/permalink is stored when available.
```

---

# 30. Sprint 4 Deliverables

## Frontend

```txt id="as79no"
Instagram section on Social Accounts page
Instagram discovery panel
Instagram connected account cards
Instagram target selector
Instagram format selector
Instagram live publish warning
Instagram publishing limit badge
Instagram processing banner
Instagram lifecycle timeline items
Updated scheduler post cards
Updated post detail page
```

## Backend

```txt id="ngysl8"
Discover linked Instagram accounts endpoint
Save Instagram account endpoint
Validate Instagram account endpoint
MetaInstagramPublisherAdapter
Instagram content publishing limit check
Instagram container creation logic
Instagram container polling logic
Instagram container publish logic
Worker routing update
Status recalculation update
Error classification update
```

## Database

```txt id="xau3wa"
SocialAccountType INSTAGRAM_BUSINESS
SocialAccountType INSTAGRAM_CREATOR
InstagramPublishContainer model
InstagramContainerStatus enum
SocialPublishTarget Instagram lifecycle fields
SocialPublishAttempt platformLifecycleStage field
Updated target/attempt/post statuses
```

## Tests

```txt id="nr7onr"
Instagram discovery tests
Workspace isolation tests
Target selector tests
Image publish tests
Video/Reel publish tests
Container processing tests
Publishing limit tests
Reauth tests
Unsupported media tests
Token non-leakage tests
Attempt timeline tests
```

---

# 31. Sprint 4 Final Implementation Summary

Build this in Sprint 4:

```txt id="dgjovu"
Meta/Facebook Page connection from Sprint 3
→ Discover linked Instagram professional account
→ Save Instagram SocialAccount to workspace
→ Select Instagram in Scheduler Target step
→ Validate media and format
→ Check Instagram publishing limit
→ Worker creates media container
→ Worker waits/polls for container readiness
→ Worker publishes container
→ Attempt timeline shows every lifecycle state
```

Do not build Pinterest yet.

Do not build YouTube yet.

Do not build Twitter/X yet.

Do not bypass the Sprint 2 worker.

Do not duplicate Sprint 3 OAuth architecture.

Sprint 4’s job is to make Instagram publishing reliable through the same account, worker, attempt, retry, and status framework already established in Sprints 1–3.

After Sprint 4, the next logical sprint is:

```txt id="fv5gra"
Sprint 5 — Pinterest Account Wiring and Pinterest Image Pin Publishing
```