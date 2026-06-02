import Link from 'next/link';
import { daysFromTodayToIso } from '@/lib/utils/dates';
import type { RacePlan } from '@/lib/types/db';

interface Props {
  plan: Pick<
    RacePlan,
    'id' | 'sport' | 'distance_km' | 'race_date' | 'race_name'
  >;
  raceDayPlanExists: boolean;
}

const SPORT_LABELS: Record<RacePlan['sport'], string> = {
  running: 'Running',
  cycling: 'Cycling',
  triathlon: 'Triathlon',
};

/**
 * Big "X days to go" hero. Becomes visually more prominent when the
 * race is imminent (<7 days) and a celebration on race day itself.
 */
export default function CountdownBanner({ plan, raceDayPlanExists }: Props) {
  const days = daysFromTodayToIso(plan.race_date);
  const title =
    plan.race_name ?? `${SPORT_LABELS[plan.sport]} · ${plan.distance_km} km`;

  const today = days === 0;
  const imminent = days >= 0 && days <= 6;
  const raceDayUnlocked = days >= 0 && days <= 14;
  const raceDayHref = raceDayPlanExists
    ? `/brut-race/${plan.id}/race-day`
    : `/brut-race/${plan.id}/race-day/setup`;

  const containerBorder = imminent ? 'border-2 border-brut-black' : 'border border-brut-line';
  const containerBg = imminent ? 'bg-brut-bg-soft' : 'bg-white';
  const titleSize = imminent
    ? 'text-[48px] md:text-[72px]'
    : 'text-[36px] md:text-[52px]';
  const countdownSize = imminent
    ? 'text-[96px] md:text-[140px]'
    : 'text-[72px] md:text-[112px]';

  return (
    <section
      className={`${containerBorder} ${containerBg} p-8 md:p-10 flex flex-col gap-4`}
    >
      <span className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
        Active race plan
      </span>
      <h2
        className={`${titleSize} leading-[0.98] font-thin tracking-brut text-brut-black uppercase`}
      >
        {title}
      </h2>

      <p
        className={`${countdownSize} leading-none font-thin tracking-brut text-brut-black tabular-nums`}
      >
        {today ? 'TODAY' : days > 0 ? days : '—'}
      </p>
      <p className="text-xs font-semibold tracking-brut-wide uppercase text-brut-ink">
        {today
          ? 'Today is the day'
          : days > 1
            ? 'days to go'
            : days === 1
              ? 'day to go'
              : 'race day passed'}
      </p>
      <p className="text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
        {plan.race_date}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href={`/brut-race/${plan.id}`}
          className="inline-flex items-center justify-center px-5 py-3 bg-brut-black text-white text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors"
        >
          Open my plan &rarr;
        </Link>
        {raceDayUnlocked ? (
          <Link
            href={raceDayHref}
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-black text-brut-black text-[10px] font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors"
          >
            {today ? 'Open race day plan' : 'Race day plan'} &rarr;
          </Link>
        ) : (
          <span
            className="inline-flex items-center justify-center px-5 py-3 border border-brut-line text-brut-muted text-[10px] font-semibold tracking-brut-wide uppercase cursor-not-allowed"
            title="Unlocks 14 days before race"
            aria-disabled="true"
          >
            Race day plan &rarr;
          </span>
        )}
      </div>
    </section>
  );
}
