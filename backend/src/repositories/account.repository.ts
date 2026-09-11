import { db } from '../config/database';
import { AccountRow } from '../types/db.types';
export const accountRepository = {
  async findByEmail(email: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, pending_email, email_change_token, email_change_expires_at, password_reset_token, password_reset_expires_at, created_at FROM account WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] ?? null;
  },
  async findById(id: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, pending_email, email_change_token, email_change_expires_at, password_reset_token, password_reset_expires_at, created_at FROM account WHERE id = $1 LIMIT 1',
      [id],
    );
    return result.rows[0] ?? null;
  },
  async create(data: { name: string; email: string; passwordHash: string }): Promise<AccountRow> {
    const result = await db.query<AccountRow>(
      `INSERT INTO account (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, pending_email, email_change_token, email_change_expires_at, password_reset_token, password_reset_expires_at, created_at`,
      [data.name, data.email, data.passwordHash],
    );
    return result.rows[0];
  },
  async setVerificationToken(accountId: string, token: string, expiresAt: Date): Promise<void> {
    await db.query(
      'UPDATE account SET email_verification_token = $1, email_verification_expires_at = $2 WHERE id = $3',
      [token, expiresAt, accountId],
    );
  },
  async findIdByVerificationToken(token: string): Promise<{ id: string; expiresAt: Date | null } | null> {
    const result = await db.query<{ id: string; expires_at: Date | null }>(
      'SELECT id, email_verification_expires_at AS "expires_at" FROM account WHERE email_verification_token = $1 LIMIT 1',
      [token],
    );
    const row = result.rows[0];
    return row ? { id: row.id, expiresAt: row.expires_at } : null;
  },
  async markEmailVerified(accountId: string): Promise<void> {
    await db.query(
      'UPDATE account SET email_verified = true, email_verification_token = NULL, email_verification_expires_at = NULL WHERE id = $1',
      [accountId],
    );
  },
  async updatePassword(accountId: string, passwordHash: string): Promise<void> {
    await db.query('UPDATE account SET password_hash = $1 WHERE id = $2', [passwordHash, accountId]);
  },
  async setPendingEmailChange(accountId: string, pendingEmail: string, token: string, expiresAt: Date): Promise<void> {
    await db.query(
      'UPDATE account SET pending_email = $1, email_change_token = $2, email_change_expires_at = $3 WHERE id = $4',
      [pendingEmail, token, expiresAt, accountId],
    );
  },
  async applyEmailChange(accountId: string, token: string): Promise<{ id: string; newEmail: string } | null> {
    const result = await db.query<{ id: string; newEmail: string }>(
      `UPDATE account SET email = pending_email, email_verified = true,
       pending_email = NULL, email_change_token = NULL, email_change_expires_at = NULL
       WHERE id = $1 AND email_change_token = $2 AND email_change_expires_at > NOW()
       RETURNING id, email AS "newEmail"`,
      [accountId, token],
    );
    return result.rows[0] ?? null;
  },
  async findByEmailChangeToken(token: string): Promise<{ id: string; currentEmail: string; pendingEmail: string; expiresAt: Date | null; name: string } | null> {
    const result = await db.query<{ id: string; currentEmail: string; pendingEmail: string; expiresAt: Date | null; name: string }>(
      'SELECT id, email AS "currentEmail", pending_email AS "pendingEmail", email_change_expires_at AS "expiresAt", name FROM account WHERE email_change_token = $1 LIMIT 1',
      [token],
    );
    return result.rows[0] ?? null;
  },
  async findAccountByEmail(email: string): Promise<AccountRow | null> {
    return this.findByEmail(email);
  },
  async setPasswordResetToken(accountId: string, token: string, expiresAt: Date): Promise<void> {
    await db.query('UPDATE account SET password_reset_token = $2, password_reset_expires_at = $3 WHERE id = $1', [accountId, token, expiresAt]);
  },
  async findIdByEmailAndPasswordResetToken(email: string, token: string): Promise<{ id: string; name: string; email: string } | null> {
    const result = await db.query<{ id: string; name: string; email: string }>('SELECT id, name, email FROM account WHERE email = $1 AND password_reset_token = $2 LIMIT 1', [email, token]);
    return result.rows[0] ?? null;
  },
  async consumePasswordResetToken(token: string, newPasswordHash: string): Promise<{ id: string; name: string; email: string } | null> {
    const result = await db.query<{ id: string; name: string; email: string }>(
      `UPDATE account SET password_hash = $2, password_reset_token = NULL, password_reset_expires_at = NULL
       WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()
       RETURNING id, name, email`,
      [token, newPasswordHash],
    );
    return result.rows[0] ?? null;
  },
};
