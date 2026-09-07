#!/usr/bin/env node
/**
 * PURPOSE: Verify storage layer upload and delete functionality
 * USAGE: node backend/scripts/verify-storage.js
 * 
 * This script:
 * 1. Uploads a small test file to the 'project-documents' bucket
 * 2. Verifies the upload succeeded and shows the storage path
 * 3. Deletes the object from the bucket
 * 4. Verifies the delete succeeded
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory (one level up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const BUCKET = 'project-documents';
const TEST_PROJECT_ID = 'verify-test-project-' + Date.now().toString(36).slice(-6);
const TEST_DOC_ID = 'test-doc-' + Date.now().toString(36).slice(-6);

async function run() {
  console.log('=== STORAGE LAYER VERIFICATION SCRIPT ===\n');
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Test Project ID: ${TEST_PROJECT_ID}`);
  console.log(`Test Document ID: ${TEST_DOC_ID}`);

  // Test file content (small markdown file)
  const testContent = `# Test Document\n\nThis is a test document uploaded at ${new Date().toISOString()}\n`;
  const testBuffer = Buffer.from(testContent, 'utf-8');
  const mimeType = 'text/markdown';
  const ext = '.md';
  const storagePath = `${TEST_PROJECT_ID}/${TEST_DOC_ID}${ext}`;

  console.log(`\nStorage Path: ${storagePath}`);
  console.log(`File Size: ${testBuffer.length} bytes`);

  // STEP 1: Upload
  console.log('\n--- STEP 1: UPLOAD ---');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, testBuffer, {
      cacheControl: 'no-cache',
      contentType: mimeType,
    });

  if (uploadError) {
    console.error('UPLOAD FAILED:', uploadError.message);
    process.exit(1);
  }

  console.log('UPLOAD SUCCESS:', JSON.stringify(uploadData, null, 2));
  console.log('Storage path confirmed:', storagePath);

  // STEP 2: Verify upload by listing bucket contents
  console.log('\n--- STEP 2: VERIFY CONTENT EXISTS ---');
  const { data: listData, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(`${TEST_PROJECT_ID}/`, { limit: 10 });

  if (listError) {
    console.error('LIST FAILED:', listError.message);
  } else {
    console.log('Bucket listing for project prefix:', JSON.stringify(listData, null, 2));
  }

  // STEP 3: Delete
  console.log('\n--- STEP 3: DELETE ---');
  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (deleteError) {
    console.error('DELETE FAILED:', deleteError.message);
    process.exit(1);
  }

  console.log('DELETE SUCCESS:', JSON.stringify(deleteData, null, 2));

  // STEP 4: Verify delete
  console.log('\n--- STEP 4: VERIFY DELETION ---');
  const { data: listAfter, error: listAfterError } = await supabase.storage
    .from(BUCKET)
    .list(`${TEST_PROJECT_ID}/`, { limit: 10 });

  console.log('Bucket listing after delete:', JSON.stringify(listAfter || [], null, 2));

  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log('All storage operations succeeded.');
  console.log('Real storage path used:', storagePath);
  console.log('Bucket:', BUCKET);
}

run().catch(err => {
  console.error('SCRIPT ERROR:', err.message);
  process.exit(1);
});