import type { ReactNode } from 'react';
import { AppleIcon, HeartIcon, MoonIcon, SunIcon, UtensilsIcon } from '../ui/Icons';
import { MEAL_TYPE_LABELS } from '../../utils/meal-type';
import { mealTypePlanLabelStyle, mealTypePlanSectionStyle } from '../../utils/meal-type';
import { MonthDayMealsGrid, MonthMealThumb, sortMealPlanItemsByType } from './MonthMealThumb';
import type { MealPlanItem, MealType } from '../../types';

const MEAL_TYPE_ORDER: MealType[] = ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK'];

const MEAL_ICONS: Record<MealType, ReactNode> = {
  DESAYUNO: <SunIcon className="w-3 h-3" />,
  COMIDA: <UtensilsIcon className="w-3 h-3" />,
  CENA: <MoonIcon className="w-3 h-3" />,
  SNACK: <AppleIcon className="w-3 h-3" />,
  POSTRE: <HeartIcon className="w-3 h-3" />,
};

interface MonthDayCellMealsProps {
  date: string;
  items: MealPlanItem[];
  showEmptySlots: boolean;
  canEdit: boolean;
  onAdd: (date: string, mealType: MealType) => void;
  previewOnly?: boolean;
}

function MonthMealEmptySlot({
  date,
  mealType,
  canEdit,
  onAdd,
}: Readonly<{
  date: string;
  mealType: MealType;
  canEdit: boolean;
  onAdd: (date: string, mealType: MealType) => void;
}>) {
  if (!canEdit) {
    return (
      <div
        className="meal-plan-month-slot-empty meal-plan-month-slot-empty--readonly"
        style={mealTypePlanSectionStyle(mealType, 'empty-slot')}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      className="meal-plan-month-slot-empty"
      style={mealTypePlanSectionStyle(mealType, 'empty-slot')}
      onClick={() => onAdd(date, mealType)}
      aria-label={`Añadir ${MEAL_TYPE_LABELS[mealType]}`}
    >
      <span className="meal-plan-month-slot-empty__icon" style={mealTypePlanLabelStyle(mealType)}>
        {MEAL_ICONS[mealType]}
      </span>
      <span className="meal-plan-month-slot-empty__plus" aria-hidden>
        +
      </span>
    </button>
  );
}

export function MonthDayCellMeals({
  date,
  items,
  showEmptySlots,
  canEdit,
  onAdd,
  previewOnly = false,
}: Readonly<MonthDayCellMealsProps>) {
  if (previewOnly) {
    return <MonthDayMealsGrid items={items} size="sm" />;
  }

  if (!showEmptySlots) {
    return <MonthDayMealsGrid items={items} />;
  }

  return (
    <div className="meal-plan-month-day-meals">
      {MEAL_TYPE_ORDER.map((mealType) => {
        const item = items.find((i) => i.mealType === mealType);
        if (item) {
          return <MonthMealThumb key={item.id} item={item} />;
        }
        return (
          <MonthMealEmptySlot
            key={mealType}
            date={date}
            mealType={mealType}
            canEdit={canEdit}
            onAdd={onAdd}
          />
        );
      })}
    </div>
  );
}

export { sortMealPlanItemsByType };
