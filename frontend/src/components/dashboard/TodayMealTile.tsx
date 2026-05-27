import { Link } from 'react-router-dom';
import { UtensilsIcon } from '../ui/Icons';
import { MEAL_TYPE_COLORS, MEAL_TYPE_LABELS, mealTypeBadgeStyle } from '../../utils/meal-type';
import { routes } from '../../lib/routes';
import type { MealPlanItem, MealType } from '../../types';

const MEAL_TYPE_ORDER: MealType[] = ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK'];

export function sortTodayMeals(meals: MealPlanItem[]): MealPlanItem[] {
  return [...meals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType),
  );
}

interface TodayMealTileProps {
  meal: MealPlanItem;
}

export function TodayMealTile({ meal }: Readonly<TodayMealTileProps>) {
  const mealType = meal.mealType;
  const title = meal.recipe?.title || meal.customMealName || 'Sin nombre';
  const imageUrl = meal.recipe?.imageUrl;
  const recipeId = meal.recipe?.id;
  const placeholderBg = `color-mix(in oklab, ${MEAL_TYPE_COLORS[mealType]} 42%, var(--page-bg))`;

  const tile = (
    <article className="today-meal-tile group min-w-0">
      <div className="today-meal-tile__thumb relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[var(--brand)]"
            style={{ background: placeholderBg }}
            aria-hidden
          >
            <UtensilsIcon className="h-6 w-6 opacity-80" />
          </div>
        )}
        <span className="today-meal-tile__label" style={mealTypeBadgeStyle(mealType)}>
          {MEAL_TYPE_LABELS[mealType]}
        </span>
      </div>
      <p className="today-meal-tile__title">{title}</p>
    </article>
  );

  if (recipeId) {
    return (
      <Link to={routes.recipe(recipeId)} className="today-meal-tile-link min-w-0">
        <div className="today-meal-tile-shell">{tile}</div>
      </Link>
    );
  }

  return (
    <div className="today-meal-tile-shell h-full min-w-0">
      {tile}
    </div>
  );
}
