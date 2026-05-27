/** Deduplicate ingredient names (case-insensitive). */
export function uniqueIngredientNames(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function recipeContainsIngredient(name: string) {
  return {
    ingredients: {
      some: { name: { contains: name, mode: 'insensitive' as const } },
    },
  };
}

function recipeMissingIngredientInPantry(name: string) {
  return {
    AND: [
      recipeContainsIngredient(name),
      {
        household: {
          pantryItems: {
            none: { name: { contains: name, mode: 'insensitive' as const } },
          },
        },
      },
    ],
  };
}

function orClause(clauses: Record<string, unknown>[]) {
  return clauses.length === 1 ? clauses[0] : { OR: clauses };
}

/** Clauses to AND into the recipe list `where` (pantry = tienes; buy = falta en despensa). */
export function buildRecipeIngredientWhereClauses(input: {
  pantryIngredients?: string[];
  buyIngredients?: string[];
  /** @deprecated use pantryIngredients */
  ingredients?: string[];
}): Record<string, unknown>[] {
  const pantryNames = uniqueIngredientNames([
    ...(input.pantryIngredients ?? []),
    ...(input.ingredients ?? []),
  ]);
  const buyNames = uniqueIngredientNames(input.buyIngredients ?? []);

  const clauses: Record<string, unknown>[] = [];

  if (pantryNames.length > 0) {
    clauses.push(
      orClause(pantryNames.map((name) => recipeContainsIngredient(name))),
    );
  }

  if (buyNames.length > 0) {
    clauses.push(
      orClause(buyNames.map((name) => recipeMissingIngredientInPantry(name))),
    );
  }

  return clauses;
}
