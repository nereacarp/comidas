import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FavoriteButton } from './FavoriteButton';
import { UtensilsIcon } from './ui/Icons';
import { MealTypeBadge } from './ui/MealTypeBadge';
import { useShowCalories } from '../hooks/useShowCalories';
import { routes } from '../lib/routes';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

function RecipeMetaChip({ children }: Readonly<{ children: ReactNode }>) {
  return <span className="recipe-meta-chip">{children}</span>;
}

function recipeTotalMinutes(recipe: Recipe): number | null {
  if (recipe.prepTime == null && recipe.cookTime == null) return null;
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

export function RecipeCard({ recipe }: Readonly<RecipeCardProps>) {
  const showCalories = useShowCalories();
  const totalMinutes = recipeTotalMinutes(recipe);
  return (
    <Link
      to={routes.recipe(recipe.id)}
      className="group block card card-hover overflow-hidden h-full flex flex-col"
    >
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt=""
          className="w-full h-28 sm:h-32 lg:h-36 object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-28 sm:h-32 lg:h-36 flex items-center justify-center shrink-0 text-[var(--brand)]"
          style={{ background: 'color-mix(in oklab, var(--pastel-lavender) 40%, var(--page-bg))' }}
        >
          <UtensilsIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>
      )}
      <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <h3 className="text-sm sm:text-base font-semibold text-ink group-hover:text-[var(--brand)] transition-colors line-clamp-2 leading-snug">
            {recipe.title}
          </h3>
          <span
            className="shrink-0 -mr-1"
            onClick={(e) => e.preventDefault()}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <FavoriteButton recipeId={recipe.id} />
          </span>
        </div>
        {recipe.description && (
          <p className="text-xs sm:text-sm text-muted mb-2 line-clamp-2 flex-1">{recipe.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-0.5">
          {recipe.categories?.slice(0, 2).map((cat) => (
            <MealTypeBadge key={cat.id} mealType={cat.mealType} />
          ))}
          {showCalories && recipe.kcal != null && <RecipeMetaChip>{recipe.kcal} kcal</RecipeMetaChip>}
          {totalMinutes != null && totalMinutes > 0 && (
            <RecipeMetaChip>{totalMinutes} min</RecipeMetaChip>
          )}
        </div>
      </div>
    </Link>
  );
}
