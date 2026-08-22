import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
router.get('/', authMiddleware, projectController.getOverview);
export default router;
