'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import FieldRow from '@/components/ui/FieldRow';
import Segmented from '@/components/ui/Segmented';
import { createRacePlan } from '@/app/brut-race/actions';
import {
  DISTANCE_PRESETS,
  EXPERIENCE_LEVELS,
  PREFERRED_TIMES,
  RACE_SPORTS,
  SURFACES_BY_SPORT,
  WEEKDAYS,
  raceFormSchema,
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

const SPORT_OPTIONS: ReadonlyArray<{ value: RaceSport; label: string }> = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'triathlon', label: 'Triathlon' },
];

const EXPERIENCE_OPTIONS = EXPERIENCE_LEVELS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

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

/** '' → null, otherwise Number — used for optional numeric inputs. */
function nullableNumber(v: unknown): number | null {
  return v === '' || v == null ? null : Number(v);
}

export default function RaceForm({ isAuthed }: Props) {
  const router = useRouter();
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
    // On success the action redirects to the plan page; only errors return.
    if (result?.error) {
      setFormError(result.error);
    }
  }

  const surfaceOptions = SURFACES_BY_SPORT[sport];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
      {/* 01 — Sport */}
      <FieldRow index="01" total={TOTAL_ROWS} label="Sport">
        <Segmented
          options={SPORT_OPTIONS}
          value={sport}
          onChange={changeSport}
          ariaLabel="Sport"
        />
      </FieldRow>

      {/* 02 — Distance */}
      <FieldRow index="02" total={TOTAL_ROWS} label="Distance">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="—"
              aria-label="Race distance in kilometres"
              className={numberInput}
              {...register('distanceKm', { valueAsNumber: true })}
            />
            <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
              km
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
            <p className={fieldError}>{errors.distanceKm.message}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 03 — Terrain */}
      <FieldRow index="03" total={TOTAL_ROWS} label="Terrain">
        {sport === 'triathlon' ? (
          <p className="text-sm font-normal text-brut-muted">
            Not applicable for triathlon.
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
              ariaLabel="Terrain"
            />
            {errors.surface ? (
              <p className={fieldError}>{errors.surface.message}</p>
            ) : null}
          </div>
        )}
      </FieldRow>

      {/* 04 — Elevation gain */}
      <FieldRow index="04" total={TOTAL_ROWS} label="Race elevation gain" optional>
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={50}
            placeholder="—"
            aria-label="Race elevation gain in metres"
            className={numberInput}
            {...register('elevationGainM', { setValueAs: nullableNumber })}
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            m
          </span>
        </div>
      </FieldRow>

      {/* 05 — Objective time */}
      <FieldRow index="05" total={TOTAL_ROWS} label="Objective time" optional>
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              max={99}
              placeholder="00"
              aria-label="Objective hours"
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
              aria-label="Objective minutes"
              className={`${numberInput} w-20`}
              {...register('objectiveMinutes', { setValueAs: nullableNumber })}
            />
          </div>
          <p className="text-xs font-normal text-brut-muted">
            Optional — we&rsquo;ll estimate if left blank.
          </p>
        </div>
      </FieldRow>

      {/* 06 — Race date */}
      <FieldRow index="06" total={TOTAL_ROWS} label="Race date">
        <div className="flex flex-col gap-2">
          <input
            type="date"
            min={todayIso()}
            aria-label="Race date"
            className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
            {...register('raceDate')}
          />
          {errors.raceDate ? (
            <p className={fieldError}>{errors.raceDate.message}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 07 — Training days */}
      <FieldRow index="07" total={TOTAL_ROWS} label="Training days">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-px bg-brut-line border border-brut-line">
            {WEEKDAYS.map((day) => {
              const active = (trainingDays ?? []).includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-pressed={active}
                  className={`py-3 text-[10px] font-semibold tracking-brut-wide uppercase transition-colors ${
                    active
                      ? 'bg-brut-black text-white'
                      : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {errors.trainingDays ? (
            <p className={fieldError}>{errors.trainingDays.message}</p>
          ) : null}
        </div>
      </FieldRow>

      {/* 08 — Preferred time of day */}
      <FieldRow index="08" total={TOTAL_ROWS} label="Preferred time of day">
        <Segmented
          options={PREFERRED_TIMES}
          value={preferredTime}
          onChange={(v: TimeOfDay) =>
            setValue('preferredTime', v, { shouldValidate: true })
          }
          columns={3}
          size="sm"
          ariaLabel="Preferred time of day"
        />
      </FieldRow>

      {/* 09 — Experience level */}
      <FieldRow index="09" total={TOTAL_ROWS} label="Experience level">
        <Segmented
          options={EXPERIENCE_OPTIONS}
          value={experienceLevel}
          onChange={(v) =>
            setValue('experienceLevel', v, { shouldValidate: true })
          }
          ariaLabel="Experience level"
        />
      </FieldRow>

      {/* 10 — Weekly hours */}
      <FieldRow index="10" total={TOTAL_ROWS} label="Weekly hours">
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className={subLabel}>Current volume</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                aria-label="Current weekly training hours"
                className={`${numberInput} w-24`}
                {...register('currentWeeklyVolumeHours', {
                  valueAsNumber: true,
                })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                h
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={subLabel}>Available / week</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="—"
                aria-label="Hours available to train per week"
                className={`${numberInput} w-24`}
                {...register('hoursPerWeek', { valueAsNumber: true })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                h
              </span>
            </div>
          </div>
        </div>
        {errors.currentWeeklyVolumeHours ? (
          <p className={fieldError}>
            {errors.currentWeeklyVolumeHours.message}
          </p>
        ) : null}
        {errors.hoursPerWeek ? (
          <p className={fieldError}>{errors.hoursPerWeek.message}</p>
        ) : null}
      </FieldRow>

      {/* 11 — Longest recent session */}
      <FieldRow
        index="11"
        total={TOTAL_ROWS}
        label="Longest recent session"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <input
              type="number"
              min={0}
              step={0.25}
              placeholder="—"
              aria-label="Longest recent session in hours"
              className={numberInput}
              {...register('longestRecentSessionHours', {
                valueAsNumber: true,
              })}
            />
            <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
              hours
            </span>
          </div>
          {errors.longestRecentSessionHours ? (
            <p className={fieldError}>
              {errors.longestRecentSessionHours.message}
            </p>
          ) : null}
        </div>
      </FieldRow>

      {/* 12 — Heart rate & power */}
      <FieldRow
        index="12"
        total={TOTAL_ROWS}
        label="Heart rate & power"
        optional
      >
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className={subLabel}>HR max</span>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                min={120}
                max={230}
                placeholder="—"
                aria-label="Maximum heart rate"
                className={`${numberInput} w-24`}
                {...register('hrMax', { setValueAs: nullableNumber })}
              />
              <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                bpm
              </span>
            </div>
          </div>
          {sport === 'cycling' ? (
            <div className="flex flex-col gap-1">
              <span className={subLabel}>FTP</span>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min={50}
                  max={600}
                  placeholder="—"
                  aria-label="Functional threshold power"
                  className={`${numberInput} w-24`}
                  {...register('ftp', { setValueAs: nullableNumber })}
                />
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  W
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
            Strava
          </span>
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-ink">
            Connect
            <span className="ml-2 text-brut-muted normal-case font-normal tracking-normal">
              optional
            </span>
          </span>
        </div>
        <p className="max-w-md text-sm font-normal text-brut-ink leading-relaxed">
          We can read your last 3 months of activities to calibrate your plan
          based on your actual fitness level.
        </p>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="mt-5 inline-flex items-center justify-center px-6 py-3 text-xs font-semibold tracking-brut-wide uppercase border border-brut-line text-brut-muted cursor-not-allowed"
        >
          Connect Strava
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
          {isSubmitting ? 'Generating…' : 'Generate plan'}
        </button>
        {!isAuthed ? (
          <p className="mt-4 text-xs font-normal text-brut-muted text-center">
            You&rsquo;ll be asked to sign in to save your plan.
          </p>
        ) : null}
      </div>
    </form>
  );
}
