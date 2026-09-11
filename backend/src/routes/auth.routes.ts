import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, changePasswordSchema, requestEmailChangeSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.schema';
import {
  authLoginLimiter,
  authRegisterLimiter,
  authVerificationEmailLimiter,
  authEmailChangeLimiter,
  authForgotPasswordLimiter,
  authResetPasswordLimiter,
} from '../middleware/rate-limit.middleware';

const router = Router();
router.post('/register', authRegisterLimiter, validate(registerSchema), authController.register);
router.post('/login', authLoginLimiter, validate(loginSchema), authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.get('/verify-email-change/:token', authController.verifyEmailChange);
router.post('/forgot-password', authForgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authResetPasswordLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.use(authMiddleware);
router.get('/me', authController.me);
router.post('/change-password', validate(changePasswordSchema), authController.changePassword);
router.post('/verification-email', authVerificationEmailLimiter, authController.requestVerificationEmail);
router.post('/email-change/request', authEmailChangeLimiter, validate(requestEmailChangeSchema), authController.requestEmailChange);
export default router;
