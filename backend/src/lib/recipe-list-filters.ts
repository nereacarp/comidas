import { z } from 'zod';
import type { MealType } from '@prisma/client';

const MEAL_TYPES = ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK'] as const;

const recipeFiltersSchema = z.object({
  search: z.string().optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
  tagIds: z.string().optional(),
  ingredient: z.string().optional(),
  ingredients: z.string().optional(),
  pantryIngredients: z.string().optional(),
  buyIngredients: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export interface ParsedRecipeListFilters {
  search?: string;
  mealType?: MealType;
  tagIds?: string[];
  minKcal?: number;
  maxKcal?: number;
  minTotalTime?: number;
  maxTotalTime?: number;
  ingredient?: string;
  ingredients?: string[];
  pantryIngredients?: string[];
  buyIngredients?: string[];
  favoritesOnly?: boolean;
  page?: number;
  limit?: number;
}

function parseFavoritesOnly(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1' || value === true) return true;
  return undefined;
}

function splitIngredientList(value?: string): string[] | undefined {
  if (!value) return undefined;
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export function parseRecipeListFilters(query: Record<string, unknown>): ParsedRecipeListFilters {
  const parsed = recipeFiltersSchema.safeParse(query);
  const base = parsed.success ? parsed.data : {};

  const minKcal = parseOptionalInt(query.minKcal);
  const maxKcal = parseOptionalInt(query.maxKcal);
  const minTotalTime = parseOptionalInt(query.minTotalTime);
  const maxTotalTime = parseOptionalInt(query.maxTotalTime);

  return {
    search: base.search,
    mealType: base.mealType,
    tagIds: base.tagIds ? base.tagIds.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    ingredients: splitIngredientList(base.ingredients),
    pantryIngredients: splitIngredientList(base.pantryIngredients) ?? splitIngredientList(base.ingredients),
    buyIngredients: splitIngredientList(base.buyIngredients),
    ingredient: base.ingredient,
    page: base.page,
    limit: base.limit,
    minKcal: minKcal != null && minKcal >= 0 ? minKcal : undefined,
    maxKcal: maxKcal != null && maxKcal > 0 ? maxKcal : undefined,
    minTotalTime: minTotalTime != null && minTotalTime >= 0 ? minTotalTime : undefined,
    maxTotalTime: maxTotalTime != null && maxTotalTime > 0 ? maxTotalTime : undefined,
    favoritesOnly: parseFavoritesOnly(query.favoritesOnly),
  };
}
