'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FieldRow from '@/components/ui/FieldRow';
import Segmented from '@/components/ui/Segmented';
import Slider from '@/components/ui/Slider';
import Toggle from '@/components/ui/Toggle';
import { SESSION_TYPES_BY_SPORT } from '@/lib/calculations/session-structure';
import type {
  CyclingSurface,
  LastMeal,
  RunningSurface,
  SessionInput,
  SessionType,
  SodiumDiet,
  Sport,
  TimeOfDay,
} from '@/lib/calculations/types';

interface Props {
  value: SessionInput;
  onChange: (next: SessionInput) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

const DEFAULT_SESSION_TYPE: Record<Sport, SessionType> = {
  running: 'easy-run',
  cycling: 'endurance',
  triathlon: 'swim',
};

const DEFAULT_SURFACE: Record<Sport, RunningSurface | CyclingSurface | null> = {
  running: 'track-road',
  cycling: 'road',
  triathlon: null,
};

const TIME_OF_DAY_VALUES: ReadonlyArray<TimeOfDay> = [
  'early-morning',
  'morning',
  'afternoon',
  'evening',
  'night',
];

const LAST_MEAL_VALUES: ReadonlyArray<LastMeal> = ['<1h', '1-2h', '2-4h', '>4h'];

const SODIUM_DIET_VALUES: ReadonlyArray<SodiumDiet> = ['low', 'normal', 'high'];

const SPORT_VALUES: ReadonlyArray<Sport> = ['running', 'cycling', 'triathlon'];

export default function SessionForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: Props) {
  const t = useTranslations('brut_train');
  const tForm = useTranslations('brut_train.form');
  const tSurface = useTranslations('brut_train.surface');
  const tTime = useTranslations('brut_train.time_of_day_options');
  const tMeal = useTranslations('brut_train.last_meal_options');
  const tSodium = useTranslations('brut_train.sodium_diet_options');
  const tSports = useTranslations('sports');
  const tSessionTypes = useTranslations('session_types');
  const tUnits = useTranslations('common.units');

  const [advancedOpen, setAdvancedOpen] = useState(false);

  function patch(p: Partial<SessionInput>) {
    onChange({ ...value, ...p });
  }

  function setSport(sport: Sport) {
    onChange({
      ...value,
      sport,
      surface: DEFAULT_SURFACE[sport],
      sessionType: DEFAULT_SESSION_TYPE[sport],
    });
  }

  const SPORTS = SPORT_VALUES.map((v) => ({ value: v, label: tSports(v) }));
  const TIME_OF_DAY = TIME_OF_DAY_VALUES.map((v) => ({ value: v, label: tTime(v) }));
  const LAST_MEAL = LAST_MEAL_VALUES.map((v) => ({ value: v, label: tMeal(v) }));
  const SODIUM_DIET = SODIUM_DIET_VALUES.map((v) => ({
    value: v,
    label: tSodium(v),
  }));

  const surfaceOptions: ReadonlyArray<{
    value: RunningSurface | CyclingSurface;
    label: string;
  }> =
    value.sport === 'running'
      ? [
          { value: 'track-road', label: tSurface('track-road') },
          { value: 'trail', label: tSurface('trail') },
        ]
      : value.sport === 'cycling'
        ? [
            { value: 'road', label: tSurface('road') },
            { value: 'gravel', label: tSurface('gravel') },
            { value: 'mtb', label: tSurface('mtb') },
          ]
        : [];

  const sessionTypes = SESSION_TYPES_BY_SPORT[value.sport].map((st) => ({
    value: st.value,
    label: tSessionTypes(st.value),
  }));

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      {/* 01 — Sport */}
      <FieldRow index="01" total="09" label={tForm('sport')}>
        <div className="flex flex-col gap-4">
          <Segmented options={SPORTS} value={value.sport} onChange={setSport} />
          {surfaceOptions.length > 0 ? (
            <Segmented
              options={surfaceOptions}
              value={
                (value.surface ?? surfaceOptions[0]!.value) as
                  | RunningSurface
                  | CyclingSurface
              }
              onChange={(v) => patch({ surface: v })}
              size="sm"
            />
          ) : null}
        </div>
      </FieldRow>

      {/* 02 — Session type */}
      <FieldRow index="02" total="09" label={tForm('session_type')}>
        <Segmented
          options={sessionTypes}
          value={value.sessionType}
          onChange={(v) => patch({ sessionType: v })}
          size="sm"
          columns={sessionTypes.length > 4 ? 4 : 3}
        />
      </FieldRow>

      {/* 03 — Duration */}
      <FieldRow index="03" total="09" label={tForm('duration')}>
        <Slider
          min={0.5}
          max={8}
          step={0.5}
          value={value.duration}
          onChange={(v) => patch({ duration: v })}
          formatValue={(v) =>
            v === Math.floor(v)
              ? `${v.toFixed(0)} ${tUnits('h')}`
              : `${v.toFixed(1)} ${tUnits('h')}`
          }
          ariaLabel={tForm('duration')}
        />
      </FieldRow>

      {/* 04 — Distance (optional) */}
      <FieldRow index="04" total="09" label={tForm('distance')} optional>
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="—"
            value={value.distance ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              patch({ distance: v === '' ? null : Number(v) });
            }}
            className="brut-number w-32 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
            aria-label={tForm('distance')}
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            {tUnits('km')}
          </span>
        </div>
      </FieldRow>

      {/* 05 — Elevation gain */}
      <FieldRow
        index="05"
        total="09"
        label={tForm('elevation_gain')}
        optional
      >
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={10}
            value={value.elevation}
            onChange={(e) => patch({ elevation: Number(e.target.value) || 0 })}
            className="brut-number w-32 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
            aria-label={tForm('elevation_gain')}
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            {tUnits('m')}
          </span>
        </div>
      </FieldRow>

      {/* 06 — Ambient temperature */}
      <FieldRow index="06" total="09" label={tForm('ambient_temperature')}>
        <Slider
          min={-5}
          max={45}
          step={1}
          value={value.temperature}
          onChange={(v) => patch({ temperature: v })}
          formatValue={(v) => `${v}°C`}
          ariaLabel={tForm('ambient_temperature')}
        />
      </FieldRow>

      {/* 07 — Time of day */}
      <FieldRow index="07" total="09" label={tForm('time_of_day')}>
        <Segmented
          options={TIME_OF_DAY}
          value={value.timeOfDay}
          onChange={(v) => patch({ timeOfDay: v })}
          size="sm"
          columns={5}
        />
      </FieldRow>

      {/* 08 — Last meal */}
      <FieldRow index="08" total="09" label={tForm('last_meal')}>
        <Segmented
          options={LAST_MEAL}
          value={value.lastMeal}
          onChange={(v) => patch({ lastMeal: v })}
          columns={4}
        />
      </FieldRow>

      {/* 09 — Body weight */}
      <FieldRow index="09" total="09" label={tForm('body_weight')}>
        <Slider
          min={40}
          max={120}
          step={1}
          value={value.weight}
          onChange={(v) => patch({ weight: v })}
          formatValue={(v) => `${v} ${tUnits('kg')}`}
          ariaLabel={tForm('body_weight')}
        />
      </FieldRow>

      {/* Advanced parameters */}
      <section className="border-t border-brut-line py-6">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between text-xs font-semibold tracking-brut-wide uppercase text-brut-ink hover:text-brut-black transition-colors"
          aria-expanded={advancedOpen}
        >
          <span>{tForm('advanced_parameters')}</span>
          <span className="text-brut-muted">{advancedOpen ? '−' : '+'}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-8 flex flex-col gap-10">
            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tForm('relative_humidity')}
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                step={1}
                value={value.humidity}
                onChange={(v) => patch({ humidity: v })}
                formatValue={(v) => `${v}%`}
                ariaLabel={tForm('relative_humidity')}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tForm('heat_acclimated')}
                </span>
              </div>
              <Toggle
                value={value.heatAcclimated}
                onChange={(v) => patch({ heatAcclimated: v })}
                ariaLabel={tForm('heat_acclimated')}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tForm('habitual_sodium_diet')}
                </span>
              </div>
              <Segmented
                options={SODIUM_DIET}
                value={value.sodiumDiet}
                onChange={(v) => patch({ sodiumDiet: v })}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tForm('known_sweat_rate')}
                  <span className="ml-2 text-brut-muted normal-case font-normal tracking-normal">
                    {tForm('optional_override')}
                  </span>
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <input
                  type="number"
                  min={0.2}
                  max={4}
                  step={0.05}
                  placeholder="—"
                  value={value.knownSweatRate ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    patch({ knownSweatRate: v === '' ? null : Number(v) });
                  }}
                  className="brut-number w-32 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
                  aria-label={tForm('known_sweat_rate')}
                />
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tUnits('L_per_h')}
                </span>
              </div>
              <p className="mt-2 text-xs font-normal text-brut-muted">
                {tForm('known_sweat_rate_hint')}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <div className="border-t border-brut-line pt-8 mt-2">
        <button
          type="submit"
          disabled={submitDisabled}
          className="block w-full text-center py-5 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitLabel ?? t('submit_calculate')}
        </button>
      </div>
    </form>
  );
}
