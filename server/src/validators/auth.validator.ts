import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .max(128, 'Password must not exceed 128 characters');

export const emailSchema = z
  .string()
  .trim()
  .pipe(z.string().email('Invalid email address'))
  .transform((val) => val.toLowerCase());

export const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Email or username is required')
  .transform((val) => val.toLowerCase());

export const loginSchema = z.object({
  email: loginIdentifierSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, 'Invalid reset token'),
  password: passwordSchema,
});

export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'ORGANIZER', 'COACH', 'ATHLETE', 'SCORER']),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(16, 'Invalid invitation token'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: passwordSchema,
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
