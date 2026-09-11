import { z } from 'zod';
export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required.' }).min(1).max(100),
  email: z.string({ required_error: 'Email is required.' }).email(),
  password: z.string({ required_error: 'Password is required.' }).min(8),
});
export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required.' }).email(),
  password: z.string({ required_error: 'Password is required.' }),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required.' }),
  newPassword: z.string({ required_error: 'New password is required.' }).min(8),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export const requestEmailChangeSchema = z.object({
  newEmail: z.string({ required_error: 'New email is required.' }).email(),
  currentPassword: z.string({ required_error: 'Current password is required.' }),
});
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>;
export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required.' }).email('Invalid email format.'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Token is required.' }).uuid('Invalid token format.'),
  newPassword: z.string({ required_error: 'New password is required.' }).min(8, 'Password must be at least 8 characters.').max(72, 'Password must be at most 72 characters.'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
