# AI Coding Guardrails — Social Media Scheduler MVP

## 1. Purpose

This document tells AI coding agents exactly how to build the MVP without scope creep, architecture drift, or unsafe shortcuts.

## 2. Primary Objective

Build a standalone social media scheduler MVP that can later be integrated into another application.

Core flow:

```txt
Login → Upload Media → Save Post → Schedule → Worker → Publish Attempt → Status
```

## 3. Hard Scope Rules

Do not add:

```txt
SaaS billing
Multi-tenant RBAC
Team invitations
Agency workspaces
Email notifications
Redis
Analytics
AI caption generation
AI hashtag generation
Social inbox
Comments/replies
Campaign management
Calendar drag/drop
X/Twitter integration
Mobile app
```

## 4. Architecture Rules

Use modular monolith structure.

Do not create microservices.

Do not create a separate queue service.

Do not add Redis unless explicitly approved.

Use:

```txt
Frontend → Backend API → Postgres/B2 → Worker → Platform Adapter
```

## 5. Backend Rules

- Controllers handle HTTP only.
- Services handle business logic.
- Repositories handle Prisma queries.
- Platform adapters handle platform-specific behavior.
- Storage service handles B2.
- Scheduler service handles due jobs.

Do not put:

- Prisma queries in controllers.
- Platform API calls in `PostsService`.
- B2 implementation details in frontend.
- Social tokens in frontend.

## 6. Prisma Rules

```txt
[ ] Use shared PrismaClient only.
[ ] Prisma query is in repository/data-access layer.
[ ] Repository function is thin and specific.
[ ] No generic CRUD abstraction.
[ ] No unbounded findMany.
[ ] findMany has where/select/take/orderBy where applicable.
[ ] Use select by default.
[ ] Avoid full-row fetch unless justified.
[ ] No Prisma queries inside loops without review.
[ ] High-growth table queries are paginated.
[ ] New index matches a real query pattern.
[ ] Transaction is short and database-only.
[ ] No external API calls inside transactions.
[ ] Raw SQL is parameterized if used.
```

## 7. Storage Rules

Do not upload large media through the backend API.

Use:

```txt
Backend creates presigned upload URL.
Browser uploads directly to B2.
Backend stores metadata after upload completes.
```

Do not:

- Store media binary in Postgres.
- Expose B2 keys to frontend.
- Let frontend choose arbitrary B2 paths.
- Make every upload permanently public by default.

## 8. Scheduling Rules

Use Postgres as the durable queue/state store.

Worker must:

```txt
1. Find due targets.
2. Claim target atomically.
3. Create publish attempt.
4. Call platform adapter.
5. Update attempt.
6. Update target.
7. Recalculate parent post status.
```

Do not:

- Publish without an attempt row.
- Retry blindly after unknown timeout.
- Process cancelled posts.
- Process already published posts.
- Make external API calls inside DB transactions.

## 9. Status Rules

Use only statuses from:

```txt
10_status_enums_and_error_states.md
```

Do not invent new status strings in random files.

## 10. Platform Rules

Create a platform adapter interface before implementing platform-specific code.

Recommended order:

```txt
1. Mock adapter
2. Meta adapter for Instagram/Facebook
3. LinkedIn adapter
4. TikTok adapter later
```

Do not build X/Twitter in MVP.

## 11. Frontend Rules

Frontend must include:

```txt
Login
Post list
Create post
Media uploader
Schedule picker
Platform selector
Post details
Social accounts page
```

Frontend must show:

```txt
Loading states
Empty states
Error states
Status badges
Upload progress
Failed publish reason
Retry/cancel actions when valid
```

Do not add:

- Complex analytics dashboard
- Billing pages
- Team pages
- Workspace switcher
- Campaign manager

## 12. Security Rules

Never expose:

```txt
B2_APPLICATION_KEY
Platform client secrets
Access tokens
Refresh tokens
Worker secret
Token encryption key
```

Never log:

```txt
Access tokens
Refresh tokens
OAuth authorization codes
B2 secret keys
Sensitive signed URLs
```

## 13. Implementation Order

Follow this order:

```txt
1. Create database schema.
2. Create shared Prisma client.
3. Create repository layer.
4. Create temporary auth.
5. Create B2 presign upload flow.
6. Create media complete-upload flow.
7. Create post composer UI.
8. Create post create/list/detail API.
9. Create scheduler state machine.
10. Create worker endpoint/process.
11. Create mock platform adapter.
12. Create publish attempt logging.
13. Create frontend status/history UI.
14. Add first real platform adapter.
15. Add retry and reauth handling.
```

## 14. Definition of Done for Any AI-Coded Task

Before marking a coding task done:

```txt
[ ] Relevant docs were followed.
[ ] API contract was not silently changed.
[ ] DB schema change is documented.
[ ] Status values are from enum doc.
[ ] No new unapproved dependency was added.
[ ] No secret is exposed to frontend.
[ ] No unbounded Prisma query was added.
[ ] Error states are handled.
[ ] Loading/empty/error UI states exist where needed.
[ ] Basic test/manual verification steps are provided.
```

## 15. Final Rule

Keep the MVP small.

Build the scheduler and publisher core first.

Everything else is future scope unless explicitly approved.
