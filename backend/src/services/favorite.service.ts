import type { PrismaClientType } from '../lib/prisma.js';

export function createFavoriteService(prisma: PrismaClientType) {
  return {
    async toggle(userId: string, recipeId: string) {
      const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { householdId: true } });
      if (!recipe) throw Object.assign(new Error('Receta no encontrada'), { statusCode: 404 });
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId: recipe.householdId } },
      });
      if (!member) throw Object.assign(new Error('No eres miembro de este hogar'), { statusCode: 403 });

      const existing = await prisma.userFavorite.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
      });
      if (existing) {
        await prisma.userFavorite.delete({ where: { id: existing.id } });
        return { favorited: false };
      }
      await prisma.userFavorite.create({ data: { userId, recipeId } });
      return { favorited: true };
    },

    async list(userId: string) {
      const favorites = await prisma.userFavorite.findMany({
        where: { userId },
        include: {
          recipe: {
            include: {
              ingredients: { orderBy: { order: 'asc' } },
              categories: true,
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return favorites.map((f) => f.recipe);
    },

    async isFavorited(userId: string, recipeId: string) {
      const fav = await prisma.userFavorite.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
      });
      return !!fav;
    },
  };
}
