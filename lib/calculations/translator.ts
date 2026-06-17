// Shared translator signature for the calculation generators. Lets a
// caller pass either useTranslations('calc') (client) or
// await getTranslations('calc') (server) without coupling the pure
// generators to next-intl directly.
//
// All keys are scoped under the `calc.*` namespace in the locale files.

export type CalcTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

// English-only fallback used when callers do not provide a translator.
// Looks up the same `calc.*` keys against `locales/en.json` so we don't
// duplicate the copy here.
import en from '@/locales/en.json';

type Dict = Record<string, unknown>;

function get(obj: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc == null) return undefined;
    return (acc as Dict)[part];
  }, obj);
}

function format(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : `{${key}}`,
  );
}

/**
 * English-only translator. Used as a default when callers don't pass
 * one in — keeps the generators backwards-compatible.
 */
export const englishCalc: CalcTranslator = (key, values) => {
  const raw = get(en.calc as Dict, key);
  if (typeof raw !== 'string') return key;
  return format(raw, values);
};
