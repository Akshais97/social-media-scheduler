# Product Requirements Document — Social Media Scheduler MVP

## 1. Product Name

Social Media Scheduler MVP

## 2. Product Objective

Build a simple standalone social media scheduler that allows an internal/test user to upload media, write a caption, schedule a post, and publish it later through connected social media accounts.

The MVP should validate the core publishing workflow before integration into the main application.

## 3. Target User

### MVP User

One internal/test user using a single login credential.

### Future User

A user inside the main application who can schedule and publish posts from within that app's authenticated workspace.

## 4. User Problem

The user needs a simple way to prepare social posts in advance and have them published later without manually logging into each platform at the scheduled time.

## 5. MVP Goal

The MVP should prove:

- Media upload works.
- Media can be saved in Backblaze B2.
- Post metadata can be saved in Supabase Postgres.
- Scheduled posts can be detected later.
- A worker/cron can publish due posts.
- Publishing outcomes are visible to the user.

## 6. In-Scope Features

### Authentication

- Single test login.
- Session-based access.
- Logout.

### Post Creation

- Create new post.
- Add caption.
- Upload image/video.
- Select scheduled date/time.
- Select one or more connected social accounts.
- Save as scheduled post.

### Media Storage

- Generate presigned Backblaze B2 upload URL.
- Upload directly from browser to B2.
- Save media metadata in Postgres.

### Scheduling

- Save scheduled time.
- Worker or Railway cron checks due posts.
- Due posts move to processing state.

### Publishing

- Publish due posts through platform-specific adapters.
- Store platform post ID when available.
- Store platform post URL when available.
- Store error reason when publishing fails.

### History

- List all posts.
- Filter by status.
- View post details.
- View publish attempts.

## 7. Out-of-Scope Features

Do not build these in MVP:

- Multi-user signup
- Supabase Auth integration
- Team members
- RBAC
- Agency workspaces
- Billing
- Subscription plans
- AI caption generation
- AI hashtag suggestions
- Social analytics
- Social inbox
- Comment replies
- Campaign management
- Approval workflows
- Calendar drag/drop
- X/Twitter integration
- Notification emails
- Mobile app

## 8. Supported Platforms

### V1

- Instagram / Facebook via Meta platform integration

### V1.5

- LinkedIn

### Later

- TikTok

### Excluded

- X/Twitter, because zero API cost is not realistic.

## 9. Functional Requirements

### FR-001: User Login

The user must be able to log in using the configured test credential.

### FR-002: Upload Media

The user must be able to upload an image or video.

### FR-003: Store Media

Uploaded media must be stored in Backblaze B2, not in Postgres.

### FR-004: Create Post

The user must be able to create a post with caption, media, platform/account, and scheduled time.

### FR-005: Schedule Post

The backend must store the post with status `SCHEDULED`.

### FR-006: Publish Due Post

The worker must find due posts and attempt to publish them.

### FR-007: Track Attempts

Each publishing attempt must be stored.

### FR-008: Display Status

The frontend must clearly display whether a post is draft, scheduled, processing, published, failed, cancelled, or retrying.

### FR-009: Cancel Scheduled Post

The user must be able to cancel a scheduled post before processing begins.

### FR-010: Retry Failed Post

The user should be able to manually retry a failed post if the failure is retryable.

## 10. Non-Functional Requirements

- Simple deployment.
- Low cost.
- No paid API dependencies in MVP.
- No Redis dependency.
- Bounded database queries.
- Secure token storage.
- Clear error states.
- Reusable architecture for later integration.

## 11. Acceptance Criteria

The MVP is complete when:

- Login works.
- Media upload to B2 works.
- Scheduled posts can be created.
- Scheduled posts are stored in Postgres.
- Worker/cron detects due posts.
- Publishing attempt rows are created.
- Status transitions are correct.
- UI shows post history.
- Failed posts show actionable error messages.
- Code is structured so publisher logic can be reused later.
