# Future Multi-Tenant SaaS Upgrade

## 1. Purpose

This document lists future SaaS capabilities that are intentionally excluded from the MVP.

Do not build these until the standalone scheduler and initial integration are stable.

## 2. Future SaaS Features

## Workspaces / Tenants

Add:

```txt
tenants
workspaces
workspace_members
workspace_roles
```

Every post, media asset, social account, and publish target should belong to a workspace or tenant.

## RBAC

Possible permissions:

```txt
social_posts.create
social_posts.read
social_posts.update
social_posts.cancel
social_posts.publish_now
social_posts.approve
social_accounts.connect
social_accounts.disconnect
social_accounts.manage
```

## Approval Workflow

Potential states:

```txt
DRAFT
PENDING_APPROVAL
APPROVED
REJECTED
SCHEDULED
PROCESSING
PUBLISHED
FAILED
CANCELLED
```

Do not add approval workflow in MVP.

## Client/Brand Ownership

Future models:

```txt
clients
brands
brand_social_accounts
brand_post_templates
```

Useful if this becomes agency-facing.

## Audit Logs

Track:

```txt
post.created
post.updated
post.scheduled
post.cancelled
post.published
post.failed
account.connected
account.disconnected
```

## Usage Limits

Possible future limits:

```txt
posts per month
connected accounts
media storage
team members
scheduled posts
platforms enabled
```

## Billing

Only add billing after real usage validation.

Possible entities:

```txt
plans
subscriptions
usage_events
invoices
```

## 3. Migration Principle

Do not retrofit tenancy casually.

Before converting MVP to SaaS:

```txt
1. Decide ownership model.
2. Decide permission model.
3. Decide tenant/workspace boundaries.
4. Add required indexes.
5. Backfill existing data.
6. Add tenant-safe queries.
7. Test authorization boundaries.
```

## 4. Anti-Scope-Creep Rule

Do not implement anything in this document during MVP unless explicitly approved.
