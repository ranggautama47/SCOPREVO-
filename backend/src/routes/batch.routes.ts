import { Router } from 'express';
import { revisionController } from '../controllers/revision.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { standardApiLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authMiddleware);
router.use(standardApiLimiter);

router.get(
  '/:id',
  revisionController.getBatch,
);

router.patch(
  '/:id/share',
  revisionController.shareBatch,
);

export default router;