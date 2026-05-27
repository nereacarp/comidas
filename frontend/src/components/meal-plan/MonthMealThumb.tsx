import type { ReactNode } from 'react';
import { AppleIcon, HeartIcon, MoonIcon, SunIcon, UtensilsIcon } from '../ui/Icons';
import { MealPlanRecipeLink, mealPlanItemRecipeId } from './MealPlanRecipeLink';
import { mealTypePlanLabelStyle, mealTypePlanSectionStyle } from '../../utils/meal-type';
import type { MealPlanItem, MealType } from '../../types';

const MEAL_TYPE_ORDER: MealType[] = ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK'];

const MEAL_ICONS: Record<MealType, ReactNode> = {
  DESAYUNO: <SunIcon className="w-3 h-3" />,
  COMIDA: <UtensilsIcon className="w-3 h-3" />,
  CENA: <MoonIcon className="w-3 h-3" />,
  SNACK: <AppleIcon className="w-3 h-3" />,
  POSTRE: <HeartIcon className="w-3 h-3" />,
};

export function sortMealPlanItemsByType(items: MealPlanItem[]): MealPlanItem[] {
  return MEAL_TYPE_ORDER.map((type) => items.find((i) => i.mealType === type))
    .filter((item): item is MealPlanItem => item !== undefined);
}

interface MonthMealThumbProps {
  item: MealPlanItem;
  size?: 'sm' | 'md';
}

function mealTitle(item: MealPlanItem): string {
  return item.recipe?.title || item.customMealName || '';
}

export function MonthMealThumb({ item, size = 'md' }: Readonly<MonthMealThumbProps>) {
  const title = mealTitle(item);
  const imageUrl = item.recipe?.imageUrl;
  const isEatOut = item.customMealName === 'Comer fuera';
  const sizeClass = size === 'sm' ? 'meal-plan-month-thumb--sm' : '';

  if (imageUrl && !isEatOut) {
    const recipeId = mealPlanItemRecipeId(item);
    const thumbClass = `meal-plan-month-thumb ${sizeClass}`;
    const thumbContent = (
      <>
        <img src={imageUrl} alt="" className="meal-plan-month-thumb__img" />
        <span className="meal-plan-month-thumb__type" aria-hidden>
          {MEAL_ICONS[item.mealType]}
        </span>
      </>
    );

    if (recipeId) {
      return (
        <MealPlanRecipeLink recipeId={recipeId} title={title} className={`${thumbClass} meal-plan-month-thumb--link`}>
          {thumbContent}
        </MealPlanRecipeLink>
      );
    }

    return (
      <div className={thumbClass} title={title}>
        {thumbContent}
      </div>
    );
  }

  const label = isEatOut ? 'Fuera' : title;
  const shortLabel = label.length > 14 ? `${label.slice(0, 13)}…` : label;

  return (
    <div
      className={`meal-plan-month-thumb meal-plan-month-thumb--fallback ${sizeClass}`}
      style={mealTypePlanSectionStyle(item.mealType)}
      title={title}
    >
      <span className="meal-plan-month-thumb__icon" style={mealTypePlanLabelStyle(item.mealType)}>
        {isEatOut ? <UtensilsIcon className="w-3.5 h-3.5" /> : MEAL_ICONS[item.mealType]}
      </span>
      <span className="meal-plan-month-thumb__label" style={mealTypePlanLabelStyle(item.mealType)}>
        {shortLabel}
      </span>
    </div>
  );
}

interface MonthDayMealsGridProps {
  items: MealPlanItem[];
  size?: 'sm' | 'md';
}

export function MonthDayMealsGrid({ items, size = 'md' }: Readonly<MonthDayMealsGridProps>) {
  const sorted = sortMealPlanItemsByType(items);
  if (sorted.length === 0) return null;

  const layoutClass =
    size === 'sm' ? 'flex flex-wrap gap-0.5 justify-end shrink-0' : 'meal-plan-month-day-meals';

  return (
    <div className={layoutClass}>
      {sorted.map((item) => (
        <MonthMealThumb key={item.id} item={item} size={size} />
      ))}
    </div>
  );
}
