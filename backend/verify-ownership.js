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

function printTest(name, req, res, expectedStatus) {
  const verdict = res.status === expectedStatus ? 'PASS' : 'FAIL';
  console.log(`\n========== ${name} ==========`);
  console.log(`REQUEST: ${req.method} ${req.path}`);
  if (req.body) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    console.log(`BODY: ${JSON.stringify(safeBody)}`);
  }
  if (req.headers?.authorization) {
    console.log(`AUTH: Bearer [REDACTED]`);
  }
  console.log(`RESPONSE: ${res.status} (expected ${expectedStatus})`);
  console.log(`BODY: ${JSON.stringify(res.data, null, 2)}`);
  console.log(`RESULT: ${verdict}`);
  return verdict === 'PASS';
}

async function runTests() {
  // Register Account A
  const emailA = `testa${Date.now()}@example.com`;
  let res = await request('POST', '/auth/register', {
    name: 'Test User A',
    email: emailA,
    password: 'password123'
  });
  const tokenA = res.data.token;
  const accountAId = res.data.account?.id;
  console.log(`Account A: ${accountAId}, Token: ${tokenA ? 'OK' : 'MISSING'}`);

  // Register Account B
  const emailB = `testb${Date.now()}@example.com`;
  res = await request('POST', '/auth/register', {
    name: 'Test User B',
    email: emailB,
    password: 'password123'
  });
  const tokenB = res.data.token;
  const accountBId = res.data.account?.id;
  console.log(`Account B: ${accountBId}, Token: ${tokenB ? 'OK' : 'MISSING'}`);

  // Account A creates a project
  res = await request('POST', '/projects', {
    name: 'Project A',
    clientName: 'Client Corp',
    totalAllowedRevisions: 3
  }, { Authorization: `Bearer ${tokenA}` });
  const projectAId = res.data.project?.id;
  console.log(`Project A: ${projectAId}`);

  // Account B creates a project
  res = await request('POST', '/projects', {
    name: 'Project B',
    clientName: 'Client Corp',
    totalAllowedRevisions: 3
  }, { Authorization: `Bearer ${tokenB}` });
  const projectBId = res.data.project?.id;
  console.log(`Project B: ${projectBId}`);

  // ==========================================
  // TEST A: Authenticated account accesses own project
  // Expected: success (200)
  // ==========================================
  res = await request('GET', `/projects/${projectAId}`, null, { Authorization: `Bearer ${tokenA}` });
  printTest('TEST A - Own project access', { method: 'GET', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${tokenA}` } }, res, 200);

  // ==========================================
  // TEST B: Authenticated account attempts to access another account's project
  // Expected: 404 NOT_FOUND (per PM decision)
  // ==========================================
  res = await request('GET', `/projects/${projectAId}`, null, { Authorization: `Bearer ${tokenB}` });
  printTest('TEST B - Cross-account access', { method: 'GET', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${tokenB}` } }, res, 404);

  // ==========================================
  // TEST C: Request without authentication token
  // Expected: 401 UNAUTHORIZED
  // ==========================================
  res = await request('GET', `/projects/${projectAId}`, null);
  printTest('TEST C - No auth', { method: 'GET', path: `/projects/${projectAId}` }, res, 401);

  // Additional: Test UPDATE cross-account
  res = await request('PATCH', `/projects/${projectAId}`, { name: 'Hacked' }, { Authorization: `Bearer ${tokenB}` });
  printTest('TEST B-UPDATE - Cross-account update', { method: 'PATCH', path: `/projects/${projectAId}`, body: { name: 'Hacked' }, headers: { Authorization: `Bearer ${tokenB}` } }, res, 404);

  // Additional: Test DELETE cross-account
  res = await request('DELETE', `/projects/${projectAId}`, null, { Authorization: `Bearer ${tokenB}` });
  printTest('TEST B-DELETE - Cross-account delete', { method: 'DELETE', path: `/projects/${projectAId}`, headers: { Authorization: `Bearer ${tokenB}` } }, res, 404);

  // Additional: Test LIST - should only show own projects
  res = await request('GET', '/projects', null, { Authorization: `Bearer ${tokenA}` });
  const ownProjects = res.data.projects?.filter(p => p.accountId === accountAId).length ?? 0;
  const otherProjects = res.data.projects?.filter(p => p.accountId !== accountAId).length ?? 0;
  console.log(`\n========== LIST projects (Account A) ==========`);
  console.log(`Own projects: ${ownProjects}, Other projects: ${otherProjects}`);
  console.log(`RESULT: ${otherProjects === 0 ? 'PASS' : 'FAIL'}`);
}

runTests().catch(console.error);