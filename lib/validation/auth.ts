import { z } from 'zod';

/**
 * Shared Zod schemas for the auth flows. Used both for client-side
 * validation (React Hook Form resolver) and as the server-side boundary
 * check inside the Server Actions.
 */

export const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Enter your email address').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const PRIMARY_SPORTS = ['running', 'cycling', 'triathlon'] as const;
export type PrimarySport = (typeof PRIMARY_SPORTS)[number];

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type Gender = (typeof GENDERS)[number];

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(80, 'Name is too long'),
  age: z
    .number({ error: 'Enter your age' })
    .int()
    .min(14, 'Age must be at least 14')
    .max(90, 'Age must be 90 or below'),
  gender: z.enum(GENDERS),
  primarySport: z.enum(PRIMARY_SPORTS),
  weightKg: z
    .number({ error: 'Enter your body weight' })
    .min(30, 'Weight must be at least 30 kg')
    .max(200, 'Weight must be below 200 kg'),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
