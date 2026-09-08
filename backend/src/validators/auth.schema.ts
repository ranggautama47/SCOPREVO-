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
