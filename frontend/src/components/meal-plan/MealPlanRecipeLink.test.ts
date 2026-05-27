import { describe, expect, it } from 'vitest';
import { mealPlanItemRecipeId } from './MealPlanRecipeLink';
import type { MealPlanItem } from '../../types';

describe('mealPlanItemRecipeId', () => {
  it('prefers recipeId then nested recipe id', () => {
    const item = {
      id: 'm1',
      date: '2026-05-25',
      mealType: 'COMIDA',
      householdId: 'h1',
      recipeId: 'r-direct',
      createdAt: '2026-05-25T12:00:00.000Z',
      recipe: { id: 'r-nested', title: 'Tortilla' },
    } as MealPlanItem;

    expect(mealPlanItemRecipeId(item)).toBe('r-direct');
    expect(mealPlanItemRecipeId({ ...item, recipeId: undefined })).toBe('r-nested');
  });
});
