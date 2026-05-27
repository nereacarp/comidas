import type { CSSProperties } from 'react';
import { CheckSmallIcon } from '../ui/Icons';

export interface PlanRowStyle {
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badge: string;
}

interface CaloriePlanRowProps {
  label: string;
  kcal: number;
  adaptedKcal?: number | null;
  style: PlanRowStyle;
  isSelected: boolean;
  isRecommended?: boolean;
  isClosestMatch?: boolean;
  projectionSubtitle?: string | null;
  onSelect: () => void;
}

export function CaloriePlanRow({
  label,
  kcal,
  adaptedKcal = null,
  style,
  isSelected,
  isRecommended = false,
  isClosestMatch = false,
  projectionSubtitle = null,
  onSelect,
}: Readonly<CaloriePlanRowProps>) {
  const displayKcal = adaptedKcal != null && (isSelected || isClosestMatch) ? adaptedKcal : kcal;
  const rowStyle = isSelected || isClosestMatch
    ? ({
        '--plan-accent': style.iconColor,
        '--plan-accent-soft': style.iconBg,
        borderColor: 'color-mix(in oklab, var(--plan-accent) 35%, var(--border-subtle))',
        background: 'color-mix(in oklab, var(--plan-accent-soft) 42%, var(--surface))',
      } as CSSProperties)
    : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      style={rowStyle}
      className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-[var(--radius-control)] border transition-colors duration-200 cursor-pointer text-left min-h-11 ${
        isSelected || isClosestMatch ? 'text-ink' : 'health-option-btn--idle'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: style.iconBg, color: style.iconColor }}
        aria-hidden
      >
        {style.badge}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <span className="mt-1 flex flex-wrap gap-1">
          <span
            className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-xs"
            style={{
              background: style.badgeBg,
              color: style.badgeText,
              borderColor: style.badgeBorder,
            }}
          >
            Objetivo diario
          </span>
          {isClosestMatch && (
            <span
              className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-xs"
              style={{
                background: 'var(--pastel-peach)',
                color: 'var(--pastel-peach-icon)',
                borderColor: 'color-mix(in oklab, var(--pastel-peach-icon) 25%, transparent)',
              }}
            >
              Tu cálculo
            </span>
          )}
          {isRecommended && !isClosestMatch && (
            <span
              className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:text-xs"
              style={{
                background: 'var(--pastel-mint)',
                color: 'var(--pastel-mint-icon)',
                borderColor: 'color-mix(in oklab, var(--pastel-mint-icon) 25%, transparent)',
              }}
            >
              Recomendado
            </span>
          )}
        </span>
        {projectionSubtitle && (
          <p className="mt-1 text-[10px] leading-snug text-muted">{projectionSubtitle}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p className="text-base font-bold tabular-nums text-ink sm:text-lg">
            {displayKcal.toLocaleString('es-ES')}
          </p>
          <p className="text-[10px] text-muted">
            {adaptedKcal != null && (isSelected || isClosestMatch) && adaptedKcal !== kcal
              ? isRecommended
                ? `por fecha · ref. ${kcal.toLocaleString('es-ES')}`
                : `adaptado · ref. ${kcal.toLocaleString('es-ES')}`
              : 'kcal/día'}
          </p>
        </div>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          style={
            isSelected || isClosestMatch
              ? { borderColor: style.iconColor, background: style.iconBg }
              : { borderColor: 'var(--border-subtle)', background: 'var(--surface)' }
          }
          aria-hidden
        >
          {(isSelected || isClosestMatch) && (
            <CheckSmallIcon className="h-3 w-3" style={{ color: style.iconColor }} />
          )}
        </span>
      </div>
    </button>
  );
}
