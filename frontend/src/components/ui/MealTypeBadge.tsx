import { MEAL_TYPE_LABELS, mealTypeBadgeStyle } from '../../utils/meal-type';
import type { MealType } from '../../types';

interface MealTypeBadgeProps {
  mealType: MealType;
}

const BADGE_CLASS =
  'meal-type-badge inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border';

export function MealTypeBadge({ mealType }: Readonly<MealTypeBadgeProps>) {
  return (
    <span className={BADGE_CLASS} style={mealTypeBadgeStyle(mealType)}>
      {MEAL_TYPE_LABELS[mealType]}
    </span>
  );
}
