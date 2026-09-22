import { Request, Response, NextFunction } from 'express';
import { portalService } from '../services/portal.service';

export const portalController = {
  async getBatchByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const batch = await portalService.getBatchByToken(token);
      res.status(200).json({
        batch: {
          id: batch.batch.id,
          projectId: batch.batch.projectId,
          status: batch.batch.status,
          summary: batch.batch.summary,
          createdAt: batch.batch.createdAt,
          items: batch.batch.items,
          project: batch.batch.project,
        },
        unresolvedCount: batch.unresolvedCount,
        hiddenItemsCount: batch.hiddenItemsCount,
        scopeReviewPending: batch.scopeReviewPending,
      });
    } catch (err) {
      next(err);
    }
  },

  async confirmByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const batch = await portalService.confirmByToken(token);
      res.status(200).json({ batch });
    } catch (err) {
      next(err);
    }
  },
};
