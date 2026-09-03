# Social Media Scheduler MVP — Project Overview

## 1. What This Project Is

This project is a standalone Social Media Scheduler MVP.

It allows one internal/test user to upload a media file, write a caption, select a connected social account, schedule the post, and have the backend publish it later.

The MVP is intentionally small. It is not a full SaaS platform, not an agency workspace system, not a social inbox, and not an analytics product.

## 2. Why Build It Standalone First

The feature is being built standalone first so the publishing flow can be validated independently before being integrated into a larger application.

The standalone app should act as a temporary shell around a reusable publishing module.

The final goal is:

```txt
Standalone scheduler app now
        ↓
Reusable publisher core
        ↓
Integrated feature inside main application later
```

## 3. Core User Journey

```txt
1. User logs in with one test credential.
2. User uploads image/video media.
3. Media is saved in Backblaze B2.
4. User writes caption.
5. User selects platform/account.
6. User selects publish time.
7. Post metadata is saved in Supabase Postgres.
8. Railway cron/worker checks due posts.
9. Due post is published through the platform adapter.
10. Status becomes PUBLISHED or FAILED.
11. User can view post history and error details.
```

## 4. Deployment Stack

| Layer | Service |
|---|---|
| Frontend | Vercel |
| Backend/API | Railway |
| Database | Supabase Postgres |
| Media Storage | Backblaze B2 |
| Scheduler | Railway Cron or Railway Worker |
| Queue | Postgres-backed jobs/status table |
| Auth | Temporary single-user login |

## 5. MVP Principle

Build only what proves the upload, storage, scheduling, and publishing flow.

Do not add features that belong to the later integrated SaaS product.

## 6. What This Is Not

This MVP is not:

- A full SaaS product
- A multi-tenant workspace system
- A user/team management system
- A billing platform
- A content approval workflow
- A social inbox
- A social analytics dashboard
- An AI caption generator
- A campaign management tool

## 7. Long-Term Integration Direction

The temporary standalone app should be replaceable.

The reusable parts should remain:

- Post composer logic
- Media upload flow
- Backblaze B2 storage integration
- Scheduling workflow
- Publishing state machine
- Social platform adapters
- Publish attempt logging
- Error handling

The temporary parts should be replaced later:

- Single login credential
- Standalone navigation
- Standalone dashboard shell
- Nullable `owner_id` / `workspace_id`

## 8. Success Criteria

The MVP is successful when:

- A user can upload media.
- The media is stored in B2.
- A scheduled post is saved in Postgres.
- The scheduler detects due posts.
- A platform adapter attempts publishing.
- Success/failure is stored clearly.
- The UI shows scheduled, published, failed, and cancelled states.
- The code can later be integrated into another application without rewriting the publisher core.
