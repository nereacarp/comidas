import type { CSSProperties, ReactNode } from 'react';
import { FlameIcon } from '../ui/Icons';
import type { DayClipboardAction } from '../../lib/meal-plan-day-clipboard';
import { MealSlot } from '../MealSlot';
import { getDayKcalStatus, kcalStatusLabel, kcalStatusTone } from '../../lib/meal-plan-kcal-status';
import { mealTypePlanLabelStyle, mealTypePlanSectionStyle } from '../../utils/meal-type';
import type { MealPlanItem, MealType } from '../../types';

interface MealTypeConfig {
  value: MealType;
  label: string;
  icon: ReactNode;
}

export interface PlanKcalColors {
  onTrack: string;
  over: string;
  under: string;
}

interface WeeklyDayColumnProps {
  date: string;
  dayName: string;
  dayDateLabel: string;
  isToday: boolean;
  mealTypes: MealTypeConfig[];
  getItem: (date: string, mealType: MealType) => MealPlanItem | undefined;
  onAdd: (date: string, mealType: MealType) => void;
  onEatOut: (date: string, mealType: MealType) => void;
  onRemove: (itemId: string) => void;
  canEdit: boolean;
  showCalories: boolean;
  totalKcal: number;
  calorieTarget: number | null;
  planKcalColors: PlanKcalColors;
  dayClipboardLabel?: string | null;
  dayClipboardAction?: DayClipboardAction | null;
  onDayClipboard?: () => void;
  dayClipboardBusy?: boolean;
  isClipboardSource?: boolean;
  hasMeals?: boolean;
}

function kcalAccentColor(status: ReturnType<typeof getDayKcalStatus>, _colors: PlanKcalColors): string {
  return kcalStatusTone(status).color;
}

export function WeeklyDayColumn({
  date,
  dayName,
  dayDateLabel,
  isToday,
  mealTypes,
  getItem,
  onAdd,
  onEatOut,
  onRemove,
  canEdit,
  showCalories,
  totalKcal,
  calorieTarget,
  planKcalColors,
  dayClipboardLabel = null,
  dayClipboardAction = null,
  onDayClipboard,
  dayClipboardBusy = false,
  isClipboardSource = false,
  hasMeals: _hasMeals = false,
}: Readonly<WeeklyDayColumnProps>) {
  const status = getDayKcalStatus(totalKcal, calorieTarget);
  const diff = calorieTarget !== null && totalKcal > 0 ? totalKcal - calorieTarget : null;
  const accent = kcalAccentColor(status, planKcalColors);
  const statusHint = kcalStatusLabel(status);

  const kcalStyle: CSSProperties = { color: accent };

  return (
    <article
      className={[
        'meal-plan-day-column',
        isToday && 'meal-plan-day-column--today',
        isClipboardSource && 'meal-plan-day-column--copied',
        dayClipboardAction === 'paste' && 'meal-plan-day-column--paste-ready',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="meal-plan-day-column__head shrink-0">
        <div className="meal-plan-day-column__head-row">
          <p className="meal-plan-day-column__name">{dayName}</p>
          {canEdit && dayClipboardLabel && onDayClipboard && (
            <button
              type="button"
              onClick={onDayClipboard}
              disabled={dayClipboardBusy}
              className={`meal-plan-copy-btn !px-2 !py-1 !text-[10px] shrink-0 ${
                dayClipboardAction === 'paste' ? 'meal-plan-paste-btn' : ''
              }`}
              title={
                dayClipboardAction === 'paste'
                  ? `Pegar comidas copiadas en ${dayName}`
                  : `Copiar comidas de ${dayName}`
              }
            >
              {dayClipboardLabel}
            </button>
          )}
        </div>
        <p className="meal-plan-day-column__date">{dayDateLabel}</p>
      </header>

      <div className="meal-plan-day-column__meals">
        {mealTypes.map((mt) => (
          <div
            key={mt.value}
            className="meal-plan-day-meal"
            style={mealTypePlanSectionStyle(mt.value)}
          >
            <p className="meal-plan-day-meal__label" style={mealTypePlanLabelStyle(mt.value)}>
              <span className="meal-plan-day-meal__icon" aria-hidden>
                {mt.icon}
              </span>
              {mt.label}
            </p>
            <MealSlot
              item={getItem(date, mt.value)}
              onAdd={() => onAdd(date, mt.value)}
              onEatOut={() => onEatOut(date, mt.value)}
              onRemove={onRemove}
              canEdit={canEdit}
            />
          </div>
        ))}
      </div>

      {showCalories && (
        <footer className="meal-plan-day-column__kcal">
          {totalKcal > 0 ? (
            <>
              {statusHint && (
                <p className="meal-plan-day-column__kcal-status" style={kcalStyle}>
                  {statusHint}
                </p>
              )}
              <p className="meal-plan-day-column__kcal-total" style={kcalStyle}>
                <FlameIcon className="w-4 h-4 shrink-0" />
                {totalKcal.toLocaleString('es-ES')} kcal
              </p>
            </>
          ) : (
            <p className="meal-plan-day-column__kcal-empty">Sin datos</p>
          )}
          {calorieTarget !== null && totalKcal > 0 && diff !== null && status !== 'on-track' && (
            <p className="meal-plan-day-column__kcal-diff" style={kcalStyle}>
              {diff > 0 ? `+${diff.toLocaleString('es-ES')}` : diff.toLocaleString('es-ES')} vs objetivo
            </p>
          )}
          {calorieTarget !== null && totalKcal === 0 && (
            <p className="meal-plan-day-column__kcal-target">
              Objetivo {calorieTarget.toLocaleString('es-ES')} kcal
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
