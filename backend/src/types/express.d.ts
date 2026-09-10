export {};

import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      accountId?: string;
    }
  }
}
