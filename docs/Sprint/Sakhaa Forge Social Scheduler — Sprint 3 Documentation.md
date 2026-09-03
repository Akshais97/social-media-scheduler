# Sakhaa Forge Social Scheduler — Sprint 3 Documentation  
## Sprint 3: Meta Account Wiring, Facebook Page Connection, and Real Facebook Page Publishing

## 0. Sprint Intent

Sprint 3 is the first real social-platform integration sprint.

Sprint 1 created:

```txt id="d7py7m"
Manual media upload
→ Draft Composer JSONB
→ Workspace-isolated scheduled post
→ Mock target selection
→ Scheduler list/detail UI
```

Sprint 2 created:

```txt id="mdobye"
Due-post worker
→ Safe target claiming
→ Mock publisher adapter
→ SocialPublishAttempt rows
→ Attempt timeline
→ Retry/failure/status state machine
```

Sprint 3 must now connect the first real provider:

```txt id="b8sqod"
Meta OAuth
→ Facebook Page discovery
→ Workspace-scoped connected Page account
→ Real Facebook Page publishing through Sprint 2 worker
→ Real attempt logs
→ Real published post ID / URL storage
```

This sprint must **not bypass Sprint 2**. Real Facebook publishing must use the same worker, status transitions, target records, and attempt timeline built in Sprint 2.

---

## 1. Sprint 3 Name

```txt id="xhlnf5"
Sprint 3 — Meta Connection & Facebook Page Publishing
```

Alternative internal label:

```txt id="r6l7u0"
Sprint 3 — First Real Social Publishing Adapter
```

---

## 2. Sprint 3 Outcome

By the end of Sprint 3:

1. A workspace admin can connect Meta.
2. The app can request required Facebook Page permissions.
3. The app can discover Facebook Pages available to the connected Meta user.
4. The user can select one or more Pages to connect to the active workspace.
5. Connected Pages appear inside the Scheduler Target step.
6. A scheduled Facebook Page target can be processed by the Sprint 2 worker.
7. The worker can call the real Meta Pages API adapter.
8. A successful attempt stores the real external post ID.
9. A successful attempt stores the real public/permalink URL if available.
10. Failed attempts are visible in the existing attempt timeline.
11. Retryable failures use Sprint 2 retry logic.
12. Expired/revoked/missing permission states show clear reconnect actions.

Meta’s Pages API supports Page management tasks including posting content, and the Pages posts guide covers creating, publishing, updating, replying to, and deleting Page posts.

---

## 3. In Scope

Sprint 3 includes:

```txt id="4tc23h"
Meta app configuration documentation
Meta OAuth redirect flow
OAuth state/CSRF protection
Facebook Page discovery
Workspace-scoped SocialAccount records
Credential reference storage
Connected Facebook Page selector
Real Facebook Page text post publishing
Real Facebook Page single-image publishing
Attempt timeline integration
Permission missing state
Reconnect required state
Disconnect account action
Admin/developer diagnostics
Functional tests
```

---

## 4. Out of Scope

Sprint 3 must **not** implement:

```txt id="kmu0ao"
Instagram publishing
Instagram account discovery
Instagram content publishing limits
Pinterest OAuth
YouTube OAuth
Twitter/X OAuth
Facebook video upload as required acceptance
Facebook carousel/multi-photo post as required acceptance
Social analytics
Comment inbox
Real verification crawler
Auto-generated captions
Approval workflow
Drag-and-drop calendar
Bulk scheduling
```

Optional stretch only:

```txt id="fj68cb"
Facebook Page video publishing
```

Do not block Sprint 3 completion on video publishing. Single-image Facebook Page publishing is enough for the first real provider sprint.

---

## 5. Source and UI Alignment

Sprint 3 must preserve the current Sakhaa Forge UI direction.

The `/app/branding` flow is already step-based: scan URL, upload assets, review candidates, request missing assets, and approve profile. 

The homepage uses a staged workflow with a persistent premium header, side-by-side workspace, stage navigation, and bottom progress rail. 

Sprint 3 should therefore extend the Social Scheduler UI with a guided connection experience, not a raw developer settings table.

UX direction:

```txt id="pz8nwk"
Dark premium shell
Step-led account connection
Clear permission checklist
Workspace-scoped connected account cards
No hidden token state
No generic OAuth dump screen
No real publishing without visible connected account
```

---

# 6. Sprint 3 Platform Scope

## 6.1 Supported Live Platform

```txt id="8q76ct"
Facebook Page
```

## 6.2 Supported Live Publish Types

Required:

```txt id="9f1yzg"
Text + single image Facebook Page post
Text-only Facebook Page post if product allows no media
```

Recommended for this media-first scheduler:

```txt id="twlat8"
Require one uploaded image for live Sprint 3 publishing.
Keep text-only as backend-capable but UI-disabled unless explicitly enabled.
```

## 6.3 Still Mock in Sprint 3

These remain mock/disabled:

```txt id="5pxxs7"
Instagram
Pinterest
YouTube
Twitter/X
Facebook video
Facebook multi-image
```

Reason: Sprint 3 should prove one real adapter safely through the Sprint 2 execution system before expanding platform complexity.

---

# 7. Meta App Requirements

## 7.1 Required Meta Product

Use:

```txt id="tivght"
Facebook Login for Business
```

Meta’s Facebook Login for Business lets apps create a login experience in the Meta App Dashboard and specify the access requested from users.

## 7.2 Required Permissions

For Facebook Page publishing, request:

```txt id="nsl8i8"
pages_show_list
pages_read_engagement
pages_manage_posts
```

`pages_manage_posts` allows an app to create, edit, and delete Page posts. Meta’s permissions system is granular, and users must grant the permissions required by each endpoint.

## 7.3 App Access Level

For internal development, developer/admin/test users can be used first.

For real client accounts, the app must be prepared for Meta app review/access-level requirements. Meta’s Graph API access-level documentation distinguishes Standard and Advanced access, with Advanced Access allowing permission requests from any app user rather than only app-owned/test assets.

Sprint 3 implementation must support both modes:

```txt id="ozjxs5"
META_APP_MODE=development
META_APP_MODE=production
```

Development mode:

```txt id="yi8c4z"
Only developer/test users and owned/test Pages are expected to work.
```

Production mode:

```txt id="v7pkft"
External client account connection requires approved permissions/access.
```

---

# 8. Environment Variables

Add:

```txt id="v7nxcc"
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v23.0
META_REDIRECT_URI=
META_OAUTH_STATE_SECRET=
META_APP_MODE=development
META_ALLOWED_TEST_USER_IDS=
```

Existing Sprint 2 worker variables remain:

```txt id="locdmx"
SOCIAL_SCHEDULER_WORKER_SECRET=
SOCIAL_SCHEDULER_WORKER_BATCH_SIZE=25
SOCIAL_SCHEDULER_MAX_ATTEMPTS=3
```

Do not expose any `META_*SECRET*` variable to frontend.

Allowed frontend public config:

```txt id="507pq1"
NEXT_PUBLIC_META_CONNECT_ENABLED=true
```

Only if needed for UI gating. It must not contain secrets.

---

# 9. Data Model Updates

Sprint 1 created post/media/target foundation.

Sprint 2 added attempt tracking.

Sprint 3 adds real connected accounts and credentials.

---

## 9.1 New Enum — SocialAccountStatus

```prisma id="i6x5mq"
enum SocialAccountStatus {
  CONNECTED
  REAUTH_REQUIRED
  PERMISSION_MISSING
  REVOKED
  DISCONNECTED
  ERROR
}
```

---

## 9.2 New Enum — SocialAccountProvider

```prisma id="raez93"
enum SocialAccountProvider {
  META
  GOOGLE
  PINTEREST
  X
}
```

Only `META` is used in Sprint 3.

---

## 9.3 New Enum — SocialAccountType

```prisma id="gu61nw"
enum SocialAccountType {
  FACEBOOK_PAGE
  INSTAGRAM_BUSINESS
  YOUTUBE_CHANNEL
  PINTEREST_ACCOUNT
  X_USER
}
```

Only `FACEBOOK_PAGE` is live in Sprint 3.

---

## 9.4 New Model — SocialAccount

```prisma id="fv5sm5"
model SocialAccount {
  id                    String @id @default(uuid())

  workspaceId           String
  connectedByUserId     String

  provider              SocialAccountProvider
  platform              SocialSchedulerPlatform
  accountType           SocialAccountType

  displayName           String
  username              String?
  externalAccountId     String
  externalParentId      String?

  status                SocialAccountStatus @default(CONNECTED)

  scopesJson            Json
  metadataJson          Json?
  credentialRef         String

  tokenExpiresAt        DateTime?
  lastConnectedAt       DateTime @default(now())
  lastValidatedAt       DateTime?
  disconnectedAt        DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  targets               SocialPublishTarget[]

  @@unique([workspaceId, provider, externalAccountId])
  @@index([workspaceId, provider, platform])
  @@index([workspaceId, status])
}
```

Important:

```txt id="ez9zma"
credentialRef must point to secure secret storage.
Do not store raw access tokens in SocialAccount.
```

---

## 9.5 New Model — SocialOAuthState

```prisma id="v2pylf"
model SocialOAuthState {
  id              String @id @default(uuid())

  workspaceId     String
  userId          String
  provider        SocialAccountProvider

  stateHash       String
  redirectPath    String?
  expiresAt       DateTime
  consumedAt      DateTime?

  createdAt       DateTime @default(now())

  @@index([workspaceId, provider])
  @@index([expiresAt])
}
```

Purpose:

```txt id="3comjm"
Prevent OAuth CSRF.
Bind OAuth callback to the correct workspace.
Prevent one user's Meta connection from being attached to another client's workspace.
```

---

## 9.6 Update SocialPublishTarget

Add:

```prisma id="4c1xa8"
socialAccountId   String?
publishMode       String @default("MOCK")
provider          SocialAccountProvider?
externalPostId    String?
externalPostUrl   String?
reauthRequiredAt  DateTime?
```

Relation:

```prisma id="y9q3jx"
socialAccount     SocialAccount? @relation(fields: [socialAccountId], references: [id])
```

Sprint 3 target rules:

```txt id="zqy2or"
Facebook target with connected Page → publishMode = LIVE_META
Facebook target without connected Page → publishMode = MOCK or BLOCKED
All non-Facebook platforms → publishMode = MOCK
```

---

## 9.7 Update SocialPublishAttempt

Add:

```prisma id="g2v4bh"
provider          SocialAccountProvider?
socialAccountId   String?
providerRequestId String?
providerErrorCode String?
providerTraceId   String?
```

Keep existing:

```txt id="r37ss3"
requestJson
responseJson
diagnosticsJson
externalPostId
externalPostUrl
```

But sanitize all provider payloads.

---

# 10. Account Wiring UX

Sprint 2 had `Social accounts` as a placeholder.

Sprint 3 makes it functional.

Route:

```txt id="z3ud2s"
/app/social-accounts
```

or if keeping module-local route:

```txt id="xh29ab"
/app/social-scheduler/accounts
```

Preferred:

```txt id="7sp70d"
/app/social-accounts
```

because all future platforms will reuse it.

---

## 10.1 Social Accounts Page Layout

Header:

```txt id="nd901s"
Social Accounts
```

Subtitle:

```txt id="fhs5z4"
Connect each client workspace to the social accounts it is allowed to publish to.
```

Top context card:

```txt id="0j1v5n"
Active workspace: <Workspace Name>
```

Primary CTA:

```txt id="vwc6ew"
Connect Meta
```

Secondary CTA:

```txt id="fiog0z"
Back to Scheduler
```

---

## 10.2 Empty State

Title:

```txt id="z5qd8f"
No social accounts connected
```

Body:

```txt id="xmv31o"
Connect a Facebook Page for this workspace before enabling real publishing.
```

Button:

```txt id="3lwpjo"
Connect Meta
```

---

## 10.3 Connect Meta Card

Card title:

```txt id="m7y9t0"
Facebook Pages
```

Description:

```txt id="2z49gr"
Connect Meta to publish approved scheduled posts to this client's Facebook Page.
```

Permission checklist:

```txt id="p0534e"
View available Pages
Read Page engagement
Create Page posts
```

Technical mapping:

```txt id="cx3q0m"
View available Pages → pages_show_list
Read Page engagement → pages_read_engagement
Create Page posts → pages_manage_posts
```

Button:

```txt id="7wc95e"
Connect Meta
```

---

## 10.4 Meta Connection Modal

Before redirecting to Meta, show a confirmation modal.

Title:

```txt id="rqrbp3"
Connect Meta for this workspace?
```

Body:

```txt id="ba1sc9"
You are connecting Facebook Pages only for the active workspace. Other client workspaces will not get access to these Pages.
```

Checklist:

```txt id="hu28as"
Active workspace is correct
You have permission to manage this client's Facebook Page
You understand this enables real publishing in Sprint 3
```

Buttons:

```txt id="wnl4nc"
Continue to Meta
Cancel
```

Primary button disabled until all checklist items are confirmed.

---

## 10.5 OAuth Callback UX

After Meta redirects back:

Success state title:

```txt id="010ggq"
Meta connected
```

Body:

```txt id="34xq4q"
Choose which Facebook Pages should be available in this workspace.
```

If no Pages found:

```txt id="v4x0zj"
No Facebook Pages found
```

Body:

```txt id="w9fby3"
The connected Meta user did not return any Pages that can be published to. Check Page access, permissions, and app access level.
```

Buttons:

```txt id="m3j9ft"
Try again
Back to Social Accounts
```

If permission missing:

```txt id="jfg04e"
Permission missing
```

Body:

```txt id="8oh0lz"
Meta did not grant the required Page publishing permissions. Reconnect and approve all requested permissions.
```

Button:

```txt id="tkgo20"
Reconnect Meta
```

---

## 10.6 Page Selection Screen

Title:

```txt id="fbdsqu"
Select Facebook Pages
```

Description:

```txt id="56strx"
Choose the Pages this workspace is allowed to publish to.
```

Each Page card shows:

```txt id="a7ep8r"
Page name
Page ID, masked
Permission status
Connection status
Checkbox
```

Buttons:

```txt id="wxf47j"
Save selected Pages
Cancel
```

Post-save success:

```txt id="d5qbr7"
Facebook Pages connected
```

Body:

```txt id="4cqm87"
These Pages can now be selected when scheduling Facebook posts for this workspace.
```

---

# 11. Scheduler Target Step Updates

Sprint 1 Target step used mock platform cards.

Sprint 3 modifies only Facebook.

---

## 11.1 Facebook Target Card — Connected State

Card title:

```txt id="m52la1"
Facebook Page
```

Badge:

```txt id="e8ajkq"
Live connected
```

Dropdown label:

```txt id="ps83ta"
Choose Facebook Page
```

Dropdown options:

```txt id="sy1r9y"
<Connected Page Name>
```

Helper text:

```txt id="fqnqco"
This post will be published through the connected Meta Page account.
```

---

## 11.2 Facebook Target Card — Not Connected State

Badge:

```txt id="merx8d"
Not connected
```

Body:

```txt id="n1f66q"
Connect a Facebook Page before enabling live Facebook publishing.
```

Buttons:

```txt id="mut57g"
Connect Meta
Use mock mode
```

Sprint 3 rule:

```txt id="r52f3t"
Use mock mode remains available for development/testing.
Normal users should be guided to Connect Meta.
```

---

## 11.3 Other Platforms

Instagram card:

```txt id="adgfc4"
Coming in Sprint 4
```

Pinterest card:

```txt id="n89iqr"
Coming later
```

YouTube card:

```txt id="g63pvx"
Coming later
```

X card:

```txt id="z8tshn"
Coming later · Paid API warning
```

Do not allow real non-Facebook target selection in Sprint 3.

---

# 12. Real Facebook Publishing Flow

Sprint 3 must publish through the existing Sprint 2 worker.

## 12.1 Flow

```txt id="f769cp"
1. User creates scheduled post from Sprint 1 flow.
2. User selects connected Facebook Page in Target step.
3. Target is saved with publishMode = LIVE_META.
4. Worker from Sprint 2 finds due target.
5. Worker claims target.
6. Worker creates SocialPublishAttempt.
7. Worker calls MetaFacebookPagePublisherAdapter.
8. Adapter publishes to Facebook Page.
9. Attempt row stores sanitized request/result.
10. Target stores externalPostId/externalPostUrl.
11. Parent post status recalculates.
12. UI timeline displays real result.
```

Meta’s Pages getting-started documentation describes publishing to a Page feed by sending a POST request to the Page feed endpoint with a message parameter.

---

## 12.2 Adapter Decision

Create a real adapter:

```txt id="kuioi6"
MetaFacebookPagePublisherAdapter
```

Recommended path:

```txt id="rxj90x"
apps/api/src/social-scheduler/adapters/meta-facebook-page-publisher.adapter.ts
```

or `.mjs` equivalent if the active API still uses `.mjs`.

---

## 12.3 Adapter Interface

Reuse Sprint 2 adapter interface.

Do not create a totally new publish pipeline.

```ts id="xxrxrs"
type PublishInput = {
  workspaceId: string;
  postId: string;
  targetId: string;
  platform: "FACEBOOK";
  publishMode: "LIVE_META";
  socialAccountId: string;
  caption: string;
  media: Array<{
    mediaAssetId: string;
    mimeType: string;
    byteSize: number;
    objectKey: string;
  }>;
  draftContentJson: unknown;
};

type PublishResult = {
  status:
    | "SUCCEEDED"
    | "FAILED_RETRYABLE"
    | "FAILED_PERMANENT"
    | "REAUTH_REQUIRED"
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

## 12.4 Text + Image Publishing

For Sprint 3 required support:

```txt id="nks4vy"
Single uploaded image
+ caption/message
+ connected Facebook Page
→ Facebook Page post
```

Suggested implementation:

```txt id="lreebw"
1. Generate temporary platform-readable media URL from B2.
2. Call Facebook Page photo publishing endpoint or Page feed endpoint as appropriate.
3. Store returned post/photo ID.
4. Resolve/stash permalink if available.
```

Do not store the temporary B2 signed URL in the database attempt record.

Store only:

```txt id="hfeg7e"
mediaAssetId
mimeType
byteSize
signedUrlGenerated=true
signedUrlExpiresAt
```

in sanitized diagnostics if needed.

---

## 12.5 Text-Only Publishing

Optional in UI, but backend can support:

```txt id="gdbjtn"
Caption/message only
→ Facebook Page feed post
```

Recommended product rule:

```txt id="5ksvc5"
Because Sakhaa Forge is a creative/video engine, keep text-only Facebook posts disabled in UI for Sprint 3 unless explicitly enabled by env flag.
```

Env flag:

```txt id="0pa1na"
SOCIAL_SCHEDULER_ALLOW_TEXT_ONLY_FACEBOOK=false
```

---

## 12.6 Video Publishing

Facebook Page video publishing is not required in Sprint 3.

If implemented as stretch:

```txt id="wwkfse"
Single MP4 video
→ Facebook Page video upload endpoint
→ Attempt timeline
```

But do not let video publishing delay Sprint 3 acceptance.

---

# 13. Token Handling

Meta access tokens must not be treated casually.

Meta’s access-token documentation states short-lived tokens typically last around one to two hours, while long-lived tokens usually last around 60 days, and warns not to depend on those lifetimes remaining the same.

Sprint 3 must implement:

```txt id="uf6k9i"
Short-lived token exchange
Long-lived token exchange where applicable
Page access token retrieval
Secure credential storage
Token expiry metadata
Reconnect required state
```

## 13.1 Store Token Secrets Securely

Do not store raw tokens in:

```txt id="mihq56"
SocialAccount
SocialPublishAttempt
requestJson
responseJson
diagnosticsJson
frontend state
logs
```

Store token material behind:

```txt id="rs9zfp"
credentialRef
```

## 13.2 SocialAccount Token Fields

Allowed:

```txt id="n2n760"
credentialRef
tokenExpiresAt
lastValidatedAt
scopesJson
status
```

Not allowed:

```txt id="bh0od2"
accessToken
refreshToken
pageAccessToken
clientSecret
```

---

# 14. OAuth Flow

## 14.1 Connect Start Endpoint

```txt id="dlpqcm"
POST /api/v0/social-accounts/meta/connect/start
```

Body:

```json id="73ztl5"
{
  "workspaceId": "workspace_id",
  "returnPath": "/app/social-accounts"
}
```

Backend responsibilities:

```txt id="o502di"
Validate authenticated user
Validate workspace permission
Create OAuth state
Hash/store OAuth state
Build Meta OAuth URL
Return redirect URL
```

Response:

```json id="e7eq5h"
{
  "redirectUrl": "https://meta-oauth-url"
}
```

Frontend behavior:

```txt id="bcwgut"
window.location.href = redirectUrl
```

---

## 14.2 OAuth Callback Endpoint

```txt id="1d97za"
GET /api/v0/social-accounts/meta/callback?code=...&state=...
```

Backend responsibilities:

```txt id="qkr0e3"
Validate state
Ensure state not expired
Ensure state not consumed
Exchange code for access token
Exchange token for long-lived token if applicable
Fetch available Pages
Store temporary connection result
Redirect to Page selection screen
```

Callback redirect:

```txt id="zdqe7q"
/app/social-accounts/meta/select-pages?connectionId=<id>
```

Do not put tokens in query params.

---

## 14.3 Select Pages Endpoint

```txt id="y6dtz0"
POST /api/v0/social-accounts/meta/select-pages
```

Body:

```json id="xqegv4"
{
  "workspaceId": "workspace_id",
  "connectionId": "connection_id",
  "selectedPageIds": ["123456789"]
}
```

Backend responsibilities:

```txt id="ln49fw"
Validate workspace access
Validate connection belongs to user/workspace
Validate selected pages came from Meta discovery
Create/update SocialAccount rows
Store token material securely
Mark SocialAccount CONNECTED
Consume temporary connection
```

---

# 15. API Contracts

## 15.1 List Social Accounts

```txt id="e6z82b"
GET /api/v0/social-accounts?workspaceId=workspace_id
```

Response:

```json id="ye7lip"
{
  "accounts": [
    {
      "id": "social_account_id",
      "provider": "META",
      "platform": "FACEBOOK",
      "accountType": "FACEBOOK_PAGE",
      "displayName": "Mantri Developers",
      "externalAccountIdMasked": "1234••••789",
      "status": "CONNECTED",
      "scopes": [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts"
      ],
      "lastConnectedAt": "2026-09-03T05:30:00.000Z",
      "lastValidatedAt": "2026-09-03T05:31:00.000Z"
    }
  ]
}
```

---

## 15.2 Disconnect Social Account

```txt id="ypu9k4"
POST /api/v0/social-accounts/{socialAccountId}/disconnect
```

Body:

```json id="zfaxnj"
{
  "workspaceId": "workspace_id"
}
```

Behavior:

```txt id="g4wkwm"
Mark SocialAccount DISCONNECTED
Set disconnectedAt
Prevent new live targets from selecting it
Do not delete old attempt history
```

Confirmation modal copy:

```txt id="keliyi"
Disconnect this Facebook Page?
```

Body:

```txt id="a8tqvf"
Future scheduled posts will no longer publish to this Page. Existing history will remain visible.
```

Buttons:

```txt id="ys7d3n"
Disconnect Page
Cancel
```

---

## 15.3 Validate Social Account

```txt id="y1au3z"
POST /api/v0/social-accounts/{socialAccountId}/validate
```

Body:

```json id="hcbdfx"
{
  "workspaceId": "workspace_id"
}
```

Response:

```json id="ao5j9f"
{
  "status": "CONNECTED",
  "missingPermissions": [],
  "reauthRequired": false
}
```

---

## 15.4 Save Facebook Target

Update Sprint 1/2 target endpoint:

```txt id="f3zfh7"
POST /api/v0/social-scheduler/posts/{postId}/targets
```

Body:

```json id="wj2pm2"
{
  "workspaceId": "workspace_id",
  "targets": [
    {
      "platform": "FACEBOOK",
      "publishMode": "LIVE_META",
      "socialAccountId": "social_account_id"
    }
  ]
}
```

Validation:

```txt id="2urxq4"
socialAccountId must belong to workspaceId
socialAccount must be CONNECTED
socialAccount platform must be FACEBOOK
user must have permission to schedule for workspace
```

---

# 16. Worker Updates

Sprint 2 worker remains the execution engine.

## 16.1 Worker Adapter Selection

Update worker adapter routing:

```txt id="9y50t4"
if target.publishMode = MOCK:
  use MockSocialPublisherAdapter

if target.publishMode = LIVE_META and platform = FACEBOOK:
  use MetaFacebookPagePublisherAdapter

else:
  mark FAILED_PERMANENT or BLOCKED
```

## 16.2 Worker Must Not Publish If Account Invalid

Before calling Meta adapter:

```txt id="6ly6as"
Load SocialAccount
Verify workspaceId match
Verify status CONNECTED
Verify credentialRef exists
Verify required scopes are present
Verify platform FACEBOOK
```

If invalid:

```txt id="mnb8k6"
target.status = REAUTH_REQUIRED or FAILED
attempt.status = FAILED_PERMANENT
errorCode = SOCIAL_ACCOUNT_INVALID
```

If token expired/revoked:

```txt id="d2w4cq"
target.status = REAUTH_REQUIRED
post.status = REAUTH_REQUIRED if all live targets blocked by auth
```

---

# 17. State Machine Updates

Sprint 2 statuses are extended for live publishing.

## 17.1 Post Status Enum

```prisma id="l4p2ve"
enum SocialSchedulerPostStatus {
  DRAFT
  SCHEDULED
  PROCESSING
  PUBLISHED_MOCK
  PUBLISHED
  PARTIALLY_PUBLISHED
  PARTIALLY_FAILED
  RETRYING
  REAUTH_REQUIRED
  FAILED
  CANCELLED
}
```

## 17.2 Target Status Enum

```prisma id="eqgdgm"
enum SocialSchedulerTargetStatus {
  SELECTED
  SCHEDULED
  DUE
  PROCESSING
  PUBLISHED_MOCK
  PUBLISHED
  RETRYING
  REAUTH_REQUIRED
  FAILED
  SKIPPED
  CANCELLED
}
```

## 17.3 Attempt Status Enum

```prisma id="chrznh"
enum SocialPublishAttemptStatus {
  STARTED
  SUCCEEDED
  FAILED_RETRYABLE
  FAILED_PERMANENT
  REAUTH_REQUIRED
  TIMED_OUT
  SKIPPED
}
```

---

# 18. Status Recalculation Updates

After each attempt:

```txt id="e8xgfz"
If all live targets PUBLISHED → post PUBLISHED
If all mock targets PUBLISHED_MOCK → post PUBLISHED_MOCK
If some live targets PUBLISHED and some targets failed → post PARTIALLY_FAILED
If some live targets PUBLISHED and some targets still retrying → post PARTIALLY_PUBLISHED
If any target REAUTH_REQUIRED and none processing → post REAUTH_REQUIRED
If any target PROCESSING → post PROCESSING
If any target RETRYING and none processing → post RETRYING
If all targets FAILED → post FAILED
If all targets CANCELLED → post CANCELLED
```

---

# 19. Retry Rules for Meta

Use Sprint 2 retry engine.

## 19.1 Retryable Meta Failure Categories

Treat as retryable:

```txt id="jm9exn"
Network timeout
Meta 5xx response
Temporary rate limit
Temporary unavailable
Unknown timeout before response
```

Attempt status:

```txt id="4j7yep"
FAILED_RETRYABLE
```

Target status:

```txt id="syss46"
RETRYING
```

## 19.2 Permanent Meta Failure Categories

Treat as permanent:

```txt id="rpiq6m"
Unsupported media type
Missing Page permission
Invalid Page ID
Media URL inaccessible
Post content rejected
Bad request due validation
```

Attempt status:

```txt id="dk2uwq"
FAILED_PERMANENT
```

Target status:

```txt id="q0nw8u"
FAILED
```

## 19.3 Reauth Category

Treat as reauth required:

```txt id="nf5rdi"
Expired token
Revoked token
Permission removed
Page access removed
User disconnected app
```

Attempt status:

```txt id="mkzib4"
REAUTH_REQUIRED
```

Target status:

```txt id="y9ji3y"
REAUTH_REQUIRED
```

Social account status:

```txt id="f866qi"
REAUTH_REQUIRED
```

---

# 20. UI Status Copy

## Connected Account

```txt id="jpoo41"
Connected
```

Tooltip:

```txt id="qruvsb"
This Facebook Page can be used for live scheduled publishing.
```

## Permission Missing

```txt id="u14hjx"
Permission missing
```

Tooltip:

```txt id="zcb2eo"
Reconnect Meta and approve all required Page publishing permissions.
```

## Reconnect Required

```txt id="1eax3m"
Reconnect required
```

Tooltip:

```txt id="gfyc8z"
The token or Page access is no longer valid.
```

## Live Publishing Enabled

```txt id="q8rtpk"
Live publishing enabled
```

## Real Attempt Success

```txt id="ei0ltv"
Published to Facebook
```

## Real Attempt Failure

```txt id="lui5gl"
Facebook publishing failed
```

## Reauth Attempt Failure

```txt id="bpayup"
Facebook account needs reconnection
```

---

# 21. Attempt Timeline Updates

Sprint 2 timeline must now differentiate mock vs live.

## Attempt Item Fields

Add:

```txt id="hxwz9x"
Provider
Publish mode
Connected account name
External post ID
External post URL
Provider error code
Reauth required flag
```

Example success item:

```txt id="ohb9er"
Attempt 1 · Facebook · Live Meta
Published to Facebook
External ID: 123456789_987654321
Finished: 03 Sep 2026, 11:15 AM IST
```

Example failure item:

```txt id="dr4rgv"
Attempt 1 · Facebook · Live Meta
Failed: Media URL inaccessible
This target will not retry until the media URL issue is fixed.
```

Example reauth item:

```txt id="uz9673"
Attempt 1 · Facebook · Live Meta
Reconnect required
The connected Page token is expired or revoked.
```

Buttons:

```txt id="ztgw2b"
Reconnect Meta
Retry after reconnect
View post on Facebook
```

`View post on Facebook` appears only when `externalPostUrl` exists.

---

# 22. Social Accounts Page — Connected Account Cards

Each connected Page card shows:

```txt id="ayfmlc"
Facebook Page name
Status
Connected workspace
Connected by
Last connected
Last validated
Required scopes
Actions
```

Actions:

```txt id="za4n73"
Validate
Reconnect
Disconnect
```

Button rules:

### Validate

Visible for admins.

```txt id="91sbii"
Validate
```

### Reconnect

Visible if:

```txt id="a7vdw5"
REAUTH_REQUIRED
PERMISSION_MISSING
ERROR
```

### Disconnect

Visible for:

```txt id="wxlwxk"
CONNECTED
REAUTH_REQUIRED
PERMISSION_MISSING
ERROR
```

---

# 23. Scheduler Review Step Update

In Sprint 1 Review step, validation checklist was:

```txt id="pi5q84"
Workspace selected
Media uploaded
Draft content saved
At least one target selected
Schedule time valid
Mock publish mode enabled
```

Sprint 3 checklist becomes:

```txt id="3abzxd"
Workspace selected
Media uploaded
Draft content saved
Facebook Page connected
Facebook Page selected
Schedule time valid
Live Meta publish mode enabled
```

If using mock mode:

```txt id="8m7fzi"
Mock mode selected
No real Facebook post will be created
```

Show a clear warning:

```txt id="y8e68d"
This target is in live mode. When the scheduled time arrives, Sakhaa Forge will attempt to publish to the selected Facebook Page.
```

Confirmation checkbox:

```txt id="be4l5g"
I understand this post will publish to the selected Facebook Page.
```

Required only for live Facebook targets.

---

# 24. Media URL Handling for Meta

Sprint 3 must not expose permanent public B2 URLs unnecessarily.

Publishing flow:

```txt id="tf55v7"
1. Worker loads uploaded media asset.
2. Worker creates short-lived platform-readable URL or temporary publish copy.
3. Adapter sends the media URL to Meta if required.
4. Attempt diagnostics stores only sanitized URL metadata.
5. Temporary URL expires.
```

Do not store:

```txt id="f0klm9"
Signed B2 URL
B2 secret
Raw private object key in frontend response
```

Allowed diagnostics:

```json id="3n7hzd"
{
  "mediaAssetId": "asset_123",
  "mimeType": "image/jpeg",
  "byteSize": 824122,
  "temporaryMediaUrlGenerated": true,
  "temporaryMediaUrlExpiresAt": "2026-09-03T06:00:00.000Z"
}
```

---

# 25. Security Requirements

## 25.1 OAuth State Security

Must enforce:

```txt id="bcv2p9"
State is random and unguessable
State is stored hashed
State expires quickly
State is single-use
State binds workspaceId
State binds userId
Callback rejects reused/expired state
```

## 25.2 Token Security

Must enforce:

```txt id="mhwni9"
No token in frontend
No token in logs
No token in attempt JSON
No token in browser storage
No token in URL query params
No token in plain SocialAccount columns
```

## 25.3 Workspace Isolation

Must enforce:

```txt id="asrwd0"
A Facebook Page connected to Workspace A cannot be selected in Workspace B.
A user without access to Workspace A cannot view its connected accounts.
A user without permission cannot connect/disconnect accounts.
```

## 25.4 Worker Security

Must preserve Sprint 2:

```txt id="67yiwk"
Worker endpoint requires X-Worker-Secret.
Frontend never receives worker secret.
Worker validates workspace and target before publishing.
```

The uploaded scheduler workflow specifically requires worker protection through an `X-Worker-Secret` header.

---

# 26. Rate Limit Handling — Sprint 3 Minimal

Sprint 3 does not need a full quota dashboard, but it must not ignore provider throttling.

Meta Graph API rate limiting is documented as access/rate-limit controlled behavior, and standard access has lower rate limits than higher access levels.

Sprint 3 must store rate-limit hints if present:

```txt id="3ksxli"
x-app-usage
x-page-usage
x-business-use-case-usage
retry-after
```

Store sanitized rate metadata in:

```txt id="s17f2m"
SocialPublishAttempt.diagnosticsJson
```

Example:

```json id="m0dd28"
{
  "rateLimit": {
    "retryAfterSeconds": 600,
    "provider": "meta"
  }
}
```

If `Retry-After` is present:

```txt id="cfipxq"
target.status = RETRYING
target.nextRetryAt = now + retryAfterSeconds
```

---

# 27. Backend Services

Add:

```txt id="x33xe0"
SocialAccountsService
MetaOAuthService
MetaPageDiscoveryService
MetaCredentialService
MetaFacebookPagePublisherAdapter
SocialAccountValidationService
```

Update:

```txt id="r96uz6"
SocialSchedulerWorkerService
SocialPublishAttemptService
SocialSchedulerStatusService
SocialSchedulerTargetsService
```

---

## 27.1 SocialAccountsService

Responsibilities:

```txt id="o2qodu"
List workspace social accounts
Create/update connected account rows
Disconnect account
Validate account ownership and workspace access
Return safe account objects to frontend
```

---

## 27.2 MetaOAuthService

Responsibilities:

```txt id="tb00sm"
Create OAuth state
Build Meta OAuth URL
Validate callback state
Exchange authorization code
Exchange long-lived token if applicable
Handle callback errors
```

---

## 27.3 MetaPageDiscoveryService

Responsibilities:

```txt id="m27wak"
Fetch available Facebook Pages
Validate required permissions
Return safe Page selection list
Detect missing permissions
```

---

## 27.4 MetaCredentialService

Responsibilities:

```txt id="iq5soj"
Store token material securely
Return usable token to backend-only adapter
Rotate/update credentialRef if needed
Mark account reauth required
```

---

## 27.5 MetaFacebookPagePublisherAdapter

Responsibilities:

```txt id="psvhjy"
Publish Facebook Page post
Classify Meta errors
Return sanitized PublishResult
Never leak tokens
Never bypass attempt logging
```

---

# 28. Frontend Components

Add:

```txt id="f7cafk"
SocialAccountsPage.tsx
MetaConnectCard.tsx
MetaPermissionChecklist.tsx
MetaConnectConfirmModal.tsx
MetaPageSelection.tsx
ConnectedSocialAccountCard.tsx
SocialAccountStatusChip.tsx
ReconnectMetaButton.tsx
DisconnectSocialAccountDialog.tsx
FacebookPageTargetSelector.tsx
LivePublishWarning.tsx
```

Update:

```txt id="o30ylp"
PlatformTargetsStep.tsx
ReviewStep.tsx
AttemptTimeline.tsx
PlatformTargetStatusCard.tsx
SchedulerPostDetail.tsx
SchedulerPostCard.tsx
```

---

# 29. UX Buttons

## Social Accounts Page

```txt id="ylfgzk"
Connect Meta
Back to Scheduler
Validate
Reconnect
Disconnect
Save selected Pages
Cancel
```

## Scheduler Target Step

```txt id="xosl4x"
Connect Meta
Choose Facebook Page
Use mock mode
Continue to schedule
Back
```

## Review Step

```txt id="lw3h8n"
Save scheduled post
Save as draft
Back
```

Live confirmation checkbox:

```txt id="hn8ob8"
I understand this post will publish to the selected Facebook Page.
```

## Attempt Timeline

```txt id="llaq8a"
Refresh status
Reconnect Meta
Retry after reconnect
View post on Facebook
Back to scheduler
```

---

# 30. Error States

## OAuth Cancelled

```txt id="mo38yr"
Meta connection was cancelled.
```

Action:

```txt id="c0j1ki"
Try again
```

## OAuth State Invalid

```txt id="zcvaeo"
This connection session expired. Please start again.
```

Action:

```txt id="arvnnq"
Reconnect Meta
```

## Missing Permission

```txt id="a9kcou"
Required Page publishing permission was not granted.
```

Action:

```txt id="gdj0a1"
Reconnect and approve permissions
```

## No Pages Found

```txt id="v82m0f"
No Facebook Pages were available for this Meta account.
```

Action:

```txt id="jrtm40"
Use a Meta account with Page access
```

## Page Token Invalid

```txt id="wli11d"
This Facebook Page needs to be reconnected.
```

Action:

```txt id="jo834s"
Reconnect Meta
```

## Media URL Inaccessible

```txt id="m9xtrr"
Facebook could not access the uploaded media.
```

Action:

```txt id="u3nld1"
Retry publish
```

Admin/dev only until retry UX is hardened.

---

# 31. Functional Test Cases

## 31.1 Account Connection

```txt id="nxuu3x"
Logged-out user cannot start Meta OAuth.
```

```txt id="56tll9"
User without workspace permission cannot start Meta OAuth.
```

```txt id="g3t8bw"
OAuth state is created with workspaceId and userId.
```

```txt id="n4o2kv"
Expired OAuth state is rejected.
```

```txt id="oyilnu"
Reused OAuth state is rejected.
```

---

## 31.2 Page Selection

```txt id="c03yos"
After successful OAuth, available Pages are shown.
```

```txt id="eqe66z"
User can select one Facebook Page and save it to workspace.
```

```txt id="n2znc6"
Selected Page creates SocialAccount with platform FACEBOOK and provider META.
```

```txt id="wygy8h"
SocialAccount stores credentialRef, not raw token.
```

```txt id="elvm6a"
Workspace A cannot see Workspace B connected Page.
```

---

## 31.3 Target Selection

```txt id="mscp48"
Connected Facebook Page appears in Scheduler Target step.
```

```txt id="wcnuuy"
Disconnected Page does not appear as selectable.
```

```txt id="4wu4h4"
Facebook live target stores socialAccountId and publishMode LIVE_META.
```

```txt id="5o5nqg"
Non-Facebook platforms remain mock/disabled in Sprint 3.
```

---

## 31.4 Worker Integration

```txt id="zqy8ne"
Due Facebook live target is claimed by Sprint 2 worker.
```

```txt id="c9dktz"
Worker creates SocialPublishAttempt before calling Meta adapter.
```

```txt id="p387xz"
Successful Meta response marks target PUBLISHED.
```

```txt id="2ajy9h"
Successful Meta response marks parent post PUBLISHED if all targets are published.
```

```txt id="mg75ws"
Provider failure appears in attempt timeline.
```

---

## 31.5 Reauth

```txt id="ha391y"
Expired token marks SocialAccount REAUTH_REQUIRED.
```

```txt id="ixilv6"
Expired token marks target REAUTH_REQUIRED.
```

```txt id="sc1la8"
UI shows Reconnect Meta button.
```

---

## 31.6 Security

```txt id="0f2qbi"
Frontend API never returns access token.
```

```txt id="n1wa2m"
Attempt requestJson does not contain token.
```

```txt id="qzpum6"
Attempt responseJson does not contain token.
```

```txt id="t6x2fz"
Logs do not contain token.
```

```txt id="lqenxu"
Worker endpoint still requires X-Worker-Secret.
```

---

# 32. Acceptance Criteria

Sprint 3 is complete when all of this works:

## Account Wiring

```txt id="mfo4zi"
Admin can click Connect Meta.
OAuth state is created and validated.
Meta callback works.
Available Facebook Pages are discovered.
User can save selected Page to active workspace.
Connected Page appears on Social Accounts page.
```

## Workspace Isolation

```txt id="p5bqsl"
Connected Page belongs to exactly one workspace unless separately connected elsewhere.
Users cannot see accounts outside their workspace.
Users cannot select accounts outside their workspace.
Worker validates account workspace before publishing.
```

## Scheduler Integration

```txt id="w6xw0f"
Facebook Target step shows connected Pages.
User can choose live Facebook Page target.
Review step clearly warns that live publishing will happen.
Scheduled post saves with LIVE_META target.
```

## Worker + Publishing

```txt id="az8g15"
Sprint 2 worker processes due Facebook live targets.
Attempt row is created before provider call.
Real Meta adapter is called for Facebook live target.
Successful publish marks target PUBLISHED.
Failed publish marks target RETRYING, FAILED, or REAUTH_REQUIRED according to error.
Attempt timeline shows result.
```

## Security

```txt id="dp0fsz"
No raw Meta token is stored in SocialAccount.
No raw Meta token is returned to frontend.
No raw Meta token appears in attempt JSON.
No raw Meta token appears in logs.
OAuth state is single-use and workspace-bound.
```

---

# 33. Sprint 3 Deliverables

## Frontend

```txt id="k31qz7"
/app/social-accounts page
Meta connect card
Meta permission checklist
Meta connect confirmation modal
Facebook Page selection screen
Connected Page cards
Facebook Page selector in Target step
Live publishing warning in Review step
Attempt timeline live/mock distinction
Reconnect/disconnect UI
```

## Backend

```txt id="52fkjy"
Meta OAuth start endpoint
Meta OAuth callback endpoint
Meta Page selection endpoint
List social accounts endpoint
Disconnect social account endpoint
Validate social account endpoint
Meta Page discovery service
Meta credential service
Meta Facebook Page publisher adapter
Worker adapter routing update
```

## Database

```txt id="ax2m4t"
SocialAccount model
SocialOAuthState model
SocialAccountStatus enum
SocialAccountProvider enum
SocialAccountType enum
SocialPublishTarget socialAccountId/publishMode fields
SocialPublishAttempt provider/socialAccount fields
```

## Tests

```txt id="w376ye"
OAuth state tests
Workspace isolation tests
Page selection tests
Token non-leakage tests
Target selection tests
Worker live-adapter routing tests
Meta success simulation/integration tests
Meta failure classification tests
Reauth UI tests
Attempt timeline tests
```

---

# 34. Sprint 3 Final Implementation Summary

Build this in Sprint 3:

```txt id="eesprs"
Social Accounts page
→ Connect Meta
→ OAuth callback
→ Discover Facebook Pages
→ Save selected Page to active workspace
→ Choose connected Page in Scheduler Target step
→ Save post as LIVE_META target
→ Sprint 2 worker processes due target
→ Meta Facebook Page adapter publishes
→ Attempt timeline shows real result
```

Do not implement Instagram yet.

Do not implement Pinterest yet.

Do not implement YouTube yet.

Do not implement Twitter/X yet.

Do not bypass Sprint 2 worker/attempt/status logic.

Sprint 3’s job is to prove one real provider end-to-end through the already-built scheduler execution engine.

After Sprint 3, the next logical sprint is:

```txt id="ekjedf"
Sprint 4 — Instagram Business Account Connection and Instagram Publishing
```