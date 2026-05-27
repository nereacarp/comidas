import type { PhysiologyGoalResult } from '../../utils/deficit-planning';
import { DEFICIT_TIER_META } from '../../utils/deficit-planning';
import { tierTitleColor } from '../../utils/health-plan-styles';

interface WeightGoalPreviewProps {
  result: PhysiologyGoalResult;
}

export function WeightGoalPreview({ result }: Readonly<WeightGoalPreviewProps>) {
  const titleColor = tierTitleColor(result.tier);
  const titleLabel = DEFICIT_TIER_META[result.tier].label;

  return (
    <div
      className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-page px-3 py-2.5 space-y-2"
      role="status"
    >
      <p className="text-sm font-bold" style={{ color: titleColor }}>
        {titleLabel}
      </p>

      {result.warnings.length > 0 && (
        <ul className="space-y-0.5 text-xs text-[var(--warning-text)]">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs tabular-nums">
        <span className="text-muted">Objetivo</span>
        <span className="text-right font-semibold text-ink">
          {result.dailyKcal.toLocaleString('es-ES')} kcal/día
        </span>
        <span className="text-muted">Déficit</span>
        <span className="text-right font-semibold text-ink">
          {result.dailyDeficit > 0 ? `−${result.dailyDeficit.toLocaleString('es-ES')}` : '0'} kcal
        </span>
        <span className="text-muted">Ritmo</span>
        <span className="text-right font-semibold text-ink">
          {Math.abs(result.kgPerWeek).toFixed(2)} kg/sem
        </span>
      </div>
    </div>
  );
}
