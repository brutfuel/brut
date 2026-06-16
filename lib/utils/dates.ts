// Small date helpers shared across BRUT RACE views.
//
// Weekdays follow the database convention: 1 = Monday … 7 = Sunday.

import { BCP47, type AppLocale } from '@/lib/i18n/routing';

export const WEEKDAY_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Convert JS getDay() (0 = Sun) to the 1 = Mon … 7 = Sun convention. */
export function dayOfWeekFromIso(iso: string): number {
  const js = new Date(`${iso}T00:00:00`).getDay();
  return js === 0 ? 7 : js;
}

/** Monday/Sunday ISO of the week containing the given iso date. */
export function weekBoundsFromIso(iso: string): {
  monday: string;
  sunday: string;
} {
  const d = new Date(`${iso}T00:00:00`);
  const dow = dayOfWeekFromIso(iso);
  const mon = new Date(d);
  mon.setDate(d.getDate() - (dow - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { monday: toIsoDate(mon), sunday: toIsoDate(sun) };
}

export function toIsoDate(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** "SATURDAY 15 FEB" / "DISSABTE 15 FEB" / "SÁBADO 15 FEB" style date. */
export function formatLongDate(
  iso: string | null,
  locale: AppLocale = 'en',
): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d
    .toLocaleDateString(BCP47[locale], {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    })
    .toUpperCase();
}

/** Full weekday name in the active locale ("Saturday" / "Dissabte" / "Sábado"). */
export function weekdayLong(iso: string, locale: AppLocale = 'en'): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(BCP47[locale], {
    weekday: 'long',
  });
}

/** Whole days from today (00:00) to the given ISO date. May be negative. */
export function daysFromTodayToIso(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
