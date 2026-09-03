# Sakhaa Forge Social Scheduler — Sprint 7 Documentation  
## Sprint 7: Twitter/X Account Wiring, Paid API Guardrails, Media Upload, and Real X Post Publishing

## 0. Sprint Intent

Sprint 7 continues directly from Sprints 1–6.

Sprint 1 created:

```txt id="8ogx5m"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail page
```

Sprint 2 created:

```txt id="w08btq"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ Publish attempts
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 created:

```txt id="c99fdh"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped Facebook Page accounts
→ Real Facebook Page publishing
```

Sprint 4 created:

```txt id="5m16ye"
Instagram account discovery
→ Instagram target selection
→ Instagram media-container publishing
→ Instagram lifecycle tracking
```

Sprint 5 created:

```txt id="sct79o"
Pinterest OAuth
→ Pinterest account wiring
→ Board discovery
→ Image Pin publishing
```

Sprint 6 created:

```txt id="un4hj4"
Google OAuth
→ YouTube channel wiring
→ YouTube quota ledger
→ Video-only YouTube publishing
```

Sprint 7 now adds Twitter/X as an **optional paid publishing integration**:

```txt id="jqs6qq"
X OAuth with PKCE
→ X account connection
→ Workspace-scoped X account
→ Paid API cost acknowledgement
→ X media upload
→ X post creation
→ Worker publishes through Sprint 2 execution system
→ Attempt timeline shows real X result, cost, rate limit, retry, or failure
```

X must **not bypass Sprint 2’s worker, attempt, retry, locking, and status system**.

---

## 1. Sprint 7 Name

```txt id="09ehlq"
Sprint 7 — Twitter/X Account Wiring and Paid API Publishing
```

Alternative internal label:

```txt id="eqou0b"
Sprint 7 — X Paid Publishing Adapter
```

---

## 2. Sprint 7 Product Positioning

Twitter/X must be treated differently from Facebook, Instagram, Pinterest, and YouTube.

The X API uses pay-per-usage pricing with no subscriptions, and credits are deducted as API requests are made. X currently lists write costs such as `Post: Create` at `$0.015` per request and `Post: Create (with URL)` at `$0.200` per request, with current rates subject to change and available in the Developer Console.

Therefore Sprint 7 must not silently enable X for all users.

Product decision:

```txt id="qkg8kq"
X publishing is optional.
X publishing is disabled by default.
X publishing requires admin enablement.
X publishing requires user cost acknowledgement before scheduling.
X publishing must estimate and log expected API cost.
```

This is the first scheduler sprint where **API cost awareness becomes a core UX requirement**, not just an internal backend note.

---

## 3. Sprint 7 Outcome

By the end of Sprint 7:

1. Admin can enable X integration using environment flags.
2. Workspace admin can connect an X account through OAuth 2.0 Authorization Code Flow with PKCE.
3. X tokens are stored securely through `credentialRef`.
4. Connected X account appears in Social Accounts.
5. X appears in Scheduler target step only when enabled.
6. User sees paid API warning before selecting X live publishing.
7. User can schedule a text/image/video X post.
8. Worker uploads media to X if media exists.
9. Worker creates X post through `POST /2/tweets`.
10. Worker stores external X post ID and URL.
11. Attempt timeline shows publish result, estimated cost, actual charged operation type, and rate-limit metadata.
12. X rate limits are respected.
13. X posting failures are mapped into existing retry/failure/reauth states.
14. X-specific AI media and paid partnership disclosures are supported.
15. No X token, signed URL, or secret leaks to frontend/logs/attempt JSON.

---

## 4. In Scope

Sprint 7 includes:

```txt id="p59xha"
X developer app configuration documentation
X OAuth 2.0 Authorization Code Flow with PKCE
X account identity discovery
X token storage through credentialRef
X account card in Social Accounts page
X paid API cost warning
X cost acknowledgement before scheduling
X text post publishing
X single-image post publishing
X multi-image post publishing up to 4 images
X single-video post publishing
X media upload flow
X media_id handling
X made_with_ai disclosure
X paid_partnership disclosure
X rate-limit metadata capture
X usage/cost ledger
X worker adapter routing
X attempt timeline integration
Functional tests
```

---

## 5. Out of Scope

Sprint 7 must **not** implement:

```txt id="ay95it"
X direct messages
X replies as required acceptance
X quote posts as required acceptance
X polls
X articles
X communities
X paid/super-follower-only posts
X nullcast ads
X analytics dashboard
X trends research
X social inbox
X deletion/sync compliance
X webhook activity subscriptions
AI-generated X captions
Bulk X campaign scheduling
```

Optional stretch only:

```txt id="jtctol"
Reply post support
Quote post support
Media alt text
```

Do not block Sprint 7 completion on these.

---

# 6. Platform Reality

## 6.1 X Post Creation

X uses:

```txt id="juwzyh"
POST /2/tweets
```

for creating posts. The X Create Posts reference defines the endpoint as `POST /2/tweets`, and its response returns a post ID/text object on success.

For a post body:

```txt id="y82kgn"
text is required unless media is provided
```

The official Create Posts reference states that `text` is required unless media is provided.

## 6.2 X Media Attachments

For media posts, media must be uploaded first, then attached during post creation using `media.media_ids`. A post may include up to **4 photos**, **1 animated GIF**, or **1 video**.

Sprint 7 supported combinations:

```txt id="4rd27w"
Text-only post
Text + 1 image
Text + up to 4 images
Text + 1 video
Media-only post if explicitly allowed
```

Blocked combinations:

```txt id="ihthvf"
More than 4 images
Image + video mixed in one X post
Multiple videos
Video + GIF
Carousel-style post beyond X media rules
```

## 6.3 X Media Limits

For default non-Premium accounts, X lists image max size as **5 MB**, animated GIF max as **15 MB**, and post video max as **8 GB / 20 minutes**. For Premium/verified accounts, post video can go up to **16 GB / 125 minutes**.

Sprint 7 product limits must be stricter than X’s maximums:

```txt id="sbrs8g"
Image: max 5 MB
GIF: disabled in Sprint 7 unless specifically implemented
Video: max 200 MB, aligned with Sprint 1 product media limit
Video duration: max 20 minutes
```

Reason:

```txt id="0t46hl"
Sakhaa Forge Sprint 1 already uses a 200 MB video upload limit.
Do not let X's large theoretical limits destabilize the scheduler upload architecture.
```

X also recommends using the chunked upload flow for all videos through initialize, append, and finalize endpoints.

---

# 7. X Pricing and Cost Guardrails

## 7.1 Official Pricing Reality

The X API is pay-per-usage. Writes/actions are charged per request. Current listed examples include:

```txt id="xfxff2"
Post: Create → $0.015 per request
Post: Create with URL → $0.200 per request
Media Metadata → $0.005 per request
```



Sprint 7 must therefore introduce a cost ledger.

---

## 7.2 Product Cost Rules

Before scheduling a live X target:

```txt id="8f0xrp"
Estimate X API cost.
Show cost warning.
Require explicit acknowledgement.
Store cost estimate.
Block if workspace/admin has not enabled X paid publishing.
```

Cost examples to show in UI:

```txt id="new98j"
Plain X post: estimated $0.015 API cost
X post containing a URL: estimated $0.200 API cost
Media metadata/alt text: additional cost if enabled
```

Do not show these as guaranteed eternal prices. Show:

```txt id="lhjm7l"
Pricing is based on current X API pricing and may change.
```

---

## 7.3 X Cost Ledger Model

Create:

```prisma id="va0hv4"
model XApiCostLedger {
  id                    String @id @default(uuid())

  workspaceId           String
  postId                String?
  targetId              String?
  attemptId             String?
  socialAccountId       String?

  operation             String
  estimatedUnitCostUsd  Decimal @db.Decimal(10, 4)
  actualUnitCostUsd     Decimal? @db.Decimal(10, 4)
  quantity              Int @default(1)

  estimatedTotalUsd     Decimal @db.Decimal(10, 4)
  actualTotalUsd        Decimal? @db.Decimal(10, 4)

  pricingVersion        String?
  costAcknowledgedBy    String?
  costAcknowledgedAt    DateTime?

  status                String @default("ESTIMATED")

  metadataJson          Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([workspaceId])
  @@index([targetId])
  @@index([attemptId])
  @@index([operation])
}
```

Possible statuses:

```txt id="5b2qlw"
ESTIMATED
ACKNOWLEDGED
RESERVED
CONSUMED
RELEASED
FAILED
```

---

## 7.4 Cost Acknowledgement UX

When the user selects X live target, show modal.

Title:

```txt id="ybe4yz"
X uses paid API actions
```

Body:

```txt id="m1c4pt"
Publishing to X can create API charges. Posts with links may cost materially more than plain posts.
```

Cost rows:

```txt id="tplckn"
Post create: estimated $0.015
Post create with URL: estimated $0.200
Media metadata: optional, additional
```

Checkbox:

```txt id="cog24o"
I understand this X post may create API charges.
```

Buttons:

```txt id="63ho0e"
Enable X for this post
Cancel
```

Primary button disabled until checkbox is checked.

---

# 8. X Rate Limits

X rate limits are per endpoint and often apply per 15-minute or 24-hour windows. X says exceeding limits returns a `429` until the window resets, and response headers include `x-rate-limit-limit`, `x-rate-limit-remaining`, and `x-rate-limit-reset`.

For post creation:

```txt id="221k45"
POST /2/tweets
Per app: 10,000 / 24h
Per user: 100 / 15min
```



For media upload:

```txt id="ffmlse"
POST /2/media/upload: 50,000 / 24h per app, 500 / 15min per user
POST /2/media/upload/initialize: 180,000 / 24h per app, 1,875 / 15min per user
POST /2/media/upload/:id/append: 180,000 / 24h per app, 1,875 / 15min per user
POST /2/media/upload/:id/finalize: 180,000 / 24h per app, 1,875 / 15min per user
```



## 8.1 Product Rate Limits

Do not use the full provider limit as the product cap.

Recommended Sprint 7 caps:

```txt id="0phuaf"
Per connected X account:
- max 50 scheduled posts / 15 minutes
- max 200 scheduled X posts / day

Per Sakhaa Forge app:
- max 5,000 X posts / day unless explicitly raised

Per workspace:
- max 100 X posts / day by default
```

Reason:

```txt id="98qo8a"
Leave headroom for retries, failed attempts, media upload calls, diagnostics, and future account usage.
```

---

# 9. OAuth and Scopes

X supports OAuth 2.0 Authorization Code Flow with PKCE. Its docs state that access tokens from this flow last two hours by default unless `offline.access` is used, and that `offline.access` issues refresh tokens.

## 9.1 Required Scopes

Sprint 7 should request:

```txt id="o7k6i4"
tweet.read
tweet.write
users.read
media.write
offline.access
```

Why:

```txt id="fk41t6"
tweet.read → confirm created post / fetch basic post if needed
tweet.write → create X posts
users.read → identify connected user/account
media.write → upload media
offline.access → refresh tokens for scheduled publishing
```

## 9.2 OAuth Flow

Use:

```txt id="gm70zi"
OAuth 2.0 Authorization Code Flow with PKCE
```

Do not use app-only bearer token for posting on behalf of users.

---

# 10. Environment Variables

Add:

```txt id="5p17ja"
X_CLIENT_ID=
X_CLIENT_SECRET=
X_REDIRECT_URI=
X_OAUTH_STATE_SECRET=
X_API_BASE_URL=https://api.x.com/2
X_CONNECT_ENABLED=false
X_PAID_PUBLISHING_ENABLED=false
X_DEFAULT_COST_GUARD_ENABLED=true
```

Feature flags:

```txt id="84yplj"
SOCIAL_SCHEDULER_X_ENABLED=false
SOCIAL_SCHEDULER_X_TEXT_POSTS_ENABLED=true
SOCIAL_SCHEDULER_X_IMAGE_POSTS_ENABLED=true
SOCIAL_SCHEDULER_X_VIDEO_POSTS_ENABLED=true
SOCIAL_SCHEDULER_X_GIF_POSTS_ENABLED=false
SOCIAL_SCHEDULER_X_ALT_TEXT_ENABLED=false
SOCIAL_SCHEDULER_X_REPLY_POSTS_ENABLED=false
SOCIAL_SCHEDULER_X_QUOTE_POSTS_ENABLED=false
```

Cost flags:

```txt id="jo8mbs"
X_COST_POST_CREATE_USD=0.015
X_COST_POST_CREATE_WITH_URL_USD=0.200
X_COST_MEDIA_METADATA_USD=0.005
X_COST_PRICING_VERSION=2026-09
X_REQUIRE_COST_ACK=true
```

Rate-limit product caps:

```txt id="has744"
X_PRODUCT_MAX_POSTS_PER_WORKSPACE_PER_DAY=100
X_PRODUCT_MAX_POSTS_PER_ACCOUNT_PER_DAY=200
X_PRODUCT_MAX_POSTS_PER_ACCOUNT_PER_15MIN=50
X_PRODUCT_MAX_POSTS_PER_APP_PER_DAY=5000
```

Keep prior worker variables:

```txt id="69yykl"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Security rule:

```txt id="p8c00i"
No X_* secret may be exposed to frontend.
```

Allowed public flag only:

```txt id="vswzx2"
NEXT_PUBLIC_X_CONNECT_ENABLED=true/false
```

---

# 11. Data Model Updates

Sprint 3 introduced the common `SocialAccount` model.

Sprint 7 reuses it.

---

## 11.1 Ensure Provider Enum Includes X

```prisma id="qf0v09"
enum SocialAccountProvider {
  META
  GOOGLE
  PINTEREST
  X
}
```

---

## 11.2 Ensure Account Type Includes X

```prisma id="8bsr9r"
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

## 11.3 X SocialAccount Shape

Save connected X account as:

```txt id="fmrmzd"
provider = X
platform = X
accountType = X_USER
externalAccountId = x_user_id
credentialRef = secure X OAuth token reference
```

Example:

```json id="w57bbe"
{
  "provider": "X",
  "platform": "X",
  "accountType": "X_USER",
  "displayName": "Mantri Developers",
  "username": "mantridevelopers",
  "externalAccountId": "123456789",
  "status": "CONNECTED",
  "scopesJson": [
    "tweet.read",
    "tweet.write",
    "users.read",
    "media.write",
    "offline.access"
  ],
  "metadataJson": {
    "paidPublishingEnabled": true,
    "supportsTextPosts": true,
    "supportsImagePosts": true,
    "supportsVideoPosts": true,
    "supportsGifPosts": false
  },
  "credentialRef": "secret_ref"
}
```

---

## 11.4 New Model — XMediaUploadJob

Track X media upload separately from the final post attempt.

```prisma id="v0o8il"
model XMediaUploadJob {
  id                    String @id @default(uuid())

  workspaceId           String
  postId                String
  targetId              String
  attemptId             String?
  socialAccountId       String

  mediaAssetId          String
  mediaCategory         String
  uploadStatus          String @default("CREATED")

  xMediaId              String?
  xMediaIdString        String?

  uploadStartedAt       DateTime?
  uploadFinishedAt      DateTime?
  finalizedAt           DateTime?
  processingCheckedAt   DateTime?

  errorCode             String?
  errorMessage          String?

  diagnosticsJson       Json?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([workspaceId, postId])
  @@index([targetId])
  @@index([attemptId])
  @@index([xMediaIdString])
  @@index([uploadStatus])
}
```

Possible `uploadStatus` values:

```txt id="rjmi95"
CREATED
INITIALIZED
APPENDING
FINALIZED
PROCESSING
READY
FAILED
REAUTH_REQUIRED
RATE_LIMITED
```

---

## 11.5 New Model — XApiCostLedger

Use the model defined in Section 7.3.

This ledger is required in Sprint 7.

---

## 11.6 Update SocialPublishTarget

Add X fields:

```prisma id="yl2czh"
xMediaUploadJobId       String?
xCostAcknowledgedAt     DateTime?
xCostAcknowledgedBy     String?
platformOptionsJson     Json?
```

Example `platformOptionsJson`:

```json id="dldyou"
{
  "x": {
    "text": "Explore the new luxury walkthrough.",
    "containsUrl": false,
    "madeWithAi": true,
    "paidPartnership": false,
    "replySettings": null,
    "mediaMode": "SINGLE_VIDEO",
    "costAcknowledged": true,
    "estimatedCostUsd": "0.015"
  }
}
```

---

## 11.7 Update SocialPublishAttempt

Ensure provider fields exist:

```prisma id="2kgoq4"
provider              SocialAccountProvider?
socialAccountId       String?
providerRequestId     String?
providerErrorCode     String?
providerTraceId       String?
```

X lifecycle stage:

```prisma id="zf8813"
platformLifecycleStage String?
```

Possible stages:

```txt id="3s5dxv"
ESTIMATE_COST
UPLOAD_MEDIA
FINALIZE_MEDIA
CREATE_POST
FETCH_RESULT
```

---

# 12. Social Accounts UX Updates

Route remains:

```txt id="as2p9k"
/app/social-accounts
```

Sprint 7 adds an X section.

---

## 12.1 X Section

Title:

```txt id="s4m0n4"
Twitter/X Accounts
```

Subtitle:

```txt id="ydg5iv"
Connect X accounts for optional paid post publishing.
```

Primary button:

```txt id="su1o38"
Connect X
```

Secondary button:

```txt id="xtnj48"
View API cost settings
```

If disabled by env:

```txt id="syj4ql"
X publishing is disabled for this environment.
```

---

## 12.2 Empty State

Title:

```txt id="b6kq1h"
No X account connected
```

Body:

```txt id="0ktf1x"
Connect an X account before scheduling paid X posts for this workspace.
```

Button:

```txt id="6qxpxr"
Connect X
```

Disabled unless:

```txt id="yw9sug"
SOCIAL_SCHEDULER_X_ENABLED=true
X_CONNECT_ENABLED=true
```

---

## 12.3 Connect X Modal

Title:

```txt id="36dhix"
Connect X for this workspace?
```

Body:

```txt id="rtnxn4"
You are connecting this X account only for the active workspace. Other client workspaces will not get access to it.
```

Checklist:

```txt id="ncch0b"
Active workspace is correct
You manage this X account
You approve post creation permission
You approve media upload permission
You understand X uses paid API actions
```

Buttons:

```txt id="i9297e"
Continue to X
Cancel
```

Primary button disabled until all checklist items are checked.

---

## 12.4 Connected X Account Card

Each card shows:

```txt id="a3bt8p"
Display name
Username / handle
Connected workspace
Connected by
Last connected
Last token refresh
Paid publishing status
Daily workspace cap
Account status
```

Actions:

```txt id="uw6ytw"
Validate
Reconnect
Disconnect
View cost settings
```

Status badges:

```txt id="ffwlxi"
Connected
Paid publishing enabled
Paid publishing disabled
Reconnect required
Permission missing
Rate limited
Disconnected
```

---

# 13. X OAuth Flow

## 13.1 Start X OAuth

Endpoint:

```txt id="4moccz"
POST /api/v0/social-accounts/x/connect/start
```

Body:

```json id="h4eqbw"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Backend responsibilities:

```txt id="10wu46"
Validate authenticated user
Validate workspace permission
Validate X integration is enabled
Create OAuth state
Create PKCE code_verifier and code_challenge
Store hashed state and encrypted/verifiable PKCE data
Bind state to workspaceId and userId
Request required scopes
Build X OAuth URL
Return redirect URL
```

---

## 13.2 X OAuth Callback

Endpoint:

```txt id="3nn453"
GET /api/v0/social-accounts/x/callback?code=...&state=...
```

Backend responsibilities:

```txt id="0colqd"
Validate OAuth state
Reject expired/reused state
Resolve PKCE code_verifier
Exchange code for token
Store token material securely
Fetch connected X user identity
Create or update SocialAccount
Redirect to Social Accounts page
```

Redirect:

```txt id="094vr0"
/app/social-accounts?provider=x&connected=true
```

Do not put tokens in query params.

---

## 13.3 OAuth State Security

State must be:

```txt id="svyd6k"
Random
Hashed at rest
Single-use
Short-lived
Bound to workspaceId
Bound to userId
Bound to provider X
Bound to returnPath
```

PKCE verifier must be:

```txt id="o6k1ck"
Stored securely server-side
Short-lived
Never sent to frontend after OAuth start
Deleted or consumed after callback
```

---

# 14. Scheduler Target Step Updates

Route:

```txt id="uw1kb9"
/app/social-scheduler/new
```

Stage:

```txt id="z9u6q5"
Targets
```

Sprint 7 makes X live only when enabled.

---

## 14.1 X Card — Disabled Environment

Card title:

```txt id="8z2kr9"
Twitter/X
```

Badge:

```txt id="df11io"
Disabled
```

Body:

```txt id="bymbnh"
X publishing is not enabled for this environment because it uses paid API actions.
```

Button:

```txt id="y569or"
View requirements
```

---

## 14.2 X Card — Connected State

Card title:

```txt id="xfs0ts"
Twitter/X
```

Badge:

```txt id="dmdylj"
Live connected · Paid API
```

Account dropdown:

```txt id="dknul5"
Choose X account
```

Dropdown option format:

```txt id="bjm2j9"
@handle · Paid publishing enabled
```

Helper text:

```txt id="uj5bq3"
X posts use paid API actions. Review the estimated cost before scheduling.
```

Button:

```txt id="d1b2nn"
Review X cost
```

---

## 14.3 X Card — Not Connected State

Badge:

```txt id="fw5ytz"
Not connected
```

Body:

```txt id="rphjky"
Connect an X account before enabling live X publishing.
```

Buttons:

```txt id="faln43"
Connect X
Use mock mode
```

---

# 15. X-Specific Composer Fields

X should not blindly reuse the long caption from Instagram/Facebook.

Add X platform override fields after X target is selected.

## 15.1 Required Fields

```txt id="s7qs9h"
X post text
Cost acknowledgement
```

## 15.2 Optional Fields

```txt id="4wmepc"
Made with AI disclosure
Paid partnership disclosure
Reply settings
```

## 15.3 Field Details

### X post text

Label:

```txt id="fr0wlz"
X post text
```

Placeholder:

```txt id="frcnhv"
Write the X-specific version of this post...
```

Validation:

```txt id="ho61nb"
Required unless media-only posting is explicitly enabled.
```

### Made with AI

Label:

```txt id="dytjq6"
Contains AI-generated media
```

Helper:

```txt id="jz3apx"
Enable this if the uploaded creative was generated or materially altered with AI.
```

The X Create Posts API includes a `made_with_ai` boolean to disclose AI-generated media.

### Paid partnership

Label:

```txt id="zuwlqq"
Paid partnership
```

Helper:

```txt id="lkmm37"
Enable this if the post is sponsored or part of a paid partnership.
```

The X Create Posts API includes a `paid_partnership` boolean.

### Reply settings

Label:

```txt id="k9fgbv"
Who can reply?
```

Options:

```txt id="bd2d4c"
Everyone / Default
People you follow
Mentioned users
Subscribers
Verified users
```

For Sprint 7, keep default unless product specifically wants reply restriction.

---

# 16. Review Step Updates

Sprint 7 X checklist:

```txt id="3t1wad"
Workspace selected
Media uploaded or text entered
Draft content saved
X account connected
X paid publishing enabled
X cost acknowledged
X post text validated
Media combination valid
Schedule time valid
Live X publish mode enabled
```

Live confirmation checkbox:

```txt id="w36g3d"
I understand this post will publish to the selected X account and may create API charges.
```

Cost warning:

```txt id="v84fbi"
X API pricing may change. This estimate is based on the configured pricing version.
```

Multi-target warning:

```txt id="9h9ihr"
This post has multiple live targets. Each platform will publish independently and may succeed or fail separately.
```

---

# 17. X Publishing Flow

X publishing must use the Sprint 2 worker.

## 17.1 Text-Only Flow

```txt id="kxvwv7"
1. User schedules post with X live target.
2. Target stores socialAccountId and X platformOptionsJson.
3. Cost acknowledgement is stored.
4. Worker detects due X target.
5. Worker claims target safely.
6. Worker creates SocialPublishAttempt.
7. Worker validates X SocialAccount and credentialRef.
8. Worker refreshes X access token if needed.
9. Worker validates product cost/rate limit caps.
10. Worker creates X post using POST /2/tweets.
11. Worker stores returned X post ID.
12. Worker stores external X post URL.
13. Worker marks target PUBLISHED.
14. Worker recalculates parent post status.
15. Attempt timeline shows X result and cost.
```

---

## 17.2 Media Flow

For media posts:

```txt id="95g7t9"
1. Worker validates media combination.
2. Worker uploads each media asset to X.
3. Worker stores X media_id_string.
4. Worker creates X post using media.media_ids.
5. Worker stores X post ID and URL.
6. Worker updates attempt and target status.
```

X documentation states that media is uploaded first, then the returned `media_id` is passed during post creation.

---

## 17.3 Video Flow

Video must use chunked upload.

```txt id="e7m76q"
1. Initialize media upload.
2. Append chunks.
3. Finalize upload.
4. Poll/process if needed.
5. Create X post with finalized media ID.
```

X recommends chunked upload for all videos.

---

# 18. X Adapter

Create:

```txt id="k5pjht"
XPublisherAdapter
```

Recommended path:

```txt id="i80eyv"
apps/api/src/social-scheduler/adapters/x-publisher.adapter.ts
```

or `.mjs` equivalent if the current API uses `.mjs`.

---

## 18.1 Adapter Input

```ts id="fzdjgn"
type XPublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "X";
  publishMode: "LIVE_X";
  socialAccountId: string;
  xUserId: string;
  text: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  xOptions: {
    madeWithAi?: boolean;
    paidPartnership?: boolean;
    replySettings?: "following" | "mentionedUsers" | "subscribers" | "verified" | null;
    containsUrl: boolean;
    costAcknowledged: boolean;
    estimatedCostUsd: string;
  };
  draftContentJson: unknown;
};
```

---

## 18.2 Adapter Result

```ts id="wd0of2"
type XPublishResult = {
  status:
    | "SUCCEEDED"
    | "MEDIA_PROCESSING"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "REAUTH_REQUIRED"
    | "RATE_LIMITED"
    | "COST_BLOCKED"
    | "TIMED_OUT";

  xPostId?: string;
  externalPostId?: string;
  externalPostUrl?: string;

  xMediaIds?: string[];

  providerRequestId?: string;
  providerErrorCode?: string;
  errorCode?: string;
  errorMessage?: string;
  retryAfterMs?: number;

  estimatedCostUsd?: string;
  actualCostUsd?: string;

  diagnostics?: Record<string, unknown>;
};
```

---

# 19. Worker Updates

Sprint 7 updates the Sprint 2/3/4/5/6 worker routing.

## 19.1 Adapter Routing

```txt id="cjs9ig"
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

if target.publishMode = LIVE_X and platform = X:
  use XPublisherAdapter

else:
  mark FAILED_PERMANENT or BLOCKED
```

---

## 19.2 X Worker Lifecycle

```txt id="e97oqd"
1. Claim due X target.
2. Validate target belongs to workspace.
3. Validate post belongs to workspace.
4. Validate SocialAccount belongs to workspace.
5. Validate X integration is enabled.
6. Validate paid publishing is enabled.
7. Validate cost acknowledgement exists.
8. Validate SocialAccount status is CONNECTED.
9. Refresh X access token if needed.
10. Validate product rate caps.
11. Validate media combination.
12. Create SocialPublishAttempt.
13. Create cost ledger reservation/consumption record.
14. Upload media if present.
15. Create X post.
16. Store X post ID and URL.
17. Store sanitized rate-limit and cost diagnostics.
18. Update target/post status.
```

---

# 20. State Machine Updates

Sprint 7 reuses prior statuses and adds cost-specific status.

## 20.1 Target Statuses

Ensure these exist:

```prisma id="26xmue"
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
  COST_BLOCKED
  FAILED
  SKIPPED
  CANCELLED
}
```

---

## 20.2 Attempt Statuses

Ensure these exist:

```prisma id="br90bp"
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
  COST_BLOCKED
  PRIVATE_RESTRICTED
  TIMED_OUT
  SKIPPED
}
```

---

## 20.3 X Status Mapping

```txt id="jopkgr"
X post success → target PUBLISHED, attempt SUCCEEDED
X media still processing → target RETRYING or PLATFORM_PROCESSING, attempt PLATFORM_PROCESSING
X 401/invalid token → target REAUTH_REQUIRED, attempt REAUTH_REQUIRED
X missing scope → target REAUTH_REQUIRED or FAILED, attempt FAILED_PERMANENT
X 429/rate limit → target RETRYING, attempt RATE_LIMITED
X cost not acknowledged → target COST_BLOCKED, attempt COST_BLOCKED
X app paid publishing disabled → target COST_BLOCKED, attempt COST_BLOCKED
X invalid media combination → target FAILED, attempt FAILED_PERMANENT
X post rejected → target FAILED, attempt FAILED_PERMANENT
X 5xx/network timeout → target RETRYING, attempt FAILED_RETRYABLE or TIMED_OUT
```

---

# 21. Parent Post Recalculation

Use existing multi-target recalculation from Sprint 6, with X additions:

```txt id="lmd417"
If any target PROCESSING → post PROCESSING
If any target PLATFORM_PROCESSING → post PROCESSING
If all live targets PUBLISHED → post PUBLISHED
If some targets PUBLISHED and some RETRYING → post PARTIALLY_PUBLISHED
If some targets PUBLISHED and some FAILED → post PARTIALLY_FAILED
If any target REAUTH_REQUIRED and none processing → post REAUTH_REQUIRED
If any target LIMIT_REACHED/RATE_LIMITED/QUOTA_BLOCKED and none processing → post RETRYING
If any target COST_BLOCKED and none processing → post COST_BLOCKED
If all targets FAILED → post FAILED
If all targets CANCELLED → post CANCELLED
```

If the current enum does not have `COST_BLOCKED` at post level, add it or map to `FAILED` with clear target-level reason. Preferred:

```txt id="03q09q"
Add COST_BLOCKED at post level.
```

---

# 22. Media Validation Rules

## 22.1 Image Posts

Allow:

```txt id="oavpru"
image/jpeg
image/png
image/webp
```

Product validation:

```txt id="aq5gxu"
Max 5 MB per image
Max 4 images
No video mixed with image group
```

X supports JPG, PNG, GIF, and WEBP image media, with image size up to 5 MB.

## 22.2 Video Posts

Allow strict MVP:

```txt id="3rxx6o"
video/mp4
```

Product validation:

```txt id="iktk43"
Max 200 MB
Min duration 0.5 seconds
Max duration 20 minutes
Use tweet_video media category
```

X’s media documentation lists post video duration as 0.5 seconds to 20 minutes for default accounts and 0.5 seconds to 125 minutes for Premium/verified accounts.

## 22.3 GIF Posts

Sprint 7 default:

```txt id="ys0bz2"
Disabled
```

Reason:

```txt id="7cd8z6"
GIF upload has extra constraints and can fail during post creation even after upload.
```

X’s docs warn that animated GIFs may fail during post creation even if within file size limits and recommend additional constraints.

---

# 23. Cost and Rate-Limit Handling

## 23.1 Before Scheduling

Validate:

```txt id="04jmq1"
X enabled
Paid publishing enabled
Connected account exists
Cost acknowledgement checked
Estimated cost calculated
Workspace daily X cap not exceeded
Account daily X cap not exceeded
```

## 23.2 Before Worker Publish

Validate again:

```txt id="jy1d6f"
Cost acknowledgement still exists
Target not cancelled
SocialAccount still connected
Rate cap not exceeded
X paid publishing still enabled
```

## 23.3 On 429

If X returns 429:

```txt id="3wj9w6"
Read x-rate-limit-reset.
Set target RETRYING.
Set nextRetryAt based on reset.
Store rate-limit diagnostics.
```

X’s docs recommend checking `x-rate-limit-reset` and waiting until reset before retrying after rate-limit errors.

---

# 24. API Contracts

## 24.1 Start X OAuth

```txt id="z87az8"
POST /api/v0/social-accounts/x/connect/start
```

Body:

```json id="ysw7iz"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Response:

```json id="y6rjv1"
{
  "redirectUrl": "https://x-oauth-url"
}
```

---

## 24.2 X OAuth Callback

```txt id="mr03hl"
GET /api/v0/social-accounts/x/callback?code=...&state=...
```

Behavior:

```txt id="5rvb3n"
Validate state
Exchange code using PKCE verifier
Store token securely
Fetch X user identity
Create/update SocialAccount
Redirect to Social Accounts page
```

---

## 24.3 Validate X Account

```txt id="3x2xgm"
POST /api/v0/social-accounts/{socialAccountId}/validate-x
```

Body:

```json id="4igdu7"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="804o8t"
{
  "status": "CONNECTED",
  "canPost": true,
  "canUploadMedia": true,
  "missingPermissions": [],
  "paidPublishingEnabled": true
}
```

---

## 24.4 Estimate X Cost

```txt id="3yrbxz"
POST /api/v0/social-scheduler/x/estimate-cost
```

Body:

```json id="y1rgjd"
{
  "workspaceId": "workspace_id",
  "postId": "post_id",
  "containsUrl": true,
  "mediaMetadataEnabled": false
}
```

Response:

```json id="tid02v"
{
  "pricingVersion": "2026-09",
  "operation": "POST_CREATE_WITH_URL",
  "estimatedCostUsd": "0.200",
  "requiresAcknowledgement": true
}
```

---

## 24.5 Save X Target

Update existing target endpoint:

```txt id="l2z2yd"
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json id="9j9aar"
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "X",
      "publishMode": "LIVE_X",
      "socialAccountId": "social_account_id",
      "platformOptions": {
        "text": "Explore the new luxury walkthrough.",
        "containsUrl": false,
        "madeWithAi": true,
        "paidPartnership": false,
        "replySettings": null,
        "costAcknowledged": true,
        "estimatedCostUsd": "0.015"
      }
    }
  ]
}
```

Validation:

```txt id="6a6o9q"
socialAccountId must belong to workspace
X publishing must be enabled
paid publishing must be enabled
costAcknowledged must be true
text/media requirements must be satisfied
media combination must be valid
rate/product caps must not already be exceeded
```

---

## 24.6 Get X Cost Ledger

```txt id="zwexy7"
GET /api/v0/social-scheduler/x/costs?workspaceId=workspace_id&from=2026-09-01&to=2026-09-30
```

Response:

```json id="bjcoxm"
{
  "estimatedTotalUsd": "4.215",
  "actualTotalUsd": "4.000",
  "items": [
    {
      "targetId": "target_id",
      "operation": "POST_CREATE",
      "estimatedTotalUsd": "0.015",
      "status": "CONSUMED"
    }
  ]
}
```

---

# 25. Frontend Components

Add:

```txt id="lis277"
XConnectCard.tsx
XConnectConfirmModal.tsx
XAccountCard.tsx
XTargetSelector.tsx
XPostFields.tsx
XCostWarningModal.tsx
XCostEstimateBadge.tsx
XPaidPublishingBadge.tsx
XRateLimitBadge.tsx
XMediaUploadTimelineItem.tsx
XPublishTimelineItem.tsx
XCostLedgerPanel.tsx
```

Update:

```txt id="lgf6ku"
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

X section title:

```txt id="s36y2h"
Twitter/X Accounts
```

Subtitle:

```txt id="af0p75"
Connect X accounts for optional paid post publishing.
```

Button:

```txt id="3sm2n6"
Connect X
```

---

## 26.2 Target Step

X card helper:

```txt id="nlujoo"
X uses paid API actions. Review the estimated API cost before scheduling.
```

If disabled:

```txt id="8oyqbc"
X publishing is disabled for this environment.
```

If not connected:

```txt id="w4e752"
Connect an X account before enabling live X publishing.
```

---

## 26.3 Cost Warning

Title:

```txt id="57p5a3"
X API charge warning
```

Body:

```txt id="8nyyvb"
This scheduled post may consume paid X API credits when published.
```

Checkbox:

```txt id="7ho16k"
I understand and approve this estimated X API cost.
```

---

## 26.4 Success Timeline

```txt id="f1twqi"
Published to X
```

Body:

```txt id="2t5tbr"
The scheduled post was published to the selected X account.
```

Button:

```txt id="747ms6"
View on X
```

Only show if `externalPostUrl` exists.

---

## 26.5 Cost Blocked Timeline

```txt id="yopajy"
X publishing blocked by cost guard
```

Body:

```txt id="7rwrph"
This target was not published because X paid publishing was not enabled or the cost was not acknowledged.
```

---

## 26.6 Rate-Limited Timeline

```txt id="su23gc"
X rate limit reached
```

Body:

```txt id="yktrzx"
This target will retry after the rate-limit window resets.
```

---

# 27. Error Handling

## 27.1 OAuth Cancelled

```txt id="uax8cf"
X connection was cancelled.
```

Action:

```txt id="n4hcnb"
Try again
```

---

## 27.2 OAuth State Invalid

```txt id="zaf5ss"
This X connection session expired. Please start again.
```

Action:

```txt id="4kn2e6"
Reconnect X
```

---

## 27.3 Missing Scope

```txt id="oubfqm"
X posting permission was not granted.
```

Action:

```txt id="9eflzp"
Reconnect and approve permissions
```

---

## 27.4 Paid Publishing Disabled

```txt id="dq6c2o"
X paid publishing is disabled.
```

Action:

```txt id="9l4b8e"
Enable X paid publishing in settings
```

Admin only.

---

## 27.5 Cost Not Acknowledged

```txt id="kn9r87"
X API cost was not acknowledged.
```

Action:

```txt id="fqntsg"
Review cost and approve
```

---

## 27.6 Rate Limited

```txt id="u88rp4"
X rate limit reached.
```

Body:

```txt id="l66iyf"
The post will retry after X allows more requests.
```

---

## 27.7 Reconnect Required

```txt id="qr927h"
X account needs reconnection.
```

Action:

```txt id="1v4qim"
Reconnect X
```

---

## 27.8 Unsupported Media

```txt id="2792hd"
This media combination is not eligible for X publishing.
```

Detail examples:

```txt id="28qgkx"
Use up to 4 images, or 1 video, not both.
```

---

# 28. Retry Rules

Use Sprint 2 retry foundation.

## 28.1 Retryable

Retry:

```txt id="cvhhcg"
X 429 rate limit
X 5xx
Network timeout
Media upload processing not ready
Temporary media upload failure
Unknown timeout before response
```

## 28.2 Permanent

Fail permanently:

```txt id="jfayhq"
Invalid media combination
Unsupported file type
Image over 5 MB
Missing required posting scope
Post rejected by X
Cost not acknowledged
Paid publishing disabled
Invalid account
```

## 28.3 Reauth

Mark reauth required:

```txt id="eecp1v"
Access token expired and refresh failed
Refresh token revoked
User revoked app access
Required scope removed
CredentialRef missing
```

## 28.4 Cost Blocked

Mark cost blocked:

```txt id="gyrmjr"
X paid publishing disabled
Cost acknowledgement missing
Workspace X budget exceeded
Account X budget exceeded
App X budget exceeded
```

---

# 29. Security Requirements

Sprint 7 must preserve all previous security rules.

## 29.1 OAuth State Security

```txt id="1ejhoy"
State must be random and unguessable.
State must be stored hashed.
State must expire quickly.
State must be single-use.
State must bind workspaceId.
State must bind userId.
State must bind provider X.
Callback must reject reused/expired state.
```

## 29.2 Token Security

Never expose:

```txt id="6jz6bk"
X access token
X refresh token
X client secret
OAuth raw state secret
PKCE verifier
B2 signed URL
B2 secret
```

## 29.3 Workspace Isolation

Must enforce:

```txt id="3zy8cc"
X account connected to Workspace A cannot be selected in Workspace B.
Worker validates target.workspaceId, post.workspaceId, and socialAccount.workspaceId before posting.
User without workspace access cannot view X accounts, costs, or attempts.
```

## 29.4 Attempt Sanitization

Attempt JSON may store:

```txt id="2xk5kt"
platform
text length
containsUrl
madeWithAi
paidPartnership
mediaAssetId
mimeType
byteSize
xMediaIdString
estimated cost
rate-limit metadata
provider error code
sanitized diagnostics
```

Attempt JSON must not store:

```txt id="rp2jhk"
tokens
signed URLs
raw private object keys
client secrets
raw provider auth headers
PKCE verifier
```

---

# 30. Functional Test Cases

## 30.1 OAuth

```txt id="vsd2p2"
Logged-out user cannot start X OAuth.
```

```txt id="fqob9r"
User without workspace permission cannot start X OAuth.
```

```txt id="y0qigb"
OAuth state is created with workspaceId and userId.
```

```txt id="cwnuoh"
PKCE verifier is stored server-side only.
```

```txt id="s4gwhh"
Expired OAuth state is rejected.
```

```txt id="nprugx"
Reused OAuth state is rejected.
```

---

## 30.2 Account Connection

```txt id="jw8rga"
Successful OAuth creates SocialAccount with provider X and platform X.
```

```txt id="b6240m"
SocialAccount stores credentialRef, not raw token.
```

```txt id="h75oyc"
SocialAccount stores granted scopes in scopesJson.
```

```txt id="22f7vm"
Connected X account appears on Social Accounts page.
```

---

## 30.3 Workspace Isolation

```txt id="5k4cu7"
Workspace A X account does not appear in Workspace B.
```

```txt id="daflo6"
Worker refuses to publish if target, account, and post do not belong to same workspace.
```

```txt id="m71tmv"
User without workspace access cannot view X attempts or cost ledger.
```

---

## 30.4 Target Selection

```txt id="gd5rl5"
X live target appears only when X integration is enabled.
```

```txt id="3d4o3l"
X live target appears only when account is connected.
```

```txt id="7rssbk"
Selecting X opens cost warning modal.
```

```txt id="v0okc7"
Continue is blocked until cost acknowledgement is checked.
```

```txt id="h5kuv0"
Post with URL shows higher estimated cost.
```

---

## 30.5 Media Validation

```txt id="uqb780"
Single image under 5 MB is allowed.
```

```txt id="dat05a"
Four images under 5 MB each are allowed.
```

```txt id="yndql0"
Five images are blocked.
```

```txt id="ggnvcp"
Image plus video combination is blocked.
```

```txt id="60sp01"
Single MP4 video under 200 MB is allowed.
```

```txt id="xtfj3n"
GIF is blocked unless feature flag is enabled.
```

---

## 30.6 Worker Publish

```txt id="44vme5"
Create scheduled X text post.
Run worker after scheduledAt.
Verify:
- target claimed
- attempt created
- X token resolved securely
- cost ledger consumed
- POST /2/tweets called
- X post ID stored
- target marked PUBLISHED
- parent post recalculated
```

```txt id="dlvb1m"
Create scheduled X image post.
Run worker.
Verify:
- media upload job created
- media_id_string stored
- post created with media IDs
- timeline shows media upload and post creation
```

```txt id="3q48ax"
Create scheduled X video post.
Run worker.
Verify:
- chunked upload lifecycle is used
- finalize result handled
- post created only after media is ready
```

---

## 30.7 Cost Guard

```txt id="91j2ke"
Schedule X post without cost acknowledgement.
Verify target is blocked.
```

```txt id="h8majz"
Disable X paid publishing.
Run worker.
Verify target becomes COST_BLOCKED.
```

```txt id="n46d83"
Set workspace X budget exceeded.
Verify new X targets cannot be scheduled.
```

---

## 30.8 Rate Limit

```txt id="kx428c"
Simulate X 429.
Verify:
- attempt status RATE_LIMITED
- target status RETRYING
- nextRetryAt uses x-rate-limit-reset
- rate-limit metadata stored
- UI shows rate-limit message
```

---

## 30.9 Reauth

```txt id="2nngqf"
Simulate expired/revoked refresh token.
Verify:
- SocialAccount becomes REAUTH_REQUIRED
- target becomes REAUTH_REQUIRED
- timeline shows reconnect required
```

---

## 30.10 Security

```txt id="te8pzw"
Frontend never receives X access token.
```

```txt id="c6q0oo"
Attempt requestJson does not contain token.
```

```txt id="jjnhhc"
Attempt responseJson does not contain token.
```

```txt id="qo4d16"
Attempt diagnostics do not contain signed B2 URL.
```

```txt id="e72pzm"
Logs do not contain token.
```

```txt id="eeum4e"
PKCE verifier is not exposed to frontend.
```

---

# 31. Acceptance Criteria

Sprint 7 is complete when:

## Account Wiring

```txt id="d15ihb"
Admin can enable X integration.
Workspace admin can click Connect X.
OAuth state and PKCE are created and validated.
X OAuth callback works.
X user identity is fetched.
X SocialAccount is saved to active workspace.
Token material is stored only through credentialRef.
Connected X account appears on Social Accounts page.
```

## Scheduler UX

```txt id="ca5v4k"
X appears only when enabled.
X appears as live connected only when account is connected.
User can write X-specific post text.
User can select made_with_ai disclosure.
User can select paid partnership disclosure.
User sees cost estimate.
User must acknowledge cost before scheduling.
Review step warns about live X publishing and API charges.
```

## Cost and Rate Limits

```txt id="lb3t7v"
X cost estimate endpoint exists.
X cost ledger exists.
Cost acknowledgement is stored.
Cost guard blocks unacknowledged paid publishing.
Rate-limit metadata is stored.
429 responses schedule retry using reset time.
```

## Worker + Publishing

```txt id="lkda95"
Sprint 2 worker processes due X targets.
Worker validates workspace/account/target/media ownership.
Worker creates attempt before provider call.
Worker uploads media when required.
Worker creates X post through X adapter.
Successful publish stores X post ID.
Successful publish stores external post URL.
Failed publish maps to RETRYING, FAILED, REAUTH_REQUIRED, RATE_LIMITED, or COST_BLOCKED correctly.
Attempt timeline shows result and cost.
```

## Security

```txt id="yhn44k"
No token leakage.
No cross-workspace account access.
No cross-workspace cost ledger access.
No raw signed URL stored in JSONB.
No PKCE verifier exposed.
Worker validates workspace/account/target before publishing.
```

---

# 32. Sprint 7 Deliverables

## Frontend

```txt id="btodfs"
X section on Social Accounts page
Connect X modal
Connected X account card
X target selector
X-specific post fields
X cost warning modal
X cost estimate badge
X paid publishing badge
X rate-limit badge
X media upload timeline item
X publish timeline item
X cost ledger panel
Updated Scheduler Review step
Updated Scheduler Detail page
```

## Backend

```txt id="nzr077"
X OAuth start endpoint
X OAuth callback endpoint
X credential service
X user identity service
X cost estimate service
X cost ledger service
X target validation
X media upload service
XPublisherAdapter
Worker adapter routing update
X rate-limit classification
X error classification
Token refresh handling
Media upload lifecycle handling
```

## Database

```txt id="t0hdlu"
SocialAccount provider X support
SocialAccount type X_USER support
XMediaUploadJob model
XApiCostLedger model
SocialPublishTarget X fields
SocialPublishAttempt X lifecycle support
COST_BLOCKED status
RATE_LIMITED status support
Workspace indexes
Cost ledger indexes
```

## Tests

```txt id="go12fg"
X OAuth tests
PKCE security tests
Workspace isolation tests
Token non-leakage tests
X account discovery tests
X target validation tests
X cost acknowledgement tests
X cost ledger tests
X rate-limit tests
X text post publish tests
X image media publish tests
X video media publish tests
Reauth tests
Attempt timeline tests
```

---

# 33. Sprint 7 Final Implementation Summary

Build this in Sprint 7:

```txt id="jmnruh"
Admin enables X integration
→ User connects X through OAuth with PKCE
→ Store X credentialRef
→ Save X account to active workspace
→ Select X in Scheduler Target step
→ Add X-specific text/disclosures
→ Estimate API cost
→ Require cost acknowledgement
→ Schedule live X target
→ Sprint 2 worker processes due target
→ Upload media if required
→ Create X post through POST /2/tweets
→ Store X post ID and URL
→ Attempt timeline shows real result, cost, and rate-limit data
```

Do not build X analytics yet.

Do not build X inbox/DMs yet.

Do not build X trends yet.

Do not build bulk X automation yet.

Do not bypass the Sprint 2 worker.

Sprint 7’s job is to make Twitter/X publishing available as a controlled, optional, paid API integration through the same account, worker, attempt, retry, cost, and status framework already established in Sprints 1–6.

After Sprint 7, the next logical sprint is:

```txt id="y3amsx"
Sprint 8 — Scheduler Hardening, Platform QA, Calendar View, and Production Readiness
```