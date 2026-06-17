import { z } from 'zod';

/**
 * Shared Zod schemas for the auth flows. Used both for client-side
 * validation (React Hook Form resolver) and as the server-side boundary
 * check inside the Server Actions.
 *
 * Messages are stable error codes that map 1:1 onto keys under
 * `common.validation.*` in the locale files. Forms translate via
 * `useTranslations('common.validation')`; server actions via
 * `getTranslations('common.validation')`.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
  password: z.string().min(1, 'password_required'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'email_required')
      .email('email_invalid'),
    password: z.string().min(8, 'password_too_short'),
    confirmPassword: z.string().min(1, 'confirm_password_required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords_no_match',
    path: ['confirmPassword'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const PRIMARY_SPORTS = ['running', 'cycling', 'triathlon'] as const;
export type PrimarySport = (typeof PRIMARY_SPORTS)[number];

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDERS)[number];

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, 'name_required').max(80, 'name_too_long'),
  age: z
    .number({ error: 'age_required' })
    .int()
    .min(14, 'age_too_low')
    .max(90, 'age_too_high'),
  gender: z.enum(GENDERS),
  primarySport: z.enum(PRIMARY_SPORTS),
  weightKg: z
    .number({ error: 'weight_required' })
    .min(30, 'weight_too_low')
    .max(200, 'weight_too_high'),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
