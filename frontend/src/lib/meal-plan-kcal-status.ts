type DayKcalStatus = 'empty' | 'no-target' | 'on-track' | 'over' | 'under';

const KCAL_TOLERANCE = 100;

function getKcalTargetRange(target: number) {
  return { min: target - KCAL_TOLERANCE, max: target + KCAL_TOLERANCE, target };
}

export function getDayKcalStatus(totalKcal: number, calorieTarget: number | null): DayKcalStatus {
  if (totalKcal <= 0) return 'empty';
  if (calorieTarget === null) return 'no-target';
  const diff = totalKcal - calorieTarget;
  if (diff > KCAL_TOLERANCE) return 'over';
  if (diff < -KCAL_TOLERANCE) return 'under';
  return 'on-track';
}

export function kcalStatusLabel(status: DayKcalStatus): string | null {
  switch (status) {
    case 'on-track':
      return 'En rango';
    case 'over':
      return 'Por encima';
    case 'under':
      return 'Por debajo';
    default:
      return null;
  }
}

export function formatKcalRange(target: number): string {
  const { min, max } = getKcalTargetRange(target);
  return `${min.toLocaleString('es-ES')} – ${max.toLocaleString('es-ES')} kcal`;
}

export function kcalStatusTone(status: DayKcalStatus): {
  color: string;
  background: string;
  border: string;
} {
  switch (status) {
    case 'over':
      return {
        color: 'var(--danger-text)',
        background: 'color-mix(in oklab, var(--danger-soft) 35%, var(--surface))',
        border: 'color-mix(in oklab, var(--danger) 28%, var(--border-subtle))',
      };
    case 'under':
      return {
        color: 'var(--text-secondary)',
        background: 'color-mix(in oklab, var(--pastel-cyan) 30%, var(--surface))',
        border: 'color-mix(in oklab, var(--pastel-cyan-icon) 20%, var(--border-subtle))',
      };
    case 'on-track':
      return {
        color: 'var(--success-text)',
        background: 'color-mix(in oklab, var(--pastel-mint) 40%, var(--surface))',
        border: 'color-mix(in oklab, var(--success-text) 22%, var(--border-subtle))',
      };
    default:
      return {
        color: 'var(--text-secondary)',
        background: 'var(--page)',
        border: 'var(--border-subtle)',
      };
  }
}
