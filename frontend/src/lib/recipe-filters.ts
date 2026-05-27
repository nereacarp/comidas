import type { RecipeAdvancedFilters } from '../components/RecipeFilters';
import { kcalRangeToQueryParams } from './kcal-ranges';
import { timeRangeToQueryParams } from './time-ranges';

export function buildRecipeListParams(
  page: number,
  limit: number,
  filters: {
    search: string;
    mealType: string;
    favoritesOnly: boolean;
    selectedTagIds: string[];
    advanced: RecipeAdvancedFilters;
  },
  options?: { showCalories?: boolean },
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.mealType) params.mealType = filters.mealType;
  if (filters.favoritesOnly) params.favoritesOnly = 'true';
  if (filters.selectedTagIds.length > 0) params.tagIds = filters.selectedTagIds.join(',');

  if (options?.showCalories !== false) {
    Object.assign(params, kcalRangeToQueryParams(filters.advanced.kcalRangeIdx));
  }
  Object.assign(params, timeRangeToQueryParams(filters.advanced.timeRangeIdx));

  const pantryIngredients = filters.advanced.ingredientFilters
    .filter((item) => item.inPantry)
    .map((item) => item.name);
  const buyIngredients = filters.advanced.ingredientFilters
    .filter((item) => !item.inPantry)
    .map((item) => item.name);

  if (pantryIngredients.length > 0) {
    params.pantryIngredients = pantryIngredients.join(',');
  }
  if (buyIngredients.length > 0) {
    params.buyIngredients = buyIngredients.join(',');
  }

  return params;
}
