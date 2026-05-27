import { describe, expect, it } from 'vitest';
import { EMPTY_ADVANCED_FILTERS, hasActiveAdvancedFilters } from './RecipeFilters';

describe('hasActiveAdvancedFilters', () => {
  it('returns true when style tags are selected', () => {
    expect(
      hasActiveAdvancedFilters(EMPTY_ADVANCED_FILTERS, { selectedTagIds: ['comfort'] }),
    ).toBe(true);
  });

  it('returns true when ingredient filters are selected', () => {
    expect(
      hasActiveAdvancedFilters(
        {
          ...EMPTY_ADVANCED_FILTERS,
          ingredientFilters: [{ name: 'Pollo', inPantry: true }],
        },
        { selectedTagIds: [] },
      ),
    ).toBe(true);
  });
});
