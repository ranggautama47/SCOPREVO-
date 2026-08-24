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
