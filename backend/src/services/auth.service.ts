import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { accountRepository } from '../repositories/account.repository';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError, TooManyRequestsError } from '../middleware/error.middleware';
import { sendPasswordChangedEmail, sendVerificationEmail, sendWelcomeEmail } from './mailer.service';

const SALT_ROUNDS = 12;
export interface AuthResult {
  token: string;
  account: { id: string; name: string; email: string; createdAt: Date; emailVerified: boolean };
}
export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const existing = await accountRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const row = await accountRepository.create({ name, email, passwordHash });
    try {
      await sendWelcomeEmail(email, name);
    } catch (err) {
      console.warn(`[MAILER] Welcome email failed for ${email}: ${(err as Error).message}`);
    }
    const token = issueToken(row.id);
    return { token, account: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at, emailVerified: row.email_verified } };
  },
  async login(email: string, password: string): Promise<AuthResult> {
    const row = await accountRepository.findByEmail(email);
    const invalid = new UnauthorizedError('Invalid email or password.');
    if (!row) throw invalid;
    const passwordMatch = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatch) throw invalid;
    const token = issueToken(row.id);
    return { token, account: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at, emailVerified: row.email_verified } };
  },

  async changePassword(accountId: string, currentPassword: string, newPassword: string): Promise<void> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError('Account not found.');
    }
    const passwordMatch = await bcrypt.compare(currentPassword, row.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials.', 'INVALID_CREDENTIALS');
    }
    if (currentPassword === newPassword) {
      throw new ConflictError('PASSWORD_UNCHANGED', 'New password must be different from current password.');
    }
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await accountRepository.updatePassword(accountId, newPasswordHash);
    try {
      await sendPasswordChangedEmail(row.email);
    } catch (err) {
      console.warn(`[MAILER] Password-changed email failed for ${row.email}: ${(err as Error).message}`);
    }
  },

  async requestEmailVerification(accountId: string): Promise<{ message: string; deliveredVia: 'smtp' | 'console'; expiresAt: Date }> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError('Account not found.');
    }
    if (row.email_verification_token && row.email_verification_expires_at) {
      const now = new Date();
      const expiresAt = new Date(row.email_verification_expires_at);
      const secondsSinceCreated = (expiresAt.getTime() - 24 * 60 * 60 * 1000 - now.getTime()) / 1000;
      if (secondsSinceCreated > -60) {
        throw new TooManyRequestsError('VERIFICATION_COOLDOWN', 'Verification email already sent recently. Please wait before requesting again.');
      }
    }
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await accountRepository.setVerificationToken(accountId, token, expiresAt);
    let deliveredVia: 'smtp' | 'console' = 'console';
    try {
      deliveredVia = await sendVerificationEmail(row.email, token);
    } catch (err) {
      console.warn(`[MAILER] SMTP send failed, falling back to console. Error: ${(err as Error).message}`);
      deliveredVia = 'console';
    }
    return { message: 'Verification email sent.', deliveredVia, expiresAt };
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const row = await accountRepository.findIdByVerificationToken(token);
    if (!row) {
      throw new NotFoundError('Invalid or expired verification link.');
    }
    const expiresAt = row.expiresAt ? new Date(row.expiresAt) : null;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw new ConflictError('TOKEN_EXPIRED', 'Verification token has expired.');
    }
    await accountRepository.markEmailVerified(row.id);
    return { message: 'Email verified successfully.' };
  },

  async me(accountId: string): Promise<{ account: { id: string; name: string; email: string; createdAt: Date; emailVerified: boolean } }> {
    const row = await accountRepository.findById(accountId);
    if (!row) {
      throw new NotFoundError('Account not found.');
    }
    return { account: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at, emailVerified: row.email_verified } };
  },
};
function issueToken(accountId: string): string {
  return jwt.sign({ accountId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}
