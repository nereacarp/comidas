import type { PrismaClientType } from './prisma.js';

export interface IngredientNameSuggestion {
  name: string;
  inPantry: boolean;
}

export function isNameInPantry(ingredientName: string, pantryNames: string[]): boolean {
  const key = ingredientName.trim().toLowerCase();
  if (!key) return false;
  return pantryNames.some((pantryName) => pantryName.trim().toLowerCase().includes(key));
}

function dedupeSuggestions(items: IngredientNameSuggestion[], limit: number): IngredientNameSuggestion[] {
  const seen = new Set<string>();
  const results: IngredientNameSuggestion[] = [];
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    results.push({ name: item.name.trim(), inPantry: item.inPantry });
    if (results.length >= limit) break;
  }
  return results;
}

export async function getIngredientNameSuggestions(
  prisma: PrismaClientType,
  householdId: string,
  query?: string,
): Promise<IngredientNameSuggestion[]> {
  const q = query?.trim().toLowerCase() ?? '';
  const pantryRows = await prisma.pantryItem.findMany({
    where: { householdId },
    select: { name: true },
    orderBy: { name: 'asc' },
  });
  const pantryNames = pantryRows.map((row) => row.name);

  if (q.length < 2) {
    const [pantryItems, recipeIngredients] = await Promise.all([
      prisma.pantryItem.findMany({
        where: { householdId },
        select: { name: true },
        orderBy: { name: 'asc' },
        take: 12,
      }),
      prisma.recipeIngredient.findMany({
        where: { recipe: { householdId } },
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' },
        take: 12,
      }),
    ]);

    const suggestions: IngredientNameSuggestion[] = [
      ...pantryItems.map((item) => ({ name: item.name, inPantry: true })),
      ...recipeIngredients.map((item) => ({
        name: item.name,
        inPantry: isNameInPantry(item.name, pantryNames),
      })),
    ];
    return dedupeSuggestions(suggestions, 15);
  }

  const [pantryMatches, recipeMatches] = await Promise.all([
    prisma.pantryItem.findMany({
      where: { householdId, name: { contains: q, mode: 'insensitive' } },
      select: { name: true },
      distinct: ['name'],
      take: 20,
    }),
    prisma.recipeIngredient.findMany({
      where: {
        recipe: { householdId },
        name: { contains: q, mode: 'insensitive' },
      },
      select: { name: true },
      distinct: ['name'],
      take: 20,
    }),
  ]);

  const suggestions: IngredientNameSuggestion[] = [
    ...pantryMatches.map((item) => ({ name: item.name, inPantry: true })),
    ...recipeMatches.map((item) => ({
      name: item.name,
      inPantry: isNameInPantry(item.name, pantryNames),
    })),
  ];
  return dedupeSuggestions(suggestions, 15);
}
