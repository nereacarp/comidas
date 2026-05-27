import { describe, expect, it } from 'vitest';
import { getShoppingListProgress, getShoppingListsOverview } from './shopping-list-stats';
import type { ShoppingList } from '../types';

function list(partial: Partial<ShoppingList> & Pick<ShoppingList, 'id' | 'name'>): ShoppingList {
  return {
    startDate: '2026-05-25',
    endDate: '2026-05-31',
    householdId: 'h1',
    createdAt: '2026-05-25T10:00:00Z',
    items: [],
    ...partial,
  };
}

describe('shopping-list-stats', () => {
  it('computes progress for a list', () => {
    expect(
      getShoppingListProgress(
        list({
          id: '1',
          name: 'Semana',
          items: [
            { id: 'a', name: 'Leche', checked: true, isManual: false },
            { id: 'b', name: 'Pan', checked: false, isManual: false },
          ],
        }),
      ),
    ).toEqual({
      checked: 1,
      total: 2,
      progress: 50,
      isComplete: false,
      pending: 1,
    });
  });

  it('picks the newest in-progress list as active', () => {
    const overview = getShoppingListsOverview([
      list({
        id: 'old',
        name: 'Old',
        createdAt: '2026-05-10T10:00:00Z',
        items: [{ id: 'a', name: 'X', checked: false, isManual: true }],
      }),
      list({
        id: 'new',
        name: 'New',
        createdAt: '2026-05-20T10:00:00Z',
        items: [{ id: 'b', name: 'Y', checked: false, isManual: true }],
      }),
    ]);
    expect(overview.activeListId).toBe('new');
    expect(overview.pendingItems).toBe(2);
  });
});
