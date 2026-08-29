import { Router } from 'express';
import { portalController } from '../controllers/portal.controller';

const router = Router();

// No auth middleware - these are public endpoints

router.get(
  '/:token',
  portalController.getBatchByToken,
);

router.post(
  '/:token/confirm',
  portalController.confirmByToken,
);

export default router;