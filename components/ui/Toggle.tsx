'use client';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  labels?: { on: string; off: string };
  ariaLabel?: string;
}

// Binary Yes/No toggle styled as a two-segment Segmented control.
export default function Toggle({
  value,
  onChange,
  labels = { on: 'Yes', off: 'No' },
  ariaLabel,
}: ToggleProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-px bg-brut-line border border-brut-line"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!value}
        className={`py-3 text-xs font-semibold tracking-brut-wide uppercase transition-colors ${
          !value ? 'bg-brut-black text-white' : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
        }`}
      >
        {labels.off}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={value}
        className={`py-3 text-xs font-semibold tracking-brut-wide uppercase transition-colors ${
          value ? 'bg-brut-black text-white' : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
        }`}
      >
        {labels.on}
      </button>
    </div>
  );
}
