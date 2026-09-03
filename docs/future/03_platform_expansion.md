# Future Platform Expansion

## 1. Purpose

This document tracks future social platform support beyond the first MVP platform.

Do not add every platform at once.

## 2. Platform Order

Recommended implementation order:

```txt
1. Mock adapter
2. Instagram/Facebook via Meta
3. LinkedIn
4. TikTok
5. Other platforms only if justified
```

## 3. V1 Platforms

## Instagram

Use for:

- Feed posts
- Reels later
- Carousel later

Start with one simple media post type.

## Facebook Pages

Use for:

- Page posts
- Page video/reel later

Start with one simple media post type.

## 4. V1.5 Platform

## LinkedIn

Start with:

- Personal/member posting

Later:

- Organization/company page posting

LinkedIn organization posting may need additional product access or approval.

## 5. Later Platform

## TikTok

Add after the core scheduler is stable.

TikTok may involve:

- App review/audit
- Public/private visibility restrictions
- Direct video upload flow
- Different media validation requirements

Do not block MVP on TikTok.

## 6. Excluded Platform

## X/Twitter

Excluded from zero-cost MVP.

Reason:

```txt
Zero API cost cannot be assumed.
```

Add only if the business accepts API pricing.

## 7. Per-Platform Implementation Checklist

Before adding a platform, document:

```txt
[ ] Required developer account setup
[ ] Required OAuth scopes
[ ] Required app review status
[ ] Supported account types
[ ] Supported media types
[ ] Image limits
[ ] Video limits
[ ] Caption/text limits
[ ] Upload mechanism
[ ] Publish mechanism
[ ] Token expiry behavior
[ ] Common error codes
[ ] Rate limit behavior
[ ] Sandbox/test mode behavior
```

## 8. Adapter Rule

Every platform must implement the common adapter interface.

Do not add platform-specific conditionals across the app.

Bad:

```ts
if (platform === 'instagram') {
  // logic inside PostsService
}
```

Good:

```ts
const adapter = adapterRegistry.get(platform);
await adapter.publish(input);
```
