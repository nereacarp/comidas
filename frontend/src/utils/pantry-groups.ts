import type { PantryItem, StorageLocation } from '../types';

export interface PantryLocationGroupData {
  location: StorageLocation | null;
  items: PantryItem[];
}

function sortLocations(locations: StorageLocation[]): StorageLocation[] {
  return [...locations].sort(
    (a, b) => (a.layoutColumn ?? 0) - (b.layoutColumn ?? 0) || a.order - b.order,
  );
}

/** Groups items by location; every ubicación appears (even empty). Orphans → sin ubicación. */
export function groupPantryByLocation(
  items: PantryItem[],
  locations: StorageLocation[],
): PantryLocationGroupData[] {
  const groups: PantryLocationGroupData[] = [];
  const locationMap = new Map<string, PantryItem[]>();
  const knownIds = new Set(locations.map((loc) => loc.id));
  const unassigned: PantryItem[] = [];

  for (const item of items) {
    if (item.locationId && knownIds.has(item.locationId)) {
      const list = locationMap.get(item.locationId) || [];
      list.push(item);
      locationMap.set(item.locationId, list);
    } else {
      unassigned.push(item);
    }
  }

  for (const loc of sortLocations(locations)) {
    groups.push({
      location: loc,
      items: locationMap.get(loc.id) || [],
    });
  }

  if (unassigned.length > 0) {
    groups.push({ location: null, items: unassigned });
  }

  return groups;
}

/** Changes when any item is added, removed, or updated — used to refresh the layout board. */
export function pantryGroupsItemsKey(groups: PantryLocationGroupData[]): string {
  return groups
    .map((g) => {
      const locId = g.location?.id ?? '_unassigned';
      const itemSig = g.items
        .map((i) => `${i.id}:${i.quantity}:${i.locationId ?? ''}:${i.updatedAt}`)
        .join(';');
      return `${locId}=[${itemSig}]`;
    })
    .sort()
    .join('|');
}
