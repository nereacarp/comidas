import { describe, it, expect } from 'vitest';
import { EMPTY_ADVANCED_FILTERS } from '../components/RecipeFilters';
import { buildRecipeListParams } from './recipe-filters';

describe('buildRecipeListParams', () => {
  it('includes pagination defaults', () => {
    expect(
      buildRecipeListParams(2, 12, {
        search: '',
        mealType: '',
        favoritesOnly: false,
        selectedTagIds: [],
        advanced: EMPTY_ADVANCED_FILTERS,
      })
    ).toEqual({ page: '2', limit: '12' });
  });

  it('maps meal type, tags, kcal range, time range, and ingredient filters', () => {
    expect(
      buildRecipeListParams(1, 20, {
        search: '  tortilla ',
        mealType: 'CENA',
        favoritesOnly: true,
        selectedTagIds: ['t1', 't2'],
        advanced: {
          kcalRangeIdx: 2,
          timeRangeIdx: 3,
          ingredientFilters: [
            { name: 'Huevo', inPantry: true },
            { name: 'Pollo', inPantry: true },
            { name: 'Salmón', inPantry: false },
          ],
        },
      })
    ).toEqual({
      page: '1',
      limit: '20',
      search: 'tortilla',
      mealType: 'CENA',
      favoritesOnly: 'true',
      tagIds: 't1,t2',
      minKcal: '200',
      maxKcal: '350',
      minTotalTime: '30',
      maxTotalTime: '45',
      pantryIngredients: 'Huevo,Pollo',
      buyIngredients: 'Salmón',
    });
  });

  it('omits kcal params when showCalories is false', () => {
    expect(
      buildRecipeListParams(
        1,
        20,
        {
          search: '',
          mealType: '',
          favoritesOnly: false,
          selectedTagIds: [],
          advanced: { kcalRangeIdx: 3, timeRangeIdx: 0, ingredientFilters: [] },
        },
        { showCalories: false },
      ),
    ).toEqual({ page: '1', limit: '20' });
  });
});
