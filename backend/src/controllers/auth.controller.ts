import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { getClientMeta } from "../utils/client-info";
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  RequestEmailChangeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validators/auth.schema";
export const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(
        input.name,
        input.email,
        input.password,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { const input = req.body as ForgotPasswordInput; res.status(200).json(await authService.requestPasswordReset(input.email)); } catch (err) { next(err); }
  },
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { const input = req.body as ResetPasswordInput; res.status(200).json(await authService.resetPassword(input.token, input.newPassword)); } catch (err) { next(err); }
  },
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input.email, input.password);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const accountId = req.accountId!;
      const input = req.body as ChangePasswordInput;
      const meta = getClientMeta(req); 
      await authService.changePassword(
        accountId,
        input.currentPassword,
        input.newPassword,
      );
      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
  async requestVerificationEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const accountId = req.accountId!;
      const result = await authService.requestEmailVerification(accountId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  async verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token);
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = req.accountId!;
      const result = await authService.me(accountId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  async requestEmailChange(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = req.body as RequestEmailChangeInput;
      const result = await authService.requestEmailChange(
        req.accountId!,
        input.newEmail,
        input.currentPassword,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
  async verifyEmailChange(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.verifyEmailChange(req.params.token);
      res.status(200).json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
