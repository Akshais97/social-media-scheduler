# Social Platform Integrations

## 1. Purpose

Social platform behavior must be isolated behind platform adapters.

The rest of the app should not know the details of Instagram, Facebook, LinkedIn, or TikTok publishing APIs.

## 2. Adapter Interface

```ts
export interface SocialPublisherAdapter {
  platform: SocialPlatform;

  validatePost(input: PublishInput): Promise<ValidationResult>;

  publish(input: PublishInput): Promise<PublishResult>;

  refreshToken?(input: RefreshTokenInput): Promise<TokenRefreshResult>;
}
```

## 3. Shared Types

```ts
export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok';

export interface PublishInput {
  postId: string;
  publishTargetId: string;
  caption: string;
  media: PublishMediaAsset[];
  account: ConnectedSocialAccount;
  idempotencyKey: string;
}

export interface PublishMediaAsset {
  id: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  publishableUrl?: string;
  b2Bucket: string;
  b2Key: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  rawResponse?: unknown;
  error?: PublishError;
}

export interface PublishError {
  code: string;
  message: string;
  retryable: boolean;
  rawError?: unknown;
}
```

## 4. Platform Priority

## V1

```txt
Instagram
Facebook Pages
```

## V1.5

```txt
LinkedIn
```

## Later

```txt
TikTok
```

## Excluded From Zero-Cost MVP

```txt
X/Twitter
```

Reason: zero API cost cannot be assumed.

## 5. Meta: Instagram / Facebook

## Integration Scope

Start with Meta because it can cover:

- Instagram publishing
- Facebook Page publishing

## Required MVP capabilities

- OAuth connection
- Store access token securely
- Fetch connected pages/accounts where needed
- Publish image/video post
- Store platform post ID
- Store platform post URL if returned or constructible

## Platform rules to document during implementation

- Account type requirements
- Required permissions
- Media URL requirements
- Image/video size limits
- Caption limits
- Rate limits
- Error response formats
- Token expiry behavior

## 6. LinkedIn

## Integration Scope

Add after Meta works.

Start with member posting if simpler.

Company/page posting may require additional permissions and product access.

## Required capabilities

- OAuth connection
- Store token securely
- Publish text/media post
- Handle organization/page publishing later if approved

## 7. TikTok

## Integration Scope

Add later.

TikTok has additional review/audit and public visibility constraints.

Do not block the MVP on TikTok.

## Required capabilities later

- OAuth connection
- Upload video or provide URL depending on selected API flow
- Understand public/private posting limitations
- Handle platform review status

## 8. Token Storage Rules

Social tokens must be encrypted before saving.

Do not store raw tokens in:

- Logs
- Publish attempts
- Error payloads
- Frontend state
- Browser localStorage

## 9. Validation Rules

Each adapter must validate before publish:

- Account connected
- Token valid or refreshable
- Required scopes present
- Media exists
- Media type supported
- Caption allowed
- Platform-specific constraints satisfied

## 10. Error Mapping

Each adapter must map platform errors to app-level errors.

Common app-level error codes:

```txt
TOKEN_EXPIRED
PERMISSION_MISSING
MEDIA_TOO_LARGE
UNSUPPORTED_FORMAT
PLATFORM_REJECTED
RATE_LIMITED
NETWORK_ERROR
TEMPORARY_PLATFORM_ERROR
UNKNOWN_ERROR
```

## 11. Adapter File Structure

```txt
src/modules/platform-adapters/
  platform-adapters.module.ts
  social-publisher-adapter.interface.ts
  meta/
    instagram.adapter.ts
    facebook.adapter.ts
    meta-auth.service.ts
    meta.types.ts
  linkedin/
    linkedin.adapter.ts
    linkedin-auth.service.ts
    linkedin.types.ts
  tiktok/
    tiktok.adapter.ts
    tiktok-auth.service.ts
    tiktok.types.ts
```

## 12. Important Rule

Do not put platform-specific logic inside `PostsService`.

`PostsService` owns post data.

`PublisherService` owns publish orchestration.

Platform adapters own platform-specific behavior.
