import { Router } from 'express';
import { aiQuotaController } from '../controllers/aiQuota.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { standardApiLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authMiddleware);
router.use(standardApiLimiter);

router.get(
  '/quota',
  aiQuotaController.getQuota,
);

export default router;