import { db } from '../config/database';
import { AccountRow } from '../types/db.types';
export const accountRepository = {
  async findByEmail(email: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, created_at FROM account WHERE email = $1 LIMIT 1',
      [email],
    );
    return result.rows[0] ?? null;
  },
  async findById(id: string): Promise<AccountRow | null> {
    const result = await db.query<AccountRow>(
      'SELECT id, name, email, password_hash, created_at FROM account WHERE id = $1 LIMIT 1',
      [id],
    );
    return result.rows[0] ?? null;
  },
  async create(data: { name: string; email: string; passwordHash: string }): Promise<AccountRow> {
    const result = await db.query<AccountRow>(
      `INSERT INTO account (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, password_hash, created_at`,
      [data.name, data.email, data.passwordHash],
    );
    return result.rows[0];
  },
};
