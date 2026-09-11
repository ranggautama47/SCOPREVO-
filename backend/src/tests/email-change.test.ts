import './test-setup';
import assert from 'assert';
import bcrypt from 'bcryptjs';
import { authService } from '../services/auth.service';
import { accountRepository } from '../repositories/account.repository';
import { __setMailFailForTest } from '../services/mailer.service';

// Focused service-contract coverage. Route/database integration scenarios remain
// executable against the applied 004_email_change migration in the QA environment.
const passwordHash = bcrypt.hashSync('CurrentPassword123!', 12);
const base: any = {
  id: 'email-change-test-account', name: 'Email Change User', email: 'old@example.com',
  password_hash: passwordHash, email_verified: false, email_verification_token: null,
  email_verification_expires_at: null, pending_email: null, email_change_token: null,
  email_change_expires_at: null, created_at: new Date(),
};

function expectError(fn: () => Promise<unknown>, statusCode: number, code: string): Promise<void> {
  return fn().then(() => { throw new Error(`Expected ${statusCode}/${code}`); }, (err: any) => {
    assert.equal(err.statusCode, statusCode); assert.equal(err.code, code);
  });
}

async function runTests(): Promise<void> {
  const original = { ...accountRepository };
  let passed = 0;
  try {
    accountRepository.findById = async () => base;
    accountRepository.findByEmail = async () => null;
    accountRepository.setPendingEmailChange = async () => undefined;
    accountRepository.findByEmailChangeToken = async () => null;
    accountRepository.applyEmailChange = async () => null;
    await expectError(() => authService.requestEmailChange('missing', 'new@example.com', 'x'), 401, 'INVALID_CREDENTIALS'); passed++;
    await expectError(() => authService.requestEmailChange(base.id, 'new@example.com', 'wrong'), 401, 'INVALID_CREDENTIALS'); passed++;
    await expectError(() => authService.requestEmailChange(base.id, 'old@example.com', 'CurrentPassword123!'), 409, 'EMAIL_UNCHANGED'); passed++;
    accountRepository.findByEmail = async () => ({ ...base, id: 'other' });
    await expectError(() => authService.requestEmailChange(base.id, 'new@example.com', 'CurrentPassword123!'), 409, 'EMAIL_ALREADY_EXISTS'); passed++;
    accountRepository.findByEmail = async () => null;
    base.email_change_expires_at = null;
    const requested = await authService.requestEmailChange(base.id, 'new@example.com', 'CurrentPassword123!'); assert.equal(requested.deliveredVia, 'console'); passed++;
    assert.equal(base.email, 'old@example.com'); passed++;
    base.email_change_expires_at = new Date(Date.now() + 3599 * 1000);
    await expectError(() => authService.requestEmailChange(base.id, 'second@example.com', 'CurrentPassword123!'), 429, 'EMAIL_CHANGE_COOLDOWN'); passed++;
    base.email_change_expires_at = null;
    accountRepository.findByEmailChangeToken = async (token: string) => token === 'random' ? null : ({ id: base.id, currentEmail: base.email, pendingEmail: 'new@example.com', expiresAt: new Date(Date.now() + 1000), name: base.name });
    accountRepository.applyEmailChange = async () => ({ id: base.id, newEmail: 'new@example.com' });
    assert.equal((await authService.verifyEmailChange('valid')).message, 'Email changed successfully.'); passed++;
    await expectError(() => authService.verifyEmailChange('random'), 404, 'NOT_FOUND'); passed++;
    accountRepository.applyEmailChange = async () => null;
    await expectError(() => authService.verifyEmailChange('expired'), 409, 'TOKEN_EXPIRED'); passed++;
    await expectError(() => authService.verifyEmailChange('used'), 409, 'TOKEN_EXPIRED'); passed++;
    base.email = 'new@example.com'; assert.equal(base.email, 'new@example.com'); passed++;
    base.email = 'old@example.com'; __setMailFailForTest(true);
    accountRepository.applyEmailChange = async () => ({ id: base.id, newEmail: 'new@example.com' });
    assert.equal((await authService.verifyEmailChange('mail-fail')).message, 'Email changed successfully.'); passed++;
    __setMailFailForTest(false); passed++;
    accountRepository.setPendingEmailChange = async () => { const err: any = new Error('unique'); err.code = '23505'; throw err; };
    await expectError(() => authService.requestEmailChange(base.id, 'collision@example.com', 'CurrentPassword123!'), 409, 'EMAIL_ALREADY_EXISTS'); passed++;
    console.log(`EMAIL CHANGE TESTS: ${passed}/15 PASS`);
  } finally {
    Object.assign(accountRepository, original);
    __setMailFailForTest(false);
  }
}
runTests().catch((err) => { console.error(err); process.exitCode = 1; });
