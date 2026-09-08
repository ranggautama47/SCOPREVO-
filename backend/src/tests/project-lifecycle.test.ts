import './test-setup';
import http from 'http';
import app from '../app';
import { db } from '../config/database';
import { projectRepository } from '../repositories/project.repository';
import { ProjectStatus } from '../types/db.types';
import { setDeleteHookForTest } from '../services/storage.service';

let server: http.Server;
const PORT = 3458;
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
  console.log('=== STARTING SCOPREVO PROJECT LIFECYCLE V1.2 TESTS ===');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-SERVER] Running on ${BASE_URL}`);
      resolve();
    });
  });

  const testResults: Record<string, { pass: boolean; note: string; details?: any }> = {};

  try {
    const unique = Date.now();
    const user = { name: 'Lifecycle User', email: `lifecycle_${unique}@test.com`, password: 'Password123!' };

    // Register user
    const reg = await request('POST', '/api/auth/register', user);
    const token = reg.body?.token;

    // Create a project
    const projRes = await request('POST', '/api/projects', {
      name: 'Lifecycle Test Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const projectId = projRes.body?.project?.id;

    console.log(`[SETUP] User: ${reg.body?.account?.id}, Project: ${projectId}`);

    // -------------------------------------------------------------
    // TEST 1: New project defaults to ACTIVE status
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 1: Default Status ACTIVE ---');
    const proj1 = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test1Pass = proj1.status === 200 && proj1.body?.project?.status === 'ACTIVE';
    testResults['TEST 1'] = {
      pass: test1Pass,
      note: `Status ${proj1.status}, project.status: ${proj1.body?.project?.status}`,
    };
    console.log(`TEST 1: ${test1Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 2: ACTIVE → COMPLETED transition
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 2: ACTIVE -> COMPLETED ---');
    const upd2 = await request('PATCH', `/api/projects/${projectId}`, { status: 'COMPLETED' }, token);
    const proj2 = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test2Pass = upd2.status === 200 && proj2.body?.project?.status === 'COMPLETED';
    testResults['TEST 2'] = {
      pass: test2Pass,
      note: `Update status: ${upd2.status}, stored status: ${proj2.body?.project?.status}`,
    };
    console.log(`TEST 2: ${test2Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 3: COMPLETED → ACTIVE transition
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 3: COMPLETED -> ACTIVE ---');
    const upd3 = await request('PATCH', `/api/projects/${projectId}`, { status: 'ACTIVE' }, token);
    const proj3 = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test3Pass = upd3.status === 200 && proj3.body?.project?.status === 'ACTIVE';
    testResults['TEST 3'] = {
      pass: test3Pass,
      note: `Update status: ${upd3.status}, stored status: ${proj3.body?.project?.status}`,
    };
    console.log(`TEST 3: ${test3Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 4: Same-status transition is a no-op (no DB write, returns 200)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 4: Same-status no-op ---');
    const dbStatusBefore = await db.query('SELECT status FROM project WHERE id = $1', [projectId]);
    const statusBefore = dbStatusBefore.rows[0]?.status;
    const upd4 = await request('PATCH', `/api/projects/${projectId}`, { status: 'ACTIVE' }, token);
    const dbStatusAfter = await db.query('SELECT status FROM project WHERE id = $1', [projectId]);
    const statusAfter = dbStatusAfter.rows[0]?.status;
    const test4Pass = upd4.status === 200 && statusBefore === statusAfter;
    testResults['TEST 4'] = {
      pass: test4Pass,
      note: `No-op transition: ${upd4.status === 200}, status unchanged: ${statusBefore === statusAfter} (${statusBefore} -> ${statusAfter})`,
    };
    console.log(`TEST 4: ${test4Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 5: INVALID transition ACTIVE → COMPLETED when pending batch exists → 409
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 5: ACTIVE -> COMPLETED with pending batch ---');
    // Create a new ACTIVE project
    const proj5Res = await request('POST', '/api/projects', {
      name: 'Pending Batch Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj5Id = proj5Res.body?.project?.id;
    // Insert a PENDING_CONFIRMATION batch directly in DB
    await db.query(
      `INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'input', 'summary', 'PENDING_CONFIRMATION', gen_random_uuid())`,
      [proj5Id]
    );
    const upd5 = await request('PATCH', `/api/projects/${proj5Id}`, { status: 'COMPLETED' }, token);
    const proj5 = await request('GET', `/api/projects/${proj5Id}`, undefined, token);
    const test5Pass = upd5.status === 409 && upd5.body?.error?.code === 'PROJECT_HAS_PENDING_BATCH' && proj5.body?.project?.status === 'ACTIVE';
    testResults['TEST 5'] = {
      pass: test5Pass,
      note: `Status ${upd5.status}, code: ${upd5.body?.error?.code}, project.status still: ${proj5.body?.project?.status}`,
    };
    console.log(`TEST 5: ${test5Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 6: INVALID transition COMPLETED → ACTIVE is allowed (re-open)
    //         but ACTIVE → ACTIVE → COMPLETED when completed already with no pending → 409
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 6: INVALID transition from DRAFT-equivalent ---');
    // Project with COMPLETED status, no pending - transition back to ACTIVE then to COMPLETED again
    const proj6Res = await request('POST', '/api/projects', {
      name: 'Re-open Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj6Id = proj6Res.body?.project?.id;

    // Complete it
    await request('PATCH', `/api/projects/${proj6Id}`, { status: 'COMPLETED' }, token);
    const proj6c = await request('GET', `/api/projects/${proj6Id}`, undefined, token);

    // Now try to complete again (COMPLETED -> COMPLETED is a no-op, should succeed)
    const upd6 = await request('PATCH', `/api/projects/${proj6Id}`, { status: 'COMPLETED' }, token);
    const test6Pass = upd6.status === 200 && proj6c.body?.project?.status === 'COMPLETED';
    testResults['TEST 6'] = {
      pass: test6Pass,
      note: `Re-complete (no-op): ${upd6.status}, status: ${proj6c.body?.project?.status}`,
    };
    console.log(`TEST 6: ${test6Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 7: Overview activeProjects counts only ACTIVE projects
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 7: Overview activeProjects counts ACTIVE ---');
    // proj5Id and proj6Id are ACTIVE, projectId is ACTIVE
    // proj6Id is COMPLETED after TEST 6, but then re-completed; let's verify
    // First, ensure projectId is ACTIVE and proj6Id is COMPLETED
    await request('PATCH', `/api/projects/${proj6Id}`, { status: 'ACTIVE' }, token); // reopen proj6
    await request('PATCH', `/api/projects/${proj6Id}`, { status: 'COMPLETED' }, token); // complete again

    const overviewRes = await request('GET', '/api/overview', undefined, token);
    const activeCount = overviewRes.body?.activeProjects;
    // Count ACTIVE projects for this account in DB
    const dbActiveCount = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM project WHERE account_id = $1 AND status = \'ACTIVE\'',
      [reg.body?.account?.id]
    );
    const expectedActive = parseInt(dbActiveCount.rows[0]?.count ?? '0', 10);
    const test7Pass = overviewRes.status === 200 && activeCount === expectedActive;
    testResults['TEST 7'] = {
      pass: test7Pass,
      note: `Overview activeProjects: ${activeCount}, DB count: ${expectedActive}`,
    };
    console.log(`TEST 7: ${test7Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 8: PATCH status with invalid enum value → 422
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 8: Invalid status enum → 422 ---');
    const upd8 = await request('PATCH', `/api/projects/${projectId}`, { status: 'INVALID_STATUS' }, token);
    const test8Pass = upd8.status === 422;
    testResults['TEST 8'] = {
      pass: test8Pass,
      note: `Status ${upd8.status}, error: ${JSON.stringify(upd8.body?.error)}`,
    };
    console.log(`TEST 8: ${test8Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 9: Hard delete removes project, batches, items, documents, storage
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 9: Hard delete with cleanup ---');
    const proj9Res = await request('POST', '/api/projects', {
      name: 'Delete Me Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj9Id = proj9Res.body?.project?.id;

    // Add a batch with items directly
    const batchInsertRes = await db.query(
      `INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'input', 'summary', 'APPROVED', gen_random_uuid()) RETURNING id`,
      [proj9Id]
    );
    const batch9Id = batchInsertRes.rows[0]?.id;
    await db.query(
      'INSERT INTO revision_item (id, revision_batch_id, description, category, scope_status, reason) VALUES (gen_random_uuid(), $1, \'item1\', NULL, \'IN_SCOPE\', NULL)',
      [batch9Id]
    );

    // Verify exists
    const batchCountBefore = await db.query('SELECT COUNT(*)::int as count FROM revision_batch WHERE project_id = $1', [proj9Id]);
    const itemCountBefore = await db.query('SELECT COUNT(*)::int as count FROM revision_item WHERE revision_batch_id = $1', [batch9Id]);

    // Delete project
    const del9 = await request('DELETE', `/api/projects/${proj9Id}`, undefined, token);
    const projDeleted = await projectRepository.findById(proj9Id);
    const batchDeleted = await db.query('SELECT COUNT(*)::int as count FROM revision_batch WHERE id = $1', [batch9Id]);
    const itemDeleted = await db.query('SELECT COUNT(*)::int as count FROM revision_item WHERE revision_batch_id = $1', [batch9Id]);
    const test9Pass = del9.status === 204 && !projDeleted && batchDeleted.rows[0]?.count === 0 && itemDeleted.rows[0]?.count === 0;
    testResults['TEST 9'] = {
      pass: test9Pass,
      note: `Delete: ${del9.status}, project gone: ${!projDeleted}, batches: ${batchDeleted.rows[0]?.count}, items: ${itemDeleted.rows[0]?.count}`,
    };
    console.log(`TEST 9: ${test9Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 10: Cross-account status update → 404 (ownership isolation)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 10: Cross-account status update → 404 ---');
    const userB = { name: 'User B', email: `userb_${unique}@test.com`, password: 'Password123!' };
    const regB = await request('POST', '/api/auth/register', userB);
    const tokenB = regB.body?.token;

    const crossUpd10 = await request('PATCH', `/api/projects/${projectId}`, { status: 'COMPLETED' }, tokenB);
    const proj10 = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test10Pass = crossUpd10.status === 404 && crossUpd10.body?.error?.code === 'NOT_FOUND' && proj10.body?.project?.status === 'ACTIVE';
    testResults['TEST 10'] = {
      pass: test10Pass,
      note: `Cross-account update: ${crossUpd10.status}, code: ${crossUpd10.body?.error?.code}, project status unchanged: ${proj10.body?.project?.status === 'ACTIVE'}`,
    };
    console.log(`TEST 10: ${test10Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 11: Cross-account delete → 404, project still exists
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 11: Cross-account delete → 404 ---');
    const crossDel11 = await request('DELETE', `/api/projects/${projectId}`, undefined, tokenB);
    const proj11StillExists = await projectRepository.findById(projectId);
    const test11Pass = crossDel11.status === 404 && !!proj11StillExists;
    testResults['TEST 11'] = {
      pass: test11Pass,
      note: `Cross-account delete: ${crossDel11.status}, project exists: ${!!proj11StillExists}`,
    };
    console.log(`TEST 11: ${test11Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 12: Update name + status together (atomic)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 12: Update name + status together ---');
    const upd12 = await request('PATCH', `/api/projects/${projectId}`, { name: 'Updated Lifecycle Project', status: 'COMPLETED' }, token);
    const proj12 = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test12Pass = upd12.status === 200 && proj12.body?.project?.name === 'Updated Lifecycle Project' && proj12.body?.project?.status === 'COMPLETED';
    testResults['TEST 12'] = {
      pass: test12Pass,
      note: `Name: ${proj12.body?.project?.name}, Status: ${proj12.body?.project?.status}`,
    };
    console.log(`TEST 12: ${test12Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 13: Reopen COMPLETED → ACTIVE, then complete again works
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 13: Reopen cycle works ---');
    await request('PATCH', `/api/projects/${projectId}`, { status: 'ACTIVE' }, token);
    const proj13a = await request('GET', `/api/projects/${projectId}`, undefined, token);
    await request('PATCH', `/api/projects/${projectId}`, { status: 'COMPLETED' }, token);
    const proj13b = await request('GET', `/api/projects/${projectId}`, undefined, token);
    const test13Pass = proj13a.body?.project?.status === 'ACTIVE' && proj13b.body?.project?.status === 'COMPLETED';
    testResults['TEST 13'] = {
      pass: test13Pass,
      note: `Reopen: ${proj13a.body?.project?.status}, complete: ${proj13b.body?.project?.status}`,
    };
    console.log(`TEST 13: ${test13Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 14: Share batch on ACTIVE project + DRAFT batch → 200
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 14: Share on ACTIVE project → 200 ---');
    const proj14Res = await request('POST', '/api/projects', {
      name: 'Share Active Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj14Id = proj14Res.body?.project?.id;
    // Create a DRAFT batch directly in DB
    const batchInsertRes14 = await db.query(
      `INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'input', 'summary', 'DRAFT', gen_random_uuid()) RETURNING id`,
      [proj14Id]
    );
    const batch14Id = batchInsertRes14.rows[0]?.id;
    const share14 = await request('PATCH', `/api/batches/${batch14Id}/share`, undefined, token);
    const test14Pass = share14.status === 200 && share14.body?.batch?.status === 'PENDING_CONFIRMATION';
    testResults['TEST 14'] = {
      pass: test14Pass,
      note: `Share on ACTIVE project: ${share14.status}, batch status: ${share14.body?.batch?.status}`,
    };
    console.log(`TEST 14: ${test14Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 15: Share batch on COMPLETED project → 409 PROJECT_COMPLETED
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 15: Share on COMPLETED project → 409 ---');
    const proj15Res = await request('POST', '/api/projects', {
      name: 'Share Completed Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj15Id = proj15Res.body?.project?.id;
    // Complete the project
    await request('PATCH', `/api/projects/${proj15Id}`, { status: 'COMPLETED' }, token);
    const batchInsertRes15 = await db.query(
      `INSERT INTO revision_batch (id, project_id, raw_input, ai_summary, status, magic_token) VALUES (gen_random_uuid(), $1, 'input', 'summary', 'DRAFT', gen_random_uuid()) RETURNING id`,
      [proj15Id]
    );
    const batch15Id = batchInsertRes15.rows[0]?.id;
    const share15 = await request('PATCH', `/api/batches/${batch15Id}/share`, undefined, token);
    const test15Pass = share15.status === 409 && share15.body?.error?.code === 'PROJECT_COMPLETED';
    testResults['TEST 15'] = {
      pass: test15Pass,
      note: `Share on COMPLETED project: ${share15.status}, code: ${share15.body?.error?.code}`,
    };
    console.log(`TEST 15: ${test15Pass ? 'PASS' : 'FAIL'}`);

    // -------------------------------------------------------------
    // TEST 16: Storage failure - DB commit before cleanup, response succeeds, structured error log
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 16: Storage failure is graceful ---');
    const proj16Res = await request('POST', '/api/projects', {
      name: 'Storage Failure Project',
      clientName: 'Test Client',
      totalAllowedRevisions: 5,
    }, token);
    const proj16Id = proj16Res.body?.project?.id;
    // Add a document with storage path directly in DB
    await db.query(
      `INSERT INTO project_document (id, project_id, filename, mime_type, size_bytes, storage_path, extraction_status) VALUES (gen_random_uuid(), $1, 'test.pdf', 'application/pdf', 1000, 'test-project/test.pdf', 'pending')`,
      [proj16Id]
    );

    // Spy on deleteDocumentObject to throw
    setDeleteHookForTest(async (_path: string) => {
      throw new Error('Simulated storage network failure');
    });

    // Intercept console.error to verify structured log
    const capturedErrors: string[] = [];
    const origConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      capturedErrors.push(args.map(String).join(' '));
      origConsoleError(...args);
    };

    let del16: any;
    try {
      // Delete project — should succeed (204) despite storage failure
      del16 = await request('DELETE', `/api/projects/${proj16Id}`, undefined, token);
    } finally {
      console.error = origConsoleError;
      setDeleteHookForTest(null);
    }

    // Verify DB cleanup committed before storage failure
    const docCountAfter = await db.query('SELECT COUNT(*)::int as count FROM project_document WHERE project_id = $1', [proj16Id]);
    const projectDeleted = await projectRepository.findById(proj16Id);

    // Verify structured log format
    const hasStructuredLog = capturedErrors.some(
      (msg) =>
        msg.includes('[STORAGE_CLEANUP_FAILED]') &&
        msg.includes(`projectId=${proj16Id}`) &&
        msg.includes('storagePath=test-project/test.pdf') &&
        msg.includes('Simulated storage network failure'),
    );

    const test16Pass =
      del16?.status === 204 &&
      !projectDeleted &&
      docCountAfter.rows[0]?.count === 0 &&
      hasStructuredLog;

    testResults['TEST 16'] = {
      pass: test16Pass,
      note: `Delete status: ${del16?.status} (expected 204), project deleted: ${!projectDeleted}, doc count: ${docCountAfter.rows[0]?.count}, structured log: ${hasStructuredLog}`,
    };
    console.log(`TEST 16: ${test16Pass ? 'PASS' : 'FAIL'}`);

  } catch (err) {
    console.error('[FATAL]', err);
  } finally {
    server.close();
    await db.end();
  }

  console.log('\n=== SUMMARY ===');
  const passCount = Object.values(testResults).filter(r => r.pass).length;
  const failCount = Object.values(testResults).filter(r => !r.pass).length;
  for (const [name, r] of Object.entries(testResults)) {
    console.log(`  ${name}: ${r.pass ? 'PASS' : 'FAIL'} — ${r.note}`);
  }
  console.log(`\nTotal: ${passCount} PASS, ${failCount} FAIL`);
  process.exit(failCount > 0 ? 1 : 0);
}

runTests();
