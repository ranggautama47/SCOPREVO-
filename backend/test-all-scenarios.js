require('dotenv').config();
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function main() {
  const ts = Date.now();
  console.log("=== 1. SETUP USERS & PROJECTS ===");
  
  // Register Account A
  let res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: `user_a_${ts}@test.com`, password: 'password123' })
  });
  let dataA = await res.json();
  const tokenA = dataA.token;
  const accAId = dataA.account.id;
  console.log("Account A registered:", accAId);

  // Register Account B
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: `user_b_${ts}@test.com`, password: 'password123' })
  });
  let dataB = await res.json();
  const tokenB = dataB.token;
  const accBId = dataB.account.id;
  console.log("Account B registered:", accBId);

  // Project 1 under Account A
  res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ name: 'Project Alpha', clientName: 'Client Alpha', totalAllowedRevisions: 3 })
  });
  let pDataA = await res.json();
  const projectAId = pDataA.project.id;
  console.log("Project A created:", projectAId);

  // Project 2 under Account B
  res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ name: 'Project Beta', clientName: 'Client Beta', totalAllowedRevisions: 3 })
  });
  let pDataB = await res.json();
  const projectBId = pDataB.project.id;
  console.log("Project B created:", projectBId);

  // Prepare dummy test files
  const validMdPath = path.join(__dirname, 'dummy_valid.md');
  fs.writeFileSync(validMdPath, '# Scope of Work\nThis is a valid scope document.');
  
  const corruptPdfPath = path.join(__dirname, 'dummy_corrupt.pdf');
  fs.writeFileSync(corruptPdfPath, '%PDF-1.4\nCorrupt bytes that fail extraction %EOF');

  const oversizePath = path.join(__dirname, 'dummy_oversize.md');
  fs.writeFileSync(oversizePath, Buffer.alloc(2.5 * 1024 * 1024, 'a'));

  const invalidTypePath = path.join(__dirname, 'dummy_invalid.exe');
  fs.writeFileSync(invalidTypePath, 'MZ binary executable format dummy');

  console.log("\n=== 2. RUNNING 9 CURL SCENARIOS (a - i) ===");

  // Scenario a: POST Valid Document Upload (MD/PDF)
  console.log("\n--- SCENARIO a: Valid Document Upload (Account A to Project A) ---");
  let formDataA = new FormData();
  formDataA.append('file', new Blob([fs.readFileSync(validMdPath)], { type: 'text/markdown' }), 'scope.md');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formDataA
  });
  let docA = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(docA, null, 2));
  const docAId = docA.document?.id;

  // Scenario b: GET List Documents (Project A by Account A)
  console.log("\n--- SCENARIO b: GET List Documents (Account A on Project A) ---");
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  let listA = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(listA, null, 2));

  // Scenario c: POST Cross-Account ProjectId (Account B uploading to Project A) -> 404
  console.log("\n--- SCENARIO c: POST Cross-Account ProjectId (Account B to Project A) -> 404 ---");
  let formDataCross = new FormData();
  formDataCross.append('file', new Blob([fs.readFileSync(validMdPath)], { type: 'text/markdown' }), 'scope.md');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: formDataCross
  });
  let crossPost = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(crossPost, null, 2));

  // Scenario d: POST Invalid MIME Type (e.g., .exe) -> 400
  console.log("\n--- SCENARIO d: POST Invalid File Format / MIME Type -> 400 ---");
  let formDataInvalid = new FormData();
  formDataInvalid.append('file', new Blob([fs.readFileSync(invalidTypePath)], { type: 'application/x-msdownload' }), 'app.exe');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formDataInvalid
  });
  let invalidRes = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(invalidRes, null, 2));

  // Scenario e: POST Oversized File (>2MB) -> 400
  console.log("\n--- SCENARIO e: POST Oversized File (>2MB) -> 400 ---");
  let formDataOversize = new FormData();
  formDataOversize.append('file', new Blob([fs.readFileSync(oversizePath)], { type: 'text/markdown' }), 'large.md');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formDataOversize
  });
  let oversizeRes = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(oversizeRes, null, 2));

  // Scenario f: POST Corrupt/Password-Protected PDF -> 201 with extractionStatus='failed'
  console.log("\n--- SCENARIO f: POST Corrupt/Protected PDF -> 201 (extractionStatus='failed') ---");
  let formDataCorrupt = new FormData();
  formDataCorrupt.append('file', new Blob([fs.readFileSync(corruptPdfPath)], { type: 'application/pdf' }), 'corrupt.pdf');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formDataCorrupt
  });
  let corruptRes = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(corruptRes, null, 2));
  const corruptDocId = corruptRes.document?.id;

  // Scenario g: Max 3 Documents Quota Limit Exceeded -> 409
  console.log("\n--- SCENARIO g: Quota Limit (4th document) -> 409 ---");
  // Upload 3rd doc first
  let formData3rd = new FormData();
  formData3rd.append('file', new Blob([fs.readFileSync(validMdPath)], { type: 'text/markdown' }), 'doc3.md');
  await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formData3rd
  });
  // Now attempt 4th doc
  let formData4th = new FormData();
  formData4th.append('file', new Blob([fs.readFileSync(validMdPath)], { type: 'text/markdown' }), 'doc4.md');
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: formData4th
  });
  let quotaRes = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(quotaRes, null, 2));

  // Scenario h: DELETE Own Document -> 204
  console.log("\n--- SCENARIO h: DELETE Own Document -> 204 ---");
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents/${docAId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  console.log("Status:", res.status);

  // Scenario i: DELETE Cross-Account ProjectId (Account B deleting Account A's doc) -> 404
  console.log("\n--- SCENARIO i: DELETE Cross-Account Document -> 404 ---");
  res = await fetch(`${BASE_URL}/projects/${projectAId}/documents/${corruptDocId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  let crossDel = await res.json().catch(() => ({}));
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(crossDel, null, 2));

  // Cleanup temp files
  try {
    fs.unlinkSync(validMdPath);
    fs.unlinkSync(corruptPdfPath);
    fs.unlinkSync(oversizePath);
    fs.unlinkSync(invalidTypePath);
  } catch(e) {}
}

main().catch(console.error);
