import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Secret key derivation
function getEncryptionKey(): Buffer {
  const secret =
    process.env.CREDENTIAL_VAULT_SECRET ||
    process.env.META_OAUTH_STATE_SECRET ||
    process.env.SOCIAL_SCHEDULER_WORKER_SECRET ||
    'sakhaa-forge-default-dev-vault-secret-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 */
export function decryptSecret(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export interface StoredCredential {
  credentialRef: string;
  encryptedToken: string;
  tokenType: string;
  createdAt: string;
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DiscoveredMetaPage {
  id: string;
  name: string;
  category?: string;
  accessToken: string;
  tasks?: string[];
  perms?: string[];
}

export interface PendingOAuthConnection {
  connectionId: string;
  workspaceId: string;
  userId: string;
  provider: string;
  pages: DiscoveredMetaPage[];
  expiresAt: string;
  consumedAt?: string | null;
}

/**
 * In-memory Credential Vault store simulating secure vault/KMS
 */
class CredentialVault {
  private vault = new Map<string, StoredCredential>();
  private pendingConnections = new Map<string, PendingOAuthConnection>();

  /**
   * Store a secret token and return a secure credentialRef
   */
  public storeToken(
    token: string,
    options: {
      tokenType?: string;
      expiresAt?: string | null;
      metadata?: Record<string, unknown>;
    } = {}
  ): string {
    const credentialRef = `cred_${crypto.randomUUID()}`;
    const encryptedToken = encryptSecret(token);

    this.vault.set(credentialRef, {
      credentialRef,
      encryptedToken,
      tokenType: options.tokenType || 'bearer',
      createdAt: new Date().toISOString(),
      expiresAt: options.expiresAt,
      metadata: options.metadata,
    });

    return credentialRef;
  }

  /**
   * Retrieve the decrypted token by credentialRef
   */
  public getToken(credentialRef: string): string | null {
    const record = this.vault.get(credentialRef);
    if (!record) {
      return null;
    }

    try {
      return decryptSecret(record.encryptedToken);
    } catch (err) {
      console.error(`Failed to decrypt token for credentialRef ${credentialRef}:`, err);
      return null;
    }
  }

  /**
   * Retrieve the decrypted secret token by credentialRef, throwing on failure
   */
  public getDecryptedSecret(credentialRef: string): string {
    const token = this.getToken(credentialRef);
    if (!token) {
      throw new Error(`Token not found or decryption failed for credentialRef: ${credentialRef}`);
    }
    return token;
  }

  /**
   * Delete token by credentialRef
   */
  public revokeToken(credentialRef: string): boolean {
    return this.vault.delete(credentialRef);
  }

  /**
   * Check if token exists and is not expired
   */
  public hasValidToken(credentialRef: string): boolean {
    const record = this.vault.get(credentialRef);
    if (!record) return false;
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }

  /**
   * Save pending discovery session post-OAuth callback
   */
  public savePendingConnection(
    conn: Omit<PendingOAuthConnection, 'connectionId' | 'expiresAt' | 'consumedAt'>
  ): string {
    const connectionId = `conn_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 min validity

    this.pendingConnections.set(connectionId, {
      ...conn,
      connectionId,
      expiresAt,
      consumedAt: null,
    });

    return connectionId;
  }

  /**
   * Get pending connection details
   */
  public getPendingConnection(connectionId: string): PendingOAuthConnection | null {
    const conn = this.pendingConnections.get(connectionId);
    if (!conn) return null;
    if (new Date(conn.expiresAt) < new Date()) return null;
    return conn;
  }

  /**
   * Consume pending connection
   */
  public consumePendingConnection(connectionId: string): PendingOAuthConnection | null {
    const conn = this.getPendingConnection(connectionId);
    if (!conn || conn.consumedAt) return null;
    conn.consumedAt = new Date().toISOString();
    return conn;
  }

  /**
   * Clear all for testing
   */
  public clear(): void {
    this.vault.clear();
    this.pendingConnections.clear();
  }
}

export const credentialVault = new CredentialVault();

/**
 * Deep sanitization helper that recursively redacts tokens, secrets, and authorization headers
 */
export function sanitizePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    // Redact Meta access tokens (EAA...)
    let sanitized = input.replace(/EAA[A-Za-z0-9]+/g, '[REDACTED_META_TOKEN]');
    // Redact generic Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');
    // Redact URLs with access_token query param
    sanitized = sanitized.replace(/access_token=[A-Za-z0-9\-._~+/]+=*/gi, 'access_token=[REDACTED]');
    // Redact client secrets
    sanitized = sanitized.replace(/client_secret=[A-Za-z0-9\-._~+/]+=*/gi, 'client_secret=[REDACTED]');
    return sanitized as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('authorization')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizePayload(value);
      }
    }
    return sanitizedObj as unknown as T;
  }

  return input;
}
