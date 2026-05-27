import type { MealType } from '@prisma/client';

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export type RecipeWithCategories = {
  id: string;
  title: string;
  categories: { mealType: MealType }[];
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
};

export function pickRecipeForMeal(
  recipes: RecipeWithCategories[],
  mealType: MealType,
  dayIndex: number,
): RecipeWithCategories | null {
  const pool = recipes.filter((r) =>
    r.categories.some((c) => c.mealType === mealType),
  );
  if (pool.length === 0) return null;
  return pool[dayIndex % pool.length];
}

export function aggregateIngredients(
  recipes: RecipeWithCategories[],
): Map<string, { name: string; quantity: number; unit: string; sourceRecipeId: string }> {
  const aggregated = new Map<
    string,
    { name: string; quantity: number; unit: string; sourceRecipeId: string }
  >();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}_${(ing.unit || '').toLowerCase()}`;
      const qty = ing.quantity ?? 0;
      const unit = ing.unit || '';
      const existing = aggregated.get(key);
      if (existing) {
        existing.quantity += qty;
      } else {
        aggregated.set(key, {
          name: ing.name,
          quantity: qty,
          unit,
          sourceRecipeId: recipe.id,
        });
      }
    }
  }

  return aggregated;
}
