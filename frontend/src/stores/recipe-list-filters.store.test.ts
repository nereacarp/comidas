import { describe, expect, it, beforeEach } from 'vitest';
import { useRecipeListFiltersStore } from './recipe-list-filters.store';

describe('useRecipeListFiltersStore', () => {
  beforeEach(() => {
    useRecipeListFiltersStore.getState().reset();
  });

  it('stores filter fields and resets to defaults', () => {
    const store = useRecipeListFiltersStore.getState();
    store.setSearch('tortilla');
    store.setMealType('CENA');
    store.setSelectedTagIds(['t1']);
    store.setAdvanced({
      kcalRangeIdx: 2,
      timeRangeIdx: 1,
      ingredientFilters: [{ name: 'Huevo', inPantry: true }],
    });
    store.setPage(3);

    expect(useRecipeListFiltersStore.getState().search).toBe('tortilla');
    expect(useRecipeListFiltersStore.getState().page).toBe(3);

    store.reset();

    const after = useRecipeListFiltersStore.getState();
    expect(after.search).toBe('');
    expect(after.mealType).toBe('');
    expect(after.selectedTagIds).toEqual([]);
    expect(after.advanced.ingredientFilters).toEqual([]);
    expect(after.page).toBe(1);
  });
});
