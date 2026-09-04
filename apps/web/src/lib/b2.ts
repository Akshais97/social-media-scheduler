import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getB2Config() {
  const endpoint =
    process.env.B2_ENDPOINT ||
    process.env.OBJECT_STORAGE_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL ||
    'https://s3.eu-central-003.backblazeb2.com';

  const region =
    process.env.B2_REGION ||
    process.env.OBJECT_STORAGE_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'eu-central-003';

  const accessKeyId =
    process.env.B2_ACCESS_KEY_ID ||
    process.env.OBJECT_STORAGE_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    '003b7ab5bb258980000000003';

  const secretAccessKey =
    process.env.B2_SECRET_ACCESS_KEY ||
    process.env.OBJECT_STORAGE_APPLICATION_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    'K003Ii22Pt0e5mRENXtaLmn9q2m9FJs';

  const defaultBucket =
    process.env.B2_DEFAULT_BUCKET ||
    process.env.B2_BUCKET_CLEAN_MEDIA ||
    process.env.B2_BUCKET_CLEAN ||
    'sakhaa-forge-clean-media';

  return { endpoint, region, accessKeyId, secretAccessKey, defaultBucket };
}

let cachedClient: S3Client | null = null;

export function getB2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const cfg = getB2Config();
  cachedClient = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });

  return cachedClient;
}

export function getDefaultB2Bucket(): string {
  return getB2Config().defaultBucket;
}

export async function createPresignedUploadUrl(params: {
  bucket?: string;
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const client = getB2Client();
  const bucket = params.bucket || getDefaultB2Bucket();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(client, command, { expiresIn: params.expiresIn || 900 });
}

export async function createPresignedDownloadUrl(params: {
  bucket?: string;
  key: string;
  expiresIn?: number;
}): Promise<string> {
  const client = getB2Client();
  const bucket = params.bucket || getDefaultB2Bucket();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
  });

  return getSignedUrl(client, command, { expiresIn: params.expiresIn || 3600 });
}

export async function verifyB2Object(params: {
  bucket?: string;
  key: string;
}): Promise<{ exists: boolean; size?: number; contentType?: string }> {
  const client = getB2Client();
  const bucket = params.bucket || getDefaultB2Bucket();

  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: params.key,
      })
    );

    return {
      exists: true,
      size: head.ContentLength,
      contentType: head.ContentType,
    };
  } catch {
    return { exists: false };
  }
}

export const b2Storage = {
  getPresignedUploadUrl: (key: string, contentType: string, expiresIn?: number) =>
    createPresignedUploadUrl({ key, contentType, expiresIn }),
  getPresignedDownloadUrl: (key: string, expiresIn?: number) =>
    createPresignedDownloadUrl({ key, expiresIn }),
  verifyObject: (key: string) => verifyB2Object({ key }),
};
