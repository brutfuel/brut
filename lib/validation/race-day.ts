import { z } from 'zod';
import {
  COURSE_PROFILES,
  EXPECTED_WEATHERS,
  PACING_STRATEGIES,
} from '@/lib/calculations/race-day-generator';

/**
 * Zod schema for the BRUT RACE DAY setup form. Shared by the client
 * form (RHF resolver) and the server action (boundary check).
 */

export const raceDaySetupSchema = z.object({
  courseProfile: z.enum(COURSE_PROFILES),
  expectedTemperatureC: z
    .number({ error: 'Pick an expected temperature' })
    .int()
    .min(-10)
    .max(45),
  expectedHumidityPct: z
    .number({ error: 'Pick an expected humidity' })
    .int()
    .min(0)
    .max(100),
  expectedWeather: z.enum(EXPECTED_WEATHERS),
  /** Race start time HH:MM (24h). */
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Use HH:MM')
    .min(1, 'Pick a start time'),
  pacingStrategy: z.enum(PACING_STRATEGIES),
  caffeineOk: z.boolean(),
  preferredGels: z.string().max(200).nullable(),
});

export type RaceDaySetupValues = z.infer<typeof raceDaySetupSchema>;
