import { Router } from 'express';
import { revisionController } from '../controllers/revision.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get(
  '/:id',
  revisionController.getBatch,
);

export default router;