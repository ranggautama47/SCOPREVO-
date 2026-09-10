import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.schema';
import {
  authLoginLimiter,
  authRegisterLimiter,
  authVerificationEmailLimiter,
} from '../middleware/rate-limit.middleware';

const router = Router();
router.post('/register', authRegisterLimiter, validate(registerSchema), authController.register);
router.post('/login', authLoginLimiter, validate(loginSchema), authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.use(authMiddleware);
router.get('/me', authController.me);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);
router.post('/verification-email', authVerificationEmailLimiter, authController.requestVerificationEmail);
export default router;
