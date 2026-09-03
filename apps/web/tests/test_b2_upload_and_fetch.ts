import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getB2Client, getDefaultB2Bucket } from '../src/lib/b2';

async function testUploadAndFetch() {
  console.log('--- Testing B2 Presigned Upload & Fetch ---');
  const client = getB2Client();
  const bucket = getDefaultB2Bucket();

  const testKey = `workspaces/ws_mantri/social-scheduler/test/sample-${Date.now()}.txt`;
  const fileContent = 'Hello Backblaze B2 from Social Media Scheduler!';

  // 1. Generate Presigned Upload URL
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: testKey,
    ContentType: 'text/plain',
  });
  const presignedUploadUrl = await getSignedUrl(client, putCommand, { expiresIn: 900 });
  console.log('1. Generated Presigned Upload URL:', presignedUploadUrl.slice(0, 80) + '...');

  // 2. Direct PUT Upload
  console.log('2. Uploading content via HTTP PUT to B2...');
  const uploadRes = await fetch(presignedUploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: fileContent,
  });
  console.log(`   Upload response status: ${uploadRes.status} ${uploadRes.statusText}`);

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error('Upload failed with text:', text);
    process.exit(1);
  }

  // 3. Head Object to verify metadata
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
  console.log(`3. Verified Object on B2: size=${head.ContentLength} bytes, type=${head.ContentType}`);

  // 4. Generate Presigned Download URL for Preview
  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: testKey,
  });
  const presignedDownloadUrl = await getSignedUrl(client, getCommand, { expiresIn: 3600 });
  console.log('4. Generated Presigned Download/Preview URL:', presignedDownloadUrl.slice(0, 80) + '...');

  // 5. Fetch content from presigned download URL
  const fetchRes = await fetch(presignedDownloadUrl);
  const downloadedText = await fetchRes.text();
  console.log(`5. Fetched content from Preview URL: "${downloadedText}"`);

  if (downloadedText === fileContent) {
    console.log('\n🎉 ALL B2 OPERATIONS PASSED: Presigned PUT, B2 storage, Presigned GET preview verified!');
  } else {
    console.error('Mismatch in content!');
    process.exit(1);
  }
}

testUploadAndFetch().catch(console.error);
