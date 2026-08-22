import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from './error.middleware';
interface JwtPayload { accountId: string; }
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication required.'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!payload.accountId || typeof payload.accountId !== 'string') {
      return next(new UnauthorizedError('Invalid token payload.'));
    }
    req.accountId = payload.accountId;
    return next();
  } catch {
    return next(new UnauthorizedError('Token is invalid or expired.'));
  }
}
