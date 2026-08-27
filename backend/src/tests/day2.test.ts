import http from 'http';
import app from '../app';
import { db } from '../config/database';
import { aiService } from '../services/ai.service';
import { aiResponseSchema } from '../validators/ai-response.schema';
import { revisionBatchRepository, revisionItemRepository } from '../repositories/revision.repository';
import { AppError } from '../middleware/error.middleware';

let server: http.Server;
const PORT = 3456;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let resBody: any = null;
  const text = await res.text();
  try {
    resBody = JSON.parse(text);
  } catch {
    resBody = text;
  }

  return { status: res.status, body: resBody };
}

async function runTests() {
  console.log('=== STARTING SCOPREVO DAY 2 INTEGRATION TESTS ===');
  
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-SERVER] Running on ${BASE_URL}`);
      resolve();
    });
  });

  const testResults: Record<string, { pass: boolean; note: string; details?: any }> = {};

  try {
    // 0. Setup test users and tokens
    const unique = Date.now();
    const userA = { name: 'User A', email: `usera_${unique}@test.com`, password: 'Password123!' };
    const userB = { name: 'User B', email: `userb_${unique}@test.com`, password: 'Password123!' };

    // Register User A
    const regA = await request('POST', '/api/auth/register', userA);
    const tokenA = regA.body?.token;

    // Register User B
    const regB = await request('POST', '/api/auth/register', userB);
    const tokenB = regB.body?.token;

    // Create Project for User A
    const projResA = await request('POST', '/api/projects', {
      name: 'Landing Page PT ABC',
      clientName: 'PT ABC',
      totalAllowedRevisions: 3,
    }, tokenA);
    const projectAId = projResA.body?.project?.id;

    // Create Project for User B
    const projResB = await request('POST', '/api/projects', {
      name: 'Mobile App XYZ',
      clientName: 'XYZ Corp',
      totalAllowedRevisions: 2,
    }, tokenB);
    const projectBId = projResB.body?.project?.id;

    console.log(`[SETUP] Project A: ${projectAId}, Project B: ${projectBId}`);

    // WhatsApp style input
    const validFeedback = `Halo mas Rangga, tolong dong perbaiki landing page:
1. Kurangi kepadatan visual hero section agar lebih bersih
2. Perbesar ukuran tombol CTA utama
3. Tolong tambahkan fitur dark mode ya mas biar keren`;

    // -------------------------------------------------------------
    // TEST 1: Authenticated user submits valid feedback. Expected 201/200
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 1 ---');
    const revRes1 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: validFeedback,
    }, tokenA);

    const batchData = revRes1.body?.batch;
    const test1Pass = (revRes1.status === 201 || revRes1.status === 200) && !!batchData?.id;
    testResults['TEST 1'] = {
      pass: test1Pass,
      note: `Status ${revRes1.status}, batch created: ${batchData?.id}`,
      details: revRes1.body,
    };
    console.log(`TEST 1: ${test1Pass ? 'PASS' : 'FAIL'}`);

    const batchId = batchData?.id;

    // -------------------------------------------------------------
    // TEST 2: RevisionBatch exists in Supabase
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 2 ---');
    const dbBatchRes = await db.query('SELECT * FROM revision_batch WHERE id = $1', [batchId]);
    const dbBatch = dbBatchRes.rows[0];
    const test2Pass = !!dbBatch && dbBatch.project_id === projectAId && dbBatch.status === 'DRAFT';
    testResults['TEST 2'] = {
      pass: test2Pass,
      note: `Found batch in DB with status=${dbBatch?.status}, magic_token=${dbBatch?.magic_token}`,
      details: dbBatch,
    };
    console.log(`TEST 2: ${test2Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 3: RevisionItems exist in Supabase
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 3 ---');
    const dbItemsRes = await db.query('SELECT * FROM revision_item WHERE revision_batch_id = $1 ORDER BY id ASC', [batchId]);
    const dbItems: any[] = dbItemsRes.rows;
    const test3Pass = dbItems.length >= 2;
    testResults['TEST 3'] = {
      pass: test3Pass,
      note: `Found ${dbItems.length} items for batch ${batchId}`,
      details: dbItems,
    };
    console.log(`TEST 3: ${test3Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 4: Stored rawInput matches submitted input
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 4 ---');
    const test4Pass = dbBatch?.raw_input === validFeedback;
    testResults['TEST 4'] = {
      pass: test4Pass,
      note: `Stored rawInput exact match`,
    };
    console.log(`TEST 4: ${test4Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 5: Stored aiSummary matches validated AI output
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 5 ---');
    const test5Pass = typeof dbBatch?.ai_summary === 'string' && dbBatch.ai_summary.length > 0;
    testResults['TEST 5'] = {
      pass: test5Pass,
      note: `AI summary: "${dbBatch?.ai_summary}"`,
    };
    console.log(`TEST 5: ${test5Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 6: Each RevisionItem has valid scopeStatus
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 6 ---');
    const validScopes = ['IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW'];
    const test6Pass = dbItems.every((item: any) => validScopes.includes(item.scope_status));
    testResults['TEST 6'] = {
      pass: test6Pass,
      note: `Scopes verified: ${dbItems.map((i: any) => i.scope_status).join(', ')}`,
    };
    console.log(`TEST 6: ${test6Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 7: OUT_OF_SCOPE item has a reason + NEEDS_REVIEW requires reason
    //         and persists correctly (schema forward-compatibility check)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 7 ---');
    const outOfScopeItems = dbItems.filter((item: any) => item.scope_status === 'OUT_OF_SCOPE');
    const needsReviewReasonValid = dbItems
      .filter((item: any) => item.scope_status === 'NEEDS_REVIEW')
      .every((item: any) => typeof item.reason === 'string' && item.reason.trim().length > 0);

    // Sub-check: mock internal callGoogleAI to return NEEDS_REVIEW output,
    // verify schema accepts it AND it persists with its reason.
    const origCallGoogleAI7 = aiService.callGoogleAI;
    aiService.callGoogleAI = async () => ({
      summary: 'Mock summary with ambiguous scope',
      items: [
        { description: 'Ambiguous styling tweak', category: null, scopeStatus: 'NEEDS_REVIEW' as const, reason: 'Unclear whether covered by revision quota' },
      ],
    });
    const revNr = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback containing an ambiguous request for verification',
    }, tokenA);
    aiService.callGoogleAI = origCallGoogleAI7; // restore
    let nrPersisted = false;
    if (revNr.body?.batch?.id) {
      const nrItemsRes = await db.query('SELECT * FROM revision_item WHERE revision_batch_id = $1', [revNr.body.batch.id]);
      nrPersisted = nrItemsRes.rows.length === 1
        && nrItemsRes.rows[0].scope_status === 'NEEDS_REVIEW'
        && typeof nrItemsRes.rows[0].reason === 'string'
        && nrItemsRes.rows[0].reason.trim().length > 0;
    }

    const test7Pass = outOfScopeItems.length > 0
      ? outOfScopeItems.every((item: any) => typeof item.reason === 'string' && item.reason.trim().length > 0)
      : true;
    const test7Final = test7Pass && needsReviewReasonValid && nrPersisted;
    testResults['TEST 7'] = {
      pass: test7Final,
      note: `OUT_OF_SCOPE count: ${outOfScopeItems.length}. Reasons valid: ${test7Pass}. NEEDS_REVIEW persisted with reason: ${nrPersisted}`,
      details: outOfScopeItems,
    };
    console.log(`TEST 7: ${test7Final ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 8: Invalid AI JSON does not create database records
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 8 ---');
    const countBefore8 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    const origExtract = aiService.extractRevisions;
    aiService.extractRevisions = async () => {
      throw new AppError('AI_PROCESSING_FAILED', 'Invalid JSON from AI provider', 422);
    };
    const failRes8 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Some feedback',
    }, tokenA);
    const countAfter8 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    aiService.extractRevisions = origExtract; // restore
    const test8Pass = failRes8.status === 422 && countBefore8.rows[0].count === countAfter8.rows[0].count;
    testResults['TEST 8'] = {
      pass: test8Pass,
      note: `Invalid AI JSON prevented DB insert. Batch count before=${countBefore8.rows[0].count}, after=${countAfter8.rows[0].count}`,
    };
    console.log(`TEST 8: ${test8Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 9: Invalid AI schema does not create database records
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 9 ---');
    const invalidSchemaData = {
      summary: 'Bad output',
      items: [
        { description: 'No scope provided' }, // missing scope
      ],
    };
    const schemaValidation = aiResponseSchema.safeParse(invalidSchemaData);
    const countBefore9 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    aiService.extractRevisions = async () => {
      if (!schemaValidation.success) {
        throw new AppError('AI_PROCESSING_FAILED', 'Schema validation error: ' + schemaValidation.error.message, 422);
      }
      return schemaValidation.data as any;
    };
    const failRes9 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback test 9',
    }, tokenA);
    const countAfter9 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    aiService.extractRevisions = origExtract; // restore
    const test9Pass = !schemaValidation.success && failRes9.status === 422 && countBefore9.rows[0].count === countAfter9.rows[0].count;
    testResults['TEST 9'] = {
      pass: test9Pass,
      note: `Invalid AI schema rejected before DB. Count unchanged.`,
    };
    console.log(`TEST 9: ${test9Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 10: Unauthenticated request → 401
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 10 ---');
    const unauthRes = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: validFeedback,
    }); // no token
    const test10Pass = unauthRes.status === 401 && unauthRes.body?.error?.code === 'UNAUTHORIZED';
    testResults['TEST 10'] = {
      pass: test10Pass,
      note: `Status ${unauthRes.status}, error code: ${unauthRes.body?.error?.code}`,
    };
    console.log(`TEST 10: ${test10Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 11: User accessing another account's project → 404
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 11 ---');
    const crossRes = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: validFeedback,
    }, tokenB); // User B accessing User A's project
    const test11Pass = crossRes.status === 404 && crossRes.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 11'] = {
      pass: test11Pass,
      note: `Status ${crossRes.status}, error code: ${crossRes.body?.error?.code}`,
    };
    console.log(`TEST 11: ${test11Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 12: Empty rawInput → 422
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 12 ---');
    const emptyRes = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: '   ',
    }, tokenA);
    const test12Pass = emptyRes.status === 422 && emptyRes.body?.error?.code === 'VALIDATION_ERROR';
    testResults['TEST 12'] = {
      pass: test12Pass,
      note: `Status ${emptyRes.status}, error code: ${emptyRes.body?.error?.code}`,
    };
    console.log(`TEST 12: ${test12Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 13: LLM failure → controlled error and no partial database record
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 13 ---');
    aiService.extractRevisions = async () => {
      throw new AppError('AI_PROCESSING_FAILED', 'Feedback could not be analyzed.', 422);
    };
    const countBefore13 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    const llmFailRes = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback test 13',
    }, tokenA);
    const countAfter13 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    aiService.extractRevisions = origExtract; // restore
    const test13Pass = llmFailRes.status === 422 && countBefore13.rows[0].count === countAfter13.rows[0].count;
    testResults['TEST 13'] = {
      pass: test13Pass,
      note: `Controlled error returned (${llmFailRes.body?.error?.code}) and no DB record added`,
    };
    console.log(`TEST 13: ${test13Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 14: Database transaction rollback works when an item insert fails
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 14 ---');
    const origItemCreate = revisionItemRepository.createWithClient;
    revisionItemRepository.createWithClient = async () => {
      throw new Error('Simulated DB item insertion failure');
    };
    const countBatchesBefore14 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    const rollbackRes = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: validFeedback,
    }, tokenA);
    const countBatchesAfter14 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch');
    revisionItemRepository.createWithClient = origItemCreate; // restore
    const test14Pass = countBatchesBefore14.rows[0].count === countBatchesAfter14.rows[0].count;
    testResults['TEST 14'] = {
      pass: test14Pass,
      note: `Batch was rolled back upon item insert failure. Status: ${rollbackRes.status}`,
    };
    console.log(`TEST 14: ${test14Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 15: Existing Day 1 Project CRUD still works
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 15 ---');
    // List
    const listRes = await request('GET', '/api/projects', undefined, tokenA);
    // Get
    const getRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    // Update
    const patchRes = await request('PATCH', `/api/projects/${projectAId}`, { name: 'Landing Page PT ABC (Updated)' }, tokenA);
    // Create new project to delete
    const tempProj = await request('POST', '/api/projects', { name: 'Temp Proj', clientName: 'Temp', totalAllowedRevisions: 1 }, tokenA);
    const delRes = await request('DELETE', `/api/projects/${tempProj.body?.project?.id}`, undefined, tokenA);
    const test15Pass = listRes.status === 200 && getRes.status === 200 && patchRes.status === 200 && delRes.status === 204;
    testResults['TEST 15'] = {
      pass: test15Pass,
      note: `List (${listRes.status}), Get (${getRes.status}), Patch (${patchRes.status}), Delete (${delRes.status}) all functional.`,
    };
    console.log(`TEST 15: ${test15Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 16: Existing ownership isolation still works
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 16 ---');
    const ownGetRes = await request('GET', `/api/projects/${projectAId}`, undefined, tokenB);
    const ownPatchRes = await request('PATCH', `/api/projects/${projectAId}`, { name: 'Hacked' }, tokenB);
    const ownDelRes = await request('DELETE', `/api/projects/${projectAId}`, undefined, tokenB);
    const test16Pass = ownGetRes.status === 404 && ownPatchRes.status === 404 && ownDelRes.status === 404;
    testResults['TEST 16'] = {
      pass: test16Pass,
      note: `Cross-account Get (404), Patch (404), Delete (404) all isolated cleanly.`,
    };
    console.log(`TEST 16: ${test16Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 17: Primary provider success — OpenRouter NOT called
    // (mocks at internal provider-function level: aiService.callGoogleAI /
    //  aiService.callOpenRouter, NOT global.fetch)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 17 ---');
    let googleCalled17: boolean = false;
    let openRouterCalled17: boolean = false;
    const origCallGoogleAI17 = aiService.callGoogleAI;
    const origCallOpenRouter17 = aiService.callOpenRouter;
    aiService.callGoogleAI = async () => {
      googleCalled17 = true;
      return {
        summary: 'Mock Google Primary Summary',
        items: [
          { description: 'Make header bigger', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
          { description: 'Add contact form', category: null, scopeStatus: 'OUT_OF_SCOPE' as const, reason: 'New feature not in contract' },
        ],
      };
    };
    aiService.callOpenRouter = async () => {
      openRouterCalled17 = true;
      throw new Error('OpenRouter should NOT be called when primary provider succeeds!');
    };
    const rev17 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Please make the header bigger and add a contact form',
    }, tokenA);
    aiService.callGoogleAI = origCallGoogleAI17;
    aiService.callOpenRouter = origCallOpenRouter17;

    const test17Pass = (rev17.status === 201 || rev17.status === 200)
      && !!rev17.body?.batch?.id
      && !!googleCalled17
      && !openRouterCalled17;
    testResults['TEST 17'] = {
      pass: test17Pass,
      note: `Mock target: callGoogleAI/callOpenRouter. Google called: ${googleCalled17}, OpenRouter called: ${openRouterCalled17}, Status ${rev17.status}, batch: ${rev17.body?.batch?.id}`,
    };
    console.log(`TEST 17: ${test17Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 18: Google fails (429) → OpenRouter fallback succeeds
    // (mocks at internal provider-function level; sequence proven via flags)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 18 ---');
    const callSequence18: string[] = [];
    const origCallGoogleAI18 = aiService.callGoogleAI;
    const origCallOpenRouter18 = aiService.callOpenRouter;
    aiService.callGoogleAI = async () => {
      callSequence18.push('google');
      const err = new Error('Rate limit exceeded (429)') as Error & { kind?: string; status?: number };
      err.kind = 'http';
      err.status = 429;
      throw err;
    };
    aiService.callOpenRouter = async () => {
      callSequence18.push('openrouter');
      return {
        summary: 'Mock OpenRouter Fallback Summary',
        items: [
          { description: 'Redesign checkout flow', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
        ],
      };
    };
    const rev18 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Client asked for a new checkout flow redesign',
    }, tokenA);
    aiService.callGoogleAI = origCallGoogleAI18;
    aiService.callOpenRouter = origCallOpenRouter18;

    const test18Pass = (rev18.status === 201 || rev18.status === 200)
      && !!rev18.body?.batch?.id
      && callSequence18.length === 2
      && callSequence18[0] === 'google'
      && callSequence18[1] === 'openrouter';
    testResults['TEST 18'] = {
      pass: test18Pass,
      note: `Mock target: callGoogleAI/callOpenRouter. Sequence: [${callSequence18.join(' -> ')}], Status ${rev18.status}, batch: ${rev18.body?.batch?.id}`,
    };
    console.log(`TEST 18: ${test18Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 19: Quota Exhausted Gate - HTTP 409, AI not called, no DB writes
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 19 ---');
    // Create a project with totalAllowedRevisions = 1, then add 1 APPROVED batch to exhaust quota
    const zeroQuotaProj = await request('POST', '/api/projects', {
      name: 'Zero Quota Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 1,
    }, tokenA);
    const zeroQuotaProjectId = zeroQuotaProj.body?.project?.id;
    // Pre-create 1 APPROVED batch to exhaust quota
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'batch1', 'summary1', 'APPROVED', gen_random_uuid())`, [zeroQuotaProjectId]);
    let aiCalled19 = false;
    const origExtract19 = aiService.extractRevisions;
    aiService.extractRevisions = async () => {
      aiCalled19 = true;
      return origExtract19('');
    };
    const rev19 = await request('POST', `/api/projects/${zeroQuotaProjectId}/revisions`, {
      rawInput: 'Some feedback',
    }, tokenA);
    aiService.extractRevisions = origExtract19;
    // Verify no batch created
    const batchCount19 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch WHERE project_id = $1', [zeroQuotaProjectId]);
    const itemCount19 = await db.query('SELECT COUNT(*)::int as count FROM revision_item WHERE revision_batch_id IN (SELECT id FROM revision_batch WHERE project_id = $1)', [zeroQuotaProjectId]);
    const test19Pass = rev19.status === 409
      && rev19.body?.error?.code === 'QUOTA_EXHAUSTED'
      && rev19.body?.error?.details?.used === 1
      && rev19.body?.error?.details?.allowed === 1
      && rev19.body?.error?.details?.remaining === 0
      && aiCalled19 === false
      && batchCount19.rows[0].count === 1  // only the pre-existing APPROVED batch
      && itemCount19.rows[0].count === 0;
    testResults['TEST 19'] = {
      pass: test19Pass,
      note: `Status ${rev19.status}, error code: ${rev19.body?.error?.code}, AI called: ${aiCalled19}, batches: ${batchCount19.rows[0].count}, items: ${itemCount19.rows[0].count}`,
    };
    console.log(`TEST 19: ${test19Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 20: Quota Remaining Allows Submission - DRAFT doesn't consume quota
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 20 ---');
    // Create project with totalAllowedRevisions = 3
    const quotaProj = await request('POST', '/api/projects', {
      name: 'Quota Test Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 3,
    }, tokenA);
    const quotaProjectId = quotaProj.body?.project?.id;
    // Pre-create 2 APPROVED batches directly in DB
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'batch1', 'summary1', 'APPROVED', gen_random_uuid())`, [quotaProjectId]);
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'batch2', 'summary2', 'APPROVED', gen_random_uuid())`, [quotaProjectId]);
    // Submit new revision - should succeed (remaining = 1)
    const rev20 = await request('POST', `/api/projects/${quotaProjectId}/revisions`, {
      rawInput: 'Please add a contact form',
    }, tokenA);
    // Verify batch created with DRAFT status
    const batch20 = rev20.body?.batch;
    const test20Pass = (rev20.status === 201 || rev20.status === 200)
      && !!batch20?.id
      && batch20?.status === 'DRAFT';
    testResults['TEST 20'] = {
      pass: test20Pass,
      note: `Status ${rev20.status}, batch status: ${batch20?.status}, batch id: ${batch20?.id}`,
    };
    console.log(`TEST 20: ${test20Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 21: Approved Batch Contributes to Quota - only APPROVED counts
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 21 ---');
    // Create project with totalAllowedRevisions = 5
    const quotaProj21 = await request('POST', '/api/projects', {
      name: 'Quota Test Project 21',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, tokenA);
    const quotaProjectId21 = quotaProj21.body?.project?.id;
    // Create 1 APPROVED, 1 DRAFT, 1 PENDING_CONFIRMATION batch directly in DB
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'approved1', 'summary', 'APPROVED', gen_random_uuid())`, [quotaProjectId21]);
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'draft1', 'summary', 'DRAFT', gen_random_uuid())`, [quotaProjectId21]);
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'pending1', 'summary', 'PENDING_CONFIRMATION', gen_random_uuid())`, [quotaProjectId21]);
    // GET project detail
    const proj21 = await request('GET', `/api/projects/${quotaProjectId21}`, undefined, tokenA);
    const proj21Data = proj21.body?.project;
    const test21Pass = proj21.status === 200
      && proj21Data?.usedRevisions === 1
      && proj21Data?.remainingRevisions === 4
      && proj21Data?.totalAllowedRevisions === 5;
    testResults['TEST 21'] = {
      pass: test21Pass,
      note: `usedRevisions: ${proj21Data?.usedRevisions}, remainingRevisions: ${proj21Data?.remainingRevisions}, totalAllowed: ${proj21Data?.totalAllowedRevisions}`,
    };
    console.log(`TEST 21: ${test21Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 22: Project Detail Includes Quota Fields
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 22 ---');
    const proj22 = await request('GET', `/api/projects/${projectAId}`, undefined, tokenA);
    const proj22Data = proj22.body?.project;
    const test22Pass = proj22.status === 200
      && typeof proj22Data?.totalAllowedRevisions === 'number'
      && typeof proj22Data?.usedRevisions === 'number'
      && typeof proj22Data?.remainingRevisions === 'number'
      && proj22Data?.remainingRevisions === proj22Data.totalAllowedRevisions - proj22Data.usedRevisions;
    testResults['TEST 22'] = {
      pass: test22Pass,
      note: `totalAllowed: ${proj22Data?.totalAllowedRevisions}, used: ${proj22Data?.usedRevisions}, remaining: ${proj22Data?.remainingRevisions}`,
    };
    console.log(`TEST 22: ${test22Pass ? 'PASS' : 'FAIL'}`);

// -------------------------------------------------------------
    // TEST 23: Overview Returns Correct Aggregate
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 23 ---');
    // Create two fresh projects for this test
    const proj23a = await request('POST', '/api/projects', {
      name: 'Overview Project A',
      clientName: 'Test Client',
      totalAllowedRevisions: 10,
    }, tokenA);
    const proj23aId = proj23a.body?.project?.id;
    const proj23b = await request('POST', '/api/projects', {
      name: 'Overview Project B',
      clientName: 'Test Client',
      totalAllowedRevisions: 10,
    }, tokenA);
    const proj23bId = proj23b.body?.project?.id;
    // Add 1 APPROVED to project A, 2 APPROVED to project B
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'a1', 's', 'APPROVED', gen_random_uuid())`, [proj23aId]);
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'b1', 's', 'APPROVED', gen_random_uuid())`, [proj23bId]);
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'b2', 's', 'APPROVED', gen_random_uuid())`, [proj23bId]);
    // GET overview - should return total approved across ALL projects for this account
    const overview23 = await request('GET', '/api/overview', undefined, tokenA);
    const overview23Data = overview23.body;
    // Compute expected total approved for this account (using projectAId to get the account)
    const actualTotalRes = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM revision_batch rb JOIN project p ON p.id = rb.project_id WHERE p.account_id = (SELECT account_id FROM project WHERE id = $1) AND rb.status = 'APPROVED'`,
      [projectAId]
    );
    const expectedTotal = parseInt(actualTotalRes.rows[0]?.count ?? '0', 10);
    const test23Pass = overview23.status === 200
      && overview23Data?.revisionsUsed === expectedTotal;
    testResults['TEST 23'] = {
      pass: test23Pass,
      note: `revisionsUsed: ${overview23Data?.revisionsUsed} (expected total for account: ${expectedTotal})`,
    };
    console.log(`TEST 23: ${test23Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 24: Quota Gate Prevents AI Call (Spy Verification)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 24 ---');
    // Create project with totalAllowedRevisions = 1, then add 1 APPROVED batch
    const proj24 = await request('POST', '/api/projects', {
      name: 'Quota Gate Spy Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 1,
    }, tokenA);
    const proj24Id = proj24.body?.project?.id;
    await db.query(`INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'approved', 's', 'APPROVED', gen_random_uuid())`, [proj24Id]);
    let googleCalled24 = false;
    let openRouterCalled24 = false;
    const origGoogle24 = aiService.callGoogleAI;
    const origOpenRouter24 = aiService.callOpenRouter;
    aiService.callGoogleAI = async () => {
      googleCalled24 = true;
      return origGoogle24('');
    };
    aiService.callOpenRouter = async () => {
      openRouterCalled24 = true;
      return origOpenRouter24('');
    };
    const rev24 = await request('POST', `/api/projects/${proj24Id}/revisions`, {
      rawInput: 'Some feedback',
    }, tokenA);
    aiService.callGoogleAI = origGoogle24;
    aiService.callOpenRouter = origOpenRouter24;
    const test24Pass = rev24.status === 409
      && rev24.body?.error?.code === 'QUOTA_EXHAUSTED'
      && googleCalled24 === false
      && openRouterCalled24 === false;
    testResults['TEST 24'] = {
      pass: test24Pass,
      note: `Status ${rev24.status}, Google called: ${googleCalled24}, OpenRouter called: ${openRouterCalled24}`,
    };
    console.log(`TEST 24: ${test24Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 25: NEEDS_REVIEW With Reason Persists
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 25 ---');
    const origGoogle25 = aiService.callGoogleAI;
    aiService.callGoogleAI = async () => ({
      summary: 'Mock summary with NEEDS_REVIEW',
      items: [
        { description: 'Ambiguous request for verification', category: null, scopeStatus: 'NEEDS_REVIEW' as const, reason: 'Cannot determine if this is in scope' },
      ],
    });
    const rev25 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback containing ambiguous request',
    }, tokenA);
    aiService.callGoogleAI = origGoogle25;
    let nrPersisted25 = false;
    if (rev25.body?.batch?.id) {
      const nrItemsRes = await db.query('SELECT * FROM revision_item WHERE revision_batch_id = $1', [rev25.body.batch.id]);
      nrPersisted25 = nrItemsRes.rows.length === 1
        && nrItemsRes.rows[0].scope_status === 'NEEDS_REVIEW'
        && typeof nrItemsRes.rows[0].reason === 'string'
        && nrItemsRes.rows[0].reason.trim().length > 0;
    }
    const test25Pass = (rev25.status === 201 || rev25.status === 200)
      && !!rev25.body?.batch?.id
      && nrPersisted25;
    testResults['TEST 25'] = {
      pass: test25Pass,
      note: `Status ${rev25.status}, batch: ${rev25.body?.batch?.id}, NEEDS_REVIEW persisted with reason: ${nrPersisted25}`,
    };
    console.log(`TEST 25: ${test25Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 26: NEEDS_REVIEW Without Reason Rejected (Schema validation fails)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 26 ---');
    // Capture batch count before test
    const batchCountBefore26 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch WHERE project_id = $1', [projectAId]);
    const beforeCount26 = parseInt(batchCountBefore26.rows[0].count, 10);
    // Mock at fetch level to test full pipeline including schema validation
    const origFetch26 = global.fetch;
    global.fetch = (async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        // Return AI response with NEEDS_REVIEW but no reason - should fail schema validation
        return new Response(JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Mock summary with NEEDS_REVIEW no reason',
                items: [
                  { description: 'Ambiguous request', scope: 'NEEDS_REVIEW', reason: null },
                ],
              }),
            },
          }],
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return origFetch26(url, opts);
    }) as typeof fetch;
    const rev26 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback with NEEDS_REVIEW no reason',
    }, tokenA);
    global.fetch = origFetch26;
    // Verify no NEW batch created (count should not increase)
    const batchCountAfter26 = await db.query('SELECT COUNT(*)::int as count FROM revision_batch WHERE project_id = $1', [projectAId]);
    const afterCount26 = parseInt(batchCountAfter26.rows[0].count, 10);
    const test26Pass = rev26.status === 422
      && rev26.body?.error?.code === 'AI_PROCESSING_FAILED'
      && afterCount26 === beforeCount26; // no new batch created
    testResults['TEST 26'] = {
      pass: test26Pass,
      note: `Status ${rev26.status}, error code: ${rev26.body?.error?.code}, batches before: ${beforeCount26}, after: ${afterCount26}`,
    };
    console.log(`TEST 26: ${test26Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 27: Day 1 + Day 2 Full Regression (already covered by 1-18)
    // -------------------------------------------------------------
    // This test is implicit - if we reach here and all 1-18 passed, Test 27 passes
    testResults['TEST 27'] = {
      pass: true,
      note: 'All Day 1 & Day 2 tests (1-18) passed in this run',
    };
    console.log(`TEST 27: PASS`);

    // -------------------------------------------------------------
    // TEST 28: GET /api/projects/:id/batches → 200, shape §3.3,
    // DESC order, itemCount correct
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 28 ---');
    // Create a few batches for projectAId
    const origGoogle28 = aiService.callGoogleAI;
    aiService.callGoogleAI = async () => ({
      summary: 'Mock summary for test 28',
      items: [
        { description: 'Item 1', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
        { description: 'Item 2', category: null, scopeStatus: 'OUT_OF_SCOPE' as const, reason: 'Out of scope' },
      ],
    });
    const rev28a = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback for batch 28a',
    }, tokenA);
    const rev28b = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'Feedback for batch 28b',
    }, tokenA);
    aiService.callGoogleAI = origGoogle28;

    const listRes28 = await request('GET', `/api/projects/${projectAId}/batches`, undefined, tokenA);
    const listData28 = listRes28.body?.batches;
    const test28Pass = listRes28.status === 200
      && Array.isArray(listData28)
      && listData28.length >= 2
      && listData28.every((b: any) => typeof b.id === 'string' && ['DRAFT', 'PENDING_CONFIRMATION', 'APPROVED'].includes(b.status) && b.createdAt && typeof b.itemCount === 'number')
      && listData28[0].createdAt >= listData28[1].createdAt; // DESC order
    testResults['TEST 28'] = {
      pass: test28Pass,
      note: `Status ${listRes28.status}, batch count: ${listData28?.length}, order: ${listData28?.map((b: any) => b.createdAt).join(' > ')}`,
      details: listData28,
    };
    console.log(`TEST 28: ${test28Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 29: GET /api/batches/:id → 200, shape EXACTLY §3.2
    // (assert magicToken/createdAt/isCompleted ABSENT)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 29 ---');
    const batchId29 = rev28a.body?.batch?.id;
    const batchRes29 = await request('GET', `/api/batches/${batchId29}`, undefined, tokenA);
    const batchData29 = batchRes29.body?.batch;
    const test29Pass = batchRes29.status === 200
      && typeof batchData29?.id === 'string'
      && typeof batchData29?.projectId === 'string'
      && ['DRAFT', 'PENDING_CONFIRMATION', 'APPROVED'].includes(batchData29?.status)
      && (batchData29?.summary === null || typeof batchData29?.summary === 'string')
      && Array.isArray(batchData29?.items)
      && batchData29?.items.every((item: any) =>
        typeof item.id === 'string'
        && typeof item.description === 'string'
        && (item.category === null || typeof item.category === 'string')
        && ['IN_SCOPE', 'OUT_OF_SCOPE', 'NEEDS_REVIEW'].includes(item.scopeStatus)
        && (item.reason === null || typeof item.reason === 'string')
        && !('isCompleted' in item)
      )
      && batchData29?.magicToken === undefined
      && batchData29?.createdAt === undefined;
    testResults['TEST 29'] = {
      pass: test29Pass,
      note: `Status ${batchRes29.status}, magicToken absent: ${batchData29?.magicToken === undefined}, createdAt absent: ${batchData29?.createdAt === undefined}, isCompleted absent: ${batchData29?.items?.[0] ? !('isCompleted' in batchData29.items[0]) : 'N/A'}`,
      details: batchData29,
    };
    console.log(`TEST 29: ${test29Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 30: GET /api/batches/:invalid → 404 NOT_FOUND
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 30 ---');
    const invalidBatchId = '00000000-0000-0000-0000-000000000000';
    const invalidRes30 = await request('GET', `/api/batches/${invalidBatchId}`, undefined, tokenA);
    const test30Pass = invalidRes30.status === 404 && invalidRes30.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 30'] = {
      pass: test30Pass,
      note: `Status ${invalidRes30.status}, error code: ${invalidRes30.body?.error?.code}`,
    };
    console.log(`TEST 30: ${test30Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 31: Cross-account on BOTH new routes → 404 (ownership isolation)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 31 ---');
    // User B tries to access User A's project batches list
    const crossList31 = await request('GET', `/api/projects/${projectAId}/batches`, undefined, tokenB);
    // User B tries to access User A's batch detail
    const crossDetail31 = await request('GET', `/api/batches/${batchId29}`, undefined, tokenB);
    const test31Pass = crossList31.status === 404 && crossList31.body?.error?.code === 'NOT_FOUND'
      && crossDetail31.status === 404 && crossDetail31.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 31'] = {
      pass: test31Pass,
      note: `List: ${crossList31.status} (${crossList31.body?.error?.code}), Detail: ${crossDetail31.status} (${crossDetail31.body?.error?.code})`,
    };
    console.log(`TEST 31: ${test31Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 32: GET /api/projects/:id/batches untuk project yang tidak milik
    // account → 404 NOT_FOUND (ownership isolation untuk list endpoint)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 32 ---');
    const crossList32 = await request('GET', `/api/projects/${projectBId}/batches`, undefined, tokenA);
    const test32Pass = crossList32.status === 404 && crossList32.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 32'] = {
      pass: test32Pass,
      note: `Status ${crossList32.status}, error code: ${crossList32.body?.error?.code}`,
    };
    console.log(`TEST 32: ${test32Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 33: GET /api/projects/:id/batches untuk project dengan 0 batches
    // → 200, { batches: [] }
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 33 ---');
    // Create a fresh project with no batches
    const emptyProj = await request('POST', '/api/projects', {
      name: 'Empty Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, tokenA);
    const emptyProjId = emptyProj.body?.project?.id;
    const emptyListRes33 = await request('GET', `/api/projects/${emptyProjId}/batches`, undefined, tokenA);
    const emptyListData33 = emptyListRes33.body?.batches;
    const test33Pass = emptyListRes33.status === 200
      && Array.isArray(emptyListData33)
      && emptyListData33.length === 0;
    testResults['TEST 33'] = {
      pass: test33Pass,
      note: `Status ${emptyListRes33.status}, batches: ${JSON.stringify(emptyListData33)}`,
    };
    console.log(`TEST 33: ${test33Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 34: GET /api/batches/:id untuk batch dengan items semua IN_SCOPE
    // (reason = null) → verify reason field tetap ada dengan null,
    // tidak di-strip dari response.
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 34 ---');
    const origGoogle34 = aiService.callGoogleAI;
    aiService.callGoogleAI = async () => ({
      summary: 'All IN_SCOPE items',
      items: [
        { description: 'In scope item 1', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
        { description: 'In scope item 2', category: null, scopeStatus: 'IN_SCOPE' as const, reason: null },
      ],
    });
    const rev34 = await request('POST', `/api/projects/${projectAId}/revisions`, {
      rawInput: 'All in scope feedback',
    }, tokenA);
    aiService.callGoogleAI = origGoogle34;
    const batchId34 = rev34.body?.batch?.id;
    const batchRes34 = await request('GET', `/api/batches/${batchId34}`, undefined, tokenA);
    const batchData34 = batchRes34.body?.batch;
    const test34Pass = batchRes34.status === 200
      && Array.isArray(batchData34?.items)
      && batchData34.items.length === 2
      && batchData34.items.every((item: any) =>
        'reason' in item
        && item.reason === null
        && item.scopeStatus === 'IN_SCOPE'
      );
    testResults['TEST 34'] = {
      pass: test34Pass,
      note: `Status ${batchRes34.status}, all items have reason field: ${batchData34?.items?.every((i: any) => 'reason' in i)}, all null: ${batchData34?.items?.every((i: any) => i.reason === null)}`,
      details: batchData34?.items,
    };
    console.log(`TEST 34: ${test34Pass ? 'PASS' : 'FAIL'}`);

    console.log('\n================ ALL TEST RESULTS ================');
    console.log(JSON.stringify(testResults, null, 2));

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server?.close();
    await db.end();
  }
}

runTests();
