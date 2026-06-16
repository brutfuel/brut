'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FieldRow from '@/components/ui/FieldRow';
import Segmented from '@/components/ui/Segmented';
import Toggle from '@/components/ui/Toggle';
import Input from '@/components/ui/Input';
import { updateProfile } from '@/app/[locale]/profile/actions';
import {
  DIETARY_RESTRICTION_OPTIONS,
  EXPERIENCE_LEVELS,
  GENDERS,
  PRIMARY_SPORTS,
  SODIUM_DIETS,
  TERRAIN_OPTIONS,
  TRAINING_TIMES,
  profileSchema,
  type DietaryRestriction,
  type ExperienceLevel,
  type Gender,
  type PrimarySport,
  type ProfileFormValues,
  type SodiumDietValue,
  type Terrain,
  type TrainingTime,
} from '@/lib/validation/profile-schema';

interface Props {
  initialValues: ProfileFormValues;
}

const TOTAL = '07';

const numberInput =
  'brut-number w-32 bg-transparent border-b border-brut-line py-2 text-2xl md:text-3xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums';

const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';
const fieldError = 'mt-2 text-xs font-medium text-brut-ink';

function nullableNumber(v: unknown): number | null {
  return v === '' || v == null ? null : Number(v);
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const SPORT_OPTIONS = PRIMARY_SPORTS.map((value) => ({
  value,
  label: titleCase(value),
}));

const LEVEL_OPTIONS = EXPERIENCE_LEVELS.map((value) => ({
  value,
  label: titleCase(value),
}));

const SODIUM_OPTIONS = SODIUM_DIETS.map((value) => ({
  value,
  label: titleCase(value),
}));

const TRAINING_TIME_OPTIONS: ReadonlyArray<{
  value: TrainingTime;
  label: string;
}> = TRAINING_TIMES.map((value) => ({ value, label: titleCase(value) }));

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Two-input time control. Decimal-minutes round-trip. */
function TimeField({
  label,
  mode,
  value,
  onChange,
}: {
  label: string;
  mode: 'ms' | 'hm';
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  const totalSec = value == null ? null : Math.round(value * 60);
  const left =
    value == null
      ? ''
      : String(
          mode === 'ms'
            ? Math.floor((totalSec ?? 0) / 60)
            : Math.floor(value / 60),
        );
  const right =
    value == null
      ? ''
      : String(mode === 'ms' ? (totalSec ?? 0) % 60 : value % 60);

  function commit(l: string, r: string) {
    if (l === '' && r === '') {
      onChange(null);
      return;
    }
    const ln = Number(l) || 0;
    const rn = Number(r) || 0;
    if (mode === 'ms') onChange(Math.round((ln + rn / 60) * 100) / 100);
    else onChange(ln * 60 + rn);
  }

  const leftMax = mode === 'ms' ? 99 : 24;
  const leftUnit = mode === 'ms' ? 'min' : 'h';

  return (
    <div className="flex flex-col gap-1">
      <span className={subLabel}>{label}</span>
      <div className="flex items-baseline gap-2">
        <input
          type="number"
          min={0}
          max={leftMax}
          placeholder="00"
          value={left}
          onChange={(e) => commit(e.target.value, right)}
          aria-label={`${label} ${leftUnit}`}
          className={`${numberInput} w-20`}
        />
        <span className="text-xl md:text-2xl font-thin text-brut-muted">
          :
        </span>
        <input
          type="number"
          min={0}
          max={59}
          placeholder="00"
          value={right}
          onChange={(e) => commit(left, e.target.value)}
          aria-label={`${label} ${mode === 'ms' ? 'sec' : 'min'}`}
          className={`${numberInput} w-20`}
        />
        <span className={subLabel}>
          {mode === 'ms' ? 'min : sec' : 'h : min'}
        </span>
      </div>
    </div>
  );
}

/** Multi-select chip group. */
function ChipMulti<T extends string>({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: ReadonlyArray<T>;
  value: T[];
  onChange: (next: T[]) => void;
  formatLabel: (option: T) => string;
}) {
  const toggle = (option: T) => {
    onChange(value.includes(option)
      ? value.filter((v) => v !== option)
      : [...value, option]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            aria-pressed={active}
            className={`px-3 py-2 text-[10px] font-semibold tracking-brut-wide uppercase border transition-colors ${
              active
                ? 'bg-brut-black text-white border-brut-black'
                : 'bg-white text-brut-ink border-brut-line hover:bg-brut-bg-soft'
            }`}
          >
            {formatLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------
// Profile editor
// ----------------------------------------------------------------

export default function ProfileEditor({ initialValues }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
  });

  const primarySport = watch('primarySport');
  const level = watch('level');
  const gender = watch('gender');
  const sodiumDiet = watch('sodiumDiet');
  const acclimated = watch('acclimated');
  const medicallyCleared = watch('medicallyCleared');
  const typicalTrainingTime = watch('typicalTrainingTime');
  const dietaryRestrictions = watch('dietaryRestrictions');
  const typicalTerrain = watch('typicalTerrain');
  const prs = watch('prs');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(values: ProfileFormValues) {
    setFormError(null);
    const result = await updateProfile(values);
    if (result.ok) {
      // Mark form clean with the saved values.
      reset(values);
      setToast('Profile updated');
    } else {
      setFormError(result.error);
    }
  }

  // All PR values are `number | null`, so we can take the union path.
  function setPr(
    key: keyof ProfileFormValues['prs'],
    next: number | null,
  ) {
    setValue(`prs.${key}`, next, { shouldDirty: true });
  }

  return (
    <>
      {toast ? (
        <div
          role="status"
          className="mb-8 inline-flex items-center gap-2 border border-brut-black bg-white px-4 py-2 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black"
        >
          {toast}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full">
        {/* 01 — Identity */}
        <FieldRow index="01" total={TOTAL} label="Identity">
          <div className="flex flex-col gap-6">
            <Input
              id="fullName"
              label="Full name"
              type="text"
              autoComplete="name"
              {...register('fullName')}
            />
            {errors.fullName ? (
              <p className={fieldError}>{errors.fullName.message}</p>
            ) : null}

            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Age</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={14}
                    max={90}
                    placeholder="—"
                    aria-label="Age"
                    className={`${numberInput} w-20`}
                    {...register('age', { setValueAs: nullableNumber })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Height</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={100}
                    max={230}
                    step={0.5}
                    placeholder="—"
                    aria-label="Height in centimetres"
                    className={`${numberInput} w-24`}
                    {...register('heightCm', { setValueAs: nullableNumber })}
                  />
                  <span className={subLabel}>cm</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Body weight</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={30}
                    max={200}
                    step={0.1}
                    placeholder="—"
                    aria-label="Body weight in kilograms"
                    className={`${numberInput} w-24`}
                    {...register('weightKg', { valueAsNumber: true })}
                  />
                  <span className={subLabel}>kg</span>
                </div>
              </div>
            </div>
            {errors.weightKg ? (
              <p className={fieldError}>{errors.weightKg.message}</p>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Gender</span>
              <Segmented
                options={GENDER_OPTIONS}
                value={(gender ?? '') as Gender}
                onChange={(v) =>
                  setValue('gender', v, { shouldDirty: true, shouldValidate: true })
                }
                columns={2}
                ariaLabel="Gender"
              />
            </div>
          </div>
        </FieldRow>

        {/* 02 — Experience */}
        <FieldRow index="02" total={TOTAL} label="Experience">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className={subLabel}>Level</span>
              <Segmented
                options={LEVEL_OPTIONS}
                value={level}
                onChange={(v: ExperienceLevel) =>
                  setValue('level', v, { shouldDirty: true })
                }
                ariaLabel="Experience level"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Primary sport</span>
              <Segmented
                options={SPORT_OPTIONS}
                value={primarySport}
                onChange={(v: PrimarySport) =>
                  setValue('primarySport', v, { shouldDirty: true })
                }
                ariaLabel="Primary sport"
              />
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Years training</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  placeholder="—"
                  aria-label="Years training"
                  className={`${numberInput} w-20`}
                  {...register('yearsTraining', { setValueAs: nullableNumber })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Weekly volume</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step={0.5}
                    placeholder="—"
                    aria-label="Typical weekly volume in hours"
                    className={`${numberInput} w-24`}
                    {...register('weeklyVolumeHours', {
                      setValueAs: nullableNumber,
                    })}
                  />
                  <span className={subLabel}>h</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={subLabel}>Longest recent</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={0}
                    max={300}
                    step={0.5}
                    placeholder="—"
                    aria-label="Longest recent session in kilometres"
                    className={`${numberInput} w-24`}
                    {...register('longestRecentSessionKm', {
                      setValueAs: nullableNumber,
                    })}
                  />
                  <span className={subLabel}>km</span>
                </div>
              </div>
            </div>
          </div>
        </FieldRow>

        {/* 03 — Personal records */}
        <FieldRow index="03" total={TOTAL} label="Personal records" optional>
          {primarySport === 'running' ? (
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <TimeField
                label="5 km"
                mode="ms"
                value={prs.fiveKMinutes}
                onChange={(v) => setPr('fiveKMinutes', v)}
              />
              <TimeField
                label="10 km"
                mode="ms"
                value={prs.tenKMinutes}
                onChange={(v) => setPr('tenKMinutes', v)}
              />
              <TimeField
                label="Half marathon"
                mode="hm"
                value={prs.halfMinutes}
                onChange={(v) => setPr('halfMinutes', v)}
              />
              <TimeField
                label="Marathon"
                mode="hm"
                value={prs.marathonMinutes}
                onChange={(v) => setPr('marathonMinutes', v)}
              />
            </div>
          ) : null}
          {primarySport === 'cycling' ? (
            <div className="flex flex-wrap gap-x-10 gap-y-4">
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
                    {...register('prs.ftpWatts', {
                      setValueAs: nullableNumber,
                    })}
                  />
                  <span className={subLabel}>W</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={subLabel}>20-min power</span>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min={50}
                    max={700}
                    placeholder="—"
                    aria-label="20 minute average power"
                    className={`${numberInput} w-24`}
                    {...register('prs.twentyMinWatts', {
                      setValueAs: nullableNumber,
                    })}
                  />
                  <span className={subLabel}>W</span>
                </div>
              </div>
            </div>
          ) : null}
          {primarySport === 'triathlon' ? (
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <TimeField
                label="Olympic swim"
                mode="ms"
                value={prs.olympicSwimMinutes}
                onChange={(v) => setPr('olympicSwimMinutes', v)}
              />
              <TimeField
                label="Sprint bike"
                mode="hm"
                value={prs.sprintBikeMinutes}
                onChange={(v) => setPr('sprintBikeMinutes', v)}
              />
            </div>
          ) : null}
        </FieldRow>

        {/* 04 — Physiology */}
        <FieldRow index="04" total={TOTAL} label="Physiology" optional>
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
                  {...register('fcmax', { setValueAs: nullableNumber })}
                />
                <span className={subLabel}>bpm</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className={subLabel}>HR rest</span>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min={30}
                  max={110}
                  placeholder="—"
                  aria-label="Resting heart rate"
                  className={`${numberInput} w-24`}
                  {...register('fcrest', { setValueAs: nullableNumber })}
                />
                <span className={subLabel}>bpm</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className={subLabel}>VO2max</span>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min={20}
                  max={95}
                  step={0.1}
                  placeholder="—"
                  aria-label="VO2max"
                  className={`${numberInput} w-24`}
                  {...register('vo2max', { setValueAs: nullableNumber })}
                />
                <span className={subLabel}>ml/kg/min</span>
              </div>
            </div>
          </div>
        </FieldRow>

        {/* 05 — Health */}
        <FieldRow index="05" total={TOTAL} label="Health">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className={subLabel}>Current or past injuries</span>
              <textarea
                rows={3}
                placeholder="Describe any injuries we should know about…"
                className="w-full bg-transparent border-b border-brut-line py-2 text-base font-normal text-brut-black placeholder:text-brut-muted focus:outline-none focus:border-brut-black transition-colors resize-none"
                {...register('injuries')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Dietary restrictions</span>
              <ChipMulti
                options={DIETARY_RESTRICTION_OPTIONS}
                value={dietaryRestrictions}
                onChange={(next: DietaryRestriction[]) =>
                  setValue('dietaryRestrictions', next, { shouldDirty: true })
                }
                formatLabel={titleCase}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Medically cleared for training</span>
              <Toggle
                value={medicallyCleared}
                onChange={(v) =>
                  setValue('medicallyCleared', v, { shouldDirty: true })
                }
                ariaLabel="Medically cleared for training"
              />
            </div>
          </div>
        </FieldRow>

        {/* 06 — Hydration profile */}
        <FieldRow index="06" total={TOTAL} label="Hydration profile">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className={subLabel}>Heat acclimated</span>
              <Toggle
                value={acclimated}
                onChange={(v) =>
                  setValue('acclimated', v, { shouldDirty: true })
                }
                ariaLabel="Heat acclimated"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Habitual sodium diet</span>
              <Segmented
                options={SODIUM_OPTIONS}
                value={sodiumDiet}
                onChange={(v: SodiumDietValue) =>
                  setValue('sodiumDiet', v, { shouldDirty: true })
                }
                ariaLabel="Habitual sodium diet"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className={subLabel}>Known sweat rate</span>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min={0.2}
                  max={4}
                  step={0.05}
                  placeholder="—"
                  aria-label="Known sweat rate"
                  className={`${numberInput} w-24`}
                  {...register('knownSweatRateLh', {
                    setValueAs: nullableNumber,
                  })}
                />
                <span className={subLabel}>L / h</span>
              </div>
              <p className="text-xs font-normal text-brut-muted">
                Optional — fill in only if you&rsquo;ve measured it.
              </p>
            </div>
          </div>
        </FieldRow>

        {/* 07 — Logistics */}
        <FieldRow index="07" total={TOTAL} label="Logistics">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className={subLabel}>Typical training time</span>
              <Segmented
                options={TRAINING_TIME_OPTIONS}
                value={(typicalTrainingTime ?? '') as TrainingTime}
                onChange={(v: TrainingTime) =>
                  setValue('typicalTrainingTime', v, { shouldDirty: true })
                }
                columns={3}
                size="sm"
                ariaLabel="Typical training time"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={subLabel}>Typical terrain</span>
              <ChipMulti
                options={TERRAIN_OPTIONS}
                value={typicalTerrain}
                onChange={(next: Terrain[]) =>
                  setValue('typicalTerrain', next, { shouldDirty: true })
                }
                formatLabel={titleCase}
              />
            </div>
          </div>
        </FieldRow>

        {/* Form-level error */}
        {formError ? (
          <p className="mt-6 text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
            {formError}
          </p>
        ) : null}

        {/* Sticky save bar — visible only when there are unsaved changes */}
        {isDirty || isSubmitting ? (
          <div className="sticky bottom-0 -mx-6 md:-mx-10 px-6 md:px-10 py-4 mt-8 bg-white border-t border-brut-line z-20">
            <button
              type="submit"
              disabled={isSubmitting}
              className="block w-full text-center py-4 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : null}
      </form>
    </>
  );
}
