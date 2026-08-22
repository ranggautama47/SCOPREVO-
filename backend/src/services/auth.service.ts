import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { accountRepository } from '../repositories/account.repository';
import { env } from '../config/env';
import { ConflictError, UnauthorizedError } from '../middleware/error.middleware';
const SALT_ROUNDS = 12;
export interface AuthResult {
  token: string;
  account: { id: string; name: string; email: string; createdAt: Date };
}
export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const existing = await accountRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const row = await accountRepository.create({ name, email, passwordHash });
    const token = issueToken(row.id);
    return { token, account: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at } };
  },
  async login(email: string, password: string): Promise<AuthResult> {
    const row = await accountRepository.findByEmail(email);
    const invalid = new UnauthorizedError('Invalid email or password.');
    if (!row) throw invalid;
    const passwordMatch = await bcrypt.compare(password, row.password_hash);
    if (!passwordMatch) throw invalid;
    const token = issueToken(row.id);
    return { token, account: { id: row.id, name: row.name, email: row.email, createdAt: row.created_at } };
  },
};
function issueToken(accountId: string): string {
  return jwt.sign({ accountId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}
