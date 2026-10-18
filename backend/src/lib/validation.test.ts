import { describe, expect, it } from 'vitest';
import { createMealPlanItemSchema, dateRangeSchema, importRecipeSchema, registerSchema } from './validation';

describe('request validation', () => {
  it('normalizes registration email and trims the name', () => {
    const result = registerSchema.parse({
      email: '  USER@Example.COM ', password: 'correct-horse-battery', name: '  Ana  ',
    });
    expect(result).toMatchObject({ email: 'user@example.com', name: 'Ana' });
  });

  it('rejects impossible calendar dates and reversed ranges', () => {
    expect(dateRangeSchema.safeParse({ startDate: '2026-02-30', endDate: '2026-03-01' }).success).toBe(false);
    expect(dateRangeSchema.safeParse({ startDate: '2026-03-02', endDate: '2026-03-01' }).success).toBe(false);
  });

  it('requires exactly one meal source', () => {
    const base = { date: '2026-08-10', mealType: 'COMIDA' };
    expect(createMealPlanItemSchema.safeParse(base).success).toBe(false);
    expect(createMealPlanItemSchema.safeParse({ ...base, recipeId: 'r1', customMealName: 'Fuera' }).success).toBe(false);
    expect(createMealPlanItemSchema.safeParse({ ...base, recipeId: 'r1' }).success).toBe(true);
  });

  it('accepts only HTTP(S) recipe URLs', () => {
    expect(importRecipeSchema.safeParse({ url: 'file:///etc/passwd' }).success).toBe(false);
    expect(importRecipeSchema.safeParse({ url: 'https://example.com/recipe' }).success).toBe(true);
  });
});
