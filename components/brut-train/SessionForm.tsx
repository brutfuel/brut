'use client';

import { useState } from 'react';
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
  /** Label shown on the submit button (e.g. "Calculate", "Recalculate"). */
  submitLabel?: string;
  /** Disables the submit button — e.g. while the result is already fresh. */
  submitDisabled?: boolean;
}

// Default session type per sport, used when the user switches sport.
const DEFAULT_SESSION_TYPE: Record<Sport, SessionType> = {
  running: 'easy-run',
  cycling: 'endurance',
  triathlon: 'swim',
};

// Default surface per sport (triathlon has none).
const DEFAULT_SURFACE: Record<Sport, RunningSurface | CyclingSurface | null> = {
  running: 'track-road',
  cycling: 'road',
  triathlon: null,
};

const SPORTS: ReadonlyArray<{ value: Sport; label: string }> = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'triathlon', label: 'Triathlon' },
];

const TIME_OF_DAY: ReadonlyArray<{ value: TimeOfDay; label: string }> = [
  { value: 'early-morning', label: 'Early morning' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

const LAST_MEAL: ReadonlyArray<{ value: LastMeal; label: string }> = [
  { value: '<1h', label: '< 1 h' },
  { value: '1-2h', label: '1 – 2 h' },
  { value: '2-4h', label: '2 – 4 h' },
  { value: '>4h', label: '> 4 h' },
];

const SODIUM_DIET: ReadonlyArray<{ value: SodiumDiet; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

export default function SessionForm({
  value,
  onChange,
  onSubmit,
  submitLabel = 'Calculate',
  submitDisabled = false,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Patch helper — typed update of a single field.
  function patch(p: Partial<SessionInput>) {
    onChange({ ...value, ...p });
  }

  // Switching sport resets dependent fields (subtype + session type).
  function setSport(sport: Sport) {
    onChange({
      ...value,
      sport,
      surface: DEFAULT_SURFACE[sport],
      sessionType: DEFAULT_SESSION_TYPE[sport],
    });
  }

  const surfaceOptions: ReadonlyArray<{
    value: RunningSurface | CyclingSurface;
    label: string;
  }> =
    value.sport === 'running'
      ? [
          { value: 'track-road', label: 'Track / Road' },
          { value: 'trail', label: 'Trail' },
        ]
      : value.sport === 'cycling'
      ? [
          { value: 'road', label: 'Road' },
          { value: 'gravel', label: 'Gravel' },
          { value: 'mtb', label: 'MTB' },
        ]
      : [];

  const sessionTypes = SESSION_TYPES_BY_SPORT[value.sport];

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      {/* 01 — Sport */}
      <FieldRow index="01" total="09" label="Sport">
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
      <FieldRow index="02" total="09" label="Session type">
        <Segmented
          options={sessionTypes}
          value={value.sessionType}
          onChange={(v) => patch({ sessionType: v })}
          size="sm"
          columns={sessionTypes.length > 4 ? 4 : 3}
        />
      </FieldRow>

      {/* 03 — Duration */}
      <FieldRow index="03" total="09" label="Duration">
        <Slider
          min={0.5}
          max={8}
          step={0.5}
          value={value.duration}
          onChange={(v) => patch({ duration: v })}
          formatValue={(v) =>
            v === Math.floor(v) ? `${v.toFixed(0)} h` : `${v.toFixed(1)} h`
          }
          ariaLabel="Duration in hours"
        />
      </FieldRow>

      {/* 04 — Distance (optional) */}
      <FieldRow index="04" total="09" label="Distance" optional>
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
            aria-label="Distance in kilometres"
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            km
          </span>
        </div>
      </FieldRow>

      {/* 05 — Elevation gain */}
      <FieldRow index="05" total="09" label="Elevation gain" optional>
        <div className="flex items-baseline gap-3">
          <input
            type="number"
            min={0}
            step={10}
            value={value.elevation}
            onChange={(e) => patch({ elevation: Number(e.target.value) || 0 })}
            className="brut-number w-32 bg-transparent border-b border-brut-line py-2 text-3xl md:text-4xl font-thin tracking-brut text-brut-black focus:outline-none focus:border-brut-black transition-colors tabular-nums"
            aria-label="Elevation gain in metres"
          />
          <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
            m
          </span>
        </div>
      </FieldRow>

      {/* 06 — Ambient temperature */}
      <FieldRow index="06" total="09" label="Ambient temperature">
        <Slider
          min={-5}
          max={45}
          step={1}
          value={value.temperature}
          onChange={(v) => patch({ temperature: v })}
          formatValue={(v) => `${v}°C`}
          ariaLabel="Ambient temperature in Celsius"
        />
      </FieldRow>

      {/* 07 — Time of day */}
      <FieldRow index="07" total="09" label="Time of day">
        <Segmented
          options={TIME_OF_DAY}
          value={value.timeOfDay}
          onChange={(v) => patch({ timeOfDay: v })}
          size="sm"
          columns={5}
        />
      </FieldRow>

      {/* 08 — Last meal */}
      <FieldRow index="08" total="09" label="Last meal">
        <Segmented
          options={LAST_MEAL}
          value={value.lastMeal}
          onChange={(v) => patch({ lastMeal: v })}
          columns={4}
        />
      </FieldRow>

      {/* 09 — Body weight */}
      <FieldRow index="09" total="09" label="Body weight">
        <Slider
          min={40}
          max={120}
          step={1}
          value={value.weight}
          onChange={(v) => patch({ weight: v })}
          formatValue={(v) => `${v} kg`}
          ariaLabel="Body weight in kilograms"
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
          <span>Advanced parameters</span>
          <span className="text-brut-muted">{advancedOpen ? '−' : '+'}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-8 flex flex-col gap-10">
            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  Relative humidity
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                step={1}
                value={value.humidity}
                onChange={(v) => patch({ humidity: v })}
                formatValue={(v) => `${v}%`}
                ariaLabel="Relative humidity in percent"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  Heat acclimated
                </span>
              </div>
              <Toggle
                value={value.heatAcclimated}
                onChange={(v) => patch({ heatAcclimated: v })}
                ariaLabel="Heat acclimated"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  Habitual sodium diet
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
                  Known sweat rate
                  <span className="ml-2 text-brut-muted normal-case font-normal tracking-normal">
                    optional override
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
                  aria-label="Known sweat rate override"
                />
                <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted">
                  L / h
                </span>
              </div>
              <p className="mt-2 text-xs font-normal text-brut-muted">
                If set, overrides the calculated sweat rate for this session.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* CTA — explicit Calculate / Recalculate / Up to date trigger.
          Submission is wired through the form's onSubmit prop above. */}
      <div className="border-t border-brut-line pt-8 mt-2">
        <button
          type="submit"
          disabled={submitDisabled}
          className="block w-full text-center py-5 bg-brut-black text-white text-xs font-semibold tracking-brut-wide uppercase hover:bg-brut-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
