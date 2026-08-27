import { Request, Response, NextFunction } from 'express';
import { revisionService } from '../services/revision.service';
import { CreateRevisionInput } from '../validators/revision.schema';
import { UnauthorizedError } from '../middleware/error.middleware';

function requireAccountId(req: Request): string {
  if (!req.accountId) throw new UnauthorizedError();
  return req.accountId;
}

export const revisionController = {
  async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = requireAccountId(req);
      const { projectId } = req.params;
      const { rawInput } = req.body as CreateRevisionInput;

      const batch = await revisionService.createBatch(projectId, accountId, rawInput);
      res.status(201).json({ batch });
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
