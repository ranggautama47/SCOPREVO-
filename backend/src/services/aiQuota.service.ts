import { db } from '../config/database';
import { env } from '../config/env';
import { ConflictError } from '../middleware/error.middleware';

export interface AIQuotaResult {
  used: number;
  limit: number;
  period: string;
  remaining: number;
  resetAt: string;
}

export interface AIConsumeResult {
  used: number;
}

export const aiQuotaService = {
  getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  async consume(accountId: string): Promise<AIConsumeResult> {
    const period = this.getCurrentPeriod();
    const limit = env.SERVER_AI_MONTHLY_LIMIT;

    const result = await db.query<{ used_count: number }>(
      `INSERT INTO account_ai_usage (account_id, period, used_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (account_id, period) DO UPDATE
         SET used_count = account_ai_usage.used_count + 1, updated_at = now()
         WHERE account_ai_usage.used_count < $3
       RETURNING used_count`,
      [accountId, period, limit]
    );

    if (result.rows.length === 0) {
      const quota = await this.get(accountId);
      throw new ConflictError(
        'AI_QUOTA_EXHAUSTED',
        'Monthly AI quota exhausted.',
        {
          used: quota.used,
          limit: quota.limit,
          period: quota.period,
          resetAt: quota.resetAt,
        }
      );
    }

    return { used: result.rows[0].used_count };
  },

  async get(accountId: string): Promise<AIQuotaResult> {
    const period = this.getCurrentPeriod();
    const limit = env.SERVER_AI_MONTHLY_LIMIT;

    const result = await db.query<{ used_count: number; updated_at: Date }>(
      `SELECT used_count, updated_at FROM account_ai_usage WHERE account_id = $1 AND period = $2`,
      [accountId, period]
    );

    const used = result.rows.length > 0 ? result.rows[0].used_count : 0;
    const remaining = Math.max(0, limit - used);

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    const resetAt = nextMonth.toISOString();

    return {
      used,
      limit,
      period,
      remaining,
      resetAt,
    };
  },
};