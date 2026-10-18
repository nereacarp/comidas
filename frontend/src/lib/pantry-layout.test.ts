import { describe, expect, it } from 'vitest';
import {
  columnsToPlacements,
  finalizeColumns,
  flattenToMobileStack,
  groupsToColumns,
  moveGroupInStack,
  moveGroupToColumn,
} from './pantry-layout';
import type { LocatedPantryGroup } from './pantry-layout';

function group(id: string, layoutColumn: number, order: number): LocatedPantryGroup {
  return {
    location: { id, name: id, icon: 'cabinet', order, layoutColumn },
    items: [{ id: `i-${id}`, name: 'x', quantity: 1, unit: 'g', householdId: 'h', createdAt: '', updatedAt: '' }],
  };
}

describe('flattenToMobileStack', () => {
  it('orders by column then order', () => {
    const columns = groupsToColumns([
      group('b', 1, 0),
      group('a', 0, 1),
      group('c', 0, 0),
    ]);
    expect(flattenToMobileStack(columns).map((g) => g.location.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('columnsToPlacements', () => {
  it('maps column stacks to placements', () => {
    const columns = groupsToColumns([group('nevera', 0, 0)]);
    expect(columnsToPlacements(columns)[0]).toEqual({
      id: 'nevera',
      column: 0,
      row: 0,
    });
  });
});

describe('moveGroupInStack', () => {
  it('places a group below another in the same column', () => {
    const initial = groupsToColumns([
      group('nevera', 0, 0),
      group('congelador', 1, 0),
      group('armario', 0, 1),
    ]);
    const next = moveGroupInStack(initial, 'armario', 'congelador', 'after');
    expect(next[1].map((g) => g.location.id)).toEqual(['congelador', 'armario']);
  });
});

describe('moveGroupToColumn', () => {
  it('appends to target column', () => {
    const initial = groupsToColumns([group('nevera', 0, 0), group('armario', 0, 1)]);
    const next = moveGroupToColumn(initial, 'armario', 2);
    expect(next[2].map((g) => g.location.id)).toEqual(['armario']);
  });
});

describe('finalizeColumns', () => {
  it('renumbers order within each column', () => {
    const columns = groupsToColumns([group('a', 1, 5), group('b', 1, 2)]);
    const next = finalizeColumns(columns);
    expect(next[1].map((g) => g.location.order)).toEqual([0, 1]);
  });
});
