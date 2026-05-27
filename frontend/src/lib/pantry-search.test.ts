import { describe, expect, it } from 'vitest';
import {
  filterPantryGroupsBySearch,
  findPantrySearchMatches,
  pantryItemMatchesQuery,
} from './pantry-search';
import type { PantryItem, StorageLocation } from '../types';

const item = (id: string, name: string, locationId?: string): PantryItem => ({
  id,
  name,
  quantity: 1,
  unit: 'ud',
  locationId: locationId ?? null,
  householdId: 'h1',
  createdAt: '',
  updatedAt: '',
});

const loc = (id: string, name: string): StorageLocation => ({
  id,
  name,
  icon: 'fridge',
  order: 0,
  layoutColumn: 0,
});

describe('pantryItemMatchesQuery', () => {
  it('matches case-insensitive substring', () => {
    expect(pantryItemMatchesQuery(item('1', 'Leche entera'), 'lech')).toBe(true);
    expect(pantryItemMatchesQuery(item('1', 'Leche'), 'pan')).toBe(false);
  });
});

describe('filterPantryGroupsBySearch', () => {
  it('drops empty groups', () => {
    const groups = filterPantryGroupsBySearch(
      [
        { location: loc('l1', 'Nevera'), items: [item('1', 'Leche', 'l1')] },
        { location: loc('l2', 'Despensa'), items: [item('2', 'Arroz', 'l2')] },
      ],
      'leche',
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items[0]?.name).toBe('Leche');
  });
});

describe('findPantrySearchMatches', () => {
  it('returns location labels', () => {
    const matches = findPantrySearchMatches(
      [item('1', 'Huevos', 'l1'), item('2', 'Sal')],
      [loc('l1', 'Nevera')],
      'hue',
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.locationLabel).toBe('Nevera');
  });

  it('labels unassigned items', () => {
    const matches = findPantrySearchMatches([item('1', 'Sal')], [], 'sal');
    expect(matches[0]?.locationLabel).toBe('Sin ubicación');
  });
});
