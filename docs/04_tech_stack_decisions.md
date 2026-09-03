# Technology Stack Decisions — Social Media Scheduler MVP

## 1. Stack Summary

| Area | Decision |
|---|---|
| Frontend Hosting | Vercel |
| Frontend Framework | Next.js or React + Vite |
| Language | TypeScript |
| UI | TailwindCSS + shadcn/ui |
| Forms | React Hook Form |
| Validation | Zod |
| Backend Hosting | Railway |
| Backend Framework | NestJS |
| Database | Supabase Postgres |
| ORM | Prisma |
| Media Storage | Backblaze B2 |
| Scheduler | Railway Cron or Railway Worker |
| Queue | Postgres-backed status/job table |
| Auth | Temporary single-user session |
| Email | None in MVP |
| Redis | Not used in MVP |
| Paid APIs | Avoid in MVP |

## 2. Frontend Decision

Use TypeScript with either:

- Next.js if using App Router and Vercel-native deployment.
- React + Vite if the app is intentionally lightweight and separate from the final product.

Recommended for fastest MVP:

```txt
React + Vite + TypeScript
```

Recommended if future integration is with a Next.js app:

```txt
Next.js + TypeScript
```

## 3. UI Decision

Use:

```txt
TailwindCSS + shadcn/ui
```

Reasons:

- Fast UI development.
- Consistent components.
- Easy future visual alignment with the main app.
- Less custom CSS maintenance.

## 4. Forms and Validation

Use:

```txt
React Hook Form + Zod
```

Frontend validation catches user mistakes early.

Backend DTO validation must still validate all incoming data.

Do not trust frontend validation alone.

## 5. Backend Decision

Use:

```txt
NestJS
```

Reasons:

- Clear module structure.
- Controller/service/repository separation.
- Good fit for future integration.
- Strong TypeScript support.
- Easier to add platform adapters cleanly.

## 6. Database Decision

Use:

```txt
Supabase Postgres
```

Reasons:

- Managed Postgres.
- Works well with Prisma.
- Free tier is enough for MVP.
- Easy to migrate into a larger application later.

## 7. ORM Decision

Use:

```txt
Prisma
```

Rules:

- Shared PrismaClient only.
- Repository/data-access layer only.
- No generic CRUD repository.
- No unbounded `findMany`.
- Use `select` by default.
- Paginate growing lists.

## 8. Storage Decision

Use:

```txt
Backblaze B2
```

Reasons:

- Already part of the broader infrastructure direction.
- Good for media files.
- Keeps media outside Postgres.
- Direct upload with presigned URLs avoids large API payloads.

## 9. Scheduler Decision

Use either:

```txt
Railway Cron → POST /worker/publish-due
```

or:

```txt
Railway Worker → Poll Postgres every N seconds
```

For MVP:

```txt
Railway Cron is acceptable.
```

For more accurate publishing times:

```txt
Use a lightweight Railway worker loop.
```

## 10. Queue Decision

Do not add Redis in MVP.

Use Postgres tables:

```txt
posts
publish_targets
publish_attempts
```

The database already stores the durable scheduling state.

## 11. Auth Decision

Use temporary single-user login.

Do not build:

- Signup
- Password reset
- Team invites
- Supabase Auth
- OAuth login
- RBAC

Those are integration-stage features.

## 12. Cost Direction

MVP should target:

```txt
Vercel Free/Hobby
Railway Free/Hobby
Supabase Free
Backblaze B2 Free-tier usage
No paid APIs
```

Do not add paid services unless explicitly approved.
