import { Router } from 'express';
import { revisionController } from '../controllers/revision.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRevisionSchema } from '../validators/revision.schema';
import { aiRevisionsLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

router.use(authMiddleware);

// POST /api/projects/:projectId/revisions & POST /api/projects/:projectId/batches
router.post(
  '/:projectId/revisions',
  aiRevisionsLimiter,
  validate(createRevisionSchema),
  revisionController.createBatch,
);

router.post(
  '/:projectId/batches',
  aiRevisionsLimiter,
  validate(createRevisionSchema),
  revisionController.createBatch,
);

router.get(
  '/:projectId/batches',
  revisionController.listBatches,
);

export default router;
