# Testing Checklist — Social Media Scheduler MVP

## 1. Purpose

This checklist defines the minimum tests required before calling the MVP stable.

## 2. Auth Tests

```txt
[ ] Valid login succeeds.
[ ] Invalid username fails.
[ ] Invalid password fails.
[ ] Logout clears session.
[ ] Protected routes reject unauthenticated requests.
[ ] Frontend redirects unauthenticated user to login.
```

## 3. Media Upload Tests

```txt
[ ] Image upload presign succeeds.
[ ] Video upload presign succeeds.
[ ] Unsupported MIME type is rejected.
[ ] Oversized image is rejected.
[ ] Oversized video is rejected.
[ ] Browser can upload directly to B2.
[ ] Complete upload creates media_assets row.
[ ] Upload failure shows frontend error.
[ ] Missing B2 object is handled.
```

## 4. Post Creation Tests

```txt
[ ] Create draft with caption and media.
[ ] Create scheduled post with caption, media, account, and scheduled time.
[ ] Missing caption is rejected if caption is required.
[ ] Missing media is rejected if media is required.
[ ] Missing target account is rejected for scheduling.
[ ] Past scheduled time is rejected.
[ ] Scheduled time with timezone is saved correctly.
[ ] Post list shows created post.
[ ] Post details shows media and target status.
```

## 5. Social Account Tests

```txt
[ ] Social accounts page loads.
[ ] Connect flow returns authorization URL.
[ ] OAuth callback stores account.
[ ] Token is encrypted in database.
[ ] Account can be disconnected.
[ ] Reauth-required account is shown clearly.
```

## 6. Scheduler Tests

```txt
[ ] Worker finds due scheduled target.
[ ] Worker ignores future scheduled target.
[ ] Worker ignores cancelled target.
[ ] Worker ignores already published target.
[ ] Worker marks claimed target as PROCESSING.
[ ] Worker creates publish_attempt row.
[ ] Worker updates target to PUBLISHED on success.
[ ] Worker updates target to FAILED on non-retryable failure.
[ ] Worker updates target to RETRYING on retryable failure.
[ ] Worker does not duplicate processing if called twice.
```

## 7. Publishing Tests

```txt
[ ] Adapter validates required media.
[ ] Adapter validates account token.
[ ] Missing token returns REAUTH_REQUIRED.
[ ] Platform rejection is mapped to PLATFORM_REJECTED.
[ ] Rate limit is mapped to RATE_LIMITED.
[ ] Network failure is mapped to NETWORK_ERROR.
[ ] Successful publish stores platform_post_id.
[ ] Successful publish stores platform_post_url when available.
[ ] Failed publish records error code and message.
```

## 8. Retry Tests

```txt
[ ] Retryable failure increments retry_count.
[ ] Retryable failure sets next_retry_at.
[ ] Target retries after next_retry_at.
[ ] Target stops retrying after max attempts.
[ ] Manual retry is available for failed retryable targets.
[ ] Manual retry does not create duplicate post if platform state is known.
```

## 9. Cancellation Tests

```txt
[ ] Draft post can be cancelled/deleted.
[ ] Scheduled post can be cancelled.
[ ] Cancelled post is not processed by worker.
[ ] Processing post cannot be cancelled.
[ ] Published post cannot be cancelled.
```

## 10. Frontend UI Tests

```txt
[ ] Login loading state works.
[ ] Login error state works.
[ ] Post list empty state works.
[ ] Post list loading state works.
[ ] Post list error state works.
[ ] Media uploader progress appears.
[ ] Media preview appears after upload.
[ ] Status badges display correct labels.
[ ] Failed post shows error message.
[ ] Retry button appears only when valid.
[ ] Cancel button appears only when valid.
[ ] UI works on desktop.
[ ] UI works on smaller screen width.
```

## 11. Security Tests

```txt
[ ] B2 keys are not exposed in frontend bundle.
[ ] Platform client secrets are not exposed in frontend bundle.
[ ] Access tokens are not returned to frontend.
[ ] Access tokens are not logged.
[ ] Worker endpoint rejects missing secret.
[ ] Worker endpoint rejects invalid secret.
[ ] CORS allows only configured origins.
```

## 12. Database/Prisma Tests

```txt
[ ] PrismaClient is instantiated only once.
[ ] List queries include take/orderBy.
[ ] Post list is paginated.
[ ] Attempt list is scoped to post/target.
[ ] No external API calls happen inside DB transactions.
[ ] No Prisma query exists directly inside controller files.
```

## 13. MVP Completion Gate

Do not mark MVP complete until:

```txt
[ ] Upload works.
[ ] Scheduled post creation works.
[ ] Worker processes due posts.
[ ] Attempt logging works.
[ ] Status transitions work.
[ ] At least mock adapter path works.
[ ] At least one real platform adapter is ready or clearly stubbed.
[ ] Frontend shows all core states.
[ ] No secrets leak to frontend/logs.
```
