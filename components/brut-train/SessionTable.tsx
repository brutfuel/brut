import type { ScheduleRow } from '@/lib/calculations/types';

interface Props {
  rows: ScheduleRow[];
}

// Compact, scrollable schedule table. Optimised for the 380 px sticky panel.
export default function SessionTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-brut-muted">
        Set a duration to see the in-session schedule.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-px border border-brut-line">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-brut-line bg-brut-bg-soft">
            <th className="text-left py-2 px-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Time
            </th>
            <th className="text-right py-2 px-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Water
            </th>
            <th className="text-right py-2 px-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              Carbs
            </th>
            <th className="text-right py-2 px-3 text-[10px] font-semibold tracking-brut-wide uppercase text-brut-muted">
              BRUT
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.time}
              className={i % 2 === 1 ? 'bg-brut-bg-soft' : 'bg-white'}
            >
              <td className="py-2 px-3 font-medium text-brut-black">
                {row.time}
              </td>
              <td className="py-2 px-3 text-right text-brut-ink">
                {row.waterMl} ml
              </td>
              <td className="py-2 px-3 text-right text-brut-ink">
                {row.carbsG > 0 ? `${row.carbsG} g` : '—'}
              </td>
              <td className="py-2 px-3 text-right text-brut-black font-semibold">
                {row.capsules > 0 ? row.capsules : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
