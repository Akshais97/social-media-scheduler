# Scheduling and Publishing Workflow

## 1. Goal

The scheduler must reliably publish due posts without duplicates, silent failures, or unclear states.

The main workflow is:

```txt
SCHEDULED → PROCESSING → PUBLISHED
                     ↓
                  FAILED
                     ↓
                 RETRYING
```

## 2. Core Concepts

### Post

The main user-created content item.

### Publish Target

A specific destination for a post, such as one Instagram account or one Facebook page.

### Publish Attempt

A record of one attempt to publish a target.

## 3. Status Model

## Post Statuses

```txt
DRAFT
SCHEDULED
PROCESSING
PUBLISHED
PARTIALLY_PUBLISHED
FAILED
CANCELLED
```

## Publish Target Statuses

```txt
PENDING
SCHEDULED
PROCESSING
PUBLISHED
FAILED
RETRYING
REAUTH_REQUIRED
CANCELLED
```

## Publish Attempt Statuses

```txt
STARTED
SUCCESS
FAILED
SKIPPED
```

## 4. Create Scheduled Post Flow

```txt
1. User creates post with caption, media, target account, and scheduled time.
2. API validates input.
3. API creates posts row.
4. API links media_assets to post.
5. API creates publish_targets rows.
6. Post status = SCHEDULED.
7. Publish target status = SCHEDULED.
```

## 5. Due Post Detection

Worker finds publish targets where:

```txt
status IN (SCHEDULED, RETRYING)
scheduled_for <= now
```

For retrying targets:

```txt
next_retry_at <= now
```

## 6. Locking Rule

Before publishing, worker must claim the target.

Preferred approach:

```txt
Update target from SCHEDULED/RETRYING to PROCESSING only if current status is still eligible.
```

Example logic:

```txt
UPDATE publish_targets
SET status = 'PROCESSING', processing_started_at = now()
WHERE id = target_id
AND status IN ('SCHEDULED', 'RETRYING')
```

If zero rows are updated, another worker has already claimed it.

## 7. Publishing Flow

```txt
1. Worker claims target.
2. Worker creates publish_attempt with status STARTED.
3. Worker loads post, media, and social account.
4. Worker validates account/token/media.
5. Worker calls platform adapter.
6. Platform adapter returns success or failure.
7. Worker updates publish_attempt.
8. Worker updates publish_target.
9. Worker recalculates parent post status.
```

## 8. Success Handling

On success:

```txt
publish_attempt.status = SUCCESS
publish_target.status = PUBLISHED
publish_target.platform_post_id = value from platform
publish_target.platform_post_url = value from platform if available
publish_target.published_at = now
```

Then update post:

```txt
If all targets published → post.status = PUBLISHED
If some targets published and some failed → post.status = PARTIALLY_PUBLISHED
```

## 9. Failure Handling

Classify failures as retryable or non-retryable.

### Retryable

```txt
NETWORK_ERROR
RATE_LIMITED
TEMPORARY_PLATFORM_ERROR
TIMEOUT
```

### Non-Retryable

```txt
TOKEN_EXPIRED
PERMISSION_MISSING
MEDIA_REJECTED
UNSUPPORTED_FORMAT
PLATFORM_VALIDATION_FAILED
ACCOUNT_REVOKED
```

## 10. Retry Logic

For retryable failures:

```txt
status = RETRYING
retry_count += 1
next_retry_at = now + backoff
```

Recommended MVP backoff:

```txt
Attempt 1: 5 minutes
Attempt 2: 15 minutes
Attempt 3: 60 minutes
After 3 attempts: FAILED
```

## 11. Reauth Handling

If token is missing, expired, revoked, or insufficient:

```txt
publish_target.status = REAUTH_REQUIRED
social_account.status = REAUTH_REQUIRED
```

UI should tell the user to reconnect the account.

## 12. Cancellation Flow

A scheduled post can be cancelled only before processing.

Allowed:

```txt
DRAFT → CANCELLED
SCHEDULED → CANCELLED
```

Not allowed:

```txt
PROCESSING → CANCELLED
PUBLISHED → CANCELLED
```

## 13. Idempotency Rules

Every publish target must have an `idempotency_key`.

Before retrying, check whether the platform returned a post ID in a previous response.

Never blindly retry after an unknown timeout without recording the uncertainty.

Use this kind of state:

```txt
FAILED_UNKNOWN_PLATFORM_STATE
```

or store:

```txt
last_error_code = UNKNOWN_AFTER_TIMEOUT
```

Then require manual review if duplicate risk is high.

## 14. Transaction Rules

Keep database transactions short.

Allowed inside a transaction:

- Claim target.
- Create attempt row.
- Update status.

Not allowed inside a transaction:

- Calling social platform APIs.
- Uploading files.
- Downloading media.
- Waiting on external services.

## 15. Worker Endpoint Security

If using Railway cron endpoint:

```txt
POST /worker/publish-due
```

Require:

```txt
X-Worker-Secret
```

Reject requests without the correct secret.

## 16. Completion Criteria

The scheduling workflow is complete when:

- Due posts are picked up.
- Concurrent worker calls do not duplicate processing.
- Every attempt is logged.
- Failures are categorized.
- Retryable failures retry safely.
- Non-retryable failures surface useful messages.
- UI clearly reflects final state.
