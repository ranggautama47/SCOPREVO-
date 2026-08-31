require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

async function request(method, path, body, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function printTest(num, name, req, res, verdict) {
  console.log(`\n========== TEST ${num}: ${name} ==========`);
  console.log(`REQUEST: ${req.method} ${req.path}`);
  if (req.body) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    if (safeBody.token) safeBody.token = '[REDACTED]';
    console.log(`BODY: ${JSON.stringify(safeBody)}`);
  }
  if (req.headers?.authorization) {
    console.log(`AUTH: Bearer [REDACTED]`);
  }
  console.log(`RESPONSE: ${res.status}`);
  console.log(`BODY: ${JSON.stringify(res.data, null, 2)}`);
  console.log(`VERDICT: ${verdict}`);
  return verdict === 'PASS';
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  let blocked = 0;
  
  // ========== AUTH TESTS ==========
  console.log('\n\n========================================');
  console.log('AUTH TESTS');
  console.log('========================================');
  
  // Test 1: Register a new valid account
  // Use unique email to avoid conflict with manual test
  const timestamp = Date.now();
  let res = await request('POST', '/auth/register', {
    name: 'Test User A',
    email: `testusera${timestamp}@example.com`,
    password: 'password123'
  });
  let verdict = (res.status === 201 && res.data.token && res.data.account) ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(1, 'Register valid account', { method: 'POST', path: '/auth/register', body: { name: 'Test User A', email: `testusera${timestamp}@example.com`, password: 'password123' } }, res, verdict);
  const tokenA = res.data.token;
  const accountAId = res.data.account?.id;
  const emailA = `testusera${timestamp}@example.com`;

// Test 2: Register with duplicate email
  res = await request('POST', '/auth/register', {
    name: 'Test User A2',
    email: emailA,
    password: 'password123'
  });
  verdict = (res.status === 409 && res.data.error?.code === 'EMAIL_ALREADY_EXISTS') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(2, 'Register duplicate email', { method: 'POST', path: '/auth/register', body: { name: 'Test User A2', email: 'testusera2@example.com', password: 'password123' } }, res, verdict);

  // Test 3: Register with invalid input
  res = await request('POST', '/auth/register', {
    name: '',
    email: 'bad-email',
    password: 'short'
  });
  verdict = ((res.status === 400 || res.status === 422) && res.data.error?.code === 'VALIDATION_ERROR') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(3, 'Register invalid input', { method: 'POST', path: '/auth/register', body: { name: '', email: 'bad-email', password: 'short' } }, res, verdict);

  // Test 4: Login with correct credentials
  res = await request('POST', '/auth/login', {
    email: emailA,
    password: 'password123'
  });
  verdict = (res.status === 200 && res.data.token && res.data.account) ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(4, 'Login correct credentials', { method: 'POST', path: '/auth/login', body: { email: 'testusera2@example.com', password: 'password123' } }, res, verdict);
  const loginTokenA = res.data.token;
  const loginAccountAId = res.data.account?.id;

  // Test 5: Login with wrong password
  res = await request('POST', '/auth/login', {
    email: 'testusera2@example.com',
    password: 'wrongpassword'
  });
  verdict = (res.status === 401 && res.data.error?.code === 'UNAUTHORIZED') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(5, 'Login wrong password', { method: 'POST', path: '/auth/login', body: { email: 'testusera2@example.com', password: 'wrongpassword' } }, res, verdict);

  // Test 6: Login with unknown email
  res = await request('POST', '/auth/login', {
    email: 'unknown@example.com',
    password: 'password123'
  });
  verdict = (res.status === 401 && res.data.error?.code === 'UNAUTHORIZED') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(6, 'Login unknown email', { method: 'POST', path: '/auth/login', body: { email: 'unknown@example.com', password: 'password123' } }, res, verdict);

  // Test 7: Confirm JWT is well-formed
  if (loginTokenA) {
    const parts = loginTokenA.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    verdict = (parts.length === 3 && header.alg && payload.accountId === loginAccountAId) ? 'PASS' : 'FAIL';
    if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
    printTest(7, 'JWT well-formed', { method: 'POST', path: '/auth/login (from test 4)', body: { token: loginTokenA } }, { status: 200, data: { header, payload } }, verdict);
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(7, 'JWT well-formed', { method: 'POST', path: '/auth/login (from test 4)', body: {} }, { status: 0, data: { error: 'No token from test 4' } }, verdict);
  }

  // Test 8: Access protected endpoint without JWT
  res = await request('GET', '/projects', null);
  verdict = (res.status === 401 && res.data.error?.code === 'UNAUTHORIZED') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(8, 'Protected endpoint without JWT', { method: 'GET', path: '/projects', body: null }, res, verdict);

  // ========== PROJECT TESTS ==========
  console.log('\n\n========================================');
  console.log('PROJECT TESTS');
  console.log('========================================');

  // Use login token for all project tests
  const authToken = loginTokenA;
  const authAccountId = loginAccountAId;

  // Test 9: Create project with valid JWT
  res = await request('POST', '/projects', {
    name: 'Project Alpha',
    clientName: 'Client Corp',
    totalAllowedRevisions: 3
  }, { Authorization: `Bearer ${authToken}` });
  verdict = (res.status === 201 && res.data.project?.id && res.data.project.accountId === authAccountId) ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(9, 'Create project with JWT', { method: 'POST', path: '/projects', body: { name: 'Project Alpha', clientName: 'Client Corp', totalAllowedRevisions: 3 }, headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);
  const projectAId = res.data.project?.id;

  // Test 10: Create project without JWT
  res = await request('POST', '/projects', {
    name: 'Project No Auth',
    clientName: 'Client Corp'
  });
  verdict = (res.status === 401 && res.data.error?.code === 'UNAUTHORIZED') ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(10, 'Create project without JWT', { method: 'POST', path: '/projects', body: { name: 'Project No Auth', clientName: 'Client Corp' } }, res, verdict);

  // Test 11: List projects for authenticated account
  res = await request('GET', '/projects', null, { Authorization: `Bearer ${authToken}` });
  verdict = (res.status === 200 && Array.isArray(res.data.projects) && res.data.projects.length >= 1) ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(11, 'List projects', { method: 'GET', path: '/projects', headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);

  // Test 12: Account B cannot see Account A's project
  // First register Account B
  const emailB = `testuserb${timestamp}@example.com`;
  res = await request('POST', '/auth/register', {
    name: 'Test User B',
    email: emailB,
    password: 'password123'
  });
  const tokenB = res.data.token;
  const accountBId = res.data.account?.id;
  
  // Try to access Account A's project with Account B's token
  if (projectAId && tokenB) {
    res = await request('GET', `/projects/${projectAId}`, null, { Authorization: `Bearer ${tokenB}` });
    verdict = (res.status === 404 && res.data.error?.code === 'NOT_FOUND') ? 'PASS' : 'FAIL';
    if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
    printTest(12, 'Ownership isolation (B cannot access A)', { method: 'GET', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${tokenB}` } }, res, verdict);
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(12, 'Ownership isolation (B cannot access A)', { method: 'GET', path: '/projects/undefined', headers: { Authorization: `Bearer ${tokenB}` } }, { status: 0, data: { error: 'No projectAId from test 9' } }, verdict);
  }

  // Test 13: Get single project detail (own project)
  if (projectAId) {
    res = await request('GET', `/projects/${projectAId}`, null, { Authorization: `Bearer ${authToken}` });
    verdict = (res.status === 200 && res.data.project?.id === projectAId && res.data.project.accountId === authAccountId) ? 'PASS' : 'FAIL';
    if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
    printTest(13, 'Get own project detail', { method: 'GET', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(13, 'Get own project detail', { method: 'GET', path: '/projects/undefined', headers: { Authorization: `Bearer ${authToken}` } }, { status: 0, data: { error: 'No projectAId from test 9' } }, verdict);
  }

  // Test 14: Update own project
  if (projectAId) {
    res = await request('PATCH', `/projects/${projectAId}`, {
      name: 'Project Alpha Updated',
      clientName: 'Client Corp Updated'
    }, { Authorization: `Bearer ${authToken}` });
    verdict = (res.status === 200 && res.data.project?.name === 'Project Alpha Updated') ? 'PASS' : 'FAIL';
    if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
    printTest(14, 'Update own project', { method: 'PATCH', path: `/projects/${projectAId}`, body: { name: 'Project Alpha Updated', clientName: 'Client Corp Updated' }, headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(14, 'Update own project', { method: 'PATCH', path: '/projects/undefined', body: { name: 'Project Alpha Updated', clientName: 'Client Corp Updated' }, headers: { Authorization: `Bearer ${authToken}` } }, { status: 0, data: { error: 'No projectAId from test 9' } }, verdict);
  }

  // Test 15: Delete own project (zero RevisionBatch)
  if (projectAId) {
    res = await request('DELETE', `/projects/${projectAId}`, null, { Authorization: `Bearer ${authToken}` });
    verdict = (res.status === 204) ? 'PASS' : 'FAIL';
    if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
    printTest(15, 'Delete own project (empty)', { method: 'DELETE', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(15, 'Delete own project (empty)', { method: 'DELETE', path: '/projects/undefined', headers: { Authorization: `Bearer ${authToken}` } }, { status: 0, data: { error: 'No projectAId from test 9' } }, verdict);
  }

  // Test 16: Attempt to delete another account's project
  // Create a new project for Account A first (since we deleted the first one)
  if (authToken) {
    res = await request('POST', '/projects', {
      name: 'Project Beta',
      clientName: 'Client Corp',
      totalAllowedRevisions: 5
    }, { Authorization: `Bearer ${authToken}` });
    const projectBId = res.data.project?.id;
    
    // Try to delete with Account B's token
    if (projectBId && tokenB) {
      res = await request('DELETE', `/projects/${projectBId}`, null, { Authorization: `Bearer ${tokenB}` });
      verdict = (res.status === 404 && res.data.error?.code === 'NOT_FOUND') ? 'PASS' : 'FAIL';
      if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
      printTest(16, 'Delete another account project rejected', { method: 'DELETE', path: `/projects/${projectBId}`, headers: { Authorization: `Bearer ${tokenB}` } }, res, verdict);
    } else {
      verdict = 'BLOCKED';
      blocked++;
      printTest(16, 'Delete another account project rejected', { method: 'DELETE', path: '/projects/undefined', headers: { Authorization: `Bearer ${tokenB}` } }, { status: 0, data: { error: 'No projectBId or tokenB' } }, verdict);
    }
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(16, 'Delete another account project rejected', { method: 'DELETE', path: '/projects/undefined', headers: {} }, { status: 0, data: { error: 'No authToken' } }, verdict);
  }

  // ========== DATABASE / QUOTA TESTS ==========
  console.log('\n\n========================================');
  console.log('DATABASE / QUOTA TESTS');
  console.log('========================================');

  // Test 17: Verify data persists in Supabase (direct query)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  const accountResult = await pool.query('SELECT * FROM account WHERE email = $1', [emailA]);
  const projectResult = await pool.query('SELECT * FROM project WHERE account_id = $1', [authAccountId]);
  
  const accountExists = accountResult.rows.length === 1;
  const projectExists = projectResult.rows.length >= 1; // At least Project Beta
  
  verdict = (accountExists && projectExists) ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
  printTest(17, 'Data persists in Supabase', { method: 'DIRECT SQL', path: 'SELECT * FROM account/project', body: null }, { 
    status: 200, 
    data: { 
      account: accountResult.rows[0] ? { id: accountResult.rows[0].id, email: accountResult.rows[0].email } : null,
      projects: projectResult.rows.map(p => ({ id: p.id, name: p.name, client_name: p.client_name, total_allowed_revisions: p.total_allowed_revisions }))
    } 
  }, verdict);
  
  await pool.end();

  // Test 18: Verify usedRevisions/remainingRevisions calculation
  // Use the project created in test 16 (Project Beta)
  if (authToken) {
    // First get the project list to find Project Beta
    res = await request('GET', '/projects', null, { Authorization: `Bearer ${authToken}` });
    const projectBeta = res.data.projects?.find(p => p.name === 'Project Beta');
    if (projectBeta) {
      res = await request('GET', `/projects/${projectBeta.id}`, null, { Authorization: `Bearer ${authToken}` });
      const project = res.data.project;
      verdict = (project && project.usedRevisions === 0 && project.remainingRevisions === project.totalAllowedRevisions) ? 'PASS' : 'FAIL';
      if (verdict === 'PASS') passed++; else if (verdict === 'FAIL') failed++;
      printTest(18, 'Quota calculation (0/total)', { method: 'GET', path: `/projects/${projectBeta.id}`, headers: { Authorization: `Bearer ${authToken}` } }, res, verdict);
    } else {
      verdict = 'BLOCKED';
      blocked++;
      printTest(18, 'Quota calculation (0/total)', { method: 'GET', path: '/projects/undefined', headers: { Authorization: `Bearer ${authToken}` } }, { status: 0, data: { error: 'Project Beta not found' } }, verdict);
    }
  } else {
    verdict = 'BLOCKED';
    blocked++;
    printTest(18, 'Quota calculation (0/total)', { method: 'GET', path: '/projects/undefined', headers: {} }, { status: 0, data: { error: 'No authToken' } }, verdict);
  }

  // Summary
  console.log('\n\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`TOTAL: ${passed + failed + blocked}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`BLOCKED: ${blocked}`);
  console.log(`OVERALL: ${failed === 0 && blocked === 0 ? 'PASS' : 'FAIL'}`);
}

runTests().catch(console.error);
