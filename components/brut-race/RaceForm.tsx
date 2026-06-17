'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import FieldRow from '@/components/ui/FieldRow';
import Segmented from '@/components/ui/Segmented';
import { createRacePlan } from '@/app/[locale]/brut-race/actions';
import {
  DISTANCE_PRESETS,
  EXPERIENCE_LEVELS,
  PREFERRED_TIME_VALUES,
  RACE_SPORTS,
  SURFACES_BY_SPORT,
  WEEKDAY_VALUES,
  raceFormSchema,
  type ExperienceLevel,
  type RaceFormValues,
  type RaceSport,
} from '@/lib/validation/race';
import type {
  CyclingSurface,
  RunningSurface,
  TimeOfDay,
} from '@/lib/calculations/types';

interface Props {
  /** Whether a user session exists — decides the Generate behaviour. */
  isAuthed: boolean;
}

const TOTAL_ROWS = '12';

const numberInput =
  'brut-number w-32 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums';

const fieldError = 'mt-3 text-xs font-medium text-brut-ink';
const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

/** ISO date (yyyy-mm-dd) for today — used as the date input minimum. */
function todayIso(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function nullableNumber(v: unknown): number | null {
  return v === '' || v == null ? null : Number(v);
}

export default function RaceForm({ isAuthed }: Props) {
  const router = useRouter();
  const tForm = useTranslations('brut_race.form');
  const tStrava = useTranslations('brut_race.strava');
  const tSubmit = useTranslations('brut_race.submit');
  const tExp = useTranslations('brut_race.experience');
  const tWk = useTranslations('brut_race.weekday_short');
  const tSurface = useTranslations('brut_race.surface');
  const tSports = useTranslations('sports');
  const tTime = useTranslations('brut_train.time_of_day_options');
  const tUnits = useTranslations('common.units');
  const tV = useTranslations('common.validation');

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RaceFormValues>({
    resolver: zodResolver(raceFormSchema),
    defaultValues: {
      sport: 'running',
      surface: 'track-road',
      elevationGainM: null,
      objectiveHours: null,
      objectiveMinutes: null,
      raceDate: '',
      trainingDays: [2, 4, 6],
      preferredTime: 'morning',
      experienceLevel: 'amateur',
      hrMax: null,
      ftp: null,
    },
  });

  const sport = watch('sport');
  const surface = watch('surface');
  const distanceKm = watch('distanceKm');
  const trainingDays = watch('trainingDays');
  const preferredTime = watch('preferredTime');
  const experienceLevel = watch('experienceLevel');

  function changeSport(next: RaceSport) {
    setValue('sport', next, { shouldValidate: true });
    const defaultSurface =
      next === 'running' ? 'track-road' : next === 'cycling' ? 'road' : null;
    setValue('surface', defaultSurface, { shouldValidate: true });
  }

  function toggleDay(day: number) {
    const current = trainingDays ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    setValue('trainingDays', next, { shouldValidate: true });
  }

  async function onSubmit(values: RaceFormValues) {
    setFormError(null);
    if (!isAuthed) {
      router.push('/login?redirect=/brut-race');
      return;
    }
    const result = await createRacePlan(values);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  const SPORT_OPTIONS = RACE_SPORTS.map((v) => ({ value: v, label: tSports(v) }));
  const EXPERIENCE_OPTIONS = EXPERIENCE_LEVELS.map((value) => ({
    value,
    label: tExp(value),
  }));
  const PREFERRED_TIMES = PREFERRED_TIME_VALUES.map((v) => ({
    value: v,
    label: tTime(v),
  }));

  const surfaceOptions = SURFACES_BY_SPORT[sport].map((v) => ({
    value: v,
    label: tSurface(v),
  }));

  /** Translate a Zod error code; fall back to the raw message when missing. */
  function err(code: string | undefined): string | null {
    if (!code) return null;
    try {
      return tV(code);
    } catch {
      return code;
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
      {/* 01 — Sport */}
      <FieldRow index="01" total={TOTAL_ROWS} label={tForm('sport')}>
        <Segmented
          options={SPORT_OPTIONS}
          value={sport}
          onChange={changeSport}
          ariaLabel={tForm('sport')}
        />
      </FieldRow>

      {/* 02 — Distance */}
      <FieldRow index="02" total={TOTAL_ROWS} label={tForm('distance')}>
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="—"
              aria-label={tForm('distance')}
              className={numberInput}
              {...register('distanceKm', { valueAsNumber: true })}
            />
            <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
              {tUnits('km')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_PRESETS[sport].map((preset) => {
              const active = distanceKm === preset.km;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setValue('distanceKm', preset.km, { shouldValidate: true })
                  }
                  aria-pressed={active}
                  className={`px-3 py-2 text-[10px] font-semibold tracking-brut-wide uppercase border transition-colors ${
                    active
                      ? 'bg-brut-black text-white border-brut-black'
                      : 'bg-white text-brut-ink border-brut-line hover:bg-brut-bg-soft'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          {errors.distanceKm ? (
            <p className={fieldError}>{err(errors.distanceKm.message)}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 03 — Terrain */}
      <FieldRow index="03" total={TOTAL_ROWS} label={tForm('terrain')}>
        {sport === 'triathlon' ? (
          <p className="text-sm font-normal text-brut-muted">
            {tForm('terrain_na')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <Segmented
              options={surfaceOptions as ReadonlyArray<{
                value: RunningSurface | CyclingSurface;
                label: string;
              }>}
              value={(surface ?? surfaceOptions[0]!.value) as
                | RunningSurface
                | CyclingSurface}
              onChange={(v) => setValue('surface', v, { shouldValidate: true })}
              ariaLabel={tForm('terrain')}
            />
            {errors.surface ? (
              <p className={fieldError}>{err(errors.surface.message)}</p>
            ) : null}
          </div>
        )}
      </FieldRow>

      {/* 04 — Elevation gain */}
      <FieldRow
        index="04"
        total={TOTAL_ROWS}
        label={tForm('race_elevation_gain')}
        optional
      >
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={50}
            placeholder="—"
            aria-label={tForm('race_elevation_gain')}
            className={numberInput}
            {...register('elevationGainM', { setValueAs: nullableNumber })}
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            {tUnits('m')}
          </span>
        </div>
      </FieldRow>

      {/* 05 — Objective time */}
      <FieldRow
        index="05"
        total={TOTAL_ROWS}
        label={tForm('objective_time')}
        optional
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              max={99}
              placeholder="00"
              aria-label={tForm('objective_time')}
              className={`${numberInput} w-20`}
              {...register('objectiveHours', { setValueAs: nullableNumber })}
            />
            <span className="text-2xl md:text-3xl font-thin text-brut-muted">
              :
            </span>
            <input
              type="number"
              min={0}
              max={59}
              placeholder="00"
              aria-label={tForm('objective_time')}
              className={`${numberInput} w-20`}
              {...register('objectiveMinutes', { setValueAs: nullableNumber })}
            />
          </div>
          <p className="text-xs font-normal text-brut-muted">
            {tForm('objective_hint')}
          </p>
        </div>
      </FieldRow>

      {/* 06 — Race date */}
      <FieldRow index="06" total={TOTAL_ROWS} label={tForm('race_date')}>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            min={todayIso()}
            aria-label={tForm('race_date')}
            className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
            {...register('raceDate')}
          />
          {errors.raceDate ? (
            <p className={fieldError}>{err(errors.raceDate.message)}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 07 — Training days */}
      <FieldRow index="07" total={TOTAL_ROWS} label={tForm('training_days')}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-px bg-brut-line border border-brut-line">
            {WEEKDAY_VALUES.map((day) => {
              const active = (trainingDays ?? []).includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={active}
                  className={`py-3 text-[10px] font-semibold tracking-brut-wide uppercase transition-colors ${
                    active
                      ? 'bg-brut-black text-white'
                      : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {tWk(String(day))}
                </button>
              );
            })}
          </div>
          {errors.trainingDays ? (
            <p className={fieldError}>{err(errors.trainingDays.message)}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 08 — Preferred time of day */}
      <FieldRow
        index="08"
        total={TOTAL_ROWS}
        label={tForm('preferred_time')}
      >
        <Segmented
          options={PREFERRED_TIMES}
          value={preferredTime}
          onChange={(v: TimeOfDay) =>
            setValue('preferredTime', v, { shouldValidate: true })
          }
          columns={3}
          size="sm"
          ariaLabel={tForm('preferred_time')}
        />
      </FieldRow>

      {/* 09 — Experience level */}
      <FieldRow
        index="09"
        total={TOTAL_ROWS}
        label={tForm('experience_level')}
      >
        <Segmented
          options={EXPERIENCE_OPTIONS}
          value={experienceLevel}
          onChange={(v: ExperienceLevel) =>
            setValue('experienceLevel', v, { shouldValidate: true })
          }
          ariaLabel={tForm('experience_level')}
        />
      </FieldRow>

      {/* 10 — Weekly hours */}
      <FieldRow index="10" total={TOTAL_ROWS} label={tForm('weekly_hours')}>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className={subLabel}>{tForm('current_volume')}</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                aria-label={tForm('current_volume')}
                className={`${numberInput} w-24`}
                {...register('currentWeeklyVolumeHours', {
                  valueAsNumber: true,
                })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                {tUnits('h')}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={subLabel}>{tForm('available_per_week')}</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                aria-label={tForm('available_per_week')}
                className={`${numberInput} w-24`}
                {...register('hoursPerWeek', { valueAsNumber: true })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                {tUnits('h')}
              </span>
            </div>
          </div>
        </div>
        {errors.currentWeeklyVolumeHours ? (
          <p className={fieldError}>
            {err(errors.currentWeeklyVolumeHours.message)}
          </p>
        ) : null}
        {errors.hoursPerWeek ? (
          <p className={fieldError}>{err(errors.hoursPerWeek.message)}</p>
        ) : null}
      </FieldRow>

      {/* 11 — Longest recent session */}
      <FieldRow
        index="11"
        total={TOTAL_ROWS}
        label={tForm('longest_recent_session')}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              step={0.25}
              placeholder="—"
              aria-label={tForm('longest_recent_session')}
              className={numberInput}
              {...register('longestRecentSessionHours', {
                valueAsNumber: true,
              })}
            />
            <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
              {tUnits('hours')}
            </span>
          </div>
          {errors.longestRecentSessionHours ? (
            <p className={fieldError}>
              {err(errors.longestRecentSessionHours.message)}
            </p>
          ) : null}
        </div>
      </FieldRow>

      {/* 12 — Heart rate & power */}
      <FieldRow
        index="12"
        total={TOTAL_ROWS}
        label={tForm('hr_and_power')}
        optional
      >
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className={subLabel}>{tForm('hr_max')}</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={120}
                max={230}
                placeholder="—"
                aria-label={tForm('hr_max')}
                className={`${numberInput} w-24`}
                {...register('hrMax', { setValueAs: nullableNumber })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                {tUnits('bpm')}
              </span>
            </div>
          </div>
          {sport === 'cycling' ? (
            <div className="flex flex-col gap-1">
              <span className={subLabel}>{tForm('ftp')}</span>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min={50}
                  max={600}
                  placeholder="—"
                  aria-label={tForm('ftp')}
                  className={`${numberInput} w-24`}
                  {...register('ftp', { setValueAs: nullableNumber })}
                />
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  {tUnits('watts')}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </FieldRow>

      {/* Strava — optional placeholder (Phase B) */}
      <section className="border-t border-brut-line py-8 md:py-10">
        <div className="flex items-baseline justify-between mb-5">
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            {tStrava('label')}
          </span>
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-ink">
            {tStrava('connect')}
            <span className="ml-2 text-brut-muted normal-case font-normal tracking-normal">
              {tStrava('optional')}
            </span>
          </span>
        </div>
        <p className="max-w-md text-sm font-normal text-brut-ink leading-relaxed">
          {tStrava('description')}
        </p>
        <button
          type="button"
          disabled
          title={tStrava('coming_soon')}
          className="mt-5 inline-flex items-center justify-center px-6 py-3 text-xs font-semibold tracking-brut-wide uppercase border border-brut-line text-brut-muted cursor-not-allowed"
        >
          {tStrava('connect_button')}
        </button>
      </section>

      {/* Generate */}
      <div className="border-t border-brut-line pt-8 mt-2">
        {formError ? (
          <p className="mb-5 text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="block w-full text-center py-5 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? tSubmit('generating') : tSubmit('generate')}
        </button>
        {!isAuthed ? (
          <p className="mt-4 text-xs font-normal text-brut-muted text-center">
            {tSubmit('signin_hint')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
