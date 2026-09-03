# Setup Runbook — Social Media Scheduler MVP

## 1. Purpose

This runbook explains how to set up, run, test, and deploy the Social Media Scheduler MVP.

## 2. Prerequisites

Install:

```txt
Node.js LTS
pnpm or npm
Git
PostgreSQL client tools optional
```

Accounts needed:

```txt
Vercel
Railway
Supabase
Backblaze B2
Meta Developer Account later
LinkedIn Developer Account later
TikTok Developer Account later
```

## 3. Repository Setup

Recommended structure:

```txt
social-media-scheduler/
  apps/
    web/
    api/
  packages/
    publisher-core/
  docs/
```

Install dependencies:

```bash
pnpm install
```

or:

```bash
npm install
```

## 4. Supabase Setup

1. Create Supabase project.
2. Copy database connection strings.
3. Set runtime pooled URL as `DATABASE_URL`.
4. Set migration/direct URL as `DIRECT_URL`.
5. Run Prisma migration.

```bash
pnpm prisma migrate dev
```

or:

```bash
npx prisma migrate dev
```

## 5. Backblaze B2 Setup

1. Create B2 bucket.
2. Create application key.
3. Ensure the key has required bucket permissions.
4. Configure CORS for local frontend and production frontend.
5. Add credentials to backend environment variables.

Required env vars:

```txt
B2_APPLICATION_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
B2_REGION=
```

## 6. Local Environment

Create API `.env`:

```txt
NODE_ENV=development
API_PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=
DIRECT_URL=
SESSION_SECRET=
TEST_USERNAME=admin
TEST_PASSWORD_HASH=
WORKER_SECRET=
B2_APPLICATION_KEY_ID=
B2_APPLICATION_KEY=
B2_BUCKET_NAME=
B2_ENDPOINT=
B2_REGION=
TOKEN_ENCRYPTION_KEY=
```

Create frontend `.env`:

```txt
VITE_API_BASE_URL=http://localhost:4000
```

or for Next.js:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 7. Generate Password Hash

Create a script or use backend utility to hash test password.

Do not store plain password in env.

## 8. Run Backend Locally

```bash
cd apps/api
pnpm dev
```

or:

```bash
npm run dev
```

## 9. Run Frontend Locally

```bash
cd apps/web
pnpm dev
```

or:

```bash
npm run dev
```

## 10. Local Smoke Test

```txt
1. Open frontend.
2. Login.
3. Create upload.
4. Upload image/video to B2.
5. Complete upload.
6. Create scheduled post.
7. Confirm post appears in list.
8. Manually call worker endpoint.
9. Confirm status changes.
```

Manual worker call:

```bash
curl -X POST http://localhost:4000/worker/publish-due \
  -H "Content-Type: application/json" \
  -H "X-Worker-Secret: your-worker-secret" \
  -d '{"limit":10}'
```

## 11. Deploy Backend to Railway

1. Create Railway project.
2. Connect repository.
3. Set root directory to API app if monorepo.
4. Add env vars.
5. Deploy.
6. Confirm health endpoint works.

## 12. Configure Railway Cron

Create cron job that calls:

```txt
POST /worker/publish-due
```

Include worker secret header if Railway supports configured request headers. If not, use a worker process instead of external cron.

MVP alternative:

```txt
Run lightweight worker process on Railway that polls due jobs.
```

## 13. Deploy Frontend to Vercel

1. Import frontend app.
2. Set frontend root directory.
3. Add API base URL env var.
4. Deploy.
5. Confirm login works.
6. Confirm API CORS allows Vercel domain.

## 14. Production Smoke Test

```txt
[ ] Login works on Vercel frontend.
[ ] API calls Railway successfully.
[ ] Upload presign succeeds.
[ ] Browser uploads to B2.
[ ] Scheduled post saves.
[ ] Worker processes due post.
[ ] Status updates appear in UI.
```

## 15. Common Errors

## B2 CORS failure

Symptoms:

```txt
Browser upload blocked by CORS/preflight.
```

Fix:

- Add local and production frontend origins.
- Allow required methods.
- Allow required headers.

## Invalid database connection

Symptoms:

```txt
Prisma cannot connect.
```

Fix:

- Verify `DATABASE_URL`.
- Verify `DIRECT_URL` for migrations.
- Do not use migration URL at runtime.

## Worker endpoint unauthorized

Symptoms:

```txt
401 from /worker/publish-due.
```

Fix:

- Check `WORKER_SECRET` in Railway.
- Check request header.

## Platform cannot access media URL

Symptoms:

```txt
Publishing fails after upload succeeded.
```

Fix:

- Ensure publishable URL is accessible from platform servers.
- Use temporary public object or direct upload flow if signed URL fails.

## 16. Reset Local Database

```bash
pnpm prisma migrate reset
```

or:

```bash
npx prisma migrate reset
```

## 17. Inspect Failed Attempts

Query:

```sql
SELECT *
FROM publish_attempts
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 20;
```

## 18. Rule

Whenever setup changes, update this runbook immediately.
