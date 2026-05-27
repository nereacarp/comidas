import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../lib/routes';
import type { MealPlanItem } from '../../types';

export function mealPlanItemRecipeId(item: MealPlanItem): string | undefined {
  return item.recipeId ?? item.recipe?.id;
}

interface MealPlanRecipeLinkProps {
  recipeId: string;
  title: string;
  className?: string;
  children: ReactNode;
}

export function MealPlanRecipeLink({
  recipeId,
  title,
  className,
  children,
}: Readonly<MealPlanRecipeLinkProps>) {
  return (
    <Link
      to={routes.recipe(recipeId)}
      className={className}
      title={`Ver receta: ${title}`}
      aria-label={`Ver receta: ${title}`}
      onClick={(e: MouseEvent) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}
