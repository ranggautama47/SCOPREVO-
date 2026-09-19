import { Request, Response, NextFunction } from 'express';
import { aiQuotaService } from '../services/aiQuota.service';
import { UnauthorizedError } from '../middleware/error.middleware';

function requireAccountId(req: Request): string {
  if (!req.accountId) throw new UnauthorizedError();
  return req.accountId;
}

export const aiQuotaController = {
  async getQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const quota = await aiQuotaService.get(accountId);
      res.status(200).json(quota);
    } catch (err) {
      next(err);
    }
  },
};