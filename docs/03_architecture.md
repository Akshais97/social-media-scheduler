# Architecture — Social Media Scheduler MVP

## 1. Architecture Summary

The app is a small modular monolith with a separate frontend and backend.

```txt
Frontend: Vercel-hosted web app
Backend: Railway-hosted API and scheduler
Database: Supabase Postgres
Storage: Backblaze B2
Queue: Postgres job/status tables
```

No Redis, Kafka, RabbitMQ, background microservice mesh, or separate queue infrastructure is required for MVP.

## 2. High-Level System Diagram

```txt
User
 ↓
Vercel Frontend
 ↓ HTTPS
Railway API
 ├── Supabase Postgres
 ├── Backblaze B2
 └── Social Platform APIs

Railway Cron / Worker
 ↓
Supabase Postgres
 ↓
Due scheduled posts
 ↓
Publisher Service
 ↓
Platform Adapter
 ↓
Social Platform API
```

## 3. Runtime Components

## 3.1 Frontend

Responsibilities:

- Login page
- Post composer
- Media uploader
- Schedule picker
- Platform/account selector
- Post history
- Status display
- Error display

The frontend must not:

- Hold B2 master credentials
- Hold platform client secrets
- Publish directly to social APIs
- Store tokens in localStorage

## 3.2 Backend API

Responsibilities:

- Authenticate temporary user
- Create B2 presigned upload URLs
- Save media metadata
- Save post metadata
- Manage social account OAuth
- Trigger publishing
- Expose post history/status

## 3.3 Scheduler / Worker

Can be implemented as either:

1. A Railway cron hitting an internal endpoint such as `POST /worker/publish-due`.
2. A lightweight Railway worker process polling the database periodically.

For MVP, Railway cron is acceptable.

For more accurate scheduling, a lightweight worker loop is preferred.

## 3.4 Database

Supabase Postgres stores:

- Users/test auth record
- Social accounts
- Posts
- Media metadata
- Publish targets
- Publish attempts
- Status and errors

The database is the source of truth for post state.

## 3.5 Media Storage

Backblaze B2 stores uploaded media files.

The database stores only metadata and object keys.

## 4. Module Boundaries

```txt
AuthModule
PostsModule
MediaModule
StorageModule
SchedulerModule
PublisherModule
SocialAccountsModule
PlatformAdaptersModule
```

## 5. Request Flow: Create Scheduled Post

```txt
1. Frontend sends login session cookie.
2. Frontend asks API for B2 presigned upload URL.
3. Browser uploads media directly to B2.
4. Frontend confirms upload complete.
5. API creates media_assets row.
6. Frontend submits caption/platform/schedule.
7. API creates posts row.
8. API creates publish_targets rows.
9. UI shows post as SCHEDULED.
```

## 6. Worker Flow: Publish Due Post

```txt
1. Worker finds publish targets where scheduled time is due.
2. Worker locks target or marks it PROCESSING atomically.
3. Worker creates publish_attempt row.
4. Worker asks PublisherService to publish.
5. PublisherService calls the platform adapter.
6. Adapter returns success or failure.
7. Worker updates publish target and post status.
8. UI shows result.
```

## 7. Integration-Ready Design

The standalone app must be replaceable.

Keep reusable publishing logic in services/modules that can be imported into the main app later.

Reusable:

- Media model
- Publishing state machine
- Platform adapters
- Scheduler logic
- Publish attempt logging
- Error classification

Temporary:

- Single test login
- Standalone layout
- Null owner/workspace
- MVP-only navigation

## 8. Anti-Patterns to Avoid

Do not:

- Build multiple microservices in MVP.
- Add Redis just for scheduling.
- Upload large files through the backend server.
- Store file binaries in Postgres.
- Put social API calls inside database transactions.
- Put Prisma queries in controllers.
- Use unbounded list queries.
- Mix platform-specific publishing logic into generic post service.
- Make the frontend talk to social APIs directly.
