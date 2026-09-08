import { db } from '../config/database';
import { AccountRow } from '../types/db.types';
export const accountRepository = {
  async findByEmail(email: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, created_at FROM account WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] ?? null;
  },
  async findById(id: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, created_at FROM account WHERE id = $1 LIMIT 1',
      [id],
    );
    return result.rows[0] ?? null;
  },
  async create(data: { name: string; email: string; passwordHash: string }): Promise<AccountRow> {
    const result = await db.query<AccountRow>(
      `INSERT INTO account (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, created_at`,
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
};
