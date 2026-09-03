# Sakhaa Forge Social Scheduler — Sprint 5 Documentation  
## Sprint 5: Pinterest Account Wiring, Board Discovery, and Image Pin Publishing

## 0. Sprint Intent

Sprint 5 continues directly from Sprints 1–4.

Sprint 1 created:

```txt id="ucj5je"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="jxkr2a"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="g2tw80"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped Facebook Page accounts
→ Real Facebook Page publishing
```

Sprint 4 created:

```txt id="rf4qed"
Instagram account discovery
→ Instagram target selection
→ Instagram media-container publishing
→ Instagram lifecycle tracking
```

Sprint 5 now adds Pinterest as the next real publishing platform:

```txt id="in35xf"
Pinterest OAuth
→ Pinterest account connection
→ Board discovery
→ Optional board section discovery
→ Workspace-scoped Pinterest account
→ Select Pinterest board in Scheduler
→ Worker publishes image Pin
→ Attempt timeline shows real Pinterest result
```

Pinterest is a strong fit for Sakhaa Forge because Pinterest supports image and video Pins, and Pins are saved on boards or board subsections.

Sprint 5 must **not bypass Sprint 2’s worker, attempt, retry, and status system**.

---

## 1. Sprint 5 Name

```txt id="yo42zi"
Sprint 5 — Pinterest Account Wiring and Image Pin Publishing
```

Alternative internal label:

```txt id="x5ldkb"
Sprint 5 — Pinterest Board-Based Publishing Adapter
```

---

## 2. Sprint 5 Outcome

By the end of Sprint 5:

1. A workspace admin can connect Pinterest.
2. The app can request the correct Pinterest OAuth scopes.
3. The app can store Pinterest credentials securely.
4. The app can discover the connected Pinterest user/account.
5. The app can list boards available to the connected Pinterest account.
6. The app can optionally list board sections.
7. The user can connect a Pinterest account to one workspace.
8. Pinterest appears as a live selectable platform in the Scheduler target step.
9. The user can select a board for an image Pin.
10. The user can add Pinterest-specific title, description, and destination link.
11. The Sprint 2 worker can process due Pinterest targets.
12. The worker can publish an image Pin.
13. Attempt timeline shows real Pinterest result.
14. Rate-limit handling is stored and shown.
15. Reconnect/permission-missing states are handled clearly.

---

## 3. In Scope

Sprint 5 includes:

```txt id="iupgr3"
Pinterest developer app configuration documentation
Pinterest OAuth start/callback flow
OAuth state/CSRF protection
Pinterest token storage through credentialRef
Pinterest account discovery
Pinterest board discovery
Pinterest board section discovery as optional but recommended
Pinterest SocialAccount persistence
Pinterest board selector in Scheduler target step
Pinterest-specific composer fields
Pinterest image Pin publishing
Pinterest rate-limit handling
Pinterest attempt timeline integration
Pinterest reconnect/disconnect states
Workspace isolation
Functional tests
```

---

## 4. Out of Scope

Sprint 5 must **not** implement:

```txt id="tdzuiw"
Pinterest video Pin publishing as required acceptance
Pinterest board creation as required acceptance
Pinterest board section creation as required acceptance
Pinterest analytics
Pinterest ad account integration
Pinterest product tagging
Pinterest catalog Pins
Pinterest trends research
YouTube publishing
Twitter/X publishing
Bulk calendar scheduling
Drag-and-drop calendar
AI caption generation
Social inbox
Comment moderation
Approval workflow
```

Optional stretch only:

```txt id="qa8s6m"
Pinterest video Pin foundation fields
```

Do not block Sprint 5 completion on video Pins.

---

## 5. Platform Reality and Product Decision

Pinterest’s official docs state:

```txt id="xbq7ha"
Pins are saved on boards.
Boards may have subsections.
Pins can be saved on a board or board subsection.
Pinterest supports image and video Pins.
```



Therefore Pinterest cannot be treated exactly like Facebook/Instagram.

Pinterest scheduler UX must include:

```txt id="jqs3b0"
Pinterest account
Pinterest board
Optional board section
Pin title
Pin description
Destination link
Image media
```

Product decision for Sprint 5:

```txt id="ra38zk"
Build image Pin publishing first.
Keep video Pin publishing for Sprint 6 or later.
```

Reason:

```txt id="fh41dx"
Image Pins are the fastest stable path.
Video Pins need more processing/upload lifecycle handling, similar to Instagram container complexity.
```

---

# 6. Pinterest Access Tier Reality

Pinterest has Trial and Standard access tiers.

Pinterest recommends Standard access when offering Pinterest capabilities to users, while Trial access is better for exploring API features. Trial-created Pins and Boards are visible only to their creator as sandbox entities.

Sprint 5 must support these modes:

```txt id="e66ksk"
PINTEREST_ACCESS_TIER=trial
PINTEREST_ACCESS_TIER=standard
```

## 6.1 Trial Mode Behavior

Trial mode:

```txt id="smfauz"
Can be used for internal testing.
Created Pins may only be visible as sandbox/test entities.
Do not claim production publishing is fully live for clients.
```

UI badge:

```txt id="yt4t98"
Trial mode
```

Tooltip:

```txt id="mbj6fj"
Pinterest Trial access is for testing. Pins may be sandbox-visible only.
```

## 6.2 Standard Mode Behavior

Standard mode:

```txt id="gre7qw"
Required for real client-facing production publishing.
```

Pinterest’s access-tier docs say Standard approval requires Trial approval first, compliance with developer guidelines, and a video recording showing the app completing an API action and using OAuth appropriately.

UI badge:

```txt id="xhrkpn"
Standard access
```

Tooltip:

```txt id="ikjt3u"
This Pinterest app is configured for production user-facing publishing.
```

---

# 7. Pinterest Rate Limits

Pinterest exposes universal and category-based rate limits.

Universal limits:

```txt id="aqat7h"
Trial access: 1,000 requests/day for all API requests
Standard access: 100 requests/second per user per app
```



Pinterest’s `org_write` category covers creating, editing, or deleting boards, board sections, or Pins. Its limits are:

```txt id="kn12dn"
Trial access: 300 requests/day per app
Standard access: 100 requests/minute per user per app
```



## 7.1 Sprint 5 Product Throttles

Do not use the full theoretical provider limit as the app limit.

Recommended product caps:

```txt id="odwnox"
Trial mode:
- Max 250 Pinterest write operations/day/app

Standard mode:
- Max 60 Pinterest write operations/minute/user/app
- Max 300 Pinterest Pins/day/account as a product safety cap
```

## 7.2 Rate-Limit Headers

Pinterest documents response headers such as:

```txt id="aum8un"
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
```



Store sanitized rate-limit diagnostics on attempts:

```json id="h1grty"
{
  "rateLimit": {
    "limit": "100",
    "remaining": "94",
    "reset": "60",
    "provider": "pinterest"
  }
}
```

---

# 8. OAuth and Scopes

Pinterest’s authentication docs state that Authorization Code grant is intended for web apps accessing a user’s data on behalf of that user, and that the user explicitly approves requested scopes.

Sprint 5 must use:

```txt id="zopjiw"
OAuth 2.0 Authorization Code flow
```

Do not use client credentials for client account publishing.

Pinterest’s docs also recommend requesting the minimum number of scopes needed.

## 8.1 Required Sprint 5 Scopes

For Sprint 5 image Pin publishing to existing boards:

```txt id="qf0tjq"
user_accounts:read
boards:read
pins:read
pins:write
```

Why:

```txt id="u0lfuw"
user_accounts:read → identify connected account
boards:read → list boards and board IDs
pins:read → fetch created Pin status/details
pins:write → create public Pins
```

Pinterest’s create/manage docs list relevant scopes for boards and Pins as `boards:read`, `boards:write`, `pins:read`, and `pins:write`.

## 8.2 Optional Later Scope

```txt id="e0x466"
boards:write
```

Use only when the app creates boards or board sections.

Sprint 5 should not request `boards:write` unless board creation is explicitly implemented.

---

# 9. Token Handling

Pinterest’s current authentication docs say continuous refresh tokens have a 60-day expiration and can be refreshed indefinitely, but must be refreshed before expiry to keep access uninterrupted.

Sprint 5 must store token metadata:

```txt id="bjbqv3"
accessTokenExpiresAt
refreshTokenExpiresAt
lastRefreshedAt
credentialRef
scopesJson
```

## 9.1 Never Store Tokens Plainly

Do not store raw tokens in:

```txt id="whrk8u"
SocialAccount
SocialPublishAttempt
requestJson
responseJson
diagnosticsJson
frontend state
browser localStorage
logs
URL query params
```

Store token material through:

```txt id="vzczrm"
credentialRef
```

---

# 10. Environment Variables

Add:

```txt id="ezv1ca"
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_REDIRECT_URI=
PINTEREST_OAUTH_STATE_SECRET=
PINTEREST_ACCESS_TIER=trial
PINTEREST_API_BASE_URL=https://api.pinterest.com/v5
PINTEREST_CONNECT_ENABLED=true
```

Feature flags:

```txt id="h196x0"
SOCIAL_SCHEDULER_PINTEREST_ENABLED=true
SOCIAL_SCHEDULER_PINTEREST_IMAGE_PINS_ENABLED=true
SOCIAL_SCHEDULER_PINTEREST_VIDEO_PINS_ENABLED=false
SOCIAL_SCHEDULER_PINTEREST_BOARD_CREATE_ENABLED=false
SOCIAL_SCHEDULER_PINTEREST_SECTION_CREATE_ENABLED=false
```

Keep prior worker variables:

```txt id="zk6dfa"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Security rule:

```txt id="m8srwd"
No PINTEREST_* secret may be exposed to frontend.
```

Allowed public flag only:

```txt id="blfj89"
NEXT_PUBLIC_PINTEREST_CONNECT_ENABLED=true
```

---

# 11. Data Model Updates

Sprint 3 introduced the common social account system.

Sprint 5 reuses it.

---

## 11.1 Extend SocialAccountProvider

If not already present:

```prisma id="dyn15h"
enum SocialAccountProvider {
  META
  GOOGLE
  PINTEREST
  X
}
```

---

## 11.2 Extend SocialAccountType

If not already present:

```prisma id="oj8tyj"
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

## 11.3 Pinterest SocialAccount Shape

Save connected Pinterest account as:

```txt id="v9qpsz"
provider = PINTEREST
platform = PINTEREST
accountType = PINTEREST_ACCOUNT
externalAccountId = pinterest_user_account_id
credentialRef = secure token reference
```

Example:

```json id="doq5gb"
{
  "provider": "PINTEREST",
  "platform": "PINTEREST",
  "accountType": "PINTEREST_ACCOUNT",
  "displayName": "Mantri Developers",
  "username": "mantridevelopers",
  "externalAccountId": "pinterest_user_123",
  "status": "CONNECTED",
  "scopesJson": [
    "user_accounts:read",
    "boards:read",
    "pins:read",
    "pins:write"
  ],
  "metadataJson": {
    "accessTier": "trial",
    "boardCount": 12,
    "supportsImagePins": true,
    "supportsVideoPins": false
  },
  "credentialRef": "secret_ref"
}
```

---

## 11.4 New Model — PinterestBoard

Create local cached board records.

```prisma id="ustvoy"
model PinterestBoard {
  id                    String @id @default(uuid())

  workspaceId           String
  socialAccountId       String

  externalBoardId       String
  name                  String
  description           String?
  privacy               String?
  url                   String?

  sectionCount          Int?
  metadataJson          Json?

  lastSyncedAt          DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  socialAccount         SocialAccount @relation(fields: [socialAccountId], references: [id])

  @@unique([workspaceId, socialAccountId, externalBoardId])
  @@index([workspaceId, socialAccountId])
}
```

---

## 11.5 New Model — PinterestBoardSection

Optional but recommended.

```prisma id="qzl82j"
model PinterestBoardSection {
  id                    String @id @default(uuid())

  workspaceId           String
  socialAccountId       String
  pinterestBoardId      String

  externalSectionId     String
  name                  String

  metadataJson          Json?

  lastSyncedAt          DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  board                 PinterestBoard @relation(fields: [pinterestBoardId], references: [id])

  @@unique([workspaceId, pinterestBoardId, externalSectionId])
  @@index([workspaceId, socialAccountId])
}
```

---

## 11.6 Update SocialPublishTarget

Add Pinterest fields:

```prisma id="pv180o"
pinterestBoardId          String?
pinterestBoardSectionId   String?
platformOptionsJson       Json?
```

Example `platformOptionsJson`:

```json id="uc40ep"
{
  "pinterest": {
    "pinType": "IMAGE",
    "title": "Luxury apartment inspiration",
    "description": "A premium walkthrough of the newest project highlights.",
    "destinationLink": "https://example.com/project",
    "boardId": "local_board_id",
    "boardSectionId": null
  }
}
```

---

## 11.7 Update SocialPublishAttempt

Add provider fields if not already present from Sprint 3:

```prisma id="jah550"
provider              SocialAccountProvider?
socialAccountId       String?
providerRequestId     String?
providerErrorCode     String?
providerTraceId       String?
```

Pinterest-specific diagnostics can stay in sanitized JSON.

---

# 12. Social Accounts UX Updates

Route remains:

```txt id="vf3drm"
/app/social-accounts
```

Sprint 5 adds a Pinterest section below Meta/Facebook/Instagram.

---

## 12.1 Pinterest Section

Title:

```txt id="l14foz"
Pinterest Accounts
```

Subtitle:

```txt id="fxlbop"
Connect Pinterest to publish image Pins to selected boards for this workspace.
```

Primary button:

```txt id="i0l9ci"
Connect Pinterest
```

Secondary button:

```txt id="x15gzb"
Refresh boards
```

---

## 12.2 Empty State

Title:

```txt id="b2n7h9"
No Pinterest account connected
```

Body:

```txt id="ypv065"
Connect a Pinterest account before scheduling image Pins for this workspace.
```

Button:

```txt id="vlu1tk"
Connect Pinterest
```

---

## 12.3 Connect Pinterest Modal

Title:

```txt id="b53stn"
Connect Pinterest for this workspace?
```

Body:

```txt id="00myw0"
You are connecting Pinterest only for the active workspace. Other client workspaces will not get access to this Pinterest account or its boards.
```

Checklist:

```txt id="snn82b"
Active workspace is correct
You have permission to publish Pins for this client
You understand Pins will be saved to selected boards
You approve Pinterest publishing permissions
```

Buttons:

```txt id="cr5odj"
Continue to Pinterest
Cancel
```

Primary button disabled until all checklist items are checked.

---

## 12.4 Connected Pinterest Account Card

Each card shows:

```txt id="vbicvv"
Pinterest display name
Username
Access tier: Trial or Standard
Connected workspace
Connected by
Last connected
Last token refresh
Board count
Status
```

Actions:

```txt id="yfl014"
Validate
Refresh boards
Reconnect
Disconnect
```

Status badges:

```txt id="epjhbj"
Connected
Trial mode
Standard access
Permission missing
Reconnect required
Rate limited
Disconnected
```

---

# 13. Pinterest Board Discovery UX

After Pinterest OAuth success, show board selection/sync.

## 13.1 Board Discovery Page or Modal

Recommended route:

```txt id="m1950n"
/app/social-accounts/pinterest/boards
```

or modal inside:

```txt id="dkshn1"
/app/social-accounts
```

Title:

```txt id="lw1ak4"
Sync Pinterest boards
```

Description:

```txt id="gw0p5v"
Choose which Pinterest boards should be available for this workspace’s scheduled Pins.
```

Board card fields:

```txt id="xoxhmn"
Board name
Privacy
Description if available
Section count
Checkbox
```

Buttons:

```txt id="l8m72j"
Save selected boards
Refresh from Pinterest
Cancel
```

Sprint 5 default:

```txt id="zc2jpp"
Save all public boards returned by Pinterest unless user deselects them.
```

Do not expose boards from another workspace.

---

# 14. Scheduler Target Step Updates

Route:

```txt id="yir3cq"
/app/social-scheduler/new
```

Stage:

```txt id="m12n32"
Targets
```

Sprint 5 makes Pinterest live.

---

## 14.1 Pinterest Card — Connected State

Card title:

```txt id="rvmjpl"
Pinterest
```

Badge:

```txt id="kkeue8"
Live connected
```

Account dropdown:

```txt id="nfcx67"
Choose Pinterest account
```

Board dropdown:

```txt id="p8z3pc"
Choose board
```

Optional section dropdown:

```txt id="phlmy5"
Choose board section
```

Placeholder:

```txt id="o2o8sd"
No section
```

Pin type selector:

```txt id="fi4f8s"
Pin type
```

Options:

```txt id="l8e9ln"
Image Pin
Video Pin — Coming later
```

Helper text:

```txt id="xhk34n"
Pinterest Pins must be saved to a board. Add a destination link if this Pin should drive traffic.
```

---

## 14.2 Pinterest Card — Not Connected State

Badge:

```txt id="wjokd9"
Not connected
```

Body:

```txt id="ars1a6"
Connect Pinterest before enabling live Pin publishing.
```

Buttons:

```txt id="bl3tlp"
Connect Pinterest
Use mock mode
```

---

## 14.3 Pinterest Validation in Target Step

Rules:

```txt id="uj67dv"
If uploaded media is image → allow Image Pin.
If uploaded media is video → block live mode in Sprint 5 and show Video Pin coming later.
If no Pinterest account connected → block live mode.
If no board selected → block Continue.
If token invalid → show Reconnect required.
If access tier is Trial → show Trial mode warning.
```

---

# 15. Pinterest-Specific Composer Fields

Pinterest needs more than a generic caption.

Add platform override fields in the Compose or Targets step.

Preferred UX:

```txt id="ddmde7"
Common caption remains in Compose.
Pinterest-specific fields appear after Pinterest target is selected.
```

## 15.1 Required Fields

```txt id="d5y45i"
Pin title
Pin description
Board
```

## 15.2 Optional Field

```txt id="latrn9"
Destination link
```

## 15.3 UI Copy

Pin title label:

```txt id="cb9t64"
Pin title
```

Placeholder:

```txt id="bjhxfd"
Example: Premium 3BHK walkthrough in Bangalore
```

Pin description label:

```txt id="tsp4u6"
Pin description
```

Placeholder:

```txt id="txws21"
Describe what people will discover when they open this Pin.
```

Destination link label:

```txt id="g87o9e"
Destination link
```

Placeholder:

```txt id="m7odea"
https://example.com/project
```

Helper text:

```txt id="act0qr"
Use a client-approved landing page if this Pin should drive enquiries.
```

---

# 16. Review Step Updates

Sprint 5 Pinterest checklist:

```txt id="qv44ce"
Workspace selected
Media uploaded
Draft content saved
Pinterest account connected
Pinterest board selected
Pin title added
Pin description added
Schedule time valid
Live Pinterest publish mode enabled
```

Live confirmation checkbox:

```txt id="w3rdz3"
I understand this post will publish as a Pinterest Pin on the selected board.
```

Trial warning if applicable:

```txt id="nm2r2h"
Pinterest is currently in Trial mode. Created Pins may be visible only as sandbox/test entities.
```

Multi-target warning if Facebook/Instagram/Pinterest are selected together:

```txt id="d80xq7"
This post has multiple live targets. Each platform will publish independently and may succeed or fail separately.
```

---

# 17. Pinterest Publishing Flow

Pinterest image Pin publishing must use the Sprint 2 worker.

## 17.1 Image Pin Flow

```txt id="kves89"
1. User schedules post with Pinterest live target.
2. Target stores socialAccountId, boardId, optional boardSectionId, and platformOptionsJson.
3. Worker detects due Pinterest target.
4. Worker claims target safely.
5. Worker creates SocialPublishAttempt.
6. Worker validates Pinterest SocialAccount and credentialRef.
7. Worker validates uploaded media is eligible image.
8. Worker generates temporary platform-readable B2 media URL.
9. Worker calls Pinterest Create Pin endpoint.
10. Worker stores returned external Pin ID.
11. Worker stores Pin URL if available.
12. Worker updates target to PUBLISHED.
13. Worker recalculates parent post status.
14. Attempt timeline shows Pinterest result.
```

Pinterest’s docs list `POST Create Pin` as the endpoint for creating image or video Pins.

---

## 17.2 Pinterest Payload Requirements

For image Pin:

```json id="qjh8hw"
{
  "board_id": "external_board_id",
  "board_section_id": "external_section_id_optional",
  "title": "Luxury apartment inspiration",
  "description": "A premium walkthrough of the newest project highlights.",
  "link": "https://example.com/project",
  "media_source": {
    "source_type": "image_url",
    "url": "temporary_b2_media_url"
  }
}
```

Do not store `temporary_b2_media_url` in database after publish.

---

## 17.3 Video Pin Foundation

Pinterest supports video Pins, and its docs note video Pins may require additional processing time after creation.

Sprint 5 must only prepare the future foundation:

```txt id="vnfvtn"
SOCIAL_SCHEDULER_PINTEREST_VIDEO_PINS_ENABLED=false
```

UI copy:

```txt id="lv16vb"
Video Pins are coming in a later sprint.
```

Do not implement video upload lifecycle yet unless explicitly made a stretch task.

---

# 18. Pinterest Adapter

Create:

```txt id="qp9vrv"
PinterestPublisherAdapter
```

Recommended path:

```txt id="sr77lo"
apps/api/src/social-scheduler/adapters/pinterest-publisher.adapter.ts
```

or `.mjs` equivalent if the current API uses `.mjs`.

---

## 18.1 Adapter Input

```ts id="g3x23v"
type PinterestPublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "PINTEREST";
  publishMode: "LIVE_PINTEREST";
  socialAccountId: string;
  pinterestAccountId: string;
  boardId: string;
  boardSectionId?: string | null;
  title: string;
  description: string;
  destinationLink?: string | null;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  draftContentJson: unknown;
  platformOptionsJson: unknown;
};
```

---

## 18.2 Adapter Result

```ts id="ijau0n"
type PinterestPublishResult = {
  status:
    | "SUCCEEDED"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "REAUTH_REQUIRED"
    | "RATE_LIMITED"
    | "TIMED_OUT";

  externalPostId?: string;
  externalPostUrl?: string;

  providerRequestId?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;

  diagnostics?: Record<string, unknown>;
};
```

---

# 19. Worker Updates

Sprint 5 updates the Sprint 2/3/4 worker routing.

## 19.1 Adapter Routing

```txt id="f28fl8"
if target.publishMode = MOCK:
  use MockSocialPublisherAdapter

if target.publishMode = LIVE_META and platform = FACEBOOK:
  use MetaFacebookPagePublisherAdapter

if target.publishMode = LIVE_META and platform = INSTAGRAM:
  use MetaInstagramPublisherAdapter

if target.publishMode = LIVE_PINTEREST and platform = PINTEREST:
  use PinterestPublisherAdapter

else:
  mark FAILED_PERMANENT or BLOCKED
```

---

## 19.2 Pinterest Worker Lifecycle

```txt id="o4quh3"
1. Claim due Pinterest target.
2. Validate target belongs to workspace.
3. Validate post belongs to workspace.
4. Validate SocialAccount belongs to workspace.
5. Validate SocialAccount status is CONNECTED.
6. Refresh Pinterest access token if needed.
7. Validate board belongs to same workspace/account.
8. Validate image media.
9. Create SocialPublishAttempt.
10. Generate temporary B2 media URL.
11. Call Pinterest Create Pin.
12. Store sanitized response.
13. Update target/post status.
14. Store rate-limit metadata.
```

---

# 20. State Machine Updates

Sprint 5 can reuse the existing statuses.

## 20.1 Target Statuses

Ensure these exist:

```prisma id="x7x1s3"
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

## 20.2 Attempt Statuses

Ensure these exist:

```prisma id="a9oimc"
enum SocialPublishAttemptStatus {
  STARTED
  CONTAINER_CREATED
  PLATFORM_PROCESSING
  SUCCEEDED
  FAILED_RETRYABLE
  FAILED_PERMANENT
  REAUTH_REQUIRED
  RATE_LIMITED
  LIMIT_REACHED
  TIMED_OUT
  SKIPPED
}
```

## 20.3 Pinterest Status Mapping

```txt id="ktsqu3"
Pinterest success → target PUBLISHED, attempt SUCCEEDED
Pinterest 401/invalid token → target REAUTH_REQUIRED, attempt REAUTH_REQUIRED
Pinterest missing scope → target REAUTH_REQUIRED or FAILED, attempt FAILED_PERMANENT
Pinterest 429/rate limit → target RETRYING, attempt RATE_LIMITED
Pinterest 5xx → target RETRYING, attempt FAILED_RETRYABLE
Pinterest invalid board/media → target FAILED, attempt FAILED_PERMANENT
Timeout before response → target RETRYING, attempt TIMED_OUT
```

---

# 21. Parent Post Recalculation

Use the existing multi-target recalculation from Sprint 4.

Add Pinterest without special treatment:

```txt id="xfe7au"
If any target PROCESSING → post PROCESSING
If any target PLATFORM_PROCESSING → post PROCESSING
If all live targets PUBLISHED → post PUBLISHED
If some live targets PUBLISHED and some RETRYING → post PARTIALLY_PUBLISHED
If some live targets PUBLISHED and some FAILED → post PARTIALLY_FAILED
If any target REAUTH_REQUIRED and none processing → post REAUTH_REQUIRED
If any target LIMIT_REACHED/RATE_LIMITED and none processing → post RETRYING
If all targets FAILED → post FAILED
If all targets CANCELLED → post CANCELLED
```

---

# 22. Media Validation Rules

Sprint 5 live Pinterest publishing supports image Pins only.

## 22.1 Allowed Image Types

Recommended:

```txt id="uwu6lo"
image/jpeg
image/png
```

Optional if tested:

```txt id="l0pb3e"
image/webp
```

Strict MVP recommendation:

```txt id="swpm44"
Allow JPEG and PNG for live Pinterest image Pins.
Keep WebP mock-only unless confirmed in integration testing.
```

## 22.2 Blocked in Sprint 5

```txt id="ov0aof"
video/mp4
video/quicktime
multiple-media carousel
PDF
GIF unless explicitly supported later
```

## 22.3 Error Copy

Unsupported media:

```txt id="lzeg6z"
This media is not eligible for live Pinterest image Pin publishing.
```

Detail:

```txt id="d44ie4"
Use a JPEG or PNG image for Sprint 5 Pinterest publishing.
```

---

# 23. Media URL Handling

Pinterest image Pin publishing requires a media source URL.

Worker flow:

```txt id="nhk8db"
1. Load uploaded SocialMediaAsset.
2. Generate a short-lived platform-readable B2 URL.
3. Send URL to Pinterest as image_url media source.
4. Store only sanitized diagnostics.
5. Do not store temporary signed URL.
```

Never store:

```txt id="lrhbwl"
Signed B2 URL
B2 secret
Private object key in frontend response
Pinterest access token
Pinterest refresh token
```

Allowed diagnostics:

```json id="qstp5f"
{
  "mediaAssetId": "asset_123",
  "mimeType": "image/jpeg",
  "byteSize": 824122,
  "temporaryMediaUrlGenerated": true,
  "temporaryMediaUrlExpiresAt": "2026-09-03T12:10:00.000Z",
  "pinType": "IMAGE"
}
```

---

# 24. API Contracts

## 24.1 Start Pinterest OAuth

```txt id="xd0ze3"
POST /api/v0/social-accounts/pinterest/connect/start
```

Body:

```json id="csslqa"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Response:

```json id="atke7h"
{
  "redirectUrl": "https://pinterest-oauth-url"
}
```

Backend responsibilities:

```txt id="llwhjf"
Validate authenticated user
Validate workspace permission
Create hashed OAuth state
Bind state to workspaceId and userId
Build Pinterest OAuth URL
Return redirect URL
```

---

## 24.2 Pinterest OAuth Callback

```txt id="gx1l3c"
GET /api/v0/social-accounts/pinterest/callback?code=...&state=...
```

Backend responsibilities:

```txt id="v4a206"
Validate OAuth state
Reject expired/reused state
Exchange code for token
Store token securely
Fetch connected Pinterest user account
Create or update SocialAccount
Redirect to Social Accounts page
```

Redirect:

```txt id="te9dbj"
/app/social-accounts?provider=pinterest&connected=true
```

Do not put tokens in query params.

---

## 24.3 List Pinterest Boards

```txt id="uymetb"
GET /api/v0/social-accounts/{socialAccountId}/pinterest/boards?workspaceId=workspace_id
```

Response:

```json id="jxt7vi"
{
  "boards": [
    {
      "id": "local_board_id",
      "externalBoardId": "123456789",
      "name": "Luxury Homes",
      "privacy": "PUBLIC",
      "sectionCount": 2,
      "lastSyncedAt": "2026-09-03T12:00:00.000Z"
    }
  ]
}
```

---

## 24.4 Refresh Pinterest Boards

```txt id="u8lxnt"
POST /api/v0/social-accounts/{socialAccountId}/pinterest/boards/refresh
```

Body:

```json id="8f8xpy"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="3azcfb"
{
  "syncedBoards": 12,
  "syncedSections": 4
}
```

---

## 24.5 Save Pinterest Target

Update existing endpoint:

```txt id="es57xk"
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json id="k0eask"
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "PINTEREST",
      "publishMode": "LIVE_PINTEREST",
      "socialAccountId": "social_account_id",
      "platformOptions": {
        "pinType": "IMAGE",
        "title": "Luxury apartment inspiration",
        "description": "A premium walkthrough of the newest project highlights.",
        "destinationLink": "https://example.com/project",
        "boardId": "local_board_id",
        "boardSectionId": null
      }
    }
  ]
}
```

Validation:

```txt id="fp8jle"
socialAccountId must belong to workspace
boardId must belong to socialAccountId
boardSectionId must belong to boardId if provided
media must be valid image
title must exist
description must exist
```

---

## 24.6 Get Pinterest Publish Diagnostics

Admin/developer only.

```txt id="wxdh1v"
GET /api/v0/social-scheduler/pinterest/attempts/{attemptId}?workspaceId=workspace_id
```

Response:

```json id="vfw760"
{
  "attemptId": "attempt_id",
  "provider": "PINTEREST",
  "status": "SUCCEEDED",
  "externalPostId": "pin_id",
  "externalPostUrl": "https://pinterest.com/pin/example",
  "rateLimit": {
    "remaining": "94",
    "reset": "60"
  }
}
```

---

# 25. Frontend Components

Add:

```txt id="p4u1x3"
PinterestConnectCard.tsx
PinterestConnectConfirmModal.tsx
PinterestAccountCard.tsx
PinterestBoardDiscoveryPanel.tsx
PinterestBoardSelector.tsx
PinterestBoardSectionSelector.tsx
PinterestTargetSelector.tsx
PinterestPinFields.tsx
PinterestAccessTierBadge.tsx
PinterestRateLimitBadge.tsx
PinterestPublishTimelineItem.tsx
PinterestTrialModeWarning.tsx
```

Update:

```txt id="dgqexy"
SocialAccountsPage.tsx
PlatformTargetsStep.tsx
ComposerStep.tsx
ReviewStep.tsx
AttemptTimeline.tsx
PlatformTargetStatusCard.tsx
SchedulerPostDetail.tsx
SchedulerPostCard.tsx
WorkerDiagnosticsPanel.tsx
```

---

# 26. UX Copy

## 26.1 Social Accounts Page

Pinterest section title:

```txt id="m1uohh"
Pinterest Accounts
```

Subtitle:

```txt id="myhf19"
Connect Pinterest and choose the boards this workspace can publish to.
```

Button:

```txt id="onh2g5"
Connect Pinterest
```

---

## 26.2 Board Sync

Title:

```txt id="fgelpy"
Sync Pinterest boards
```

Body:

```txt id="yq0s43"
Boards decide where Pins are saved. Select the boards this workspace can use.
```

Buttons:

```txt id="irmzt3"
Save selected boards
Refresh from Pinterest
Cancel
```

---

## 26.3 Target Step

Pinterest card helper:

```txt id="mx94ot"
Pins must be saved to a board. Add a destination link if this creative should drive traffic.
```

---

## 26.4 Trial Warning

```txt id="zvueul"
Pinterest Trial mode is enabled. Created Pins may be sandbox-visible only.
```

---

## 26.5 Success Timeline

```txt id="fnamvf"
Published to Pinterest
```

Body:

```txt id="r062sd"
The scheduled image was published as a Pin on the selected board.
```

Button:

```txt id="luszrw"
View Pin
```

---

## 26.6 Failure Timeline

```txt id="pkyxli"
Pinterest publishing failed
```

Body:

```txt id="q1o9yw"
Open the attempt details to review the board, media, permission, or rate-limit issue.
```

---

# 27. Error Handling

## 27.1 OAuth Cancelled

```txt id="sgnr5q"
Pinterest connection was cancelled.
```

Action:

```txt id="p34laq"
Try again
```

---

## 27.2 OAuth State Invalid

```txt id="w5jwyg"
This Pinterest connection session expired. Please start again.
```

Action:

```txt id="o618g5"
Reconnect Pinterest
```

---

## 27.3 Missing Scope

```txt id="udzj3v"
Pinterest publishing permission was not granted.
```

Action:

```txt id="g2lofi"
Reconnect and approve permissions
```

---

## 27.4 No Boards Found

```txt id="s3bmp0"
No Pinterest boards were found.
```

Body:

```txt id="k8jqep"
Create a board in Pinterest or reconnect with an account that has board access.
```

Action:

```txt id="aj1nys"
Refresh boards
```

---

## 27.5 Board Not Available

```txt id="g78zcw"
The selected Pinterest board is no longer available.
```

Action:

```txt id="tfttua"
Refresh boards
```

---

## 27.6 Rate Limited

```txt id="te5dlq"
Pinterest rate limit reached.
```

Body:

```txt id="r4e8zk"
This target will retry after the rate-limit window resets.
```

---

## 27.7 Reconnect Required

```txt id="oxjiri"
Pinterest account needs reconnection.
```

Action:

```txt id="vzkv8o"
Reconnect Pinterest
```

---

## 27.8 Unsupported Media

```txt id="nzeo0i"
This media is not eligible for Pinterest image Pin publishing.
```

Action:

```txt id="dxpuw5"
Use a JPEG or PNG image
```

---

# 28. Retry Rules

Use Sprint 2 retry foundation.

## 28.1 Retryable

Retry:

```txt id="fng4vf"
Pinterest 429 rate limit
Pinterest 5xx
Network timeout
Temporary media URL fetch failure
Unknown timeout before response
Temporary unavailable
```

## 28.2 Permanent

Fail permanently:

```txt id="wxgjmp"
Invalid board ID
Invalid board section ID
Unsupported media type
Missing required Pin title
Missing required board
Invalid destination link
Permission missing
Content rejected by Pinterest
```

## 28.3 Reauth

Mark reauth required:

```txt id="t4yr1d"
Access token expired and refresh failed
Refresh token expired
User revoked app access
Required scope removed
CredentialRef missing
```

---

# 29. Security Requirements

Sprint 5 must preserve all earlier security rules.

## 29.1 OAuth State Security

```txt id="qj5lmi"
State must be random and unguessable.
State must be stored hashed.
State must expire quickly.
State must be single-use.
State must bind workspaceId.
State must bind userId.
Callback must reject reused/expired state.
```

## 29.2 Token Security

Never expose:

```txt id="tph2u3"
Pinterest access token
Pinterest refresh token
Pinterest app secret
OAuth raw state secret
B2 signed URL
B2 secret
```

## 29.3 Workspace Isolation

Must enforce:

```txt id="td9s8l"
Pinterest account connected to Workspace A cannot be selected in Workspace B.
Board from Workspace A cannot be selected in Workspace B.
Worker validates target.workspaceId, post.workspaceId, socialAccount.workspaceId, and board.workspaceId before publishing.
```

## 29.4 Attempt Sanitization

Attempt JSON may store:

```txt id="xnu6a9"
platform
pinType
board local ID
board external ID masked if desired
mediaAssetId
mimeType
caption/title length
rate-limit metadata
provider error code
```

Attempt JSON must not store:

```txt id="eer0ma"
tokens
signed URLs
raw private object keys
client secrets
raw provider auth headers
```

---

# 30. Functional Test Cases

## 30.1 OAuth

```txt id="sm363h"
Logged-out user cannot start Pinterest OAuth.
```

```txt id="n5bugi"
User without workspace permission cannot start Pinterest OAuth.
```

```txt id="x0asbe"
OAuth state is created with workspaceId and userId.
```

```txt id="tzs6ei"
Expired OAuth state is rejected.
```

```txt id="dlt6gf"
Reused OAuth state is rejected.
```

---

## 30.2 Account Connection

```txt id="kw9frx"
Successful OAuth creates SocialAccount with provider PINTEREST and platform PINTEREST.
```

```txt id="erl6za"
SocialAccount stores credentialRef, not raw token.
```

```txt id="lzpg8n"
SocialAccount stores granted scopes in scopesJson.
```

```txt id="ttg93s"
Connected Pinterest account appears on Social Accounts page.
```

---

## 30.3 Board Discovery

```txt id="ofnu87"
Refresh boards fetches Pinterest boards.
```

```txt id="iofgb8"
Boards are cached with workspaceId and socialAccountId.
```

```txt id="sx2f98"
Board sections are cached if returned.
```

```txt id="kkpuzv"
No-board state is shown when no boards are returned.
```

---

## 30.4 Workspace Isolation

```txt id="hc946p"
Workspace A Pinterest account does not appear in Workspace B.
```

```txt id="mliqf9"
Workspace A board cannot be selected in Workspace B.
```

```txt id="vp71mx"
Worker refuses to publish if target, account, and board do not belong to the same workspace.
```

---

## 30.5 Target Selection

```txt id="kkhq39"
Pinterest live target appears only when account is connected.
```

```txt id="ayyh97"
Image upload allows Pinterest Image Pin option.
```

```txt id="swm5oa"
Video upload shows Pinterest Video Pin as Coming later.
```

```txt id="n9qhxt"
Continue is blocked until board is selected.
```

```txt id="x9u9ts"
Continue is blocked until Pin title and description exist.
```

---

## 30.6 Worker Publish

```txt id="grltzk"
Create scheduled Pinterest image Pin.
Run worker after scheduledAt.
Verify:
- target claimed
- attempt created
- access token resolved securely
- board ownership validated
- temporary media URL generated
- Pinterest Create Pin called
- returned Pin ID stored
- target marked PUBLISHED
- parent post recalculated
```

---

## 30.7 Rate Limit

```txt id="cmb4f1"
Simulate Pinterest 429.
Verify:
- attempt status RATE_LIMITED
- target status RETRYING
- nextRetryAt is set
- rate-limit metadata stored
- UI shows rate-limit message
```

---

## 30.8 Reauth

```txt id="q4a2gb"
Simulate expired refresh token.
Verify:
- SocialAccount becomes REAUTH_REQUIRED
- target becomes REAUTH_REQUIRED
- timeline shows reconnect required
```

---

## 30.9 Security

```txt id="y7wpvl"
Frontend never receives Pinterest access token.
```

```txt id="pupfql"
Attempt requestJson does not contain token.
```

```txt id="wp3cln"
Attempt responseJson does not contain token.
```

```txt id="uk026b"
Attempt diagnostics do not contain signed B2 URL.
```

```txt id="inrjyl"
Logs do not contain token.
```

---

# 31. Acceptance Criteria

Sprint 5 is complete when:

## Account Wiring

```txt id="ean7dn"
Admin can click Connect Pinterest.
OAuth state is created and validated.
Pinterest callback works.
Pinterest account is saved to active workspace.
Token material is stored only through credentialRef.
Connected Pinterest account appears in Social Accounts page.
```

## Board Discovery

```txt id="s9r63s"
System can fetch Pinterest boards.
Boards are cached workspace-locally.
Board sections are cached if available.
User can refresh boards.
User can select board in Scheduler target step.
```

## Scheduler UX

```txt id="tr6k02"
Pinterest appears as live connected in Target step.
User can choose Pinterest account.
User can choose board.
User can optionally choose board section.
User can enter Pin title.
User can enter Pin description.
User can enter optional destination link.
Review step warns about live Pinterest publishing.
Review step requires confirmation before scheduling live Pinterest target.
```

## Worker + Publishing

```txt id="fr4ko6"
Sprint 2 worker processes due Pinterest targets.
Worker validates workspace/account/board ownership.
Worker creates attempt before provider call.
Worker generates temporary media URL.
Worker calls Pinterest Create Pin.
Successful publish marks target PUBLISHED.
Failed publish maps to RETRYING, FAILED, or REAUTH_REQUIRED correctly.
Attempt timeline shows result.
```

## Security

```txt id="w5yh16"
No token leakage.
No cross-workspace account access.
No cross-workspace board access.
No permanent public B2 URL exposure.
No raw signed URL stored in JSONB.
Worker validates workspace/account/target/board before publishing.
```

---

# 32. Sprint 5 Deliverables

## Frontend

```txt id="mec82n"
Pinterest section on Social Accounts page
Connect Pinterest modal
Connected Pinterest account card
Board discovery/sync panel
Pinterest board selector
Pinterest board section selector
Pinterest target card
Pinterest Pin title/description/link fields
Pinterest Trial mode warning
Pinterest rate-limit badge
Pinterest attempt timeline item
Updated Scheduler Review step
Updated Scheduler Detail page
```

## Backend

```txt id="rw0upv"
Pinterest OAuth start endpoint
Pinterest OAuth callback endpoint
Pinterest credential service
Pinterest account discovery service
Pinterest board discovery service
Pinterest board refresh endpoint
Pinterest target validation
PinterestPublisherAdapter
Worker adapter routing update
Rate-limit classification
Pinterest error classification
Token refresh handling
```

## Database

```txt id="yygugr"
SocialAccount provider PINTEREST support
PinterestBoard model
PinterestBoardSection model
SocialPublishTarget Pinterest board fields
SocialPublishTarget platformOptionsJson updates
SocialPublishAttempt RATE_LIMITED support
Provider diagnostics fields
Workspace indexes
```

## Tests

```txt id="g9st6g"
Pinterest OAuth tests
Workspace isolation tests
Token non-leakage tests
Board discovery tests
Board selector tests
Image Pin validation tests
Worker publish tests
Rate-limit tests
Reconnect tests
Attempt timeline tests
```

---

# 33. Sprint 5 Final Implementation Summary

Build this in Sprint 5:

```txt id="pi2i2g"
Social Accounts page
→ Connect Pinterest
→ OAuth callback
→ Store Pinterest credentialRef
→ Discover Pinterest boards
→ Save boards to active workspace
→ Select Pinterest in Scheduler Target step
→ Choose board and optional section
→ Add Pin title, description, and optional link
→ Schedule live Pinterest image Pin
→ Sprint 2 worker processes due target
→ Pinterest adapter creates Pin
→ Attempt timeline shows real result
```

Do not build Pinterest video Pins as required acceptance yet.

Do not build YouTube yet.

Do not build Twitter/X yet.

Do not bypass the Sprint 2 worker.

Sprint 5’s job is to make Pinterest image Pin publishing reliable through the same account, worker, attempt, retry, and status framework already established in Sprints 1–4.

After Sprint 5, the next logical sprint is:

```txt id="mfbwoe"
Sprint 6 — YouTube Channel Wiring and Video Publishing
```

Optional alternative if the product wants deeper Pinterest before YouTube:

```txt id="jur2mg"
Sprint 6 — Pinterest Video Pin Publishing
```