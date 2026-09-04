# Sakhaa Forge Social Scheduler — Gap Analysis: Documentation vs Implementation

**Date:** September 4, 2026
**Code state analyzed:** `main` @ `fd9b88c` ("Sprint 9 Done")
**Scope:** Sprint documentation 1–9 (`docs/Sprint/…`), foundational specs (`docs/00…16`), future/roadmap docs (`docs/future/…`), the full `apps/web` implementation, `apps/api/prisma/schema.prisma`, and `docs/current_implementation_status.md`
**Method:** Read-only analysis. Fourteen parallel deep-dive audits were run (one doc-vs-code audit per Sprint 1–9, one end-to-end UX journey trace, one foundational-docs 00–16 audit, one persistence/wiring audit, one worker/adapters audit, one future-docs scan), each cross-verified against first-hand reads of the core code. **No code, schema, or doc changes were made.**

**Verdict legend used throughout:**

| Mark | Meaning |
|---|---|
| Mock-OK | Feature exists in code and works against the mock/in-memory data layer |
| Partial | Exists, but with material gaps vs the documented behavior |
| Missing | Documented, but not implemented |
| Broken | Exists but fails at runtime in the shipped configuration |

---

## 1. Executive summary — the ten findings that matter most

1. **There is no database.** `apps/api/` contains only `prisma/schema.prisma` + `.env` — no server, no `package.json`, no migrations. `@prisma/client` is not a dependency of `apps/web` and is imported by zero files. All 22 Prisma models (including the Sprint 6–9 models) are dead code. Runtime state lives in `src/lib/mock-storage.ts` (3,569 lines): module-level in-memory arrays on the server, **browser localStorage** on the client (`mock-storage.ts:71-84, 644-647`).
2. **The server and the browser never share state ("split brain").** Every `/api/v0/...` route mutates the server's in-memory copy; every page re-reads localStorage. This single fact breaks nearly every lifecycle action in the product (reschedule, cancel, retry, duplicate, approve, disconnect all report success but change nothing visible) and severs the composer→worker loop entirely.
3. **There is no authentication or tenant enforcement.** No `middleware.ts`, no session, no cookie, no guard. Of ~50 API routes, exactly one checks a credential (`worker/process-due`), and it accepts a missing secret outside production (`worker/process-due/route.ts:19-24`). Every route trusts a client-supplied `workspaceId`. Login is a hardcoded `admin/password` check writing a fake JWT to localStorage (`mock-storage.ts:3554-3562`).
4. **Nothing publishes on a schedule.** There is no cron configuration anywhere (no `vercel.json`, `railway.json`, crontab, or CI workflow). The only trigger is a manual button whose worker secret is hardcoded into the browser bundle (`WorkerDiagnosticsPanel.tsx:31`); the queue-page's "Process Due" button omits the secret and would 401 in production.
5. **The real-platform publishing paths are unreachable or unsafe as shipped.** No `META_*`/`GOOGLE_*`/`PINTEREST_*`/`X_*` credentials exist in any env file — Meta is gated off (sandbox bypass), while the Instagram/Pinterest/X/YouTube adapters contain real fetch code that would fire against live APIs with mock seeded tokens. X media upload IDs are fabricated; the YouTube "upload" is metadata-only.
6. **Three shipped flows are runtime-broken:** bulk draft creation fails for every item from the UI (fabricated media assets, `bulk/page.tsx:105-131`); the Review Queue and Approvals pages crash on first render (undefined `status`, `review/page.tsx:235,281,295`); OAuth-connected accounts never appear in the UI (server-side writes vs client-side reads).
7. **The Sprint 8 "production-ready" QA matrix is hardcoded to pass.** All 80 cells are `PASSED` with `productionReady:true` and `blockers:[]` (`mock-storage.ts:2524-2677`) — the release gate cannot ever report a blocker. Platform quota dashboard numbers are likewise constants, not measurements.
8. **The documented hardening rules were never implemented:** no idempotency keys (`docs/08 §13`), non-atomic worker claims, a flat 5-minute retry instead of the documented 5/15/60 ladder, `TIMED_OUT` blindly auto-retried instead of manual review, and several rate-limit headers misparsed (epoch seconds read as milliseconds → permanently wedged targets).
9. **Secrets are committed into source and shipped to the browser:** B2 access key + secret as source-code fallbacks (`b2.ts:21,27`), a second live-looking key pair in `apps/api/.env` with no `.gitignore` coverage, the AES vault key as a hardcoded literal (`credential-vault.ts:14`), and the worker secret in the client bundle.
10. **The status document overstates readiness.** "Sprints 1–9 COMPLETED, 339/339 tests, production-ready QA gate" is true only in the narrow sense that the mock-layer test scripts pass and the route/UI surface exists. See §7 for the honest itemization.

A recurring structural pattern: **later sprints' features were built beyond the earlier sprints' explicit "do not build" lists (approvals, drag-reschedule, X/Twitter, analytics, multi-tenant RBAC), while every sprint's foundational requirements — persistence, auth, idempotency, env-driven config, real platform calls — were left unbuilt.** Feature surface overshot; foundations underbuilt.

---

## 2. Architecture ground truth

These facts explain most verdicts in the per-sprint sections:

| Fact | Evidence |
|---|---|
| No database at runtime | `apps/api/prisma/schema.prisma` referenced by nothing; zero `@prisma/client` imports in `apps/web/src`; `apps/api` has no `package.json`; no `DATABASE_URL` in any env file |
| Split-brain data plane | Server: module arrays `inMemoryPosts` etc. (`mock-storage.ts:644-647`); Client: `STORAGE_KEYS` localStorage (`mock-storage.ts:71-84`); API routes and pages import the same `sprint1Storage` but execute in different processes |
| In-memory credential vault | `credential-vault.ts:90` (`private vault = new Map()`); AES-256-GCM is real but non-durable; key falls back to committed literal `'sakhaa-forge-default-dev-vault-secret-key-32b'` (`credential-vault.ts:14`); all tokens vanish on server restart → every account flips to `REAUTH_REQUIRED` |
| Mock auth | `admin`/`password` compared client-side, `mock_jwt_token_123` in localStorage (`mock-storage.ts:3554-3566`); `isAuthenticated()` defined but never called; no `middleware.ts` anywhere |
| Worker trigger is manual, browser-only | `WorkerDiagnosticsPanel.tsx:27,31` posts with hardcoded `'X-Worker-Secret': 'sakhaa_worker_secret_sprint2'`; server secret check skipped unless `NODE_ENV==='production'` (`process-due/route.ts:19-24`) |
| Only genuinely real external integration | Backblaze B2 via AWS S3 SDK (presigned PUT 15 min / GET 1–2 h / HEAD verify, `lib/b2.ts`) — wired end-to-end from the single-media composer flow only |
| OAuth adapters: real fetch code, mock credentials | `graph.facebook.com`, `api.pinterest.com`, `googleapis.com`, `api.x.com` calls exist; seeded tokens are mock strings (`EAABmockToken…` etc.); discovery paths are simulated when env creds are absent |
| Prisma schema is design documentation only | 22 models, 9 enums; header still claims "Conforms strictly to Sprint 1, Sprint 2 & Sprint 3 Documentation" (`schema.prisma:2`) despite containing Sprint 4–9 models; TS enums have drifted from it (see §6.6) |
| No workspace model | `workspaceId` is a plain string on every model; workspaces are three hardcoded seeds (`ws_mantri`, `ws_sobha`, `ws_prestige`, `mock-storage.ts:93-118`); `User.passwordHash` unused |
| Legacy parallel app still live | `/dashboard`, `/posts`, `/posts/new`, `/posts/[id]`, `/settings` render a second, older product reachable via the login redirect; `settings/page.tsx:93` advertises a Railway cron (`*/5 * * * *`) and `POST /worker/publish-due` that do not exist in this repo |

---

## 3. Per-sprint deep dives (Sprint docs 1–9 vs code)

### 3.1 Sprint 1 — Scheduler shell, B2 upload, composer (`docs/Sprint/… Sprint 1 Documentation.md`)

**Overall:** Mock-OK with holes. The 6-stage Creation Studio, real presigned B2 upload (initiate → browser PUT → HEAD-verify complete), workspace filtering, and the post list/detail foundation all exist. But three documented endpoints are stubs that persist nothing, the composer bypasses the entire documented API surface, and several security rules from the sprint doc are violated.

**Missing**

1. **Server-side media asset rows.** `POST /media/initiate-upload` returns `asset_${Date.now()}` and writes no row (`initiate-upload/route.ts:29`); `POST /media/complete-upload` only HEADs the object and returns metadata — it never persists (`complete-upload/route.ts`). Doc §11 flow steps 4 and 9 ("backend creates media asset draft row" / "stores final media metadata") are unimplemented. `sha256`, `width`, `height`, `durationMs`, `metadataJson` are never captured for real uploads.
2. **Three stub endpoints that fabricate success:**
   - `POST /posts/[postId]/media` — returns hardcoded `{success:true,…}`, writes nothing (`posts/[postId]/media/route.ts:1-24`).
   - `PATCH /posts/[postId]/draft-content` — accepts `draftContentJson` and discards it (`draft-content/route.ts:1-21`).
   - `POST /posts/[postId]/schedule` — validates the timestamp then returns fabricated `{postId, status:'SCHEDULED', …}` without loading or persisting the post, without checking targets, and with `timezone` optional (`schedule/route.ts:19-33`), where doc §22.4 requires rejecting a missing timezone.
3. **The creation studio never uses the Sprint 1 API.** `new/page.tsx` calls only `initiate-upload`, the B2 PUT, and `complete-upload`; post, JSONB, targets, and schedule are assembled client-side and written to localStorage (`new/page.tsx:392-538`, save at `:526`). `POST /posts`, `POST …/targets`, `POST …/schedule`, `PATCH …/draft-content` are unreachable dead code from the UI.
4. **Auth on scheduler routes** — no middleware, no auth check on any page (`grep redirect|/login|useAuth` in scheduler pages = 0).
5. **RBAC/role enforcement** — `Workspace.permission` (`OWNER|CLIENT_MANAGER|VIEWER`, `types/scheduler.ts:241`) is display-only; a VIEWER workspace gets the full create/upload/schedule flow.
6. **Draft Composer JSONB dev panel** (doc §17.7) and `DraftComposerJsonPanel` component — absent.
7. **"Edit post" action** anywhere (doc §16, §17) — absent (`grep "Edit post"` = 0).
8. **Workspace empty state / "No workspace selected" flow** (doc §8.2) — unreachable; workspaces always exist.
9. **UX odds and ends:** "Publish now" disabled placeholder; "Remove file" on stage 2; upload-stage "Optional notes"; "Campaign/topic" compose field; standalone "Save draft" on stage 3; "Save as unscheduled draft" on stage 5; "Manage workspace" → `/app/profile`; home-page "Social accounts" secondary button; "View brand assets" empty-state secondary (no `/app/branding` route exists); image "Dimensions"; video preview/duration + "Thumbnail generation later" note (videos render into an `<img>` via `URL.createObjectURL` and cannot display, `new/page.tsx:797-802`).
10. **Exact doc §24 error copies** — all four documented messages replaced by different wording; upload errors are raw `err.message` passthrough with no retry/choose-another actions (`new/page.tsx:344-348`).

**Doc-vs-code mismatches (selected)**

- Post-status enum: doc has `MOCK_READY`; neither Prisma nor TS includes it. Target-status `MOCK_READY`/`BLOCKED` exist only as TS "backward compat" — yet the composer writes `MOCK_READY` (`new/page.tsx:520`), which Prisma's enum cannot store.
- `complete-upload` body: doc `{workspaceId, mediaAssetId, sha256}` vs code requiring `objectKey` and **ignoring `sha256` entirely**.
- Object key `{yyyy}/{mm}` hardcoded to `2026/09` (`initiate-upload/route.ts:33`) — every upload after September 2026 lands in a stale prefix.
- `GET /posts/{postId}` ignores the documented `workspaceId` scoping param (`posts/[postId]/route.ts:8-10`) — cross-workspace read is possible.
- `scheduledAt` is built from a naive `new Date(`${date}T${time}:00`)` with no offset (`new/page.tsx:380-401`) — the stored instant reflects the **browser's** timezone, not the selected one; `timezone` is stored but never used for conversion.
- Media statuses `INITIATED/UPLOADING` are never used; upload jumps to client-side `UPLOADED`.
- Mock accounts are shown as **"Live Connected"** as soon as seeded mock accounts exist (`new/page.tsx:1005,1045`), violating doc §25.8 "mock accounts must be clearly marked as mock."
- The composer's right-hand "Platform readiness" panel renders "Mock Target Ready" unconditionally for every selected platform (`new/page.tsx:1610-1626`).

**Security violations (Sprint 1 §25)**

- B2 key + secret hardcoded in source (`b2.ts:21,27`) — defeats "never expose B2 keys."
- `GET /media/preview?key=&bucket=` signs a presigned URL for arbitrary keys with no auth and no workspace check (`media/preview/route.ts:5-20`) — defeats "never allow cross-workspace media access."
- 7 of 10 Sprint-1 endpoints perform no workspace-membership validation.
- No idempotency keys on any write path; `asset_${Date.now()}` is collision-prone.

### 3.2 Sprint 2 — Worker processing, attempt timeline, retry state machine

**Overall:** Mock-OK — the engine (`worker-service.ts`, 780 lines), mock publisher adapter, attempt timeline, stale-lock recovery, and worker summary all exist and the Sprint 2 test script passes. But the documented durability guarantees (idempotency, atomic claim, graduated backoff, unknown-timeout safety) are the parts that are missing.

**Missing / defective vs the docs**

1. **Idempotency keys absent.** `docs/08 §13` and `docs/05 §7` require `idempotency_key` on every publish target and an `UNKNOWN_AFTER_TIMEOUT` / `FAILED_UNKNOWN_PLATFORM_STATE` manual-review path. Neither exists in schema or code; `TIMED_OUT` is auto-retried as an ordinary retryable failure (`worker-service.ts:642-658`) — the opposite of the documented rule. The only "idempotency" in the codebase is a cosmetic `idem_${t.id}` fabricated at read time (`mock-storage.ts:3505,3521`).
2. **Claim is not atomic.** `docs/08 §6` requires an atomic conditional claim ("if zero rows updated, another worker claimed it"). Code performs a plain read-modify-write on a shared snapshot with no compare-and-swap (`worker-service.ts:338-344`); the re-check misses `PROCESSING`/`lockedBy` races (`:261-271`). Safe only because execution is single-process, single-threaded — the documented "concurrent worker calls do not duplicate processing" guarantee (doc §16) cannot hold across instances.
3. **Retry ladder is flat, not 5/15/60.** `docs/08 §10` requires attempt 1 → 5 min, attempt 2 → 15 min, attempt 3 → 60 min, then `FAILED`. Code applies `retryAfterMs || 5*60*1000` uniformly with a max-3 cap only for `FAILED_RETRYABLE`/`TIMED_OUT` (`worker-service.ts:642-658`).
4. **`RATE_LIMITED` retries forever.** `RATE_LIMITED` → `RETRYING` with `nextRetryAt` but no attempt-ceiling interaction (`worker-service.ts:616-625`), bypassing the 3-attempt cap.
5. **Stale-lock recovery incomplete.** 15-minute recovery exists (`worker-service.ts:50-89`) but never sets `nextRetryAt`, and the documented `STALE_WORKER_LOCK` error code is absent.
6. **Unbounded catch-up.** Due detection is `scheduledAt <= now` with no max-late bound (`worker-service.ts:111`) — a post scheduled days ago publishes instantly on the next worker run, contrary to the documented catch-up policy.
7. **Post roll-up bug.** `recalculatePostStatus` counts `PRIVATE_RESTRICTED` targets as published (`worker-service.ts:168-172`); the documented "some PUBLISHED + some RETRYING → PARTIALLY_PUBLISHED" branch is unreachable because it requires *every* target published (`:174-176`).
8. **Per-target retry returns the wrong attempt** — `retryTargetNow` returns `getAttempts(postId)[0]` (the first attempt, not the newly created one) (`worker-service.ts:707-720`).
9. **Retry-all defects** — creates dangling `STARTED` attempt rows and cannot unstick `APPROVAL_BLOCKED` targets (`mock-storage.ts:2331-2400`).
10. **Config is hardcoded, not env-driven** — batch size 25 (`worker-service.ts:240`), max attempts 3 (`:647`), 15-min stale threshold (`:52`); none of the documented `SOCIAL_SCHEDULER_WORKER_*` env vars are read. `getWorkerSummary` uses module-level `lastWorkerRunTimestamp` (`:44`) — in-memory only, and the `/worker/summary` API is unused by any UI page.
11. **Worker secret**: env name `WORKER_SECRET` vs documented `SOCIAL_SCHEDULER_WORKER_SECRET`; hardcoded default `'sakhaa_worker_secret_sprint2'` (`process-due/route.ts:5`); check skipped when the header is absent outside production; the same literal ships in the browser bundle (`WorkerDiagnosticsPanel.tsx:31`).
12. **~10 Sprint-2-named components** were not created as named modules (functionality inlined instead).

### 3.3 Sprint 3 — Meta connection & Facebook Page publishing

**Overall:** Mock-OK in sandbox form. OAuth connect/callback, page discovery, selection, workspace-scoped accounts, vault-backed `credentialRef`, adapter routing, sanitized attempts, reauth classification, and disconnect all exist. The real Meta path is implemented but **unreachable as configured** (no `META_APP_ID/SECRET` in any env file → sandbox bypass always taken).

**Missing**

1. **Long-lived token exchange** (doc:1118, 1009-1011) — short-lived exchange only (`meta/callback/route.ts:48-61`); `tokenExpiresAt` is declared but never written by any code.
2. **Authentication/workspace-permission checks on every Sprint 3 endpoint** — `userId: 'usr_admin'` hardcoded (`meta/connect/start/route.ts:14`); no user check at all in `select-pages`.
3. **Review-step live-publish warning + "I understand this post will publish…" confirmation checkbox** and the 7-item Sprint 3 checklist (doc:1700-1731) — review still says "N Mock target platform(s) selected" (`new/page.tsx:1806`).
4. **"Meta connected" success state** and **"Permission missing" callback state** screens (doc:638-685).
5. **Attempt-timeline live/mock differentiation**, provider/publish-mode/connected-account/`providerErrorCode` fields, and the Reconnect-Meta / Retry-after-reconnect / View-post-on-Facebook buttons (doc:1579-1626) — the timeline renders "Open Mock URL" unconditionally, even for live results (`AttemptTimeline.tsx:249`).
6. **Env vars**: `NEXT_PUBLIC_META_CONNECT_ENABLED`, `META_ALLOWED_TEST_USER_IDS`, `SOCIAL_SCHEDULER_WORKER_BATCH_SIZE` (doc:262-281) — never read.
7. **Meta rate-limit header capture** (`x-app-usage`, `x-page-usage`, `x-business-use-case-usage`, `retry-after`) into `diagnosticsJson` (doc:1829-1860) — absent from the Meta path (Pinterest, by contrast, does capture headers).
8. **Named services** (`SocialAccountsService`, `MetaOAuthService`, `MetaPageDiscoveryService`, `MetaCredentialService`, `SocialAccountValidationService`) and **named components** (`MetaConnectCard`, `MetaPermissionChecklist`, `MetaConnectConfirmModal`, `MetaPageSelection`, `ConnectedSocialAccountCard`, `SocialAccountStatusChip`, `ReconnectMetaButton`, `DisconnectSocialAccountDialog`, `FacebookPageTargetSelector`, `LivePublishWarning`) — none exist as modules (doc:1868-1884, 1961-1973).
9. **`providerTraceId`** never written by any adapter/worker.
10. **§30 error-state screens/action buttons** ("Try again", "Reconnect and approve permissions", "Use a Meta account with Page access") — absent.
11. **Audit events on connect/disconnect** — no social-accounts route writes an audit log.

**High-risk latent bug (mock-token guard mismatch)**

The live-path guard rejects tokens that don't start with `EAABmockToken` (`meta-facebook-page-adapter.ts:115`), but sandbox-discovered tokens are `EAABmockDiscoveredToken…` (`meta/callback/route.ts:86,93`). **If `META_APP_ID`/`META_APP_SECRET` were ever set, previously sandbox-connected Pages would be sent to the real Graph API carrying fake tokens.**

**Doc-vs-code mismatches (selected)**

- OAuth state workspace-binding is not enforced at callback time (callback never passes `workspaceId`; binding exists in storage, `mock-storage.ts:1266-1268`).
- `META_APP_MODE` is parsed but drives no behavior; `META_OAUTH_STATE_SECRET` is used only as a vault-key fallback, not for state integrity.
- Permalink is **constructed**, not resolved from Meta's `permalink_url` (`meta-facebook-page-adapter.ts:187`).
- Unknown `publishMode` silently falls back to the mock adapter instead of the documented `FAILED_PERMANENT`/`BLOCKED` (`worker-service.ts:542-543`).
- Status roll-up: "some live PUBLISHED + some RETRYING → PARTIALLY_PUBLISHED" is unreachable (`worker-service.ts:174-177`).
- `POST /posts/{id}/targets` is not on the real UI path (composer writes targets client-side); the documented target-save contract is exercised only by tests.
- OAuth requested scopes are only `['pages_show_list','pages_read_engagement','pages_manage_posts']` (`meta/connect/start/route.ts:28`) — the doc's full permission set (incl. Instagram scopes) is never requested.

### 3.4 Sprint 4 — Instagram wiring & publishing

**Overall:** Mock-OK for the simulated path; the container-lifecycle architecture exists (create → poll → publish) and image/Reel flows work in mock. Real Graph behavior is compromised by missing scopes and missing resume logic.

**Missing**

1. **OAuth never requests the Instagram scopes** `instagram_business_basic` / `instagram_business_content_publish` (`meta/connect/start/route.ts:28` still requests only the three Page scopes). IG scope strings appear only in mock seeds and UI checklist copy.
2. **Discovery is fake** — `discover-instagram` derives an IG user id from the stored Page (`178414<last9>`) and treats any Page whose `displayName` contains `nolink` as unlinked (`mock-storage.ts:1370-1406`); Meta Graph's `instagram_business_account` is never consulted. Response shape also diverges from the documented flat contract.
3. **No resume-poll of an existing container.** On the next worker cycle the adapter re-runs `publish()` from scratch — `getInstagramContainersForPost` has **zero callers** (`mock-storage.ts:1355`) — so a live video retry re-creates a container (**duplicate-Reel risk**). The documented "preferred follow-up worker cycle" resume behavior exists only in a simulated scenario path (`meta-instagram-publisher-adapter.ts:399-433`).
4. **Container lifecycle fields never populated:** `attemptId`, `statusCode`, `lastPolledAt`, `diagnosticsJson` never written; statuses `FINISHED`, `ERROR`, `EXPIRED` never persisted (only `CREATED`, `IN_PROGRESS`, `PUBLISHED`).
5. **`platformReadyAt` / `platformPublishAttemptedAt` never written** anywhere; **`attempt.platformLifecycleStage` returned by the adapter but never copied onto the attempt by the worker** — the timeline's lifecycle chip (`AttemptTimeline.tsx:204-206`) is dead code.
6. **All `SOCIAL_SCHEDULER_INSTAGRAM_*` feature flags and poll-limit env vars are missing** (grep = 0); the poll loop is hardcoded 10 × 3,000 ms inline (`meta-instagram-publisher-adapter.ts:273-294`) vs documented 12 × 10,000 ms with a 5-minute follow-up retry.
7. **Quota check treats a failed Graph call as "unlimited"** — any fetch/HTTP failure in the `content_publishing_limit` call silently returns `{quotaUsage:0, quotaTotal:50}` (`meta-instagram-publisher-adapter.ts:98-110`).
8. **All 8 named `Instagram*` components missing** (`InstagramAccountCard`, `InstagramDiscoveryPanel`, `InstagramPermissionChecklist`, `InstagramTargetSelector`, `InstagramFormatSelector`, `InstagramPublishingLimitBadge`, `InstagramContainerTimelineItem`, `InstagramProcessingBanner`) — functionality inlined.
9. **Instagram format selector missing** (Feed image / Reel / Carousel "Coming later" / Story "Coming later") — format is auto-derived read-only (`new/page.tsx:1163`).
10. **Review-step IG checklist, live-publish confirmation checkbox, "multiple live targets" copy, "Instagram is processing this media" banner, "Instagram permission missing" copy, "Instagram account not linked / Open Meta account settings" action — all missing.**
11. **No "Connection health" section** on the accounts page (doc §d.478-483).
12. **Tenant scoping holes:** `GET /instagram/containers/{containerId}` ignores `workspaceId` entirely; `validate-instagram` ignores the documented `workspaceId` body param.
13. **No strict media validation for live IG** (JPEG-only images, MP4-only videos, caption required, exactly-one-asset rule) — the composer accepts PNG/WEBP/MOV for live targets (`new/page.tsx:241-243,700`).

**Doc-vs-code mismatches:** adapter result uses `PLATFORM_PROCESSING` where the doc specifies `PROCESSING` and never emits `CONTAINER_CREATED`; retry window is 30–60 s vs the documented 5-minute `nextRetryAt`; error code `CONTAINER_PROCESSING` vs documented `INSTAGRAM_CONTAINER_PROCESSING`; account type hardcoded to `INSTAGRAM_BUSINESS` (never `INSTAGRAM_CREATOR`); permalink fabricated as `https://www.instagram.com/p/{mediaId}/` rather than a real Meta permalink; `igUserId` adapter input ignored in favor of `account.externalAccountId`; `PLATFORMS_CONFIG` claims Instagram supports "Carousel" while the doc defers it.

### 3.5 Sprint 5 — Pinterest wiring, boards, image Pins

**Overall:** Mock-OK for the mocked path; the platform-specific reality gaps are the largest of any sprint.

**Missing**

1. **Real board discovery never happens.** `GET /v5/boards` is never called; boards are hardcoded fixtures; the "Refresh Boards" endpoint just counts cached entries. Boards are never fetched from Pinterest, and **board sections** exist only in schema/types — no fetch, cache, selector, or validation anywhere.
2. **Attempts endpoint missing** for Pinterest targets.
3. **All 12 Pinterest-named components missing.**
4. **Pin description field absent** from the composer.
5. **Rate-limit metadata parsed then dropped** — `x-ratelimit-*` headers are read but never stored on attempts; product-level throttles not implemented.
6. **Access tier defaults `standard`** where the doc specifies `trial`; no tier/rate-limit badges in the UI.
7. **All `PINTEREST_*` env vars absent** (client id/secret, API base, scopes, tier); the documented OAuth state secret is not used for Pinterest state integrity.
8. **Redirect params `?provider=pinterest&connected=true`** written by the callback are never read by the accounts page.
9. **Review-step Pinterest confirmations/checklists missing**; WebP is accepted in the live path contrary to the doc's JPEG/PNG-only rule; carousel content is not detected/blocked.
10. **`RATE_LIMITED` bypasses the 3-attempt cap** (worker maps it to `RETRYING` with no ceiling, `worker-service.ts:616-625`), and 429 epoch-seconds headers are misparsed as ms (`pinterest-publisher-adapter.ts:350-359`) → `nextRetryAt` far in the future → **permanently wedged targets**.

### 3.6 Sprint 6 — YouTube wiring, quota guardrails, video publishing

**Overall:** Mock-OK for eligibility/quota UI; the actual upload is not real.

**Missing / defective**

1. **The upload is metadata-only.** No `videos.insert` resumable upload exists — the adapter POSTs metadata JSON to a stubbed endpoint and fabricates a result, minting a presigned URL that is then **dropped**; fallback ID `'https://mock-b2-storage.com/video.mp4'` (`google-youtube-publisher-adapter.ts:144-173`).
2. **Quota is consumed before the call and never released on failure** (`:117-131`) — failed uploads permanently burn quota; the reservation/ledger lifecycle documented (reserve → consume → release) is incomplete.
3. **The quota ledger is global across workspaces** (`mock-storage.ts:1514-1531`) while the reset math assumes `America/Los_Angeles` against UTC dates — cross-workspace interference plus a timezone bug.
4. **`youtube/upload-jobs` endpoint missing**; `youtubeUploadJobId` never written; `providerTraceId` / `platformLifecycleStage` never written (shared with Sprint 4).
5. **Made-for-kids**: the "Not sure" option is missing from the UI, and Boolean coercion makes the `MISSING_MADE_FOR_KIDS` blocking path unreachable.
6. **Category UI missing** — category is always `'22'` rather than selectable as documented.
7. **Token expiry never detected:** `getToken()` does not check `expiresAt`, and there is no refresh-token flow anywhere in the codebase (`grep refresh_token` across `src/lib` + `api` = 0) — so `REAUTH_REQUIRED` can only be produced by simulated scenarios, never by real expiry. All `GOOGLE_*`/`YOUTUBE_*` env vars documented are absent; the code reads different names.

### 3.7 Sprint 7 — X/Twitter wiring, paid-API guardrails, media upload

**Overall:** Mock-OK for cost acknowledgement, media rules, OAuth state, and tenant isolation. The platform-facing half is simulated, and two defects are severe.

**Missing**

1. **Real X media upload flow absent** — no `/2/media/upload(/initialize|/append|/finalize)`, no chunked video lifecycle, no processing polling; media IDs are fabricated (`x_med_${Date.now()}`, `x-publisher-adapter.ts:219-242`); `XMediaUploadJob` is written straight to `READY`; `attemptId` and `target.xMediaUploadJobId` never populated; no media-upload timeline UI.
2. **Cost ledger integrity:** the ledger row is written with `status:'CONSUMED'` **before** the API call, `actual = estimated`, never voided on failure, and **re-charged on every retry** (`:183-207`). Documented `ESTIMATED/ACKNOWLEDGED/RESERVED/RELEASED/FAILED` transitions unused; `RELEASED` replaced by `CANCELLED`.
3. **Rate/product caps missing** — all `X_PRODUCT_MAX_*` env vars and the §23 per-account/per-workspace/per-app budget checks are absent.
4. **GIF not blocked** (no `image/gif` check — GIFs pass as images); **video duration (0.5 s–20 min) never validated** (byte size only).
5. **Reply-settings ("Who can reply?") field missing** from the composer; type exists, no UI.
6. **Token exchange and identity fetch are mocked** in the callback (no HTTP call to the X token endpoint); **PKCE `code_verifier` is generated then discarded** — never stored, never resolved at callback; no refresh-token handling; no scope verification against granted scopes.
7. **Attempt rows never carry cost** (`estimatedCostUsd/actualCostUsd` not persisted to the attempt, not shown in the timeline); X lifecycle stages (`ESTIMATE_COST…FETCH_RESULT`) never recorded.
8. **`/x/estimate-cost` is orphaned** — no UI code calls it; the composer hardcodes `'0.015'/'0.200'` (`new/page.tsx:1457-1460`). `from/to` filters on `GET /x/costs` unimplemented. `MEDIA_METADATA` cost line type-only.
9. **All feature flags missing** (`SOCIAL_SCHEDULER_X_ENABLED`, `X_CONNECT_ENABLED`, per-post-type flags, cost envs) — X is always selectable; `X_PAID_PUBLISHING_ENABLED` defaults **on** (doc says default `false`).
10. **All 12 named `X*.tsx` components missing** (`XConnectCard`, `XConnectConfirmModal`, `XAccountCard`, `XTargetSelector`, `XPostFields`, `XCostWarningModal`, `XCostEstimateBadge`, `XPaidPublishingBadge`, `XRateLimitBadge`, `XMediaUploadTimelineItem`, `XPublishTimelineItem`, `XCostLedgerPanel`).
11. **Review-step live-publish confirmation checkbox, "pricing may change" warning, multi-target warning missing.**

**High-risk defect:** 429 handling reads `x-rate-limit-reset` (epoch **seconds**) and treats it as **milliseconds** (`x-publisher-adapter.ts:287-297`) → `nextRetryAt` lands ~1.8 × 10¹² ms in the future (≈ year 2028) → **the target is permanently wedged**. (Pinterest has the same class of bug.) Also: HTTP 403 from X maps to `COST_BLOCKED`/`X_PERMISSION_OR_CREDIT_ERROR` instead of the documented missing-scope → `REAUTH_REQUIRED`/`FAILED` handling.

### 3.8 Sprint 8 — Production readiness, calendar, health, preflight, QA

**Overall:** Mock-OK for surfaces; the sprint's *purpose* — a trustworthy release gate — is not met.

**Missing**

1. **The QA matrix is hardcoded to pass.** All 80 cells `PASSED`, `productionReady:true`, `blockers:[]` (`mock-storage.ts:2524-2677`); "Rerun QA Audit" merely re-fetches the same constants; no run-check endpoint (`POST /qa/run` absent); no export. The release gate cannot fail.
2. **`PlatformQuotaSnapshot` is dead code** — model + type exist, the runtime array is declared but never read or written (`mock-storage.ts:473`); dashboard numbers are constants (IG 48/50, Pinterest 980, `auditStatus:'unverified'`, `workspaceDailyCap:100`).
3. **All 12 documented env variables missing** (8 scheduler gates + 4 worker controls + 2 security flags).
4. **4 of 13 documented audit actions never written** (`POST_CREATED`, `POST_SCHEDULED`, `TARGET_ADDED/REMOVED`, `ACCOUNT_CONNECTED/RECONNECTED/DISCONNECTED`, `WORKER_ATTEMPT_STARTED/FINISHED` are enum-only).
5. **Preflight before schedule-save and before reschedule missing** — sources `SCHEDULE_SAVE`, `RESCHEDULE`, `HEALTH_CHECK`, `QA_RUN` declared but never used; only worker-preflight and detail-view run checks.
6. **Platform-specific health checks: 2 of ~27 implemented** (YouTube `auditStatus` and Pinterest `pins:write`); Facebook/Instagram/YouTube-scope/X-scope/X-paid/X-cost-guard checks all absent; health statuses `RATE_LIMITED`, `QUOTA_BLOCKED`, `COST_BLOCKED`, `UNKNOWN` are unreachable; readiness status `UNKNOWN` unreachable.
7. **Health snapshots are upserted, not appended** (`mock-storage.ts:2465-2470`) — history / "Recent auth failures" is impossible; response field `checkedAt` vs documented `lastCheckedAt`.
8. **No `/app/social-scheduler/worker` page; "Posts" nav tab missing; QA/Settings/Worker panels have no role gating** (any anonymous visitor can open the QA dashboard).
9. **Settings: Platform availability, Upload limits, and Worker settings sections missing; Danger zone's three documented actions missing** (only a localStorage-only "Reset" using `confirm()`); General fields are **write-only** (not in the save payload).
10. **§18 dashboard actions missing** (Refresh Instagram limits, View affected posts, Refresh boards/limits, Refresh quota, View reservations, View cost ledger, Update product caps, Disable X publishing).
11. **Overview page "Upcoming schedule" and "Recent publish attempts" panels missing** (computed, never rendered).
12. **Calendar gaps:** Month/Day views are stubs (a sentence + first 9 items, `calendar/page.tsx:540-566`); 6 of 11 documented status-filter values missing; event cards have no thumbnail; drawer missing Media preview / Readiness status / Latest attempt / Edit button; Reschedule/Cancel not disabled per state rules.
13. **21 of 24 named `Scheduler*` components missing** (only `ReschedulePostModal`, `RetryTargetsModal`, `CancelPostModal` exist by name).
14. **Worker hardening gaps:** idempotency key format `workspaceId:postId:targetId:attemptNumber` never constructed; stale-lock recovery doesn't set `nextRetryAt = now()` and isn't surfaced in the timeline; no worker max-runtime env; duplicate-publish protection is single-threaded-in-memory only.
15. **Cancel rejects `PROCESSING` posts outright** instead of the documented "finish current attempt, then stop future retries."
16. **Retry modal defects:** queues non-failed targets (SCHEDULED/CANCELLED/SKIPPED), missing the documented 4-item checklist; the detail-page retry button is *enabled* for COST/QUOTA_BLOCKED targets the doc says must disable it.
17. **Release gates (§20) fail:** auth protection missing; workspace isolation unenforced on several routes (`posts/[postId]` GET is open; `worker/process-due` with no `workspaceId` scans **all** workspaces); B2 signed-URL leakage unredacted (`sanitizePayload` does not redact `X-Amz-Signature`/`X-Amz-Credential`).

### 3.9 Sprint 9 — Bulk drafts, duplication, copy-to-dates, approvals

**Overall:** Mock-OK for most backend logic; **two flows are broken at runtime**, and the governance model has no teeth.

**Missing / broken**

1. **BROKEN — bulk upload is fake and bulk creation always fails from the UI.** `handleSimulatedUpload` (`bulk/page.tsx:105-131`) fabricates `Sprint1MediaAsset` objects in React state — no `media/initiate-upload` call, no B2 upload, no persisted asset. `createPostsFromBatch` resolves assets via `getMediaAssetById` against persisted state (`mock-storage.ts:3019`) → **every item fails with "Media asset … not found in workspace"**; the result screen shows Created 0 / Failed N. The test suite hides this by inlining whole asset objects (`tests/sprint9_verification.ts:374,426`).
2. **BROKEN — Review Queue and Approvals pages crash on first render:** undefined `status` at `review/page.tsx:235,281,295`; with no `error.tsx` anywhere, both `/review` and `/approvals` (a 7-line re-export) die unrecoverably. The entire approval journey is unusable from the UI.
3. **No permission model anywhere:** approve has **no `IN_REVIEW` precondition** — a DRAFT post can be approved via API (`mock-storage.ts:3193-3209`); no approver/admin checks on any approval route; `authorUserId` is client-supplied (impersonation possible); Send-for-review doesn't verify post status; no role gating in any UI.
4. **Workflow settings are write-only** — `dragRescheduleEnabled`, `dragRescheduleRequiresConfirmation`, `bulkDraftsEnabled`, `maxBulkUploadFiles`, `maxCopyToDates` are saved/displayed but never read (only `socialSchedulerApprovalRequired` is read, twice). `maxCopyToDates` (30) is hardcoded, not from settings.
5. **All 10 documented Sprint 9 env flags missing** (`SOCIAL_SCHEDULER_BULK_DRAFTS_ENABLED` … `…_WORKSPACE_ISOLATION_STRICT`, doc:1695-1710).
6. **Readiness check missing** in duplicate-with-schedule, copy-to-dates, and drag reschedule (doc:499-506, 574-580, 352).
7. **X cost recalculation/acknowledgement missing** on drag reschedule, duplicate, and copy-to-dates (doc:362-365, 504, 578) — only YouTube quota is re-reserved on reschedule (`mock-storage.ts:2269-2282`).
8. **Attempt-level `APPROVAL_BLOCKED` never produced** — blocked targets are skipped before any attempt row is created (`worker-service.ts:283-295`), so the documented attempt status is unreachable; no approval-aware banner or diagnostics (WorkerDiagnosticsPanel/StatusBadge untouched).
9. **Duplicate-with-schedule stamps target status `PENDING`** (`mock-storage.ts:2753`) — **not a value in the Prisma enum** (`schema.prisma:49-67`); it also skips readiness/quota/cost gates before setting `SCHEDULED`.
10. **`AUTO_APPROVED` is never set by any code path** (enum-only).
11. **`POST_QUICK_EDITED` audit event exists only in the enum** — the quick-edit drawer performs no audit.
12. **UI omissions:** no "Duplicate for another workspace" (disabled) option; no Timezone field in Copy-to-dates (and `timezone` never sent); no "Pick from calendar"/"Paste list" input modes; no pre-creation failure list; no Reviewer field in Send-for-Review; no "View audit trail" / "Requested by" / "Latest review comment" / "Change requests" / "Edit post" in the approval panel; Duplicate absent from the post-list card; no "Manual schedule per post" bulk mode; auto-spread missing End date / preferred times / timezone / "Clear schedule" (and uses hardcoded 10:00 UTC + 4-hour increments with no timezone math, `bulk/page.tsx:180-197`); Stage 4 has no "Mock mode" option and enforces none of the platform validation rules (targets are invented as `{mockAccountName:'${p} Mock Account'}`); per-row Thumbnail/CTA/Hashtags/Notes/Validation-status missing; Stage 7 missing "View batch"/"Create another batch".
13. **`/approvals` is not an approval queue** — it re-exports the review page; no approver-specific view, no role filtering.
14. **Bulk `?stage=upload` deep link silently ignored** (`bulk/page.tsx:42` hardcodes stage 1).
15. **Approval status chips missing from calendar day cards and the posts list** (present only on detail, review cards, and the drawer); `StatusBadge` has no `APPROVAL_BLOCKED` case (unstyled fall-through).
16. **Request-changes writes into `rejectionReason`** (`mock-storage.ts:3276`) — one field serves two documented concepts.
17. **Named `Bulk*` step components, `ApprovalPanel`, `ApprovalQueuePage` absent as modules** (inlined); the doc's Sprint 9 "update" list for WorkerDiagnosticsPanel/ReadinessCheckPanel was not done.

---

## 4. End-to-end journey map — where the journey breaks

The only chain that is fully functional is **media upload → B2 → verify**. Everything around it is severed, mostly by the split-brain store.

| # | Journey stage | Status | Break detail |
|---|---|---|---|
| 1 | Landing / login | Broken | `/` redirects straight to `/app/social-scheduler` with no auth (`src/app/page.tsx:4`). Login is theater: `admin/password` prefilled and displayed (`login/page.tsx:104`), fake token to localStorage (`mock-storage.ts:3557`), lands on the legacy orphan `/dashboard`, which links to the **legacy** `/posts/new`, not the Studio. |
| 2 | Connect accounts → accounts visible | **Broken** | OAuth connect saves accounts **server-side only** (`createOrUpdateSocialAccount` is called only from API routes); the Accounts page and the composer read **localStorage** (`social-accounts/page.tsx:103`, `new/page.tsx:189`). Real connected accounts never appear in the UI and cannot be targeted. |
| 3 | Create post (Studio) | Partial | The 6-stage wizard works; the **media upload chain is the one real end-to-end path** (`new/page.tsx:260-349` → `initiate-upload` → B2 PUT → `complete-upload`). But the final save bypasses all server routes (`new/page.tsx:526` → localStorage) — no `POST /posts`, no `POST …/targets`, no `POST …/schedule`. |
| 4 | Post → worker | **Broken** | User posts live in localStorage; the worker reads server-side in-memory state. **The worker never sees user posts; its results never reach the UI.** The core loop cannot round-trip. |
| 5 | Queue / detail views | Broken | Queue list reads localStorage; server-created posts are invisible. Detail deep-links from the review queue resolve against localStorage → "Post not found in scheduler queue." (`[postId]/page.tsx:95-108`). |
| 6 | Lifecycle actions | **Broken (all)** | Reschedule (modal and drag), Cancel-from-queue, Retry-all, Retry-target, Duplicate, Copy-to-dates, Send-for-review, Approve, Request changes, Reject, Comments, Disconnect — every one POSTs to a route mutating the server copy while the page re-reads localStorage. All modals report success; nothing visibly changes; disconnected accounts reappear on reload. |
| 7 | Publishing trigger | **Broken** | No cron/scheduler config of any kind. Manual "Run Due Worker" only; the queue-page button omits `X-Worker-Secret` (401 in production, `process-due/route.ts:19-24`); the panel hardcodes the secret in the browser bundle (`WorkerDiagnosticsPanel.tsx:31`). With no polling anywhere, PROCESSING/RETRYING states never resolve without a manual reload. |
| 8 | Review / approvals | **Broken** | Pages crash on render (see Sprint 9); approvals re-export duplicates review; author can approve own post (no role model); Settings workflow toggles unenforced. |
| 9 | Bulk intake | **Broken** | Media upload simulated (no B2), so batch creation fails for every item from the UI; no CSV import exists despite "Bulk Drafts" framing; the `?stage=upload` deep link is ignored. |
| 10 | Secondary surfaces | Partial | Health page is the best-built (loading/empty/error states) but renders a second `<Header/>`; QA page fetches `blockers` then never renders them and hardcodes "Production Guardrails Enforced"; Settings has three write-only controls and a localStorage-only "Reset"; month/day calendar are stubs; X cost estimate in the composer is a hardcoded fiction (orphaned endpoint). |
| 11 | Legacy parallel app | Broken | `/dashboard`, `/posts`, `/posts/new`, `/posts/[id]`, `/settings` are a fully-rendered second product reachable via login redirect, advertising infrastructure that does not exist (`settings/page.tsx:93`). Only `/social-accounts` correctly re-exports the live page. |

**Orphaned API routes (no UI caller):** `/overview` GET, `/platform-quotas`, `/audit-logs`, `/calendar` GET, `/posts` GET/POST, `/posts/[postId]` GET, `/posts/[postId]/attempts`, `/readiness-check`, `/draft-content`, `/targets` (list/POST), `/posts/[postId]/media`, `/instagram/containers/[containerId]`, `/x/estimate-cost`, `/worker/summary`.

---

## 5. UX gaps

- **No error/loading/404 boundaries anywhere** — zero `error.tsx`/`loading.tsx`/`not-found.tsx`/`global-error.tsx` in the repo; fetch failures are console-only; client exceptions kill pages with no recovery link.
- **Zero accessibility** — no `aria-*`, no `sr-only`, no keyboard alternative for calendar drag-and-drop, no Escape-to-close/focus trap/focus restore in any modal; icon-only buttons have `title` only.
- **No pagination, infinite scroll, or "Load more" anywhere** — queue, review, calendar, bulk, and accounts render unbounded lists.
- **No autosave or unsaved-changes guard** in the 6-stage Studio or 7-stage bulk wizard (`beforeunload` grep = 0) — a refresh loses everything.
- **The composer's readiness panel always says "Mock Target Ready"** regardless of actual account/validation state; raw enum strings are rendered as UI copy in several places; review-checklist rows are unconditionally green.
- **Blocked targets are terminal dead ends** — `QUOTA_BLOCKED`, `COST_BLOCKED`, `PRIVATE_RESTRICTED` targets get no remedy in the UI (only REAUTH gets a Reconnect link, `PlatformTargetStatusPanel.tsx:221-239`).
- **Settings has three write-only controls** (timezone, default view, schedule buffer — never sent in the save payload, read nowhere) and a "Reset" that clears only localStorage while the server store and worker state are untouched.
- **Bulk deep link ignored** (`?stage=upload`); month/day calendar are stubs; X cost shown in the composer is fabricated (the real endpoint is never called).
- **Double header** on calendar/bulk/health/qa/settings (global layout header + page-level header); no mobile nav below `lg`; Header compares against legacy routes that aren't in its nav.
- **Workspace selector bypassed** — Review Queue hardcodes `workspaceId:'ws_mantri'` (`review/page.tsx:44`); Bulk hardcodes two workspaces (`bulk/page.tsx:313-314`) — the same user sees different data per page.
- **Phantom data in the review queue** — fallback platform list includes `LINKEDIN` (a platform the app doesn't support); missing media falls back to random `picsum.photos` stock images.
- **QA page hides its own data** — `blockers` fetched, never rendered; "PRODUCTION READY" pill hardcoded.
- **Copy-to-dates 30-date cap enforced with no visible explanation.**
- **Inconsistent feedback surfaces** — `SchedulerBanners` only on the detail page; bulk reports failures via `alert()`; settings uses native `confirm()` + full reload; accounts page has its own banner.
- **No pagination or virtualization anywhere; no polling/auto-refresh** so transient states never resolve on their own.

---

## 6. Cross-cutting findings

### 6.1 Security (docs 13/16 guardrails)

- **Secrets in source / browser:** B2 access key + secret as fallbacks in `b2.ts:21,27`; second live-looking key pair in `apps/api/.env` (no `.gitignore` in `apps/api`); vault key fallback literal (`credential-vault.ts:14`); worker secret default on the server (`process-due/route.ts:5`) **and** in the client bundle (`WorkerDiagnosticsPanel.tsx:31`).
- **Arbitrary presigning:** `GET /media/preview?key=&bucket=` returns a signed download URL for any key/bucket, unauthenticated (`media/preview/route.ts:5-20`); `complete-upload` returns 200 with `verifiedInB2:false` when the object is missing (`complete-upload/route.ts:19-37`); initiate-upload accepts a client-chosen `bucket` and an unsanitized filename.
- **Unauthenticated API surface:** every route trusts client-supplied `workspaceId`; `GET /posts/[postId]` ignores workspace scoping; `worker/process-due` without a workspace scans all workspaces (`worker-service.ts:95-100`); dev-mode secret bypass.
- **No CORS / origin allowlist**; OAuth callbacks accept arbitrary inbound requests with no user binding (there is no user).
- **Redaction gaps:** `sanitizePayload` redacts tokens/secrets but **not** presigned-URL params (`X-Amz-Signature`, `X-Amz-Credential`); audit `beforeJson/afterJson` unsanitized; error bodies returned to clients are unsanitized (raw `err.message` from Graph/AWS calls); `access_token` placed in a URL query in the Meta callback (`meta/callback/route.ts:65`).
- **Unbounded audit growth:** e.g. `READINESS_CHECK_RUN` written per target per worker run.
- **B2 `objectKey` exposed in the UI** (post detail, `[postId]/page.tsx:434-436`).

### 6.2 Publishing correctness / data integrity

- No idempotency keys; non-atomic claims (double-publish risk across processes); IG container re-creation per retry (duplicate Reels).
- X cost ledger charged pre-call, never voided, re-charged per retry.
- 429 epoch-seconds misparsed as ms in X (`x-publisher-adapter.ts:287-297`) and Pinterest (`pinterest-publisher-adapter.ts:350-359`) → permanently wedged targets.
- `recalculatePostStatus` counts `PRIVATE_RESTRICTED` as published (`worker-service.ts:168-172`); "some published + some retrying" can never yield `PARTIALLY_PUBLISHED`.
- `retryTargetNow` returns the first (wrong) attempt (`worker-service.ts:707-720`); retry-all creates dangling `STARTED` attempts and can't unstick `APPROVAL_BLOCKED`.
- Unbounded catch-up publishing; timezone stored but never consulted for the scheduled instant (naive browser-local parse, `new/page.tsx:380-401`); no slot ordering, `slice(0,limit)`.
- YouTube quota consumed pre-call and never released on failure; ledger global across workspaces; X media upload fabricated while cost is consumed.

### 6.3 Worker engine

- Trigger: manual browser button only (secret hardcoded client-side); no cron config anywhere; no polling/auto-refresh so states never resolve.
- Config hardcoded: batch 25, max attempts 3, 15-min stale threshold; none of the documented worker env vars exist (`SOCIAL_SCHEDULER_WORKER_BATCH_SIZE`, `_MAX_ATTEMPTS`, `_MAX_RUNTIME_MS`).
- Stale-lock recovery lacks `nextRetryAt` and the `STALE_WORKER_LOCK` code; retry ladder flat; `RATE_LIMITED` uncapped; `TIMED_OUT` auto-retried against the documented manual-review rule.
- Worker secret env-name drift (`WORKER_SECRET` vs `SOCIAL_SCHEDULER_WORKER_SECRET`).

### 6.4 API contract drift vs foundational docs (docs/06)

The documented contract was silently replaced (docs/06 §9 line 429 requires doc-first changes):

- No `POST /auth/login|logout`, `GET /auth/me` at all; no `{error:{code,message,details}}` envelope anywhere (plain `{error:"string"}`).
- `POST /media/presign-upload` renamed `media/initiate-upload` with different request/response shapes.
- `POST /posts/:id/schedule` is a stub that persists nothing and returns fabricated `SCHEDULED`.
- No `PATCH /posts/:id` (only `draft-content`), no `DELETE /posts/:id`, no `GET /posts/:id/status`, no `POST /posts/:id/publish-now`, no pagination on `GET /posts`.
- `DELETE /social-accounts/:id` implemented as `POST …/disconnect` (wrong verb); adapter interface lacks `validatePost` and `refreshToken` on every adapter.
- 11 of 14 documented `PublishErrorCode` values absent; error vocabulary replaced wholesale with sprint-specific codes.
- Platform set diverged from docs 01/02/09/16: X fully built (explicitly excluded by four foundational docs, complete with paid-API cost metering that violates "no paid API dependencies in MVP"); LinkedIn/TikTok absent (spec's V1.5/Later) beyond unused enum placeholders.
- The mandated `packages/publisher-core` reusable package does not exist; no NestJS, no module/service/repository layering (docs 03/12) — flat Next.js routes calling `sprint1Storage` directly.

### 6.5 Tests & verification

- The **339/339** figure corresponds to nine hand-rolled `npx tsx` scripts (`tests/sprint1..9_verification.ts`) plus two B2 scripts. There is **no test runner, no `test` script, no CI** (`apps/web/package.json` has only dev/build/start/lint; `tsx` isn't even a declared dependency).
- All tests exercise the **in-memory store directly** — no HTTP coverage, no Prisma coverage, no component/DOM tests. Several Sprint 1 tests are self-referential (they re-implement the validation rules locally and assert on their own logic).
- The suites cannot catch the structural failures: missing persistence, missing auth, missing route scoping, the bulk-create runtime failure (tests inline assets), or the review-page crash.
- Missing documented test cases: mixed publish modes, duplicate-claim/concurrency, isolation-403, GIF blocking, budget caps, chunked upload lifecycle, PKCE non-exposure, worker-secret rejection, signed-URL leakage, HTTP endpoint behavior.

### 6.6 Env vars, config, enums

- **Nearly every documented `SOCIAL_SCHEDULER_*` flag is absent:** Instagram poll limits/flags (Sprint 4), `PINTEREST_*` (Sprint 5), `GOOGLE_*`/`YOUTUBE_*` (Sprint 6), `X_*` flags and cost/rate-cap vars (Sprint 7), the 12 Sprint 8 gates, and all 10 Sprint 9 flags. Feature behavior is hardcoded instead.
- **Env-name drift:** worker secret `WORKER_SECRET` vs documented `SOCIAL_SCHEDULER_WORKER_SECRET`; `TOKEN_ENCRYPTION_KEY` → `CREDENTIAL_VAULT_SECRET`; `B2_APPLICATION_KEY(_ID)` → `B2_ACCESS_KEY_ID`/`B2_SECRET_ACCESS_KEY`; documented `SESSION_SECRET`/`TEST_USERNAME`/`TEST_PASSWORD_HASH` never implemented.
- **TS/Prisma enum drift (un-writable to a real DB):** TS `PostStatus.QUOTA_BLOCKED` absent from Prisma; TS target statuses `PENDING`/`RATE_LIMITED`/`MOCK_READY`/`BLOCKED` absent from Prisma (and `PENDING`/`MOCK_READY` are actively written by the composer/duplicate flow); `TIKTOK`/`LINKEDIN` in the TS platform enum but not Prisma; account status `EXPIRED` (spec) dropped, `NEEDS_REAUTH` alias exists.
- **Schema header stale:** still claims Sprint 1–3 conformance while containing Sprint 4–9 models.

### 6.7 Named components/services conformance

Across Sprints 1–9 the docs name roughly **75+ components and services**. Essentially **none exist as named modules** — the codebase has 22 component files with different names, and all "service" logic is inlined in page files and the 3,569-line `mock-storage.ts`. Examples: all 16 Sprint 1 components; all 10 Sprint 3 components/services; all 8 Sprint 4 Instagram components; all 12 Sprint 5 Pinterest components; 11+9 Sprint 6 YouTube components; all 12 Sprint 7 X components; 21 of 24 Sprint 8 components; the Sprint 9 `Bulk*Step` family, `ApprovalPanel`, `ApprovalQueuePage`. This is a consistent documentation-vs-structure gap (behavior mostly exists, but the documented module boundaries do not), and in a few cases (e.g. `DraftComposerJsonPanel`, `XMediaUploadTimelineItem`, `XRateLimitBadge`) there is **no equivalent at all**.

---

## 7. Honest assessment of `docs/current_implementation_status.md` (v1.7)

The document claims: Sprints 1–9 COMPLETED, 339/339 automated tests passing, production build clean, and a QA matrix certifying "Production Release Gate: 100% pass."

**What is true:** the route and UI surface for every sprint exists; the nine mock-layer verification scripts pass; the Next.js build compiles; the documented feature concepts (worker, vault, preflight, calendar, bulk, approvals) are all present in code form.

**What the claim overstates — six material ways:**

1. **Nothing is persisted.** No database; all state is localStorage or process memory; the vault empties on restart. "Completed" sprints are satisfied only against the mock layer.
2. **Nothing is authenticated or tenant-enforced.** The multi-tenant isolation the status doc lists as a Sprint 1 capability is client-supplied `workspaceId` filtering with no enforcement.
3. **Nothing publishes on a schedule.** The "worker engine" runs only when a human clicks a button in the browser; there is no cron.
4. **Real publishing is unreachable or unsafe as configured.** Meta is gated off (no credentials); IG/Pinterest/X/YouTube adapters would call live APIs with mock tokens; X media upload IDs are fabricated; YouTube upload is metadata-only.
5. **Three shipped flows are runtime-broken:** bulk creation fails for every item from the UI; review/approvals crash on load; OAuth-connected accounts are invisible to the composer/accounts UI.
6. **The QA matrix that certifies production readiness is hardcoded to pass** — it structurally cannot report a blocker, so "100% pass / zero blocking issues" is not evidence of anything.

Sprints 10–11 are correctly marked Planned — **no code, routes, models, or tests exist for them** (see §8).

---

## 8. Sprints 10–11 and future docs

- **Sprint 10** (Platform Feature Deepening, Media Compatibility, Polish) and **Sprint 11** (Post-Publishing Checks, Verification, Reconciliation, Recovery) — plans only; zero code/routes/models/tests. The last commit is `fd9b88c "Sprint 9 Done"`.
- Several `docs/future/*` items were **built early** (workspaces with roles, approvals, audit logs, calendar drag) while their foundational prerequisites (persistence, auth) were not — inverting the intended dependency order.
- **Analytics, AI features, LinkedIn, TikTok** have zero presence (TIKTOK/LINKEDIN exist only as unused enum placeholders — and their presence in the TS enum itself contradicts the sprint docs' platform scopes). Per-platform preview remains generic.

---

## 9. Consolidated priority list

**P0 — Product-breaking (must fix before any real use)**

1. Single source of truth: stand up the database (Prisma client + migrations) or otherwise unify server/client state; eliminate the split brain.
2. Authentication + workspace authorization on every API route and page; remove the mock login; add `middleware.ts`.
3. Scheduled worker trigger (cron) with the secret out of the browser bundle; fix the queue-page "Process Due" 401.
4. Fix the three runtime-broken flows: bulk upload/creation (wire the real B2 pipeline), review/approvals crash, OAuth accounts invisible in UI.

**P1 — Publishing correctness**

5. Idempotency keys + atomic (CAS) target claims + `UNKNOWN_AFTER_TIMEOUT` manual-review state.
6. Retry ladder 5/15/60; cap `RATE_LIMITED`; fix the X/Pinterest 429 epoch-seconds misparse; stop re-charging X cost per retry; void unconsumed charges.
7. IG container resume (no re-creation on retry); release YouTube quota on failed uploads; scope the quota ledger per workspace and fix the reset timezone.
8. Catch-up bound for due posts; timezone-aware `scheduledAt` computation.
9. Fix `recalculatePostStatus` (`PRIVATE_RESTRICTED`), `retryTargetNow` wrong attempt, retry-all dangling attempts, and the PARTIALLY_PUBLISHED precedence.

**P2 — Honesty & conformance**

10. Make the QA matrix evaluate real invariants (and never hardcode `productionReady`); implement `PlatformQuotaSnapshot` capture; wire dashboard numbers to snapshots.
11. Add the documented env flags or update the docs to the implemented names; reconcile TS/Prisma enums; fix the schema header.
12. Implement the documented-but-missing endpoints (schedule persistence, media rows, upload-jobs, attempts, estimate-cost wiring) and remove/flag the stubs.
13. Real platform gates: request the documented OAuth scopes; add token expiry checks/refresh flow; fix the Meta sandbox-token guard; implement real X media upload and YouTube `videos.insert` or clearly label them mock.
14. Security cleanup: remove hardcoded secrets (rotate the exposed B2 keys), add workspace checks to `media/preview`/`complete-upload`, redact signed-URL params, return `verifiedInB2:false` as a failure, add CORS/origin config, sanitize error bodies.
15. Write the missing audit events (`POST_CREATED`, connect/disconnect, `WORKER_ATTEMPT_*`, `POST_QUICK_EDITED`) and bound audit growth.

**P3 — UX & robustness**

16. Error/loading/404 boundaries app-wide; polling/auto-refresh for transient states.
17. Pagination; autosave + unsaved-changes guards; keyboard alternatives for drag-and-drop; focus management in modals; ARIA labels.
18. Blocked-target remedies (quota/cost/private states); persist the write-only Settings controls; remove the legacy parallel app (`/dashboard`, `/posts…`) or merge it; fix double headers, month/day calendar stubs, hardcoded workspaces, `?stage=` deep link.

---

## Appendix A — Source reports

This document synthesizes fourteen read-only audits, each reading its assigned sprint doc (~1,900–2,650 lines) in full and verifying every deliverable against the code:

1. Sprint 1 doc vs code · 2. Sprint 2 doc vs code · 3. Sprint 3 doc vs code · 4. Sprint 4 doc vs code · 5. Sprint 5 doc vs code · 6. Sprint 6 doc vs code · 7. Sprint 7 doc vs code · 8. Sprint 8 doc vs code · 9. Sprint 9 doc vs code · 10. End-to-end UX journey trace · 11. Foundational docs 00–16 vs code · 12. Persistence/wiring audit · 13. Worker/adapters audit · 14. Future-docs scan

All file:line citations were cross-checked against first-hand reads of `worker-service.ts`, `mock-storage.ts` (key sections), `credential-vault.ts`, `b2.ts`, the worker route, the composer, the accounts pages, `apps/api/prisma/schema.prisma`, `docs/current_implementation_status.md`, `readme.md`, and both env files. No repository files were created, modified, or deleted during this analysis.