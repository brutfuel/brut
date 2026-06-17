import { z } from 'zod';

/**
 * Stable error codes — keys under `common.validation.*` in the locale
 * files. Forms and Server Actions translate at the boundary.
 */

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
});
export type RequestPasswordResetValues = z.infer<
  typeof requestPasswordResetSchema
>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'password_too_short'),
    confirmPassword: z.string().min(1, 'confirm_password_required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'passwords_no_match',
    path: ['confirmPassword'],
  });
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
});
export type ResendVerificationValues = z.infer<typeof resendVerificationSchema>;

export const deleteAccountSchema = z.object({
  confirmed: z.literal(true, { error: 'delete_confirm_required' }),
  typedConfirmation: z.literal('DELETE', { error: 'delete_type_required' }),
});
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
