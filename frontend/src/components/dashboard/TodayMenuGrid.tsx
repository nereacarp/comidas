import { TodayMealTile, sortTodayMeals } from './TodayMealTile';
import type { MealPlanItem } from '../../types';

interface TodayMenuGridProps {
  meals: MealPlanItem[];
}

function gridRowsForCount(count: number): 1 | 2 {
  return count <= 2 ? 1 : 2;
}

export function TodayMenuGrid({ meals }: Readonly<TodayMenuGridProps>) {
  const sorted = sortTodayMeals(meals);
  const rows = gridRowsForCount(sorted.length);

  return (
    <div className="today-menu-grid" data-rows={rows}>
      {sorted.map((meal) => (
        <TodayMealTile key={meal.id} meal={meal} />
      ))}
    </div>
  );
}
