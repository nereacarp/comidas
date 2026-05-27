import { describe, it, expect } from 'vitest';
import { parseRecipeListFilters } from './recipe-list-filters.js';

describe('parseRecipeListFilters', () => {
  it('parses kcal and time ranges from query strings', () => {
    expect(
      parseRecipeListFilters({
        minKcal: '200',
        maxKcal: '350',
        minTotalTime: '30',
        maxTotalTime: '45',
        page: '1',
        limit: '20',
      })
    ).toEqual({
      search: undefined,
      mealType: undefined,
      tagIds: undefined,
      ingredients: undefined,
      pantryIngredients: undefined,
      buyIngredients: undefined,
      ingredient: undefined,
      page: 1,
      limit: 20,
      minKcal: 200,
      maxKcal: 350,
      minTotalTime: 30,
      maxTotalTime: 45,
    });
  });

  it('parses favoritesOnly from query string', () => {
    expect(parseRecipeListFilters({ favoritesOnly: 'true' })).toMatchObject({
      favoritesOnly: true,
    });
    expect(parseRecipeListFilters({ favoritesOnly: '1' })).toMatchObject({
      favoritesOnly: true,
    });
    expect(parseRecipeListFilters({})).toMatchObject({
      favoritesOnly: undefined,
    });
  });

  it('parses numeric filters even when meal type is invalid', () => {
    expect(
      parseRecipeListFilters({
        mealType: 'INVALID',
        maxKcal: '200',
      })
    ).toMatchObject({
      mealType: undefined,
      maxKcal: 200,
    });
  });
});
