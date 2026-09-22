import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { UnauthorizedError } from '../middleware/error.middleware';

function requireAccountId(req: Request): string {
  if (!req.accountId) throw new UnauthorizedError();
  return req.accountId;
}

function getByokOptions(req: Request): { provider: 'openrouter' | 'google'; apiKey: string } | undefined {
  const provider = req.headers['x-scoprevo-llm-provider'] as string | undefined;
  const apiKey = req.headers['x-scoprevo-llm-key'] as string | undefined;

  if (provider && apiKey && (provider === 'openrouter' || provider === 'google')) {
    if (apiKey.length > 512) {
      return undefined;
    }
    return { provider, apiKey };
  }
  return undefined;
}

export const aiController = {
  async validateKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      requireAccountId(req);
      const byok = getByokOptions(req);

      if (!byok) {
        res.status(400).json({ valid: false, error: 'Missing x-scoprevo-llm-provider or x-scoprevo-llm-key header.' });
        return;
      }

      const result = await aiService.validateByokKey(byok.provider, byok.apiKey);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};