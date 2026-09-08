// Test setup: must be imported FIRST to disable SMTP for tests
import './test-setup';
import http from 'http';
import app from '../app';
import { db } from '../config/database';
import { accountRepository } from '../repositories/account.repository';

let server: http.Server;
const PORT = 3457;
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
  console.log('=== STARTING SCOPREVO AUTH SECURITY TESTS ===');

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST-SERVER] Running on ${BASE_URL}`);
      resolve();
    });
  });

  const testResults: Record<string, { pass: boolean; note: string; details?: any }> = {};

  try {
    const unique = Date.now();
    const user = { name: 'Auth User', email: `authuser_${unique}@test.com`, password: 'Password123!' };

    // Register user
    const reg = await request('POST', '/api/auth/register', user);
    const token = reg.body?.token;
    const accountId = reg.body?.account?.id;

    console.log(`[SETUP] User registered: ${accountId}, emailVerified: ${reg.body?.account?.emailVerified}`);

    // -------------------------------------------------------------
    // TEST 1: change password sukses -> login password baru OK, password lama ditolak
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 1: Change Password Success ---');
    const cp1 = await request('POST', '/api/auth/change-password', {
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456!',
    }, token);
    const test1Pass = cp1.status === 200 && cp1.body?.ok === true;
    if (test1Pass) {
      // Verify new password works
      const loginNew = await request('POST', '/api/auth/login', { email: user.email, password: 'NewPassword456!' });
      const test1a = loginNew.status === 200 && loginNew.body?.token;
      // Verify old password rejected
      const loginOld = await request('POST', '/api/auth/login', { email: user.email, password: 'Password123!' });
      const test1b = loginOld.status === 401;
      testResults['TEST 1'] = { pass: test1a && test1b, note: `new login: ${test1a}, old rejected: ${test1b}` };
    } else {
      testResults['TEST 1'] = { pass: false, note: `change password failed: ${cp1.status}` };
    }
    console.log(`TEST 1: ${testResults['TEST 1'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 1'].note}`);

    // -------------------------------------------------------------
    // TEST 2: current password salah -> 401 INVALID_CREDENTIALS, hash tidak berubah
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 2: Wrong Current Password ---');
    const cp2 = await request('POST', '/api/auth/change-password', {
      currentPassword: 'WrongPassword',
      newPassword: 'AnotherPassword123!',
    }, token);
    const test2Pass = cp2.status === 401 && cp2.body?.error?.code === 'INVALID_CREDENTIALS';
    // Verify hash unchanged by trying to login with current password
    const loginAfterFail = await request('POST', '/api/auth/login', { email: user.email, password: 'NewPassword456!' });
    const test2HashUnchanged = loginAfterFail.status === 200;
    testResults['TEST 2'] = { pass: test2Pass && test2HashUnchanged, note: `status: ${cp2.status}, code: ${cp2.body?.error?.code}, hash unchanged: ${test2HashUnchanged}` };
    console.log(`TEST 2: ${testResults['TEST 2'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 2'].note}`);

    // -------------------------------------------------------------
    // TEST 3: newPassword < 8 karakter -> 422
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 3: New Password Too Short ---');
    const cp3 = await request('POST', '/api/auth/change-password', {
      currentPassword: 'NewPassword456!',
      newPassword: 'Short1',
    }, token);
    const test3Pass = cp3.status === 422 && cp3.body?.error?.code === 'VALIDATION_ERROR';
    testResults['TEST 3'] = { pass: test3Pass, note: `status: ${cp3.status}, code: ${cp3.body?.error?.code}` };
    console.log(`TEST 3: ${testResults['TEST 3'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 3'].note}`);

    // -------------------------------------------------------------
    // TEST 4: change-password tanpa token -> 401 UNAUTHORIZED
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 4: Change Password No Token ---');
    const cp4 = await request('POST', '/api/auth/change-password', {
      currentPassword: 'NewPassword456!',
      newPassword: 'AnotherPassword123!',
    });
    const test4Pass = cp4.status === 401 && cp4.body?.error?.code === 'UNAUTHORIZED';
    testResults['TEST 4'] = { pass: test4Pass, note: `status: ${cp4.status}, code: ${cp4.body?.error?.code}` };
    console.log(`TEST 4: ${testResults['TEST 4'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 4'].note}`);

    // -------------------------------------------------------------
    // TEST 5: newPassword === current -> 409 PASSWORD_UNCHANGED
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 5: New Password Equals Current ---');
    const cp5 = await request('POST', '/api/auth/change-password', {
      currentPassword: 'NewPassword456!',
      newPassword: 'NewPassword456!',
    }, token);
    const test5Pass = cp5.status === 409 && cp5.body?.error?.code === 'PASSWORD_UNCHANGED';
    testResults['TEST 5'] = { pass: test5Pass, note: `status: ${cp5.status}, code: ${cp5.body?.error?.code}` };
    console.log(`TEST 5: ${testResults['TEST 5'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 5'].note}`);

    // -------------------------------------------------------------
    // TEST 6: request verification -> 200 deliveredVia 'console', token terisi di DB, email_verified masih false
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 6: Request Verification Email ---');
    const ve6 = await request('POST', '/api/auth/verification-email', {}, token);
    const test6a = ve6.status === 200 && ve6.body?.deliveredVia === 'console';
    const test6b = ve6.body?.expiresAt;
    // Verify in DB
    const acc6 = await accountRepository.findById(accountId);
    const test6c = acc6?.email_verification_token !== null && acc6?.email_verified === false;
    testResults['TEST 6'] = { pass: test6a && test6b && test6c, note: `deliveredVia: ${ve6.body?.deliveredVia}, expiresAt: ${!!ve6.body?.expiresAt}, token set: ${!!acc6?.email_verification_token}, verified: ${acc6?.email_verified}` };
    console.log(`TEST 6: ${testResults['TEST 6'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 6'].note}`);

    // -------------------------------------------------------------
    // TEST 7: request kedua dalam < 60 detik -> 429 VERIFICATION_COOLDOWN
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 7: Verification Cooldown ---');
    const ve7 = await request('POST', '/api/auth/verification-email', {}, token);
    const test7Pass = ve7.status === 429 && ve7.body?.error?.code === 'VERIFICATION_COOLDOWN';
    testResults['TEST 7'] = { pass: test7Pass, note: `status: ${ve7.status}, code: ${ve7.body?.error?.code}` };
    console.log(`TEST 7: ${testResults['TEST 7'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 7'].note}`);

    // -------------------------------------------------------------
    // TEST 8: verify token valid -> 200, email_verified=true, token NULL
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 8: Verify Valid Token ---');
    const acc8 = await accountRepository.findById(accountId);
    const token8 = acc8?.email_verification_token;
    const verify8 = await request('GET', `/api/auth/verify-email/${token8}`, undefined);
    const test8a = verify8.status === 200 && verify8.body?.ok === true;
    const acc8After = await accountRepository.findById(accountId);
    const test8b = acc8After?.email_verified === true && acc8After?.email_verification_token === null;
    testResults['TEST 8'] = { pass: test8a && test8b, note: `status: ${verify8.status}, verified: ${acc8After?.email_verified}, token cleared: ${acc8After?.email_verification_token === null}` };
    console.log(`TEST 8: ${testResults['TEST 8'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 8'].note}`);

    // -------------------------------------------------------------
    // TEST 9: verify token acak -> 404
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 9: Verify Random Token ---');
    const randomToken = '00000000-0000-0000-0000-000000000000';
    const verify9 = await request('GET', `/api/auth/verify-email/${randomToken}`, undefined);
    const test9Pass = verify9.status === 404 && verify9.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 9'] = { pass: test9Pass, note: `status: ${verify9.status}, code: ${verify9.body?.error?.code}` };
    console.log(`TEST 9: ${testResults['TEST 9'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 9'].note}`);

    // -------------------------------------------------------------
    // TEST 10: verify token expired (manipulasi expires_at di DB) -> 409 TOKEN_EXPIRED
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 10: Verify Expired Token ---');
    // First request a new verification
    const ve10 = await request('POST', '/api/auth/verification-email', {}, token);
    const acc10 = await accountRepository.findById(accountId);
    // Manipulate expires_at to past
    await db.query('UPDATE account SET email_verification_expires_at = NOW() - INTERVAL \'1 hour\' WHERE id = $1', [accountId]);
    const verify10 = await request('GET', `/api/auth/verify-email/${acc10?.email_verification_token}`, undefined);
    const test10Pass = verify10.status === 409 && verify10.body?.error?.code === 'TOKEN_EXPIRED';
    testResults['TEST 10'] = { pass: test10Pass, note: `status: ${verify10.status}, code: ${verify10.body?.error?.code}` };
    console.log(`TEST 10: ${testResults['TEST 10'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 10'].note}`);

    // -------------------------------------------------------------
    // TEST 11: verify token yang sudah dipakai -> 404 (single-use)
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 11: Verify Used Token ---');
    // Request new verification
    const ve11 = await request('POST', '/api/auth/verification-email', {}, token);
    const acc11 = await accountRepository.findById(accountId);
    const token11 = acc11?.email_verification_token;
    // First use
    await request('GET', `/api/auth/verify-email/${token11}`, undefined);
    // Second use should fail
    const verify11 = await request('GET', `/api/auth/verify-email/${token11}`, undefined);
    const test11Pass = verify11.status === 404 && verify11.body?.error?.code === 'NOT_FOUND';
    testResults['TEST 11'] = { pass: test11Pass, note: `status: ${verify11.status}, code: ${verify11.body?.error?.code}` };
    console.log(`TEST 11: ${testResults['TEST 11'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 11'].note}`);

    // -------------------------------------------------------------
    // TEST 12: regresi: register + login tetap sukses dengan email_verified=false
    // -------------------------------------------------------------
    console.log('\n--- Running TEST 12: Regression Register/Login with email_verified=false ---');
    const user12 = { name: 'Regression User', email: `reguser_${Date.now()}@test.com`, password: 'Password123!' };
    const reg12 = await request('POST', '/api/auth/register', user12);
    const test12a = reg12.status === 201 && reg12.body?.account?.emailVerified === false;
    const login12 = await request('POST', '/api/auth/login', { email: user12.email, password: user12.password });
    const test12b = login12.status === 200 && login12.body?.account?.emailVerified === false;
    testResults['TEST 12'] = { pass: test12a && test12b, note: `register emailVerified: ${reg12.body?.account?.emailVerified}, login emailVerified: ${login12.body?.account?.emailVerified}` };
    console.log(`TEST 12: ${testResults['TEST 12'].pass ? 'PASS' : 'FAIL'} — ${testResults['TEST 12'].note}`);

  } catch (err) {
    console.error('[FATAL]', err);
  } finally {
    server.close();
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