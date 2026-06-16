import { z } from 'zod';

/**
 * Zod messages are stable codes that map 1:1 to keys under
 * `common.validation.*` in the locale files. The UI translates the
 * code via `useTranslations('common.validation')` so each form stays
 * language-agnostic.
 */

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, 'name_required').max(80, 'name_too_long'),
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
  message: z
    .string()
    .trim()
    .min(10, 'message_min')
    .max(4000, 'message_too_long'),
});
export type ContactMessageValues = z.infer<typeof contactMessageSchema>;

export const feedbackMessageSchema = z.object({
  email: z
    .string()
    .min(1, 'email_required')
    .email('email_invalid'),
  message: z
    .string()
    .trim()
    .min(5, 'feedback_min')
    .max(4000, 'message_too_long'),
  url: z.string().max(500).optional(),
});
export type FeedbackMessageValues = z.infer<typeof feedbackMessageSchema>;
