# Sakhaa Forge Social Scheduler — Sprint 6 Documentation  
## Sprint 6: YouTube Channel Wiring, Video Scheduling, Quota Guardrails, and Real Video Publishing

## 0. Sprint Intent

Sprint 6 continues directly from Sprints 1–5.

Sprint 1 created:

```txt id="wk27or"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="e7owkq"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="7mwoxa"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped Facebook Page accounts
→ Real Facebook Page publishing
```

Sprint 4 created:

```txt id="x3np21"
Instagram account discovery
→ Instagram target selection
→ Instagram media-container publishing
→ Instagram lifecycle tracking
```

Sprint 5 created:

```txt id="tqgqu7"
Pinterest OAuth
→ Pinterest account wiring
→ Board discovery
→ Image Pin publishing
```

Sprint 6 now adds YouTube as the next real publishing platform:

```txt id="d9l7q4"
Google OAuth
→ YouTube channel connection
→ Workspace-scoped YouTube channel
→ Video-only Scheduler target
→ Quota-safe upload validation
→ Worker uploads video through YouTube Data API
→ Attempt timeline shows upload / processing / publish result
```

YouTube must **not bypass Sprint 2’s worker, attempt, retry, and status system**.

---

## 1. Sprint 6 Name

```txt id="0s5svf"
Sprint 6 — YouTube Channel Wiring and Video Publishing
```

Alternative internal label:

```txt id="iay310"
Sprint 6 — YouTube Video Upload Adapter
```

---

## 2. Sprint 6 Outcome

By the end of Sprint 6:

1. A workspace admin can connect Google/YouTube.
2. The app can request YouTube upload permission through OAuth.
3. The app can identify the connected YouTube channel.
4. The channel is saved as a workspace-scoped `SocialAccount`.
5. YouTube appears as a live target only for video media.
6. The Scheduler blocks YouTube for image-only posts.
7. The user can enter YouTube title, description, privacy status, category, tags, and made-for-kids setting.
8. The system checks project-level YouTube upload quota before allowing or attempting upload.
9. The Sprint 2 worker can process due YouTube targets.
10. The worker can upload the video through YouTube Data API `videos.insert`.
11. The attempt timeline shows upload success, retry, quota block, processing, or failure.
12. The system stores the returned YouTube video ID.
13. The system stores the YouTube watch URL if available.
14. Token, quota, workspace, and media safety are preserved.

YouTube’s `videos.insert` endpoint uploads a video and can set metadata; it supports media upload, allows files up to 256 GB, accepts `video/*` and `application/octet-stream`, requires authorization, and includes `youtube.upload` as an allowed scope.

---

## 3. In Scope

Sprint 6 includes:

```txt id="ew7xts"
Google Cloud / YouTube Data API configuration documentation
Google OAuth start/callback flow
OAuth state/CSRF protection
YouTube upload scope
Refresh token handling
YouTube channel discovery
Workspace-scoped YouTube SocialAccount persistence
YouTube target selector in Scheduler
Video-only platform validation
YouTube-specific composer fields
YouTube quota tracking
YouTube upload adapter
Worker routing for LIVE_GOOGLE / YouTube
Attempt timeline integration
Reconnect required state
Quota exceeded state
Functional tests
```

---

## 4. Out of Scope

Sprint 6 must **not** implement:

```txt id="fg4jbn"
Twitter/X publishing
Pinterest video Pins
YouTube Shorts-specific optimization engine
YouTube thumbnail upload as required acceptance
YouTube captions/subtitles upload
YouTube playlists
YouTube analytics
YouTube comments
YouTube livestreams
YouTube Content Owner / CMS support
Bulk YouTube upload campaigns
AI title generation
AI description generation
Drag-and-drop calendar
Approval workflow
```

Optional stretch only:

```txt id="o9odgo"
Custom thumbnail upload
```

Do not block Sprint 6 completion on thumbnail support.

---

## 5. Platform Reality and Product Decision

YouTube is different from Facebook, Instagram, and Pinterest.

YouTube is:

```txt id="249ny3"
Video-only for this scheduler
Quota-gated
OAuth-required for uploads
Potentially audit-gated for public uploads
Project-level constrained, not purely client-account constrained
```

The YouTube Data API overview states that the API requires a Google Account, a Google Developers Console project, API enablement, authorization credentials, and OAuth 2.0 authorization for methods that require user authorization.

Product decision for Sprint 6:

```txt id="46bfi1"
Build YouTube video publishing only.
Block image/static posts for YouTube.
Treat YouTube quota as a first-class product constraint.
Show audit/private-mode warning clearly.
```

---

# 6. YouTube Quota and Audit Reality

## 6.1 Default Quota

YouTube projects that enable the Data API have a default quota allocation that includes:

```txt id="q17flg"
100 videos.insert calls/day
100 search.list calls/day
10,000 units/day combined for other endpoints
```



The `videos.insert` endpoint itself lists:

```txt id="3nq13c"
Quota impact: 100 calls per day
Quota cost: 1 unit in the Video Uploads quota bucket
```



Sprint 6 must therefore treat YouTube upload quota as:

```txt id="3clqmy"
Default: 100 YouTube uploads/day per Google Cloud project
```

not:

```txt id="fczpjd"
100 uploads/day per client
```

## 6.2 Quota Extension / Audit

If the app needs quota beyond the default allocation, YouTube requires an audit demonstrating compliance with the YouTube API Services Terms of Service.

Sprint 6 must include an admin/internal quota readiness note:

```txt id="ca6dcw"
Client-facing scale beyond default quota requires YouTube API compliance/audit readiness.
```

## 6.3 Unverified Project Private Mode

YouTube states that videos uploaded through `videos.insert` from unverified API projects created after 28 July 2020 are restricted to private viewing mode until the API project passes audit/compliance review.

Sprint 6 UI must therefore show:

```txt id="cn4643"
This YouTube integration may upload videos as private until the API project is verified/audited.
```

Do not promise public scheduled YouTube publishing until project verification/audit status is confirmed.

---

# 7. Google OAuth and Scope

Sprint 6 must use server-side Google OAuth.

Google’s YouTube OAuth server-side docs state that OAuth 2.0 can grant permission to upload videos to a user’s YouTube channel and that a properly authorized web server application can access the API while the user is present or after they leave.

## 7.1 Required Scope

Use the narrowest required upload scope:

```txt id="erpe76"
https://www.googleapis.com/auth/youtube.upload
```

The YouTube OAuth docs list this scope as “Manage your YouTube videos.”

## 7.2 Optional Read Scope

For channel identity discovery, use either:

```txt id="44fv5x"
https://www.googleapis.com/auth/youtube.readonly
```

or perform channel lookup with the upload scope if sufficient in implementation testing.

Recommended Sprint 6 scopes:

```txt id="9ktv6i"
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
```

UX copy should not show these raw URLs as the primary message. Show user-friendly language first.

## 7.3 Permission Checklist Copy

User-facing permission checklist:

```txt id="1t6y0a"
View your YouTube channel identity
Upload videos to your YouTube channel
Manage uploaded video visibility
```

Technical mapping:

```txt id="mmym7l"
View channel identity → youtube.readonly
Upload videos → youtube.upload
Manage uploaded video metadata/visibility → videos.insert status/snippet fields
```

---

# 8. Environment Variables

Add:

```txt id="tg59xz"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_YOUTUBE_REDIRECT_URI=
GOOGLE_OAUTH_STATE_SECRET=
GOOGLE_YOUTUBE_CONNECT_ENABLED=true
YOUTUBE_API_BASE_URL=https://www.googleapis.com/youtube/v3
YOUTUBE_UPLOAD_BASE_URL=https://www.googleapis.com/upload/youtube/v3
YOUTUBE_PROJECT_DAILY_UPLOAD_LIMIT=100
YOUTUBE_PROJECT_TIMEZONE=America/Los_Angeles
YOUTUBE_AUDIT_STATUS=unverified
```

Feature flags:

```txt id="7aiu4i"
SOCIAL_SCHEDULER_YOUTUBE_ENABLED=true
SOCIAL_SCHEDULER_YOUTUBE_VIDEO_UPLOAD_ENABLED=true
SOCIAL_SCHEDULER_YOUTUBE_CUSTOM_THUMBNAIL_ENABLED=false
SOCIAL_SCHEDULER_YOUTUBE_CAPTIONS_ENABLED=false
SOCIAL_SCHEDULER_YOUTUBE_PLAYLIST_ENABLED=false
SOCIAL_SCHEDULER_YOUTUBE_SHORTS_LABEL_ENABLED=false
```

Keep prior worker variables:

```txt id="wgl13v"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Security rule:

```txt id="pn47wd"
No GOOGLE_* secret may be exposed to frontend.
```

Allowed frontend flag only:

```txt id="eb3jey"
NEXT_PUBLIC_GOOGLE_YOUTUBE_CONNECT_ENABLED=true
```

---

# 9. Data Model Updates

Sprint 3 introduced the shared `SocialAccount` model and provider enum.

Sprint 6 reuses that foundation.

---

## 9.1 Ensure Provider Enum Includes GOOGLE

```prisma id="tjipeb"
enum SocialAccountProvider {
  META
  GOOGLE
  PINTEREST
  X
}
```

---

## 9.2 Ensure Account Type Includes YouTube

```prisma id="38vql5"
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

## 9.3 YouTube SocialAccount Shape

Save connected YouTube channel as:

```txt id="8ew89o"
provider = GOOGLE
platform = YOUTUBE
accountType = YOUTUBE_CHANNEL
externalAccountId = youtube_channel_id
credentialRef = secure Google OAuth token reference
```

Example:

```json id="l345ea"
{
  "provider": "GOOGLE",
  "platform": "YOUTUBE",
  "accountType": "YOUTUBE_CHANNEL",
  "displayName": "Mantri Developers",
  "username": "@mantridevelopers",
  "externalAccountId": "UCxxxxxxxxxxxxxxxxxxxx",
  "status": "CONNECTED",
  "scopesJson": [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
  ],
  "metadataJson": {
    "auditStatus": "unverified",
    "supportsVideoUpload": true,
    "publicUploadsAllowed": false,
    "defaultPrivacyStatus": "private"
  },
  "credentialRef": "secret_ref"
}
```

---

## 9.4 New Model — YouTubeUploadQuotaLedger

YouTube quota is project-level, so track usage centrally.

```prisma id="5xxy80"
model YouTubeUploadQuotaLedger {
  id                    String @id @default(uuid())

  quotaDate             String
  provider              SocialAccountProvider @default(GOOGLE)
  quotaBucket           String @default("videos.insert")

  dailyLimit            Int    @default(100)
  usedCount             Int    @default(0)
  reservedCount         Int    @default(0)

  resetTimezone         String @default("America/Los_Angeles")
  lastSyncedAt          DateTime?

  metadataJson          Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([quotaDate, quotaBucket])
  @@index([quotaDate])
}
```

Purpose:

```txt id="520zwy"
Prevent the app from scheduling/attempting more YouTube uploads than the project can safely perform in one day.
```

## 9.5 New Model — YouTubeUploadReservation

Reserve quota at schedule time or pre-publish time.

```prisma id="f52u4y"
model YouTubeUploadReservation {
  id                    String @id @default(uuid())

  workspaceId           String
  postId                String
  targetId              String
  socialAccountId       String

  quotaDate             String
  status                String @default("RESERVED")

  reservedAt            DateTime @default(now())
  consumedAt            DateTime?
  releasedAt            DateTime?

  metadataJson          Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([targetId])
  @@index([quotaDate, status])
  @@index([workspaceId, socialAccountId])
}
```

Possible statuses:

```txt id="i6yw5u"
RESERVED
CONSUMED
RELEASED
EXPIRED
FAILED
```

## 9.6 New Model — YouTubeUploadJob

Track YouTube upload lifecycle separately from generic attempt data.

```prisma id="j1mc2q"
model YouTubeUploadJob {
  id                    String @id @default(uuid())

  workspaceId           String
  postId                String
  targetId              String
  attemptId             String?

  socialAccountId       String
  youtubeChannelId      String

  uploadStatus          String @default("CREATED")
  youtubeVideoId        String?
  youtubeVideoUrl       String?

  privacyStatus         String
  title                 String
  description           String?
  categoryId            String?
  madeForKids           Boolean?
  tagsJson              Json?

  uploadStartedAt       DateTime?
  uploadFinishedAt      DateTime?
  processingCheckedAt   DateTime?
  publishedAt           DateTime?

  errorCode             String?
  errorMessage          String?

  diagnosticsJson       Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([youtubeVideoId])
  @@index([uploadStatus])
}
```

Possible `uploadStatus` values:

```txt id="7clqtd"
CREATED
UPLOADING
UPLOADED
PROCESSING
PUBLISHED
PRIVATE_RESTRICTED
FAILED
REAUTH_REQUIRED
QUOTA_BLOCKED
```

---

## 9.7 Update SocialPublishTarget

Add YouTube fields:

```prisma id="vwsy01"
youtubeUploadReservationId String?
youtubeUploadJobId         String?
platformOptionsJson        Json?
```

Example `platformOptionsJson`:

```json id="23n6xt"
{
  "youtube": {
    "title": "Luxury Apartment Walkthrough",
    "description": "A complete walkthrough of the project highlights.",
    "privacyStatus": "private",
    "categoryId": "22",
    "tags": ["real estate", "luxury homes", "Bangalore"],
    "madeForKids": false,
    "notifySubscribers": false
  }
}
```

---

## 9.8 Update SocialPublishAttempt

Ensure provider fields exist:

```prisma id="pfjeat"
provider              SocialAccountProvider?
socialAccountId       String?
providerRequestId     String?
providerErrorCode     String?
providerTraceId       String?
```

YouTube-specific lifecycle can be stored as:

```prisma id="qo4cy9"
platformLifecycleStage String?
```

Possible YouTube lifecycle stages:

```txt id="5dyplh"
RESERVE_QUOTA
UPLOAD_VIDEO
CHECK_PROCESSING
FINALIZE_RESULT
```

---

# 10. Social Accounts UX Updates

Route remains:

```txt id="j8r0h5"
/app/social-accounts
```

Sprint 6 adds a YouTube section.

## 10.1 YouTube Section

Title:

```txt id="787kqi"
YouTube Channels
```

Subtitle:

```txt id="lvwyoy"
Connect YouTube channels to schedule approved video uploads for this workspace.
```

Primary button:

```txt id="wnevpz"
Connect YouTube
```

Secondary button:

```txt id="ck1l8p"
Check quota
```

---

## 10.2 Empty State

Title:

```txt id="0g1811"
No YouTube channel connected
```

Body:

```txt id="1ad3nx"
Connect a YouTube channel before scheduling video uploads for this workspace.
```

Button:

```txt id="mviueq"
Connect YouTube
```

---

## 10.3 Connect YouTube Modal

Title:

```txt id="c8ly5q"
Connect YouTube for this workspace?
```

Body:

```txt id="4iu2nb"
You are connecting a YouTube channel only for the active workspace. Other client workspaces will not get access to this channel.
```

Checklist:

```txt id="gqddvk"
Active workspace is correct
You manage the YouTube channel
You approve video upload permission
You understand uploads may be private until API verification/audit is complete
```

Buttons:

```txt id="wqs98u"
Continue to Google
Cancel
```

Primary button disabled until all checklist items are checked.

---

## 10.4 Connected YouTube Channel Card

Each card shows:

```txt id="fbw4nb"
Channel name
Channel handle if available
Channel ID masked
Connected workspace
Connected by
Last connected
Last token refresh
Default privacy status
Audit status
Status
```

Actions:

```txt id="ie7vo6"
Validate
Reconnect
Disconnect
Check quota
```

Status badges:

```txt id="2p1rnt"
Connected
Reconnect required
Permission missing
Quota warning
Audit unverified
Disconnected
```

---

# 11. Google OAuth Flow

## 11.1 Start Google OAuth

Endpoint:

```txt id="9pa65o"
POST /api/v0/social-accounts/google/youtube/connect/start
```

Body:

```json id="j6cuy0"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Backend responsibilities:

```txt id="x7uixy"
Validate authenticated user
Validate workspace permission
Create hashed OAuth state
Bind state to workspaceId and userId
Request youtube.upload and youtube.readonly scopes
Set access_type=offline
Set prompt=consent when refresh token is needed
Build Google OAuth redirect URL
Return redirect URL
```

The Google OAuth docs note that server-side apps can use OAuth to access the API after the user leaves, and the docs recommend using well-debugged OAuth libraries for this flow.

---

## 11.2 Google OAuth Callback

Endpoint:

```txt id="4czkir"
GET /api/v0/social-accounts/google/youtube/callback?code=...&state=...
```

Backend responsibilities:

```txt id="r86nra"
Validate OAuth state
Reject expired/reused state
Exchange code for tokens
Store token material securely
Fetch connected YouTube channel identity
Create or update SocialAccount
Redirect to Social Accounts page
```

Redirect:

```txt id="lberbi"
/app/social-accounts?provider=youtube&connected=true
```

Do not put tokens in query params.

---

## 11.3 OAuth State Security

Use the same state model introduced in Sprint 3/5.

State must be:

```txt id="qav3xz"
Random
Hashed at rest
Single-use
Short-lived
Bound to workspaceId
Bound to userId
Bound to provider GOOGLE
Bound to returnPath
```

---

# 12. YouTube Channel Discovery

After OAuth succeeds, fetch the connected channel identity.

Recommended result shape:

```json id="74uhlp"
{
  "channelId": "UCxxxxxxxxxxxxxxxxxxxx",
  "title": "Mantri Developers",
  "handle": "@mantridevelopers",
  "thumbnailUrl": "https://...",
  "customUrl": null
}
```

Persist safe fields only:

```txt id="vo0t2b"
channelId
title/displayName
handle/username
thumbnailUrl if useful
credentialRef
scopesJson
audit metadata
```

Do not persist or expose tokens.

---

# 13. Scheduler Target Step Updates

Route:

```txt id="m0feup"
/app/social-scheduler/new
```

Stage:

```txt id="4fpm8k"
Targets
```

Sprint 6 makes YouTube live.

---

## 13.1 YouTube Card — Connected State

Card title:

```txt id="mslw4o"
YouTube
```

Badge:

```txt id="lez4u7"
Live connected
```

Channel dropdown:

```txt id="wu4o6w"
Choose YouTube channel
```

Dropdown option format:

```txt id="ot7wfb"
<Channel Name> · @handle
```

Helper text:

```txt id="k014l9"
YouTube supports video uploads only. Images cannot be scheduled to YouTube.
```

---

## 13.2 YouTube Card — Not Connected State

Badge:

```txt id="ymx041"
Not connected
```

Body:

```txt id="1xwa1b"
Connect a YouTube channel before enabling live YouTube publishing.
```

Buttons:

```txt id="6eqqko"
Connect YouTube
Use mock mode
```

---

## 13.3 YouTube Validation in Target Step

Rules:

```txt id="rntwc5"
If uploaded media is image → block YouTube live mode.
If uploaded media is video/mp4 → allow YouTube live mode.
If uploaded media is video/quicktime → block live mode unless transcoding exists.
If no YouTube channel connected → block live mode.
If quota unavailable → show quota warning but allow draft save.
If quota exhausted → block scheduling live YouTube target.
```

Recommended Sprint 6 strict MVP:

```txt id="x61hip"
Allow only video/mp4 for live YouTube publishing.
Keep video/quicktime mock-only unless conversion/transcoding is implemented.
```

---

# 14. YouTube-Specific Composer Fields

YouTube requires richer metadata than generic social captions.

Add YouTube override fields after YouTube target is selected.

## 14.1 Required Fields

```txt id="945py7"
Video title
Description
Privacy status
Made for kids?
```

## 14.2 Recommended Fields

```txt id="gmj38o"
Tags
Category
Notify subscribers
```

## 14.3 Optional Later Fields

```txt id="c7e85a"
Custom thumbnail
Playlist
Captions/subtitles
Recording date
License
Embeddable
Public stats viewable
```

---

## 14.4 Field Details

### Video title

Label:

```txt id="mmx9mz"
YouTube title
```

Placeholder:

```txt id="0s9rv8"
Example: Luxury Apartment Walkthrough | Mantri Developers
```

Validation:

```txt id="qxykwx"
Required
Max 100 characters
```

The YouTube videos resource documentation notes that title has a maximum length of 100 characters.

### Description

Label:

```txt id="7phsla"
YouTube description
```

Placeholder:

```txt id="r31cl9"
Add project details, offer copy, and approved links.
```

Validation:

```txt id="07r43s"
Required for Sprint 6 product quality
```

### Privacy status

Label:

```txt id="u0pswa"
Visibility
```

Options:

```txt id="e5ih9x"
Private
Unlisted
Public
```

Default:

```txt id="wz32pv"
Private
```

YouTube’s `videos.insert` sample metadata includes `privacyStatus` values like `unlisted`, `private`, and `public`.

### Made for kids

Label:

```txt id="0mij8c"
Made for kids?
```

Options:

```txt id="wc8o6q"
No
Yes
Not sure
```

Sprint 6 validation:

```txt id="w58jgw"
Block final scheduling if value is Not sure.
```

Helper text:

```txt id="n6d5ai"
Choose based on the actual intended audience and content. Do not guess.
```

### Tags

Label:

```txt id="n95oj9"
Tags
```

Placeholder:

```txt id="b96kbl"
real estate, luxury homes, Bangalore
```

Validation:

```txt id="mq2z6s"
Optional
Comma-separated
Trim whitespace
Store as JSON array
```

### Category

Label:

```txt id="29vt6j"
Category
```

Default:

```txt id="o80bd8"
People & Blogs / category 22
```

Sprint 6 may start with a simple static dropdown and later replace it with API-backed categories.

---

# 15. Review Step Updates

Sprint 6 YouTube checklist:

```txt id="4x6aan"
Workspace selected
Video uploaded
Draft content saved
YouTube channel connected
YouTube title added
YouTube description added
Visibility selected
Made-for-kids value selected
Quota available
Schedule time valid
Live YouTube publish mode enabled
```

Live confirmation checkbox:

```txt id="6ls4ua"
I understand this video will upload to the selected YouTube channel.
```

Audit warning:

```txt id="7llv7b"
This YouTube API project may upload videos as private until verification/audit is complete.
```

Quota warning:

```txt id="g6rf61"
YouTube upload quota is shared across all client workspaces for this API project.
```

Multi-target warning if Facebook/Instagram/Pinterest/YouTube are selected together:

```txt id="rmfw0c"
This post has multiple live targets. Each platform will publish independently and may succeed or fail separately.
```

---

# 16. Quota Reservation Flow

Because YouTube has a hard project-level upload count, Sprint 6 should reserve quota before scheduling or before publishing.

Preferred approach:

```txt id="45ijrz"
Reserve quota at schedule time.
Consume quota at upload attempt time.
Release quota if post is cancelled before upload.
```

## 16.1 Schedule-Time Reservation

When user schedules a YouTube target:

```txt id="bh1gm2"
1. Determine quotaDate in YouTube project reset timezone.
2. Load YouTubeUploadQuotaLedger for quotaDate.
3. Check usedCount + reservedCount < dailyLimit.
4. If available, create YouTubeUploadReservation.
5. Increment reservedCount.
6. Save target.
```

## 16.2 Worker-Time Consumption

When worker starts upload:

```txt id="q6yfv0"
1. Load reservation.
2. If reservation exists, mark CONSUMED when upload call is made.
3. Increment usedCount.
4. Decrement reservedCount.
5. Continue upload attempt.
```

## 16.3 Cancellation

If user cancels before upload:

```txt id="i9w6hk"
1. Mark reservation RELEASED.
2. Decrement reservedCount.
3. Mark target CANCELLED.
```

## 16.4 No Quota Available

UI message:

```txt id="woyfs1"
YouTube upload quota is full for this day.
```

Body:

```txt id="8h0bp6"
Choose another date or remove the YouTube target.
```

---

# 17. YouTube Publishing Flow

The YouTube upload must use the Sprint 2 worker.

## 17.1 Video Upload Flow

```txt id="vahqix"
1. User schedules post with YouTube live target.
2. Target stores socialAccountId and YouTube platformOptionsJson.
3. Quota reservation is created.
4. Worker detects due YouTube target.
5. Worker claims target safely.
6. Worker creates SocialPublishAttempt.
7. Worker validates YouTube SocialAccount and credentialRef.
8. Worker refreshes Google access token if needed.
9. Worker validates quota reservation.
10. Worker loads uploaded video media asset.
11. Worker streams/uploads video to YouTube using videos.insert.
12. Worker stores returned YouTube video ID.
13. Worker stores watch URL if available.
14. Worker marks upload job UPLOADED/PUBLISHED/PRIVATE_RESTRICTED.
15. Worker updates target status.
16. Worker recalculates parent post status.
17. Attempt timeline shows YouTube result.
```

The YouTube `videos.insert` docs specify the upload endpoint as `POST https://www.googleapis.com/upload/youtube/v3/videos` and state that the method uploads a video and optionally sets metadata.

---

## 17.2 Privacy Handling

If:

```txt id="8rnp16"
YOUTUBE_AUDIT_STATUS=unverified
```

then default privacy must be:

```txt id="sxlh3q"
private
```

If user selects public/unlisted while audit status is unverified:

```txt id="y8x4g7"
Show warning and either:
1. Block public/unlisted selection, or
2. Allow scheduling but warn that YouTube may force private.
```

Recommended Sprint 6 behavior:

```txt id="h1ptt2"
Block public/unlisted while YOUTUBE_AUDIT_STATUS=unverified.
```

Reason: YouTube’s docs state unverified API projects created after 28 July 2020 will have uploads restricted to private viewing mode.

---

# 18. YouTube Adapter

Create:

```txt id="kprk9y"
GoogleYouTubePublisherAdapter
```

Recommended path:

```txt id="yu85ek"
apps/api/src/social-scheduler/adapters/google-youtube-publisher.adapter.ts
```

or `.mjs` equivalent if the current API uses `.mjs`.

---

## 18.1 Adapter Input

```ts id="xzcy39"
type YouTubePublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "YOUTUBE";
  publishMode: "LIVE_GOOGLE";
  socialAccountId: string;
  youtubeChannelId: string;
  video: {
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  };
  youtubeOptions: {
    title: string;
    description: string;
    privacyStatus: "private" | "unlisted" | "public";
    categoryId?: string;
    tags?: string[];
    madeForKids: boolean;
    notifySubscribers?: boolean;
  };
  draftContentJson: unknown;
};
```

---

## 18.2 Adapter Result

```ts id="l7syv6"
type YouTubePublishResult = {
  status:
    | "SUCCEEDED"
    | "PROCESSING"
    | "PRIVATE_RESTRICTED"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "REAUTH_REQUIRED"
    | "QUOTA_BLOCKED"
    | "TIMED_OUT";

  youtubeVideoId?: string;
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

Sprint 6 updates Sprint 2/3/4/5 worker routing.

## 19.1 Adapter Routing

```txt id="x6a2qn"
if target.publishMode = MOCK:
  use MockSocialPublisherAdapter

if target.publishMode = LIVE_META and platform = FACEBOOK:
  use MetaFacebookPagePublisherAdapter

if target.publishMode = LIVE_META and platform = INSTAGRAM:
  use MetaInstagramPublisherAdapter

if target.publishMode = LIVE_PINTEREST and platform = PINTEREST:
  use PinterestPublisherAdapter

if target.publishMode = LIVE_GOOGLE and platform = YOUTUBE:
  use GoogleYouTubePublisherAdapter

else:
  mark FAILED_PERMANENT or BLOCKED
```

---

## 19.2 YouTube Worker Lifecycle

```txt id="foeb76"
1. Claim due YouTube target.
2. Validate target belongs to workspace.
3. Validate post belongs to workspace.
4. Validate SocialAccount belongs to workspace.
5. Validate SocialAccount status is CONNECTED.
6. Refresh Google access token if needed.
7. Validate YouTube upload quota reservation.
8. Validate uploaded media is MP4 video.
9. Create SocialPublishAttempt.
10. Create YouTubeUploadJob.
11. Stream/upload video to YouTube.
12. Store YouTube video ID.
13. Store sanitized response.
14. Update target/post status.
15. Store quota and upload diagnostics.
```

---

# 20. State Machine Updates

Sprint 6 can reuse the existing statuses but adds YouTube-specific upload states.

## 20.1 Target Statuses

Ensure these exist:

```prisma id="uivird"
enum SocialSchedulerTargetStatus {
  SELECTED
  SCHEDULED
  DUE
  PROCESSING
  PLATFORM_PROCESSING
  PUBLISHED_MOCK
  PUBLISHED
  PRIVATE_RESTRICTED
  RETRYING
  REAUTH_REQUIRED
  LIMIT_REACHED
  QUOTA_BLOCKED
  FAILED
  SKIPPED
  CANCELLED
}
```

## 20.2 Attempt Statuses

Ensure these exist:

```prisma id="401ymt"
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
  QUOTA_BLOCKED
  PRIVATE_RESTRICTED
  TIMED_OUT
  SKIPPED
}
```

## 20.3 YouTube Status Mapping

```txt id="xv2f5r"
YouTube upload success → target PUBLISHED, attempt SUCCEEDED
YouTube upload forced private → target PRIVATE_RESTRICTED, attempt PRIVATE_RESTRICTED
Google 401/invalid token → target REAUTH_REQUIRED, attempt REAUTH_REQUIRED
Google insufficient scope → target REAUTH_REQUIRED or FAILED, attempt FAILED_PERMANENT
YouTube upload quota exhausted → target QUOTA_BLOCKED, attempt QUOTA_BLOCKED
Google/YouTube 5xx → target RETRYING, attempt FAILED_RETRYABLE
Invalid media/title/metadata → target FAILED, attempt FAILED_PERMANENT
Timeout before response → target RETRYING, attempt TIMED_OUT
```

---

# 21. Parent Post Recalculation

Use existing multi-target recalculation from Sprint 5, with YouTube additions:

```txt id="0n8y5p"
If any target PROCESSING → post PROCESSING
If any target PLATFORM_PROCESSING → post PROCESSING
If all live targets PUBLISHED → post PUBLISHED
If all YouTube-only targets PRIVATE_RESTRICTED → post PRIVATE_RESTRICTED
If some targets PUBLISHED and some PRIVATE_RESTRICTED → post PARTIALLY_PUBLISHED
If some live targets PUBLISHED and some RETRYING → post PARTIALLY_PUBLISHED
If some live targets PUBLISHED and some FAILED → post PARTIALLY_FAILED
If any target REAUTH_REQUIRED and none processing → post REAUTH_REQUIRED
If any target LIMIT_REACHED/RATE_LIMITED/QUOTA_BLOCKED and none processing → post RETRYING or QUOTA_BLOCKED
If all targets FAILED → post FAILED
If all targets CANCELLED → post CANCELLED
```

---

# 22. Media Validation Rules

Sprint 6 live YouTube publishing supports video only.

## 22.1 Allowed Media

Strict Sprint 6 MVP:

```txt id="ez5b0k"
video/mp4
```

Optional after testing/transcoding:

```txt id="a986ay"
video/quicktime
video/webm
```

The YouTube `videos.insert` docs accept `video/*` and `application/octet-stream`, but product-side validation should stay stricter in Sprint 6 to avoid upload failures from unsupported codecs or untested containers.

## 22.2 Blocked Media

```txt id="1quixe"
image/jpeg
image/png
image/webp
multiple images
PDF
GIF
MOV/QuickTime unless transcoding exists
```

## 22.3 File Size

YouTube allows large uploads up to 256 GB through the API, but Sprint 1’s product upload limit was 200 MB for videos. Keep Sprint 6 aligned with Sprint 1 unless storage/upload architecture is upgraded. YouTube’s larger technical limit should not override your current product upload limit.

Sprint 6 product limit:

```txt id="wtevt6"
Max video upload: 200 MB
```

---

# 23. API Contracts

## 23.1 Start YouTube OAuth

```txt id="uk26hi"
POST /api/v0/social-accounts/google/youtube/connect/start
```

Body:

```json id="8f1w4h"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Response:

```json id="mn095o"
{
  "redirectUrl": "https://google-oauth-url"
}
```

---

## 23.2 YouTube OAuth Callback

```txt id="v4m2dg"
GET /api/v0/social-accounts/google/youtube/callback?code=...&state=...
```

Behavior:

```txt id="7d4m88"
Validate state
Exchange code
Store token securely
Fetch YouTube channel identity
Create/update SocialAccount
Redirect to Social Accounts page
```

---

## 23.3 Validate YouTube Channel

```txt id="awgu2u"
POST /api/v0/social-accounts/{socialAccountId}/validate-youtube
```

Body:

```json id="fx7n15"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="txsiog"
{
  "status": "CONNECTED",
  "canUpload": true,
  "missingPermissions": [],
  "auditStatus": "unverified",
  "defaultPrivacyStatus": "private"
}
```

---

## 23.4 Get YouTube Quota Summary

```txt id="ljkxnf"
GET /api/v0/social-scheduler/youtube/quota?workspaceId=workspace_id&date=2026-09-03
```

Response:

```json id="g5p1i0"
{
  "quotaDate": "2026-09-03",
  "dailyLimit": 100,
  "usedCount": 12,
  "reservedCount": 8,
  "availableCount": 80,
  "resetTimezone": "America/Los_Angeles"
}
```

---

## 23.5 Save YouTube Target

Update existing target endpoint:

```txt id="olsyaf"
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json id="5zxtsl"
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "YOUTUBE",
      "publishMode": "LIVE_GOOGLE",
      "socialAccountId": "social_account_id",
      "platformOptions": {
        "title": "Luxury Apartment Walkthrough | Mantri Developers",
        "description": "A complete walkthrough of the project highlights.",
        "privacyStatus": "private",
        "categoryId": "22",
        "tags": ["real estate", "luxury homes", "Bangalore"],
        "madeForKids": false,
        "notifySubscribers": false
      }
    }
  ]
}
```

Validation:

```txt id="gx2mfi"
socialAccountId must belong to workspace
media must be valid MP4 video
title must exist and be <= 100 characters
privacyStatus must be private/unlisted/public
madeForKids must be true or false
quota must be available
```

---

## 23.6 Get YouTube Upload Job

Admin/developer or post-detail UI:

```txt id="zr9fru"
GET /api/v0/social-scheduler/youtube/upload-jobs/{jobId}?workspaceId=workspace_id
```

Response:

```json id="q8gnh8"
{
  "uploadJobId": "job_id",
  "status": "UPLOADED",
  "youtubeVideoId": "abc123",
  "youtubeVideoUrl": "https://youtube.com/watch?v=abc123",
  "privacyStatus": "private",
  "uploadStartedAt": "2026-09-03T06:00:00.000Z",
  "uploadFinishedAt": "2026-09-03T06:04:00.000Z"
}
```

---

# 24. Frontend Components

Add:

```txt id="pg3hkp"
YouTubeConnectCard.tsx
YouTubeConnectConfirmModal.tsx
YouTubeChannelCard.tsx
YouTubeTargetSelector.tsx
YouTubeVideoFields.tsx
YouTubePrivacySelector.tsx
YouTubeMadeForKidsSelector.tsx
YouTubeQuotaBadge.tsx
YouTubeAuditWarning.tsx
YouTubeUploadTimelineItem.tsx
YouTubeUploadStatusPanel.tsx
```

Update:

```txt id="ekzdlb"
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

# 25. UX Copy

## 25.1 Social Accounts Page

YouTube section title:

```txt id="lvw4nl"
YouTube Channels
```

Subtitle:

```txt id="757db9"
Connect YouTube channels to schedule approved video uploads.
```

Button:

```txt id="2l633x"
Connect YouTube
```

---

## 25.2 Target Step

YouTube card helper:

```txt id="tw2r73"
YouTube supports video uploads only. Use an MP4 video for live scheduling.
```

If image selected:

```txt id="rq1x8p"
YouTube is unavailable because this post uses image media.
```

If quota exhausted:

```txt id="ip4zbd"
YouTube upload quota is full for this day.
```

---

## 25.3 Audit Warning

```txt id="v87k3t"
This YouTube API project is not verified/audited yet. Uploads may be restricted to private visibility.
```

---

## 25.4 Success Timeline

```txt id="elgle5"
Uploaded to YouTube
```

Body:

```txt id="3ye0hz"
The scheduled video was uploaded to the selected YouTube channel.
```

Button:

```txt id="p0rxcn"
View on YouTube
```

Only show this button if a real video URL exists.

---

## 25.5 Private Restricted Timeline

```txt id="hjf8td"
Uploaded as private
```

Body:

```txt id="yxpq0p"
YouTube accepted the upload, but the API project may restrict visibility until verification/audit is complete.
```

---

## 25.6 Failure Timeline

```txt id="43277b"
YouTube upload failed
```

Body:

```txt id="5xx69d"
Open the attempt details to review the channel, quota, media, permission, or upload issue.
```

---

# 26. Error Handling

## 26.1 OAuth Cancelled

```txt id="9h71by"
YouTube connection was cancelled.
```

Action:

```txt id="28cnve"
Try again
```

---

## 26.2 OAuth State Invalid

```txt id="bc4wrx"
This YouTube connection session expired. Please start again.
```

Action:

```txt id="oa9yvv"
Reconnect YouTube
```

---

## 26.3 Missing Scope

```txt id="boscku"
YouTube upload permission was not granted.
```

Action:

```txt id="798c87"
Reconnect and approve permissions
```

---

## 26.4 No Channel Found

```txt id="r1ko9h"
No YouTube channel was found for this Google account.
```

Body:

```txt id="cbk9x8"
Use a Google account that owns or manages a YouTube channel.
```

---

## 26.5 Quota Exhausted

```txt id="mcj0l6"
YouTube upload quota is exhausted.
```

Body:

```txt id="seew5j"
Choose another date or remove the YouTube target.
```

---

## 26.6 Reconnect Required

```txt id="1pmr51"
YouTube channel needs reconnection.
```

Action:

```txt id="oreckp"
Reconnect YouTube
```

---

## 26.7 Unsupported Media

```txt id="m509t8"
This media is not eligible for YouTube publishing.
```

Action:

```txt id="5ncp7a"
Use an MP4 video
```

---

## 26.8 Upload Timeout

```txt id="oh0ycv"
YouTube upload timed out.
```

Body:

```txt id="8c8rxq"
The worker will retry if the upload did not complete.
```

---

# 27. Retry Rules

Use Sprint 2 retry foundation.

## 27.1 Retryable

Retry:

```txt id="f3jd1l"
Google/YouTube 5xx
Network timeout
Upload connection interruption
Temporary quota read failure
Temporary token refresh failure
Unknown timeout before response
```

## 27.2 Permanent

Fail permanently:

```txt id="87cn8j"
Invalid video format
Missing title
Title over 100 characters
Invalid privacy status
Invalid category ID
Missing made-for-kids value
No YouTube channel found
Insufficient permission after reconnect attempt
Content rejected by YouTube
```

## 27.3 Reauth

Mark reauth required:

```txt id="1ymg04"
Access token expired and refresh failed
Refresh token revoked
User revoked app access
Required scope removed
CredentialRef missing
```

## 27.4 Quota Blocked

Mark quota blocked:

```txt id="ecuv1y"
videos.insert quota exhausted
daily project upload reservation unavailable
quota ledger says no available uploads
```

---

# 28. Security Requirements

Sprint 6 must preserve all earlier security rules.

## 28.1 OAuth State Security

```txt id="ftelt3"
State must be random and unguessable.
State must be stored hashed.
State must expire quickly.
State must be single-use.
State must bind workspaceId.
State must bind userId.
Callback must reject reused/expired state.
```

## 28.2 Token Security

Never expose:

```txt id="fuptrk"
Google access token
Google refresh token
Google client secret
OAuth raw state secret
B2 signed URL
B2 secret
```

## 28.3 Workspace Isolation

Must enforce:

```txt id="g6te89"
YouTube channel connected to Workspace A cannot be selected in Workspace B.
Worker validates target.workspaceId, post.workspaceId, and socialAccount.workspaceId before upload.
User without workspace access cannot view channel/account/attempts.
```

## 28.4 Attempt Sanitization

Attempt JSON may store:

```txt id="f77q2x"
platform
youtube title
privacy status
category ID
tag count
mediaAssetId
mimeType
byteSize
quota reservation ID
provider error code
sanitized diagnostics
```

Attempt JSON must not store:

```txt id="bb4v82"
tokens
signed URLs
raw private object keys
client secrets
raw provider auth headers
```

---

# 29. Functional Test Cases

## 29.1 OAuth

```txt id="khkv3u"
Logged-out user cannot start Google/YouTube OAuth.
```

```txt id="dcnmlz"
User without workspace permission cannot start Google/YouTube OAuth.
```

```txt id="ktne02"
OAuth state is created with workspaceId and userId.
```

```txt id="kwjivv"
Expired OAuth state is rejected.
```

```txt id="o5ztko"
Reused OAuth state is rejected.
```

---

## 29.2 Account Connection

```txt id="jhxqpt"
Successful OAuth creates SocialAccount with provider GOOGLE and platform YOUTUBE.
```

```txt id="ntxktr"
SocialAccount stores credentialRef, not raw token.
```

```txt id="e1i1kz"
SocialAccount stores granted scopes in scopesJson.
```

```txt id="j4e7d0"
Connected YouTube channel appears on Social Accounts page.
```

---

## 29.3 Workspace Isolation

```txt id="787s36"
Workspace A YouTube channel does not appear in Workspace B.
```

```txt id="ab9e8t"
Worker refuses to publish if target, account, and post do not belong to same workspace.
```

```txt id="q96qrf"
User without workspace access cannot view YouTube attempts.
```

---

## 29.4 Target Selection

```txt id="tveqs7"
YouTube live target appears only when channel is connected.
```

```txt id="ypjk69"
MP4 video upload allows YouTube live target.
```

```txt id="rv970j"
Image upload blocks YouTube live target.
```

```txt id="ji2f2b"
MOV upload blocks YouTube live target unless transcoding is enabled.
```

```txt id="asfzy4"
Continue is blocked until title, description, privacy status, and made-for-kids value exist.
```

---

## 29.5 Quota

```txt id="out10p"
Scheduling a YouTube target creates upload reservation if quota is available.
```

```txt id="vixzwq"
Scheduling is blocked if quota is exhausted.
```

```txt id="hiexe7"
Cancelling a scheduled YouTube post releases the reservation.
```

```txt id="hurdao"
Worker consumes reservation when upload begins.
```

---

## 29.6 Worker Upload

```txt id="c5n8ue"
Create scheduled YouTube MP4 video post.
Run worker after scheduledAt.
Verify:
- target claimed
- attempt created
- Google token resolved securely
- quota reservation consumed
- YouTubeUploadJob created
- videos.insert called
- YouTube video ID stored
- target marked PUBLISHED or PRIVATE_RESTRICTED
- parent post recalculated
```

---

## 29.7 Reauth

```txt id="2e56wi"
Simulate expired/revoked refresh token.
Verify:
- SocialAccount becomes REAUTH_REQUIRED
- target becomes REAUTH_REQUIRED
- timeline shows reconnect required
```

---

## 29.8 Security

```txt id="mbo0lr"
Frontend never receives Google access token.
```

```txt id="vwzwp1"
Attempt requestJson does not contain token.
```

```txt id="dmm3jm"
Attempt responseJson does not contain token.
```

```txt id="ukqffu"
Attempt diagnostics do not contain signed B2 URL.
```

```txt id="gd3qtj"
Logs do not contain token.
```

---

# 30. Acceptance Criteria

Sprint 6 is complete when:

## Account Wiring

```txt id="z1drby"
Admin can click Connect YouTube.
OAuth state is created and validated.
Google OAuth callback works.
YouTube channel identity is fetched.
YouTube SocialAccount is saved to active workspace.
Token material is stored only through credentialRef.
Connected YouTube channel appears on Social Accounts page.
```

## Scheduler UX

```txt id="qpfrmy"
YouTube appears as live connected in Target step.
YouTube is available only for video posts.
User can choose YouTube channel.
User can enter title, description, privacy status, tags, category, and made-for-kids value.
Review step warns about quota and audit/private-mode constraints.
Review step requires confirmation before scheduling live YouTube target.
```

## Quota

```txt id="af662y"
Quota ledger exists.
YouTube upload reservation is created at schedule time.
Quota exhaustion blocks scheduling.
Reservation is consumed at upload.
Reservation is released on cancellation before upload.
```

## Worker + Publishing

```txt id="fjtfla"
Sprint 2 worker processes due YouTube targets.
Worker validates workspace/account/target/media ownership.
Worker creates attempt before provider call.
Worker uploads MP4 video through YouTube adapter.
Successful upload stores YouTube video ID.
Successful upload stores external video URL if available.
Failed upload maps to RETRYING, FAILED, REAUTH_REQUIRED, or QUOTA_BLOCKED correctly.
Attempt timeline shows result.
```

## Security

```txt id="kx7fev"
No token leakage.
No cross-workspace account access.
No permanent public B2 URL exposure.
No raw signed URL stored in JSONB.
Worker validates workspace/account/target before publishing.
```

---

# 31. Sprint 6 Deliverables

## Frontend

```txt id="okrgsv"
YouTube section on Social Accounts page
Connect YouTube modal
Connected YouTube channel card
YouTube target selector
YouTube video metadata fields
YouTube privacy selector
Made-for-kids selector
YouTube quota badge
YouTube audit warning
YouTube upload timeline item
Updated Scheduler Review step
Updated Scheduler Detail page
```

## Backend

```txt id="pcmetq"
Google/YouTube OAuth start endpoint
Google/YouTube OAuth callback endpoint
Google credential service
YouTube channel discovery service
YouTube quota ledger service
YouTube quota reservation service
YouTube target validation
GoogleYouTubePublisherAdapter
Worker adapter routing update
YouTube error classification
Token refresh handling
Upload job lifecycle handling
```

## Database

```txt id="kkh3iu"
SocialAccount provider GOOGLE support
SocialAccount type YOUTUBE_CHANNEL support
YouTubeUploadQuotaLedger model
YouTubeUploadReservation model
YouTubeUploadJob model
SocialPublishTarget YouTube fields
SocialPublishAttempt YouTube lifecycle support
QUOTA_BLOCKED / PRIVATE_RESTRICTED statuses
Workspace indexes
Quota indexes
```

## Tests

```txt id="o6sm61"
Google OAuth tests
Workspace isolation tests
Token non-leakage tests
YouTube channel discovery tests
YouTube target validation tests
Quota reservation tests
Quota release tests
Worker upload tests
Reauth tests
Private/audit warning tests
Attempt timeline tests
```

---

# 32. Sprint 6 Final Implementation Summary

Build this in Sprint 6:

```txt id="njpviu"
Social Accounts page
→ Connect YouTube
→ Google OAuth callback
→ Store Google credentialRef
→ Discover YouTube channel
→ Save channel to active workspace
→ Select YouTube in Scheduler Target step
→ Require MP4 video
→ Add YouTube title, description, privacy, tags, category, made-for-kids
→ Reserve upload quota
→ Schedule live YouTube target
→ Sprint 2 worker processes due target
→ YouTube adapter uploads video through videos.insert
→ Attempt timeline shows real result
```

Do not build Twitter/X yet.

Do not build YouTube analytics yet.

Do not build comments, playlists, captions, or custom thumbnails as required acceptance.

Do not bypass the Sprint 2 worker.

Sprint 6’s job is to make YouTube video publishing reliable through the same account, worker, attempt, retry, quota, and status framework already established in Sprints 1–5.

After Sprint 6, the next logical sprint is:

```txt id="7rpq7h"
Sprint 7 — Twitter/X Account Wiring and Paid API Publishing
```

Optional alternative if the product wants deeper YouTube before X:

```txt id="vkndw1"
Sprint 7 — YouTube Hardening: Thumbnail Upload, Processing Checks, Captions, and Quota Dashboard
```