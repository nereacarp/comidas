import type { PantryLocationGroupData } from './pantry-groups';
import type { StorageLocation } from '../types';

/** Máximo de columnas en el tablero de despensa. */
export const PANTRY_LAYOUT_COLUMNS = 5;

interface PantryPlacement {
  id: string;
  column: number;
  row: number;
}

export type LocatedPantryGroup = PantryLocationGroupData & { location: StorageLocation };

export function groupsToColumns(
  groups: LocatedPantryGroup[],
  columnCount = PANTRY_LAYOUT_COLUMNS,
): LocatedPantryGroup[][] {
  const columns: LocatedPantryGroup[][] = Array.from({ length: columnCount }, () => []);
  for (const group of groups) {
    const col = Math.min(
      Math.max(0, Number(group.location.layoutColumn) || 0),
      columnCount - 1,
    );
    columns[col].push(group);
  }
  for (const column of columns) {
    column.sort((a, b) => (Number(a.location.order) || 0) - (Number(b.location.order) || 0));
  }
  return columns;
}

export function columnsToPlacements(columns: LocatedPantryGroup[][]): PantryPlacement[] {
  const placements: PantryPlacement[] = [];
  columns.forEach((column, columnIndex) => {
    column.forEach((group, row) => {
      placements.push({
        id: group.location.id,
        column: Math.max(0, Math.min(PANTRY_LAYOUT_COLUMNS - 1, columnIndex)),
        row: Math.max(0, row),
      });
    });
  });
  return placements;
}

function renumberOrdersInColumns(columns: LocatedPantryGroup[][]): LocatedPantryGroup[][] {
  return columns.map((column) =>
    column.map((group, order) => ({
      ...group,
      location: { ...group.location, order },
    })),
  );
}

export function flattenToMobileStack(columns: LocatedPantryGroup[][]): LocatedPantryGroup[] {
  return columns
    .flat()
    .sort(
      (a, b) =>
        (a.location.layoutColumn ?? 0) - (b.location.layoutColumn ?? 0) ||
        a.location.order - b.location.order,
    );
}

export type PantryDropPosition = 'before' | 'after';

function removeGroupById(
  columns: LocatedPantryGroup[][],
  dragId: string,
): { columns: LocatedPantryGroup[][]; dragged: LocatedPantryGroup | null } {
  const next = columns.map((col) => [...col]);
  for (let c = 0; c < next.length; c++) {
    const index = next[c].findIndex((g) => g.location.id === dragId);
    if (index !== -1) {
      const dragged = next[c].splice(index, 1)[0] ?? null;
      return { columns: next, dragged };
    }
  }
  return { columns: next, dragged: null };
}

export function moveGroupInStack(
  columns: LocatedPantryGroup[][],
  dragId: string,
  targetId: string,
  position: PantryDropPosition,
): LocatedPantryGroup[][] {
  const { columns: without, dragged } = removeGroupById(columns, dragId);
  if (!dragged) return columns;

  const target = without.flat().find((g) => g.location.id === targetId);
  if (!target) return columns;

  const col = target.location.layoutColumn ?? 0;
  const next = without.map((c) => [...c]);
  const list = next[col] ?? [];
  if (!next[col]) next[col] = list;

  const targetIndex = list.findIndex((g) => g.location.id === targetId);
  const insertAt =
    targetIndex === -1 ? list.length : position === 'after' ? targetIndex + 1 : targetIndex;
  const placed = {
    ...dragged,
    location: { ...dragged.location, layoutColumn: col },
  };
  list.splice(insertAt, 0, placed);
  return renumberOrdersInColumns(next);
}

export function moveGroupToColumn(
  columns: LocatedPantryGroup[][],
  dragId: string,
  targetColumn: number,
): LocatedPantryGroup[][] {
  const { columns: without, dragged } = removeGroupById(columns, dragId);
  if (!dragged) return columns;

  const col = Math.min(Math.max(0, targetColumn), without.length - 1);
  const next = without.map((c) => [...c]);
  const placed = {
    ...dragged,
    location: { ...dragged.location, layoutColumn: col },
  };
  if (!next[col]) next[col] = [];
  next[col].push(placed);
  return renumberOrdersInColumns(next);
}

export function placementSignature(placements: PantryPlacement[]): string {
  return placements.map((p) => `${p.id}:${p.column}:${p.row}`).join('|');
}

export function finalizeColumns(columns: LocatedPantryGroup[][]): LocatedPantryGroup[][] {
  return renumberOrdersInColumns(columns);
}
