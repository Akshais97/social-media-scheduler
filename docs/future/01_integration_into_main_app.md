# Future Integration Into Main Application

## 1. Purpose

This document explains how the standalone Social Media Scheduler MVP should later be integrated into the main application.

The goal is to reuse the publishing module, not rewrite it.

## 2. Current Standalone Version

The standalone MVP uses:

```txt
Temporary single-user login
Nullable owner_id
Nullable workspace_id
Standalone dashboard shell
Standalone route structure
Standalone settings page
```

## 3. Future Integrated Version

The integrated version should use:

```txt
Main app authentication
Real user_id
Real workspace_id / tenant_id
Main app navigation
Main app permissions
Main app settings
Main app deployment conventions
```

## 4. What Should Be Reused

Reusable parts:

```txt
Post composer components
Media uploader
Backblaze B2 storage service
Post data model, with ownership mapping
Publish target model
Publish attempt logging
Scheduling state machine
PublisherService
Platform adapters
Error mapping
Status badges
Post history/detail UI
```

## 5. What Should Be Replaced

Temporary parts:

```txt
Single login credential
Standalone login page
Standalone dashboard shell
Temporary user table
Standalone settings route
Any hard-coded owner/workspace assumptions
```

## 6. Integration Steps

```txt
1. Add publisher module/package to main app.
2. Replace temporary auth guard with main app auth guard.
3. Map current user/workspace into owner_id/workspace_id.
4. Add permissions for social publishing.
5. Mount frontend routes/components inside main app navigation.
6. Move env vars into main app deployment.
7. Run migration to make ownership fields required if needed.
8. Test upload/schedule/publish flow under real auth.
```

## 7. Ownership Migration

MVP fields:

```txt
owner_id nullable
workspace_id nullable
```

Integrated fields:

```txt
owner_id required if publishing belongs to a user
workspace_id required if publishing belongs to a workspace/client/team
```

Do not make these fields required until integration design is confirmed.

## 8. Permission Model Later

Possible permissions:

```txt
social_posts.create
social_posts.read
social_posts.update
social_posts.cancel
social_posts.publish_now
social_accounts.connect
social_accounts.disconnect
social_accounts.read
```

Do not build this in MVP.

## 9. Navigation Integration

Potential main app routes:

```txt
/social
/social/posts
/social/posts/new
/social/posts/:id
/social/accounts
```

or inside a marketing module:

```txt
/marketing/social-posts
/marketing/social-posts/new
/marketing/social-accounts
```

## 10. Integration Guardrail

Do not rewrite the publishing core during integration.

Replace shell/auth/ownership only.

If the publishing core must change, document the exact reason before changing it.
