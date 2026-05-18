'use client';

import { type ChangeEvent } from 'react';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}

// Hairline horizontal slider with a square monochrome thumb.
// Styled via globals.css under .brut-slider.
export default function Slider({
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  ariaLabel,
}: SliderProps) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl md:text-4xl font-thin tracking-brut text-brut-black tabular-nums">
          {formatValue ? formatValue(value) : value}
        </span>
        <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
          {formatValue ? formatValue(min) : min}
          {' — '}
          {formatValue ? formatValue(max) : max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handle}
        aria-label={ariaLabel}
        className="brut-slider w-full"
      />
    </div>
  );
}
