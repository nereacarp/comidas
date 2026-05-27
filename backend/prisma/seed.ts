import { PrismaClient, type MealType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { accentKeyAtIndex } from '../src/lib/list-accent.js';
import { menuRecipes } from './seed-menu.js';
import { pantryItemData, storageLocationData } from './seed-pantry-data.js';
import {
  addDays,
  aggregateIngredients,
  formatDateLabel,
  pickRecipeForMeal,
  startOfWeek,
  type RecipeWithCategories,
} from './seed-helpers.js';

const prisma = new PrismaClient();

/** Solo esta cuenta. No usa variables de entorno para no pisar otros usuarios. */
const DEMO_EMAIL = 'demo@comidas.app';
const DEMO_PASSWORD = 'comidas123';
const DEMO_NAME = 'Cuenta demo';
const DEMO_HOUSEHOLD_NAME = 'Hogar demo';

const TAGS = [
  { name: 'Rápido', color: '#9bf6ff' },
  { name: 'Proteico', color: '#a8e6cf' },
  { name: 'Gym', color: '#e6ccff' },
  { name: 'Económico', color: '#ffd8a8' },
  { name: 'Comfort food', color: '#ffadad' },
] as const;

async function clearHouseholdData(householdId: string, userId: string) {
  await prisma.shoppingListItem.deleteMany({
    where: { shoppingList: { householdId } },
  });
  await prisma.shoppingList.deleteMany({ where: { householdId } });
  await prisma.mealPlanItem.deleteMany({ where: { householdId } });
  await prisma.userFavorite.deleteMany({ where: { userId } });
  await prisma.recipe.deleteMany({ where: { householdId } });
  await prisma.pantryItem.deleteMany({ where: { householdId } });
  await prisma.storageLocation.deleteMany({ where: { householdId } });
  await prisma.tag.deleteMany({ where: { householdId } });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_NAME, passwordHash },
    create: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash },
  });

  let household = await prisma.household.findFirst({
    where: {
      name: DEMO_HOUSEHOLD_NAME,
      members: { some: { userId: user.id, role: 'OWNER' } },
    },
  });

  if (!household) {
    household = await prisma.household.create({
      data: {
        name: DEMO_HOUSEHOLD_NAME,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    });
  }

  await clearHouseholdData(household.id, user.id);

  const tagRecords = await Promise.all(
    TAGS.map((tag) =>
      prisma.tag.create({
        data: { name: tag.name, color: tag.color, householdId: household!.id },
      }),
    ),
  );

  for (let i = 0; i < menuRecipes.length; i++) {
    const r = menuRecipes[i];
    const tag =
      tagRecords[i % tagRecords.length] ??
      tagRecords[0];
    const recipe = await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        instructions: r.instructions,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        kcal: r.kcal,
        imageUrl: r.imageUrl,
        householdId: household.id,
        ingredients: {
          create: r.ingredients.map((ing, order) => ({
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null,
            order,
          })),
        },
        categories: {
          create: r.categories.map((mealType) => ({ mealType: mealType as MealType })),
        },
        tags: { create: { tagId: tag.id } },
      },
    });
  }

  const locations: Record<string, string> = {};
  for (const loc of storageLocationData) {
    const created = await prisma.storageLocation.create({
      data: { ...loc, householdId: household.id },
    });
    locations[loc.name] = created.id;
  }

  for (const item of pantryItemData) {
    await prisma.pantryItem.create({
      data: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        householdId: household.id,
        locationId: locations[item.location],
      },
    });
  }

  const recipes = await prisma.recipe.findMany({
    where: { householdId: household.id },
    include: { categories: true, ingredients: true },
  });

  const weekStart = startOfWeek();
  const weekEnd = addDays(weekStart, 6);
  const mealSlots: MealType[] = ['DESAYUNO', 'COMIDA', 'CENA'];
  const plannedRecipes: RecipeWithCategories[] = [];

  for (let day = 0; day < 7; day++) {
    const date = addDays(weekStart, day);
    for (const mealType of mealSlots) {
      const recipe = pickRecipeForMeal(recipes, mealType, day);
      if (!recipe) continue;
      await prisma.mealPlanItem.create({
        data: {
          date,
          mealType,
          recipeId: recipe.id,
          householdId: household.id,
        },
      });
      if (!plannedRecipes.some((r) => r.id === recipe.id)) {
        plannedRecipes.push(recipe);
      }
    }
    if (day % 2 === 0) {
      const snack = pickRecipeForMeal(recipes, 'SNACK', day);
      if (snack) {
        await prisma.mealPlanItem.create({
          data: {
            date,
            mealType: 'SNACK',
            recipeId: snack.id,
            householdId: household.id,
          },
        });
        if (!plannedRecipes.some((r) => r.id === snack.id)) {
          plannedRecipes.push(snack);
        }
      }
    }
  }

  const favoriteTargets = recipes.slice(0, 6);
  for (const recipe of favoriteTargets) {
    await prisma.userFavorite.create({
      data: { userId: user.id, recipeId: recipe.id },
    });
  }

  const aggregated = aggregateIngredients(plannedRecipes);
  const currentList = await prisma.shoppingList.create({
    data: {
      name: `Semana del ${formatDateLabel(weekStart)}`,
      startDate: weekStart,
      endDate: weekEnd,
      accentKey: accentKeyAtIndex(0),
      householdId: household.id,
      items: {
        create: [...aggregated.values()].map((item) => ({
          name: item.name,
          quantity: item.quantity || null,
          unit: item.unit || null,
          sourceRecipeId: item.sourceRecipeId,
          checked: false,
        })),
      },
    },
    include: { items: true },
  });

  const prevWeekStart = addDays(weekStart, -7);
  const prevWeekEnd = addDays(weekStart, -1);
  const prevRecipes = recipes.slice(10, 16);
  const prevAggregated = aggregateIngredients(prevRecipes);
  const prevItems = [...prevAggregated.values()];
  await prisma.shoppingList.create({
    data: {
      name: `Semana del ${formatDateLabel(prevWeekStart)}`,
      startDate: prevWeekStart,
      endDate: prevWeekEnd,
      accentKey: accentKeyAtIndex(1),
      householdId: household.id,
      items: {
        create: prevItems.map((item, index) => ({
          name: item.name,
          quantity: item.quantity || null,
          unit: item.unit || null,
          sourceRecipeId: item.sourceRecipeId,
          checked: index % 3 === 0,
        })),
      },
    },
  });

  await prisma.shoppingList.create({
    data: {
      name: 'Compra rápida',
      startDate: weekStart,
      endDate: weekEnd,
      accentKey: accentKeyAtIndex(2),
      householdId: household.id,
      items: {
        create: [
          { name: 'Plátanos', quantity: 6, unit: 'uds', isManual: true, checked: true },
          { name: 'Aguacates', quantity: 2, unit: 'uds', isManual: true, checked: false },
          { name: 'Detergente', quantity: 1, unit: 'bote', isManual: true, checked: false },
        ],
      },
    },
  });

  const mealPlanCount = await prisma.mealPlanItem.count({
    where: { householdId: household.id },
  });

  console.log('\n--- Seed completado ---\n');
  console.log(`Cuenta:     ${DEMO_EMAIL}`);
  console.log(`Contraseña: ${DEMO_PASSWORD}`);
  console.log(`Hogar:      ${DEMO_HOUSEHOLD_NAME} (solo datos de esta cuenta)`);
  console.log(`Recetas:    ${menuRecipes.length}`);
  console.log(`Etiquetas:  ${TAGS.length}`);
  console.log(`Despensa:   ${pantryItemData.length} productos, ${storageLocationData.length} ubicaciones`);
  console.log(`Plan:       ${mealPlanCount} comidas esta semana`);
  console.log(`Favoritos:  ${favoriteTargets.length}`);
  console.log(`Listas:     3 (${currentList.items.length} artículos en la lista actual)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
