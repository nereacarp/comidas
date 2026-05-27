import { describe, expect, it } from 'vitest';
import { groupPantryByLocation, pantryGroupsItemsKey } from './pantry-groups';
import type { PantryItem, StorageLocation } from '../types';

const loc = (id: string, name: string, layoutColumn: number, order: number): StorageLocation => ({
  id,
  name,
  icon: 'cabinet',
  order,
  layoutColumn,
});

const item = (id: string, name: string, locationId?: string): PantryItem => ({
  id,
  name,
  quantity: 1,
  unit: 'g',
  locationId: locationId ?? null,
  householdId: 'h',
  createdAt: '',
  updatedAt: '',
});

describe('groupPantryByLocation', () => {
  it('lists every ubicación even when empty', () => {
    const groups = groupPantryByLocation(
      [item('1', 'Arroz', 'despensa')],
      [loc('nevera', 'Nevera', 0, 0), loc('despensa', 'Despensa', 2, 0)],
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].location?.name).toBe('Nevera');
    expect(groups[0].items).toHaveLength(0);
    expect(groups[1].location?.name).toBe('Despensa');
    expect(groups[1].items).toHaveLength(1);
  });

  it('pantryGroupsItemsKey changes when items are added', () => {
    const locations = [loc('nevera', 'Nevera', 0, 0)];
    const before = groupPantryByLocation([], locations);
    const after = groupPantryByLocation([item('1', 'Leche', 'nevera')], locations);
    expect(pantryGroupsItemsKey(before)).not.toBe(pantryGroupsItemsKey(after));
  });

  it('puts unknown location ids in sin ubicación', () => {
    const groups = groupPantryByLocation(
      [item('1', 'Leche', 'missing-id')],
      [loc('nevera', 'Nevera', 0, 0)],
    );
    expect(groups.find((g) => g.location === null)?.items).toHaveLength(1);
  });
});
