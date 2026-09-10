import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { standardApiLimiter } from '../middleware/rate-limit.middleware';
const router = Router();
router.get('/', authMiddleware, standardApiLimiter, projectController.getOverview);
export default router;
