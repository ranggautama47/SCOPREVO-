import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { RegisterInput, LoginInput } from '../validators/auth.schema';
export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(input.name, input.email, input.password);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input.email, input.password);
      res.status(200).json(result);
    } catch (err) { next(err); }
  },
};
