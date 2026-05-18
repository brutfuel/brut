'use client';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  columns?: 2 | 3 | 4 | 5;
}

// Row of equal-width buttons. Active = inverted (black bg, white text).
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  columns,
}: SegmentedProps<T>) {
  const pad = size === 'sm' ? 'py-2 px-3' : 'py-3 px-4';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  // When columns is provided, render as a grid so labels can wrap consistently.
  // Otherwise lay out as a flex row that splits available width.
  const gridColumns =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
      ? 'grid-cols-3'
      : columns === 4
      ? 'grid-cols-4'
      : columns === 5
      ? 'grid-cols-5'
      : '';

  const wrapperClass = columns
    ? `grid ${gridColumns} gap-px bg-brut-line border border-brut-line`
    : 'flex w-full gap-px bg-brut-line border border-brut-line';

  return (
    <div role="group" aria-label={ariaLabel} className={wrapperClass}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`${pad} ${text} font-semibold tracking-brut-wide uppercase transition-colors ${
              columns ? '' : 'flex-1'
            } ${
              active
                ? 'bg-brut-black text-white'
                : 'bg-white text-brut-ink hover:bg-brut-bg-soft'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
