import { Router } from 'express';
import { revisionController } from '../controllers/revision.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { standardApiLimiter } from '../middleware/rate-limit.middleware';
import { validate } from '../middleware/validate.middleware';
import { resolveItemScopeSchema } from '../validators/revision.schema';

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

router.patch(
  '/:id/items/:itemId/scope',
  validate(resolveItemScopeSchema),
  revisionController.resolveItem,
);

export default router;