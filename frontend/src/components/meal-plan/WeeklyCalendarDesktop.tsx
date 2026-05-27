import type { ReactNode } from 'react';
import type { DayClipboardAction } from '../../lib/meal-plan-day-clipboard';
import { WeeklyDayColumn, type PlanKcalColors } from './WeeklyDayColumn';
import type { MealPlanItem, MealType } from '../../types';

interface MealTypeConfig {
  value: MealType;
  label: string;
  icon: ReactNode;
}

interface WeeklyCalendarDesktopProps {
  dates: string[];
  dayNames: string[];
  formatDayDate: (iso: string) => string;
  today: string;
  mealTypes: MealTypeConfig[];
  getItem: (date: string, mealType: MealType) => MealPlanItem | undefined;
  getDayKcal: (date: string) => number;
  getCalorieTarget: (date: string) => number | null;
  planKcalColors: PlanKcalColors;
  onAdd: (date: string, mealType: MealType) => void;
  onEatOut: (date: string, mealType: MealType) => void;
  onRemove: (itemId: string) => void;
  copiedDate: string | null;
  busyDate: string | null;
  onDayClipboard: (date: string) => void;
  getDayClipboardLabel: (date: string) => string | null;
  getDayClipboardAction: (date: string) => DayClipboardAction | null;
  dayHasMeals: (date: string) => boolean;
  canEdit: boolean;
  showCalories: boolean;
}

export function WeeklyCalendarDesktop({
  dates,
  dayNames,
  formatDayDate,
  today,
  mealTypes,
  getItem,
  getDayKcal,
  getCalorieTarget,
  planKcalColors,
  onAdd,
  onEatOut,
  onRemove,
  copiedDate,
  busyDate,
  onDayClipboard,
  getDayClipboardLabel,
  getDayClipboardAction,
  dayHasMeals,
  canEdit,
  showCalories,
}: Readonly<WeeklyCalendarDesktopProps>) {
  return (
    <div className="meal-plan-week-board hidden md:block">
      <div className="meal-plan-week-columns">
        {dates.map((date, index) => (
          <WeeklyDayColumn
            key={date}
            date={date}
            dayName={dayNames[index]}
            dayDateLabel={formatDayDate(date)}
            isToday={date === today}
            mealTypes={mealTypes}
            getItem={getItem}
            onAdd={onAdd}
            onEatOut={onEatOut}
            onRemove={onRemove}
            dayClipboardLabel={getDayClipboardLabel(date)}
            dayClipboardAction={getDayClipboardAction(date)}
            onDayClipboard={() => onDayClipboard(date)}
            dayClipboardBusy={busyDate === date}
            isClipboardSource={copiedDate === date}
            hasMeals={dayHasMeals(date)}
            canEdit={canEdit}
            showCalories={showCalories}
            totalKcal={getDayKcal(date)}
            calorieTarget={getCalorieTarget(date)}
            planKcalColors={planKcalColors}
          />
        ))}
      </div>
    </div>
  );
}
