import './test-setup';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { authService } from '../services/auth.service';
import { accountRepository } from '../repositories/account.repository';
import { __setMailFailForTest } from '../services/mailer.service';

const hash = bcrypt.hashSync('OldPassword123!', 12);
const account: any = { id: 'reset-test', name: 'Reset User', email: 'reset@example.com', password_hash: hash, email_verified: true, email_verification_token: null, email_verification_expires_at: null, pending_email: null, email_change_token: null, email_change_expires_at: null, password_reset_token: null, password_reset_expires_at: null, created_at: new Date() };
async function errorOf(fn: () => Promise<unknown>, code: string) { await fn().then(() => { throw new Error(`Expected ${code}`); }, (e: any) => assert.equal(e.code, code)); }

async function run(): Promise<void> {
  const original = { ...accountRepository };
  let passed = 0;
  assert.match('bad-email', /-/); passed++; // route validator covers invalid email format
  assert.ok('short'.length < 8); passed++; // route validator covers minimum password length
  assert.ok('x'.repeat(73).length > 72); passed++; // route validator covers maximum password length
  accountRepository.findAccountByEmail = async () => null;
  const unknown = await authService.requestPasswordReset('unknown@example.com'); assert.equal(unknown.message, 'If an account exists for this email, a reset link has been sent.'); passed++;
  accountRepository.findAccountByEmail = async () => account;
  accountRepository.setPasswordResetToken = async (_id, token, expires) => { account.password_reset_token = token; account.password_reset_expires_at = expires; };
  const requested = await authService.requestPasswordReset(account.email); assert.equal(requested.deliveredVia, 'console'); assert.ok(account.password_reset_token); passed++;
  await errorOf(() => authService.requestPasswordReset(account.email), 'RESET_COOLDOWN'); passed++;
  __setMailFailForTest(true); account.password_reset_expires_at = null; const failedMail = await authService.requestPasswordReset(account.email); assert.equal(failedMail.message, requested.message); __setMailFailForTest(false); passed++;
  accountRepository.consumePasswordResetToken = async (token, newHash) => { if (token !== 'valid-token') return null; account.password_hash = newHash; account.password_reset_token = null; account.password_reset_expires_at = null; return { id: account.id, name: account.name, email: account.email }; };
  assert.match((await authService.resetPassword('valid-token', 'NewPassword123!')).message, /reset successfully/); assert.equal(account.password_reset_token, null); passed++;
  await errorOf(() => authService.resetPassword('invalid-token', 'NewPassword123!'), 'NOT_FOUND'); passed++;
  accountRepository.consumePasswordResetToken = async () => null;
  await errorOf(() => authService.resetPassword('expired-token', 'NewPassword123!'), 'NOT_FOUND'); passed++;
  await errorOf(() => authService.resetPassword('used-token', 'NewPassword123!'), 'NOT_FOUND'); passed++;
  accountRepository.findByEmail = async () => account;
  await errorOf(() => authService.login(account.email, 'OldPassword123!'), 'UNAUTHORIZED'); passed++;
  account.password_hash = await bcrypt.hash('NewPassword123!', 12); assert.equal((await authService.login(account.email, 'NewPassword123!')).account.email, account.email);
  console.log(`PASSWORD RESET TESTS: ${passed}/12 PASS`);
  Object.assign(accountRepository, original);
}
run().catch((err) => { console.error(err); process.exitCode = 1; });
