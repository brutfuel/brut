'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FieldRow from '@/components/ui/FieldRow';
import Segmented from '@/components/ui/Segmented';
import Slider from '@/components/ui/Slider';
import Toggle from '@/components/ui/Toggle';
import { saveRaceDaySetup } from '@/app/[locale]/brut-race/[planId]/race-day/actions';
import {
  raceDaySetupSchema,
  type RaceDaySetupValues,
} from '@/lib/validation/race-day';
import type {
  CourseProfile,
  ExpectedWeather,
  PacingStrategy,
} from '@/lib/calculations/race-day-generator';

interface Props {
  planId: string;
  initialValues: RaceDaySetupValues;
}

const TOTAL = '05';

const COURSE_OPTIONS: ReadonlyArray<{ value: CourseProfile; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'rolling', label: 'Rolling' },
  { value: 'hilly', label: 'Hilly' },
  { value: 'mountainous', label: 'Mountainous' },
];

const WEATHER_OPTIONS: ReadonlyArray<{
  value: ExpectedWeather;
  label: string;
}> = [
  { value: 'sunny', label: 'Sunny' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'rainy', label: 'Rainy' },
  { value: 'cold', label: 'Cold' },
  { value: 'hot', label: 'Hot' },
];

const PACING_OPTIONS: ReadonlyArray<{
  value: PacingStrategy;
  label: string;
  description: string;
}> = [
  {
    value: 'even',
    label: 'Even pace',
    description: 'Hold steady from gun to tape.',
  },
  {
    value: 'negative_split',
    label: 'Negative split',
    description: 'Start controlled, lift in the second half.',
  },
  {
    value: 'cautious_start',
    label: 'Cautious start',
    description: 'Open easier than goal pace, build into it.',
  },
  {
    value: 'aggressive_start',
    label: 'Aggressive start',
    description: 'Bank time early, hold on at the back end.',
  },
];

const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

export default function RaceDaySetupForm({ planId, initialValues }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RaceDaySetupValues>({
    resolver: zodResolver(raceDaySetupSchema),
    defaultValues: initialValues,
  });

  const courseProfile = watch('courseProfile');
  const expectedWeather = watch('expectedWeather');
  const expectedTemperatureC = watch('expectedTemperatureC');
  const expectedHumidityPct = watch('expectedHumidityPct');
  const pacingStrategy = watch('pacingStrategy');
  const caffeineOk = watch('caffeineOk');

  function onSubmit(values: RaceDaySetupValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await saveRaceDaySetup(planId, values);
      // Success redirects server-side; only errors return.
      if (result?.ok === false) {
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
      {/* 01 — Course profile */}
      <FieldRow index="01" total={TOTAL} label="Course profile">
        <Segmented
          options={COURSE_OPTIONS}
          value={courseProfile}
          onChange={(v: CourseProfile) =>
            setValue('courseProfile', v, { shouldValidate: true })
          }
          columns={4}
          ariaLabel="Course profile"
        />
      </FieldRow>

      {/* 02 — Expected conditions */}
      <FieldRow index="02" total={TOTAL} label="Expected conditions">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className={subLabel}>Temperature</span>
            <Slider
              min={-5}
              max={45}
              step={1}
              value={expectedTemperatureC}
              onChange={(v) =>
                setValue('expectedTemperatureC', v, { shouldValidate: true })
              }
              formatValue={(v) => `${v}°C`}
              ariaLabel="Expected temperature"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={subLabel}>Humidity</span>
            <Slider
              min={10}
              max={100}
              step={1}
              value={expectedHumidityPct}
              onChange={(v) =>
                setValue('expectedHumidityPct', v, { shouldValidate: true })
              }
              formatValue={(v) => `${v}%`}
              ariaLabel="Expected humidity"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={subLabel}>Weather</span>
            <Segmented
              options={WEATHER_OPTIONS}
              value={expectedWeather}
              onChange={(v: ExpectedWeather) =>
                setValue('expectedWeather', v, { shouldValidate: true })
              }
              columns={5}
              size="sm"
              ariaLabel="Expected weather"
            />
          </div>
        </div>
      </FieldRow>

      {/* 03 — Race start */}
      <FieldRow index="03" total={TOTAL} label="Race start">
        <div className="flex flex-col gap-2">
          <input
            type="time"
            aria-label="Race start time"
            className="w-full max-w-xs bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black focus:outline-none focus:border-brut-black transition-colors"
            {...register('startTime')}
          />
          {errors.startTime ? (
            <p className="mt-1 text-xs font-medium text-brut-ink">
              {errors.startTime.message}
            </p>
          ) : null}
        </div>
      </FieldRow>

      {/* 04 — Pacing strategy */}
      <FieldRow index="04" total={TOTAL} label="Pacing strategy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-brut-line border border-brut-line">
          {PACING_OPTIONS.map((opt) => {
            const active = pacingStrategy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setValue('pacingStrategy', opt.value, {
                    shouldValidate: true,
                  })
                }
                aria-pressed={active}
                className={`p-5 text-left transition-colors ${
                  active
                    ? 'bg-brut-black text-white'
                    : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                }`}
              >
                <p className="text-xs font-semibold tracking-brut-wide uppercase">
                  {opt.label}
                </p>
                <p
                  className={`mt-2 text-xs font-normal leading-relaxed ${
                    active ? 'text-white/70' : 'text-brut-muted'
                  }`}
                >
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </FieldRow>

      {/* 05 — Restrictions */}
      <FieldRow index="05" total={TOTAL} label="Restrictions">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className={subLabel}>Caffeine OK?</span>
            <Toggle
              value={caffeineOk}
              onChange={(v) =>
                setValue('caffeineOk', v, { shouldValidate: true })
              }
              ariaLabel="Caffeine OK"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className={subLabel}>Preferred fuelling (optional)</span>
            <input
              type="text"
              placeholder="e.g. SiS Beta Fuel, Maurten Gel 100, banana"
              className="w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors"
              {...register('preferredGels', {
                setValueAs: (v) =>
                  v === '' || v == null ? null : String(v).trim(),
              })}
            />
          </div>
        </div>
      </FieldRow>

      {/* Submit */}
      <div className="border-t border-brut-line pt-8 mt-2">
        {formError ? (
          <p className="mb-5 text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="block w-full text-center py-5 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Generating…' : 'Generate race day plan'}
        </button>
      </div>
    </form>
  );
}
