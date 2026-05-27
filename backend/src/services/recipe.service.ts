import { Prisma } from '@prisma/client';
import type { PrismaClientType } from '../lib/prisma.js';
import type { MealType } from '@prisma/client';
import { buildRecipeIngredientWhereClauses } from '../lib/recipe-ingredient-filters.js';

interface CreateRecipeInput {
  title: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  kcal?: number;
  ingredients?: Array<{ name: string; quantity?: number; unit?: string; order?: number }>;
  categories?: MealType[];
  tagIds?: string[];
}

interface UpdateRecipeInput extends CreateRecipeInput {}

interface RecipeFilters {
  search?: string;
  mealType?: MealType;
  tagIds?: string[];
  maxKcal?: number;
  minKcal?: number;
  minTotalTime?: number;
  maxTotalTime?: number;
  ingredient?: string;
  /** @deprecated use pantryIngredients */
  ingredients?: string[];
  pantryIngredients?: string[];
  buyIngredients?: string[];
  favoritesOnly?: boolean;
  userId?: string;
  page?: number;
  limit?: number;
}

function intersectIds(current: string[] | undefined, next: string[]): string[] {
  if (current === undefined) return next;
  const allowed = new Set(next);
  return current.filter((id) => allowed.has(id));
}

async function recipeIdsByKcal(
  prisma: PrismaClientType,
  householdId: string,
  minKcal?: number,
  maxKcal?: number
): Promise<string[]> {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`"householdId" = ${householdId}`,
    Prisma.sql`"kcal" IS NOT NULL`,
  ];
  if (minKcal != null) conditions.push(Prisma.sql`"kcal" >= ${minKcal}`);
  if (maxKcal != null) conditions.push(Prisma.sql`"kcal" < ${maxKcal}`);

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Recipe"
    WHERE ${Prisma.join(conditions, ' AND ')}
  `;
  return rows.map((row) => row.id);
}

async function recipeIdsByTotalTime(
  prisma: PrismaClientType,
  householdId: string,
  minTotalTime?: number,
  maxTotalTime?: number
): Promise<string[]> {
  const totalMinutes = Prisma.sql`COALESCE("prepTime", 0) + COALESCE("cookTime", 0)`;
  const conditions: Prisma.Sql[] = [Prisma.sql`"householdId" = ${householdId}`];
  if (minTotalTime != null) conditions.push(Prisma.sql`${totalMinutes} >= ${minTotalTime}`);
  if (maxTotalTime != null) conditions.push(Prisma.sql`${totalMinutes} < ${maxTotalTime}`);

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Recipe"
    WHERE ${Prisma.join(conditions, ' AND ')}
  `;
  return rows.map((row) => row.id);
}

async function recipeIdsMatchingNumericFilters(
  prisma: PrismaClientType,
  householdId: string,
  filters: { minKcal?: number; maxKcal?: number; minTotalTime?: number; maxTotalTime?: number }
): Promise<string[] | undefined> {
  const { minKcal, maxKcal, minTotalTime, maxTotalTime } = filters;
  const hasKcal = minKcal != null || maxKcal != null;
  const hasTime = minTotalTime != null || maxTotalTime != null;
  if (!hasKcal && !hasTime) return undefined;

  let ids: string[] | undefined;

  if (hasKcal) {
    ids = await recipeIdsByKcal(prisma, householdId, minKcal, maxKcal);
  }
  if (hasTime) {
    const timeIds = await recipeIdsByTotalTime(prisma, householdId, minTotalTime, maxTotalTime);
    ids = intersectIds(ids, timeIds);
  }

  return ids;
}

export function createRecipeService(prisma: PrismaClientType) {
  return {
    async create(householdId: string, input: CreateRecipeInput) {
      if (input.tagIds && input.tagIds.length > 0) {
        const validTags = await prisma.tag.findMany({
          where: { id: { in: input.tagIds }, householdId },
          select: { id: true },
        });
        if (validTags.length !== input.tagIds.length) {
          throw Object.assign(new Error('Una o más etiquetas no son válidas'), { statusCode: 400 });
        }
      }
      return prisma.recipe.create({
        data: {
          title: input.title,
          description: input.description,
          instructions: input.instructions,
          prepTime: input.prepTime,
          cookTime: input.cookTime,
          servings: input.servings,
          imageUrl: input.imageUrl,
          kcal: input.kcal,
          householdId,
          ingredients: input.ingredients
            ? { create: input.ingredients.map((ing, i) => ({ ...ing, order: ing.order ?? i })) }
            : undefined,
          categories: input.categories
            ? { create: input.categories.map((mealType) => ({ mealType })) }
            : undefined,
          tags: input.tagIds
            ? { create: input.tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: {
          ingredients: { orderBy: { order: 'asc' } },
          categories: true,
          tags: { include: { tag: true } },
        },
      });
    },

    async getById(recipeId: string, householdId: string) {
      const recipe = await prisma.recipe.findFirst({
        where: { id: recipeId, householdId },
        include: {
          ingredients: { orderBy: { order: 'asc' } },
          categories: true,
          tags: { include: { tag: true } },
          favorites: true,
        },
      });
      if (!recipe) {
        throw new Error('Receta no encontrada');
      }
      return recipe;
    },

    async list(householdId: string, filters: RecipeFilters = {}) {
      const {
        search,
        mealType,
        tagIds,
        maxKcal,
        minKcal,
        minTotalTime,
        maxTotalTime,
        ingredient,
        ingredients,
        pantryIngredients,
        buyIngredients,
        favoritesOnly,
        userId,
        page = 1,
        limit = 20,
      } = filters;
      const where: Record<string, unknown> = { householdId };

      if (favoritesOnly && userId) {
        where.favorites = { some: { userId } };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (mealType) {
        where.categories = { some: { mealType } };
      }

      if (tagIds && tagIds.length > 0) {
        where.tags = { some: { tagId: { in: tagIds } } };
      }

      const legacyPantry = ingredient?.trim() ? [ingredient.trim()] : [];
      const ingredientClauses = buildRecipeIngredientWhereClauses({
        pantryIngredients: [...(pantryIngredients ?? []), ...(ingredients ?? []), ...legacyPantry],
        buyIngredients: buyIngredients ?? [],
      });

      if (ingredientClauses.length > 0) {
        const existingAnd = Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : [];
        where.AND = [...existingAnd, ...ingredientClauses];
      }

      const numericIds = await recipeIdsMatchingNumericFilters(prisma, householdId, {
        minKcal,
        maxKcal,
        minTotalTime,
        maxTotalTime,
      });
      if (numericIds !== undefined) {
        where.id = numericIds.length > 0 ? { in: numericIds } : { in: ['__no_match__'] };
      }

      const [recipes, total] = await Promise.all([
        prisma.recipe.findMany({
          where,
          include: {
            ingredients: { orderBy: { order: 'asc' } },
            categories: true,
            tags: { include: { tag: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.recipe.count({ where }),
      ]);

      return { recipes, total, page, limit };
    },

    async update(recipeId: string, householdId: string, input: UpdateRecipeInput) {
      const existing = await prisma.recipe.findFirst({ where: { id: recipeId, householdId } });
      if (!existing) throw new Error('Receta no encontrada');

      if (input.tagIds && input.tagIds.length > 0) {
        const validTags = await prisma.tag.findMany({
          where: { id: { in: input.tagIds }, householdId },
          select: { id: true },
        });
        if (validTags.length !== input.tagIds.length) {
          throw Object.assign(new Error('Una o más etiquetas no son válidas'), { statusCode: 400 });
        }
      }

      await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
      await prisma.recipeCategory.deleteMany({ where: { recipeId } });
      await prisma.recipeTag.deleteMany({ where: { recipeId } });

      return prisma.recipe.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          description: input.description,
          instructions: input.instructions,
          prepTime: input.prepTime,
          cookTime: input.cookTime,
          servings: input.servings,
          imageUrl: input.imageUrl,
          kcal: input.kcal,
          ingredients: input.ingredients
            ? { create: input.ingredients.map((ing, i) => ({ ...ing, order: ing.order ?? i })) }
            : undefined,
          categories: input.categories
            ? { create: input.categories.map((mealType) => ({ mealType })) }
            : undefined,
          tags: input.tagIds
            ? { create: input.tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: {
          ingredients: { orderBy: { order: 'asc' } },
          categories: true,
          tags: { include: { tag: true } },
        },
      });
    },

    async delete(recipeId: string, householdId: string) {
      const existing = await prisma.recipe.findFirst({ where: { id: recipeId, householdId } });
      if (!existing) throw new Error('Receta no encontrada');
      return prisma.recipe.delete({ where: { id: recipeId } });
    },
  };
}
