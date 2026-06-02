import { z } from 'zod';

/**
 * Zod schemas for the per-session Server Actions on a race plan
 * (mark as done, skip, reschedule) and the plan-level postpone action.
 */

export const SESSION_FELT_VALUES = ['easy', 'right', 'hard'] as const;
export type SessionFeltValue = (typeof SESSION_FELT_VALUES)[number];

export const markSessionDoneSchema = z.object({
  felt: z.enum(SESSION_FELT_VALUES),
  notes: z.string().max(2000).nullable(),
  capsulesTaken: z.number().int().min(0).max(99).nullable(),
});
export type MarkSessionDoneValues = z.infer<typeof markSessionDoneSchema>;

export const skipSessionSchema = z.object({
  reason: z.string().max(2000).nullable(),
});
export type SkipSessionValues = z.infer<typeof skipSessionSchema>;

export const rescheduleSessionSchema = z.object({
  newDate: z.string().min(1, 'Pick a new date'),
  newDayOfWeek: z.number().int().min(1).max(7),
});
export type RescheduleSessionValues = z.infer<typeof rescheduleSessionSchema>;

export const postponeRaceSchema = z.object({
  newRaceDate: z.string().min(1, 'Pick a new race date'),
  regenerate: z.boolean(),
});
export type PostponeRaceValues = z.infer<typeof postponeRaceSchema>;
