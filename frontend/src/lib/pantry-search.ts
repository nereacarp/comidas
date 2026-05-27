import type { PantryItem, StorageLocation } from '../types';
import type { PantryLocationGroupData } from '../utils/pantry-groups';

export interface PantrySearchMatch {
  item: PantryItem;
  locationLabel: string;
  locationId: string | null;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function pantryItemMatchesQuery(item: PantryItem, query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  return item.name.toLowerCase().includes(q);
}

export function filterPantryGroupsBySearch(
  groups: PantryLocationGroupData[],
  query: string,
): PantryLocationGroupData[] {
  const q = normalizeQuery(query);
  if (!q) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => pantryItemMatchesQuery(item, query)),
    }))
    .filter((group) => group.items.length > 0);
}

export function findPantrySearchMatches(
  items: PantryItem[],
  locations: StorageLocation[],
  query: string,
): PantrySearchMatch[] {
  const q = normalizeQuery(query);
  if (!q) return [];

  const locationById = new Map(locations.map((loc) => [loc.id, loc]));

  return items
    .filter((item) => pantryItemMatchesQuery(item, q))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
    .map((item) => {
      const location = item.locationId ? locationById.get(item.locationId) : null;
      return {
        item,
        locationId: item.locationId ?? null,
        locationLabel: location?.name ?? 'Sin ubicación',
      };
    });
}
