import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { standardApiLimiter, validateKeyLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authMiddleware);
router.use(standardApiLimiter);

router.post(
  '/validate-key',
  validateKeyLimiter,
  aiController.validateKey,
);

export default router;