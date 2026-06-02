import { z } from 'zod';

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email address')
    .email('Enter a valid email address'),
});
export type RequestPasswordResetValues = z.infer<
  typeof requestPasswordResetSchema
>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email address')
    .email('Enter a valid email address'),
});
export type ResendVerificationValues = z.infer<typeof resendVerificationSchema>;

export const deleteAccountSchema = z.object({
  confirmed: z.literal(true, {
    error: 'Confirm that this is permanent.',
  }),
  typedConfirmation: z.literal('DELETE', {
    error: 'Type DELETE to confirm.',
  }),
});
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
