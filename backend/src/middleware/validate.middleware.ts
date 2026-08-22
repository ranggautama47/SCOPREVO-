import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware';
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formatted: Record<string, string> = {};
      for (const issue of result.error.issues) {
        formatted[issue.path.join('.') || '_root'] = issue.message;
      }
      return next(new ValidationError('Validation failed.', formatted));
    }
    req.body = result.data;
    return next();
  };
}
