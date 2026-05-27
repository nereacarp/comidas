import { FlameIcon } from '../ui/Icons';
import {
  getDayKcalStatus,
  kcalStatusLabel,
  kcalStatusTone,
} from '../../lib/meal-plan-kcal-status';

interface CalorieTargetStatusProps {
  bmr: number;
  tdee: number;
  dailyTarget: number | null;
  todayTotalKcal?: number;
}

export function CalorieTargetStatus({
  bmr,
  tdee,
  dailyTarget,
  todayTotalKcal = 0,
}: Readonly<CalorieTargetStatusProps>) {
  const status = dailyTarget !== null ? getDayKcalStatus(todayTotalKcal, dailyTarget) : 'no-target';
  const tone = kcalStatusTone(status);
  const label = kcalStatusLabel(status);
  const diff =
    dailyTarget !== null && todayTotalKcal > 0 ? todayTotalKcal - dailyTarget : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="health-stat-pill health-stat-pill--lavender p-2.5 sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">TMB</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-ink sm:text-xl">{bmr}</p>
        </div>
        <div className="health-stat-pill health-stat-pill--mint p-2.5 sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">TDEE</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-ink sm:text-xl">{tdee}</p>
        </div>
        <div
          className="health-stat-pill health-stat-pill--peach p-2.5 sm:p-3"
          style={
            dailyTarget !== null && status === 'over'
              ? {
                  background: tone.background,
                  borderColor: tone.border,
                }
              : undefined
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Objetivo</p>
          <p
            className="mt-0.5 text-lg font-bold tabular-nums sm:text-xl"
            style={{ color: dailyTarget !== null && status === 'over' ? tone.color : undefined }}
          >
            {dailyTarget?.toLocaleString('es-ES') ?? '—'}
          </p>
        </div>
      </div>

      {dailyTarget !== null && (
        <div
          className="rounded-[var(--radius-control)] border px-3 py-2.5"
          style={{ background: tone.background, borderColor: tone.border }}
        >
          {todayTotalKcal > 0 && label && (
            <p
              className="mt-2 flex items-center gap-1.5 text-sm font-semibold tabular-nums"
              style={{ color: tone.color }}
            >
              <FlameIcon className="h-4 w-4 shrink-0" />
              Hoy {todayTotalKcal.toLocaleString('es-ES')} kcal · {label}
              {diff !== null && status !== 'on-track' && (
                <span className="font-medium">
                  ({diff > 0 ? '+' : ''}
                  {diff.toLocaleString('es-ES')})
                </span>
              )}
            </p>
          )}

          {todayTotalKcal === 0 && (
            <p className="mt-1.5 text-xs text-muted">Sin comidas registradas hoy en el plan.</p>
          )}
        </div>
      )}
    </div>
  );
}
