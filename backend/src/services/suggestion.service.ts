import type { PrismaClientType } from '../lib/prisma.js';
import type { MealType } from '@prisma/client';

export function createSuggestionService(prisma: PrismaClientType) {
  return {
    async suggest(
      householdId: string,
      userId: string,
      mealType: MealType,
      date: string,
      limit = 5
    ) {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - 7);
      const recentItems = await prisma.mealPlanItem.findMany({
        where: {
          householdId,
          date: { gte: weekStart, lte: new Date(date) },
          recipeId: { not: null },
        },
        select: { recipeId: true },
      });
      const recentRecipeIds = recentItems
        .map((i) => i.recipeId)
        .filter((id): id is string => id !== null);

      const favorites = await prisma.userFavorite.findMany({
        where: { userId },
        select: { recipeId: true },
      });
      const favoriteIds = new Set(favorites.map((f) => f.recipeId));

      const candidates = await prisma.recipe.findMany({
        where: {
          householdId,
          categories: { some: { mealType } },
        },
        include: {
          ingredients: { orderBy: { order: 'asc' } },
          categories: true,
          tags: { include: { tag: true } },
        },
        take: 50,
      });

      const scored = candidates.map((recipe) => {
        let score = 0;
        if (favoriteIds.has(recipe.id)) score += 10;
        if (!recentRecipeIds.includes(recipe.id)) score += 5;
        score += Math.random() * 3;
        return { recipe, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map((s) => s.recipe);
    },
  };
}
