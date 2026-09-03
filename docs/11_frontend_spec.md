# Frontend Specification — Social Media Scheduler MVP

## 1. Goal

Build a simple, clear frontend for creating, scheduling, and tracking social posts.

The UI should be operational, lightweight, and easy to integrate into the main app later.

## 2. Frontend Routes

```txt
/login
/dashboard
/posts
/posts/new
/posts/:id
/social-accounts
/settings
```

## 3. Route Details

## `/login`

Purpose:

- Allow temporary test user login.

Components:

- `LoginForm`

Fields:

- Username
- Password

States:

- Loading
- Invalid credentials
- Server error

## `/dashboard`

Purpose:

- Show quick overview.

Content:

- Scheduled count
- Published count
- Failed count
- Recent posts
- CTA to create new post

Keep this minimal.

## `/posts`

Purpose:

- List all posts.

Features:

- Status filter
- Search by caption text if easy
- Cursor/page pagination
- Status badge
- Scheduled time
- Platform icons/names
- Create post button

## `/posts/new`

Purpose:

- Compose and schedule a post.

Components:

- `PostComposer`
- `MediaUploader`
- `PlatformSelector`
- `SchedulePicker`

Fields:

- Caption
- Media upload
- Social account/platform
- Scheduled date/time

Actions:

- Save draft
- Schedule post
- Publish now if supported

## `/posts/:id`

Purpose:

- Show post details and publishing history.

Content:

- Caption
- Media preview
- Scheduled time
- Status
- Target platform/account statuses
- Publish attempts
- Error details

Actions:

- Cancel if scheduled
- Retry if failed and retryable

## `/social-accounts`

Purpose:

- Connect and manage platform accounts.

Content:

- Connected accounts list
- Account status
- Connect buttons
- Reconnect button
- Disconnect button

## `/settings`

Purpose:

- Basic MVP settings.

Content:

- Environment/status info if useful
- No SaaS settings
- No billing settings

## 4. Components

```txt
LoginForm
DashboardSummaryCards
PostListTable
PostComposer
MediaUploader
PlatformSelector
SchedulePicker
PostStatusBadge
PublishTargetStatusBadge
PublishAttemptDrawer
SocialAccountCard
EmptyState
LoadingState
ErrorState
ConfirmCancelDialog
RetryPublishButton
```

## 5. Post Composer Behavior

## Caption

- Required for scheduled post unless platform allows media-only posting and product decision allows it.
- Show character count if platform-specific validation is implemented.

## Media

- Allow drag/drop.
- Show upload progress.
- Show preview.
- Show file name, size, type.
- Show validation error for unsupported type or oversized file.

## Platform Selection

- Show only connected accounts.
- If no accounts connected, show CTA to connect account.

## Schedule Picker

- Date/time must be in the future.
- Store timezone-aware value.
- UI should make timezone clear.

## 6. Status Badge Labels

```txt
DRAFT: Draft
SCHEDULED: Scheduled
PROCESSING: Processing
PUBLISHED: Published
PARTIALLY_PUBLISHED: Partially Published
FAILED: Failed
CANCELLED: Cancelled
RETRYING: Retrying
REAUTH_REQUIRED: Reconnect Required
```

## 7. Empty States

## No posts

```txt
No scheduled posts yet. Create your first post to test the scheduler.
```

## No connected accounts

```txt
No social accounts connected. Connect an account before scheduling a post.
```

## No attempts

```txt
No publishing attempts yet. Attempts will appear once the post is processed.
```

## 8. Error States

Every failed post must show:

- Error code
- Human-readable message
- Whether retry is available
- Whether reconnect is required

## 9. Responsive Rules

- No horizontal page scroll at normal desktop width.
- Composer should stack cleanly on smaller screens.
- Tables should scroll inside their own container if needed.
- Long captions should wrap or truncate predictably.

## 10. Design Direction

Visual style:

- Minimal
- SaaS-like
- Operational
- Calm
- Clear status hierarchy

Avoid:

- Overly flashy animations
- Social-media-consumer-app styling
- Dense ERP clutter
- Complex dashboard before the scheduler works

## 11. Frontend Data Fetching

Use a centralized API client.

Recommended:

- Axios instance or fetch wrapper
- TanStack Query for server state
- Zod for client-side form validation

## 12. Frontend Guardrails

Do not:

- Put platform secrets in frontend.
- Store access tokens in localStorage.
- Publish directly from frontend to social APIs.
- Hard-code B2 credentials.
- Add hidden SaaS/team/billing routes.
- Modify API contracts without updating `06_api_contracts.md`.
