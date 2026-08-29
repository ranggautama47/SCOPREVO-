import { Request, Response, NextFunction } from 'express';
import { portalService } from '../services/portal.service';

export const portalController = {
  async getBatchByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const batch = await portalService.getBatchByToken(token);
      res.status(200).json({ batch });
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