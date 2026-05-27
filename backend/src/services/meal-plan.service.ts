import {
  addDaysToMealPlanDate,
  daysBetweenIso,
  mealPlanDateToIso,
  parseMealPlanDate,
} from '../lib/meal-plan-dates.js';
import type { PrismaClientType } from '../lib/prisma.js';
import type { MealType } from '@prisma/client';

interface CreateMealPlanItemInput {
  date: string;
  mealType: MealType;
  recipeId?: string;
  customMealName?: string;
}

interface UpdateMealPlanItemInput {
  recipeId?: string | null;
  customMealName?: string | null;
}

export function createMealPlanService(prisma: PrismaClientType) {
  return {
    async addItem(householdId: string, input: CreateMealPlanItemInput) {
      if (input.recipeId) {
        const recipe = await prisma.recipe.findFirst({
          where: { id: input.recipeId, householdId },
          select: { id: true },
        });
        if (!recipe) {
          throw Object.assign(new Error('Receta no encontrada en este hogar'), { statusCode: 400 });
        }
      }
      return prisma.mealPlanItem.create({
        data: {
          date: parseMealPlanDate(input.date),
          mealType: input.mealType,
          recipeId: input.recipeId,
          customMealName: input.customMealName,
          householdId,
        },
        include: { recipe: { include: { categories: true } } },
      });
    },

    async updateItem(itemId: string, householdId: string, input: UpdateMealPlanItemInput) {
      const item = await prisma.mealPlanItem.findFirst({ where: { id: itemId, householdId } });
      if (!item) throw new Error('Item del plan no encontrado');
      return prisma.mealPlanItem.update({
        where: { id: itemId },
        data: {
          recipeId: input.recipeId,
          customMealName: input.customMealName,
        },
        include: { recipe: { include: { categories: true } } },
      });
    },

    async deleteItem(itemId: string, householdId: string) {
      const item = await prisma.mealPlanItem.findFirst({ where: { id: itemId, householdId } });
      if (!item) throw new Error('Item del plan no encontrado');
      return prisma.mealPlanItem.delete({ where: { id: itemId } });
    },

    async getByDateRange(householdId: string, startDate: string, endDate: string) {
      return prisma.mealPlanItem.findMany({
        where: {
          householdId,
          date: {
            gte: parseMealPlanDate(startDate),
            lte: parseMealPlanDate(endDate),
          },
        },
        include: { recipe: { include: { categories: true } } },
        orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
      });
    },

    async copyDay(householdId: string, sourceDate: string, targetDate: string) {
      const sourceItems = await prisma.mealPlanItem.findMany({
        where: { householdId, date: parseMealPlanDate(sourceDate) },
      });
      if (sourceDate !== targetDate) {
        await prisma.mealPlanItem.deleteMany({
          where: { householdId, date: parseMealPlanDate(targetDate) },
        });
      }
      const created = await Promise.all(
        sourceItems.map((item) =>
          prisma.mealPlanItem.create({
            data: {
              date: parseMealPlanDate(targetDate),
              mealType: item.mealType,
              recipeId: item.recipeId,
              customMealName: item.customMealName,
              householdId,
            },
            include: { recipe: { include: { categories: true } } },
          })
        )
      );
      return created;
    },

    async clearDay(householdId: string, date: string) {
      return prisma.mealPlanItem.deleteMany({
        where: { householdId, date: parseMealPlanDate(date) },
      });
    },

    async copyWeek(householdId: string, sourceStartDate: string, targetStartDate: string) {
      const sourceStart = parseMealPlanDate(sourceStartDate);
      const sourceEnd = addDaysToMealPlanDate(sourceStartDate, 6);

      const sourceItems = await prisma.mealPlanItem.findMany({
        where: {
          householdId,
          date: { gte: sourceStart, lte: sourceEnd },
        },
      });

      const targetStart = parseMealPlanDate(targetStartDate);
      const targetEnd = addDaysToMealPlanDate(targetStartDate, 6);
      await prisma.mealPlanItem.deleteMany({
        where: {
          householdId,
          date: { gte: targetStart, lte: targetEnd },
        },
      });

      const created = await Promise.all(
        sourceItems.map((item) => {
          const itemIso = mealPlanDateToIso(item.date);
          const dayOffset = daysBetweenIso(sourceStartDate, itemIso);
          const targetDate = addDaysToMealPlanDate(targetStartDate, dayOffset);

          return prisma.mealPlanItem.create({
            data: {
              date: targetDate,
              mealType: item.mealType,
              recipeId: item.recipeId,
              customMealName: item.customMealName,
              householdId,
            },
            include: { recipe: { include: { categories: true } } },
          });
        })
      );
      return created;
    },
  };
}
