import { Request, Response, NextFunction } from 'express';
import { revisionService } from '../services/revision.service';
import { CreateRevisionInput, ResolveItemScopeInput } from '../validators/revision.schema';
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

export const revisionController = {
  async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { projectId } = req.params;
      const { rawInput } = req.body as CreateRevisionInput;
      const byok = getByokOptions(req);

      const batch = await revisionService.createBatch(projectId, accountId, rawInput, byok);
      res.status(201).json({ batch });
    } catch (err) {
      next(err);
    }
  },

  async shareBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id } = req.params;

      const batch = await revisionService.shareBatch(id, accountId);
      res.status(200).json({ batch });
    } catch (err) {
      next(err);
    }
  },

  async getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id } = req.params;

      const batch = await revisionService.getBatchDetail(id, accountId);
      res.status(200).json({ batch });
    } catch (err) {
      next(err);
    }
  },

  async resolveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { id, itemId } = req.params;
      const { scopeStatus, reason } = req.body as ResolveItemScopeInput;

      const result = await revisionService.resolveItemScope(id, itemId, accountId, scopeStatus, reason);
      res.status(200).json({ item: result.item });
    } catch (err) {
      next(err);
    }
  },

  async listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { projectId } = req.params;

      const batches = await revisionService.listBatchesByProjectId(projectId, accountId);
      res.status(200).json({ batches });
    } catch (err) {
      next(err);
    }
  },
};
