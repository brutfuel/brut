'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input';
import Slider from '@/components/ui/Slider';
import { completeOnboarding } from '@/app/[locale]/register/actions';
import {
  GENDERS,
  onboardingSchema,
  PRIMARY_SPORTS,
  type Gender,
  type PrimarySport,
} from '@/lib/validation/auth';

interface Props {
  /** Pre-fill the name field if the profile already has one. */
  initialName?: string;
}

const blackButton =
  'py-4 px-8 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const ghostButton =
  'py-4 px-8 border border-brut-black text-brut-black text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const subLabel =
  'text-[10px] font-medium tracking-brut-wide uppercase text-brut-muted';

const ageInput =
  'brut-number w-28 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums';

const TOTAL_STEPS = 4;

export default function OnboardingFlow({ initialName = '' }: Props) {
  const t = useTranslations('auth.onboarding');
  const tCommon = useTranslations('common.actions');
  const tV = useTranslations('common.validation');
  const tU = useTranslations('common.units');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialName);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [primarySport, setPrimarySport] = useState<PrimarySport | null>(null);
  const [weightKg, setWeightKg] = useState(70);

  const canContinue =
    step === 0
      ? fullName.trim().length > 0
      : step === 1
        ? age !== null && age >= 14 && age <= 90 && gender !== null
        : step === 2
          ? primarySport !== null
          : true;

  function back() {
    setFormError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function next() {
    setFormError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }
    void finish();
  }

  async function finish() {
    const parsed = onboardingSchema.safeParse({
      fullName,
      age,
      gender,
      primarySport,
      weightKg,
    });
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.message;
      setFormError(code ? tV(code) : t('default_error'));
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await completeOnboarding(parsed.data);
    if (result?.error) {
      setFormError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Step counter */}
      <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
        {String(step + 1).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
      </span>

      {/* Step 1 — Name */}
      {step === 0 ? (
        <div className="flex flex-col gap-8">
          <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-thin tracking-brut text-brut-black">
            {t('step_name_question')}
          </h2>
          <Input
            id="fullName"
            label={t('step_name_label')}
            type="text"
            autoComplete="name"
            placeholder={t('step_name_placeholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
      ) : null}

      {/* Step 2 — Age + Gender */}
      {step === 1 ? (
        <div className="flex flex-col gap-8">
          <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-thin tracking-brut text-brut-black">
            {t('step_age_gender_question')}
          </h2>

          <div className="flex flex-col gap-2">
            <span className={subLabel}>{t('step_age_label')}</span>
            <div className="flex items-baseline gap-3">
              <input
                type="number"
                min={14}
                max={90}
                placeholder="—"
                value={age ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setAge(v === '' ? null : Number(v));
                }}
                aria-label={t('step_age_label')}
                className={ageInput}
              />
              <span className={subLabel}>{tU('years')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={subLabel}>{t('step_gender_label')}</span>
            <div className="grid grid-cols-2 gap-px bg-brut-line border border-brut-line">
              {GENDERS.map((value) => {
                const active = gender === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(value)}
                    aria-pressed={active}
                    className={`py-5 text-xs font-semibold tracking-brut-wide uppercase transition-colors ${
                      active
                        ? 'bg-brut-black text-white'
                        : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                    }`}
                  >
                    {t(`gender.${value}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 3 — Primary sport */}
      {step === 2 ? (
        <div className="flex flex-col gap-8">
          <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-thin tracking-brut text-brut-black">
            {t('step_sport_question')}
          </h2>
          <div className="flex flex-col gap-px bg-brut-line border border-brut-line">
            {PRIMARY_SPORTS.map((sport) => {
              const active = primarySport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setPrimarySport(sport)}
                  aria-pressed={active}
                  className={`py-7 text-sm font-semibold tracking-brut-wide uppercase transition-colors ${
                    active
                      ? 'bg-brut-black text-white'
                      : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
                  }`}
                >
                  {t(`sport.${sport}`)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Step 4 — Body weight */}
      {step === 3 ? (
        <div className="flex flex-col gap-8">
          <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-thin tracking-brut text-brut-black">
            {t('step_weight_question')}
          </h2>
          <Slider
            min={40}
            max={120}
            step={1}
            value={weightKg}
            onChange={setWeightKg}
            formatValue={(v) => `${v} ${tU('kg')}`}
            ariaLabel={t('step_weight_question')}
          />
        </div>
      ) : null}

      {formError ? (
        <p className="text-xs font-medium text-brut-black border-l-2 border-brut-black pl-3">
          {formError}
        </p>
      ) : null}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-brut-line pt-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || submitting}
          className={`${ghostButton} ${step === 0 ? 'invisible' : ''}`}
        >
          {tCommon('back')}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!canContinue || submitting}
          className={blackButton}
        >
          {step === TOTAL_STEPS - 1
            ? submitting
              ? tCommon('saving')
              : tCommon('finish')
            : tCommon('continue')}
        </button>
      </div>
    </div>
  );
}
