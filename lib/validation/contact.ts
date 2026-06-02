import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z
    .string()
    .min(1, 'Enter your email')
    .email('Enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(10, 'Add a few more words so we can help')
    .max(4000, 'Message is too long'),
});
export type ContactMessageValues = z.infer<typeof contactMessageSchema>;

export const feedbackMessageSchema = z.object({
  email: z
    .string()
    .min(1, 'Enter your email')
    .email('Enter a valid email address'),
  message: z
    .string()
    .trim()
    .min(5, 'Tell us a little more')
    .max(4000, 'Message is too long'),
  url: z.string().max(500).optional(),
});
export type FeedbackMessageValues = z.infer<typeof feedbackMessageSchema>;
