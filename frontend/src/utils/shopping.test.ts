import { describe, it, expect } from 'vitest';
import { groupShoppingItems } from './shopping';
import type { ShoppingListItem } from '../types';

function item(overrides: Partial<ShoppingListItem> & Pick<ShoppingListItem, 'id' | 'name'>): ShoppingListItem {
  return {
    checked: false,
    isManual: false,
    ...overrides,
  };
}

describe('groupShoppingItems', () => {
  it('enables purchase flow for recipe items with quantity and unit', () => {
    const grouped = groupShoppingItems([
      item({ id: '1', name: 'Huevos', quantity: 6, unit: 'uds' }),
    ]);
    expect(grouped[0].supportsPurchaseFlow).toBe(true);
    expect(grouped[0].neededQuantity).toBe(6);
    expect(grouped[0].purchaseUnit).toBe('uds');
  });

  it('enables purchase flow for manual items with quantity and unit', () => {
    const grouped = groupShoppingItems([
      item({ id: '1', name: 'Huevos', quantity: 6, unit: 'uds', isManual: true }),
    ]);
    expect(grouped[0].supportsPurchaseFlow).toBe(true);
    expect(grouped[0].isManual).toBe(true);
  });

  it('keeps purchase flow when manual and recipe lines share a name', () => {
    const grouped = groupShoppingItems([
      item({ id: '1', name: 'Huevos', quantity: 3, unit: 'uds', isManual: true }),
      item({ id: '2', name: 'Huevos', quantity: 3, unit: 'uds', isManual: false }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].supportsPurchaseFlow).toBe(true);
    expect(grouped[0].neededQuantity).toBe(6);
    expect(grouped[0].isManual).toBe(false);
  });

  it('disables purchase flow when the group mixes units', () => {
    const grouped = groupShoppingItems([
      item({ id: '1', name: 'Leche', quantity: 1, unit: 'L' }),
      item({ id: '2', name: 'Leche', quantity: 500, unit: 'ml' }),
    ]);
    expect(grouped[0].supportsPurchaseFlow).toBe(false);
  });
});
