import { type ReactNode } from 'react';

interface FieldRowProps {
  index: string; // "01"
  total: string; // "09"
  label: string;
  optional?: boolean;
  children: ReactNode;
}

// Editorial numbered row used for every form input in BRUT TRAIN.
// Hairline divider above, "NN / TT" left, label right, content below.
export default function FieldRow({
  index,
  total,
  label,
  optional,
  children,
}: FieldRowProps) {
  return (
    <section className="border-t border-brut-line py-8 md:py-10">
      <div className="flex items-baseline justify-between mb-5">
        <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-muted tabular-nums">
          {index} / {total}
        </span>
        <span className="text-xs font-medium tracking-brut-wide uppercase text-brut-ink">
          {label}
          {optional ? (
            <span className="ml-2 text-brut-muted normal-case font-normal tracking-normal">
              optional
            </span>
          ) : null}
        </span>
      </div>
      {children}
    </section>
  );
}
