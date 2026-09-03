# Status Enums and Error States

## 1. Purpose

This document standardizes all statuses and error codes used by the scheduler.

AI coding agents must not invent new statuses casually.

If a new status is needed, update this document first.

## 2. Post Status

```ts
export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  PARTIALLY_PUBLISHED = 'PARTIALLY_PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
```

## 3. Post Status Meaning

| Status | Meaning |
|---|---|
| `DRAFT` | Post exists but is not scheduled. |
| `SCHEDULED` | Post has at least one scheduled publish target. |
| `PROCESSING` | At least one target is currently being published. |
| `PUBLISHED` | All targets published successfully. |
| `PARTIALLY_PUBLISHED` | Some targets published and some failed. |
| `FAILED` | All publish targets failed or post could not be processed. |
| `CANCELLED` | Post was cancelled before publishing. |

## 4. Publish Target Status

```ts
export enum PublishTargetStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  CANCELLED = 'CANCELLED',
}
```

## 5. Publish Target Status Meaning

| Status | Meaning |
|---|---|
| `PENDING` | Target created but not yet scheduled. |
| `SCHEDULED` | Target is waiting for scheduled time. |
| `PROCESSING` | Worker is attempting to publish. |
| `PUBLISHED` | Platform accepted/published post. |
| `FAILED` | Publishing failed and no more automatic retries are planned. |
| `RETRYING` | Publishing failed temporarily and will be retried. |
| `REAUTH_REQUIRED` | Social account must be reconnected. |
| `CANCELLED` | Target was cancelled before processing. |

## 6. Publish Attempt Status

```ts
export enum PublishAttemptStatus {
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}
```

## 7. Social Account Status

```ts
export enum SocialAccountStatus {
  CONNECTED = 'CONNECTED',
  EXPIRED = 'EXPIRED',
  REAUTH_REQUIRED = 'REAUTH_REQUIRED',
  REVOKED = 'REVOKED',
  ERROR = 'ERROR',
}
```

## 8. Media Asset Status

```ts
export enum MediaAssetStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}
```

## 9. Error Codes

```ts
export enum PublishErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MEDIA_TOO_LARGE = 'MEDIA_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
  MEDIA_URL_NOT_ACCESSIBLE = 'MEDIA_URL_NOT_ACCESSIBLE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  PERMISSION_MISSING = 'PERMISSION_MISSING',
  ACCOUNT_REVOKED = 'ACCOUNT_REVOKED',
  PLATFORM_REJECTED = 'PLATFORM_REJECTED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TEMPORARY_PLATFORM_ERROR = 'TEMPORARY_PLATFORM_ERROR',
  UNKNOWN_AFTER_TIMEOUT = 'UNKNOWN_AFTER_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

## 10. Retryability

## Retryable Errors

```txt
NETWORK_ERROR
RATE_LIMITED
TEMPORARY_PLATFORM_ERROR
```

## Manual Review Errors

```txt
UNKNOWN_AFTER_TIMEOUT
```

## Non-Retryable Errors

```txt
VALIDATION_ERROR
MEDIA_TOO_LARGE
UNSUPPORTED_FORMAT
MEDIA_NOT_FOUND
MEDIA_URL_NOT_ACCESSIBLE
TOKEN_EXPIRED
PERMISSION_MISSING
ACCOUNT_REVOKED
PLATFORM_REJECTED
```

## 11. UI Copy Guidelines

## `REAUTH_REQUIRED`

Display:

```txt
This account needs to be reconnected before publishing can continue.
```

## `MEDIA_URL_NOT_ACCESSIBLE`

Display:

```txt
The platform could not access the uploaded media. Please retry or re-upload the file.
```

## `RATE_LIMITED`

Display:

```txt
The platform temporarily rate-limited this request. We will retry automatically.
```

## `UNKNOWN_AFTER_TIMEOUT`

Display:

```txt
The request timed out after being sent to the platform. Manual review is recommended to avoid duplicate publishing.
```

## 12. Status Transition Rules

Allowed transitions:

```txt
DRAFT → SCHEDULED
DRAFT → CANCELLED
SCHEDULED → PROCESSING
SCHEDULED → CANCELLED
PROCESSING → PUBLISHED
PROCESSING → FAILED
PROCESSING → RETRYING
PROCESSING → REAUTH_REQUIRED
RETRYING → PROCESSING
RETRYING → FAILED
REAUTH_REQUIRED → SCHEDULED after reconnect
```

Disallowed transitions:

```txt
PUBLISHED → SCHEDULED
PUBLISHED → PROCESSING
CANCELLED → PROCESSING
FAILED → PUBLISHED without a successful retry attempt
```

## 13. Rule

Do not use loose string literals for statuses throughout the app.

Use shared enum constants.
