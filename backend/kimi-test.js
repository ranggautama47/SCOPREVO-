const fetch = require('node-fetch');

async function runTests() {
  // First, set up test accounts and project
  const ts = Date.now();
  
  // Register Account A
  const rA = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kim A', email: 'kima_' + ts + '@test.com', password: 'password123' })
  }).then(r => r.json());
  const tokenA = rA.token;
  const accountIdA = rA.account.id;
  
  // Register Account B
  const rB = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kim B', email: 'kimb_' + ts + '@test.com', password: 'password123' })
  }).then(r => r.json());
  const tokenB = rB.token;
  const accountIdB = rB.account.id;
  
  // Create project for Account A
  const rP = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tokenA },
    body: JSON.stringify({ name: 'Kimi Project', clientName: 'Client Org' })
  }).then(r => r.json());
  const projectId = rP.project.id;

  console.log('TOKEN_A=' + tokenA);
  console.log('TOKEN_B=' + tokenB);
  console.log('PROJECT_ID=' + projectId);
  
  // Now run the 3 required tests
  
  // Test 1: Authenticated Success
  console.log('\n\n=== TEST 1: Authenticated Success ===');
  const t1 = await fetch('http://localhost:3000/api/projects', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenA }
  });
  const t1body = await t1.text();
  console.log('curl -X GET http://localhost:3000/api/projects -H "Authorization: Bearer <JWT_ACCOUNT_A>"');
  console.log('HTTP/1.1 ' + t1.status + ' ' + t1.statusText);
  console.log(t1body);
  
  // Test 2: Ownership Isolation
  console.log('\n\n=== TEST 2: Ownership Isolation ===');
  const t2 = await fetch('http://localhost:3000/api/projects/' + projectId, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + tokenB }
  });
  const t2body = await t2.text();
  console.log('curl -X GET http://localhost:3000/api/projects/' + projectId + ' -H "Authorization: Bearer <JWT_ACCOUNT_B>"');
  console.log('HTTP/1.1 ' + t2.status + ' ' + t2.statusText);
  console.log(t2body);
  
  // Test 3: Unauthenticated
  console.log('\n\n=== TEST 3: Unauthenticated ===');
  const t3 = await fetch('http://localhost:3000/api/projects/' + projectId);
  const t3body = await t3.text();
  console.log('curl -X GET http://localhost:3000/api/projects/' + projectId);
  console.log('HTTP/1.1 ' + t3.status + ' ' + t3.statusText);
  console.log(t3body);
}

runTests().catch(console.error);