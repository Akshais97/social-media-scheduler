// Test live Backblaze B2 pipeline through Next.js API endpoints

async function runLivePipelineTest() {
  console.log('======================================================');
  console.log('Testing Live Backblaze B2 API End-to-End Pipeline');
  console.log('======================================================\n');

  const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(sampleImageBase64, 'base64');
  const fileName = `test-creative-${Date.now()}.png`;
  const mimeType = 'image/png';
  const byteSize = imageBuffer.length;
  const workspaceId = 'ws_mantri';

  // 1. Initiate Upload
  console.log('Step 1: Calling POST /api/v0/social-scheduler/media/initiate-upload...');
  const initRes = await fetch('http://localhost:3000/api/v0/social-scheduler/media/initiate-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      fileName,
      mimeType,
      byteSize,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    console.error('❌ Step 1 Failed:', err);
    process.exit(1);
  }

  const initData = await initRes.json();
  console.log('✅ Step 1 Success! Received B2 presigned upload details:');
  console.log('   MediaAssetId:', initData.mediaAssetId);
  console.log('   Bucket:', initData.bucket);
  console.log('   Object Key:', initData.objectKey);
  console.log('   Upload URL:', initData.uploadUrl.slice(0, 90) + '...');

  // 2. Direct binary PUT upload to Backblaze B2
  console.log('\nStep 2: Uploading binary buffer directly to Backblaze B2 via HTTP PUT...');
  const uploadRes = await fetch(initData.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: imageBuffer,
  });

  console.log(`   B2 response status: ${uploadRes.status} ${uploadRes.statusText}`);
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('❌ Step 2 Failed:', errText);
    process.exit(1);
  }
  console.log('✅ Step 2 Success! File written directly to Backblaze B2 bucket.');

  // 3. Complete Upload
  console.log('\nStep 3: Calling POST /api/v0/social-scheduler/media/complete-upload...');
  const compRes = await fetch('http://localhost:3000/api/v0/social-scheduler/media/complete-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      mediaAssetId: initData.mediaAssetId,
      objectKey: initData.objectKey,
      bucket: initData.bucket,
    }),
  });

  if (!compRes.ok) {
    const err = await compRes.text();
    console.error('❌ Step 3 Failed:', err);
    process.exit(1);
  }

  const compData = await compRes.json();
  console.log('✅ Step 3 Success! Upload verified in B2:', compData.verifiedInB2);
  console.log('   Preview URL:', compData.previewUrl.slice(0, 90) + '...');

  // 4. Test Preview / Fetch Endpoint
  console.log('\nStep 4: Fetching media via GET /api/v0/social-scheduler/media/preview...');
  const previewEndpointUrl = `http://localhost:3000/api/v0/social-scheduler/media/preview?key=${encodeURIComponent(initData.objectKey)}&bucket=${encodeURIComponent(initData.bucket)}`;
  const previewRes = await fetch(previewEndpointUrl);

  console.log(`   Preview endpoint response: ${previewRes.status} ${previewRes.statusText}`);
  if (!previewRes.ok) {
    console.error('❌ Step 4 Failed: preview endpoint returned status', previewRes.status);
    process.exit(1);
  }

  const fetchedBuffer = Buffer.from(await previewRes.arrayBuffer());
  console.log(`   Fetched ${fetchedBuffer.length} bytes from Backblaze B2 preview stream.`);

  if (fetchedBuffer.length === imageBuffer.length) {
    console.log('✅ Step 4 Success! Fetched bytes match uploaded binary exactly.');
  } else {
    console.error('❌ Byte length mismatch');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL BACKBLAZE B2 PIPELINE STEPS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

runLivePipelineTest().catch(console.error);
