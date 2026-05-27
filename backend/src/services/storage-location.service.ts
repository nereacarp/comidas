import type { PrismaClientType } from '../lib/prisma.js';
import {
  DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS,
  normalizeStorageLocationColor,
  pantryColorForNewLocation,
} from '../lib/storage-location-colors.js';

const PANTRY_LAYOUT_COLUMNS = 5;

interface CreateLocationInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface PantryLayoutPlacement {
  id: string;
  column: number;
  row: number;
}

export function createStorageLocationService(prisma: PrismaClientType) {
  return {
    async normalizeLegacyLayout(householdId: string) {
      const rows = await prisma.storageLocation.findMany({
        where: { householdId },
        orderBy: { order: 'asc' },
      });
      if (rows.length <= 1) return;

      const allFirstColumn = rows.every((r) => r.layoutColumn === 0);
      const looksLinear = rows.every((r, index) => r.order === index);
      if (!allFirstColumn || !looksLinear) return;

      await prisma.$transaction(
        rows.map((row, index) =>
          prisma.storageLocation.update({
            where: { id: row.id },
            data: {
              layoutColumn: index % PANTRY_LAYOUT_COLUMNS,
              order: Math.floor(index / PANTRY_LAYOUT_COLUMNS),
            },
          }),
        ),
      );
    },

    async list(householdId: string) {
      const rows = await prisma.storageLocation.findMany({
        where: { householdId },
        orderBy: [{ layoutColumn: 'asc' }, { order: 'asc' }],
      });
      return rows.map((loc) => ({
        ...loc,
        color: normalizeStorageLocationColor(loc.icon, loc.color),
      }));
    },

    async ensureDefaults(householdId: string) {
      const existing = await prisma.storageLocation.count({ where: { householdId } });
      if (existing > 0) return;
      await prisma.storageLocation.createMany({
        data: DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS.map((loc) => ({ ...loc, householdId })),
      });
    },

    async create(householdId: string, input: CreateLocationInput) {
      const icon = input.icon || 'cabinet';
      const existingCount = await prisma.storageLocation.count({ where: { householdId } });
      const layoutColumn = existingCount % PANTRY_LAYOUT_COLUMNS;
      const lastInColumn = await prisma.storageLocation.findFirst({
        where: { householdId, layoutColumn },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const colorInput = input.color?.trim()
        ? input.color
        : pantryColorForNewLocation(existingCount);
      return prisma.storageLocation.create({
        data: {
          name: input.name,
          icon,
          color: normalizeStorageLocationColor(icon, colorInput),
          layoutColumn,
          order: (lastInColumn?.order ?? -1) + 1,
          householdId,
        },
      });
    },

    async update(locationId: string, householdId: string, input: { name?: string; icon?: string; color?: string }) {
      const existing = await prisma.storageLocation.findFirst({
        where: { id: locationId, householdId },
        select: { icon: true, color: true },
      });
      if (!existing) throw Object.assign(new Error('Ubicación no encontrada'), { statusCode: 404 });
      const icon = input.icon ?? existing.icon ?? 'cabinet';
      const data = { ...input };
      if (input.color !== undefined) {
        data.color = normalizeStorageLocationColor(icon, input.color);
      } else if (input.icon !== undefined) {
        data.color = normalizeStorageLocationColor(icon, existing.color);
      }
      const updated = await prisma.storageLocation.update({
        where: { id: locationId },
        data,
      });
      return {
        ...updated,
        color: normalizeStorageLocationColor(updated.icon, updated.color),
      };
    },

    async delete(locationId: string, householdId: string) {
      const existing = await prisma.storageLocation.findFirst({ where: { id: locationId, householdId } });
      if (!existing) throw Object.assign(new Error('Ubicación no encontrada'), { statusCode: 404 });
      await prisma.pantryItem.updateMany({
        where: { locationId },
        data: { locationId: null },
      });
      return prisma.storageLocation.delete({ where: { id: locationId } });
    },

    async reorder(householdId: string, placements: PantryLayoutPlacement[]) {
      const existing = await prisma.storageLocation.findMany({
        where: { householdId },
        select: { id: true },
      });

      const existingIds = new Set(existing.map((loc) => loc.id));
      const isValid =
        placements.length === existing.length &&
        placements.every((p) => existingIds.has(p.id));

      if (!isValid) {
        throw new Error('UBICACIONES_INVALIDAS');
      }

      await prisma.$transaction(
        placements.map(({ id, column, row }) =>
          prisma.storageLocation.update({
            where: { id },
            data: { layoutColumn: column, order: row },
          }),
        ),
      );

      return this.list(householdId);
    },
  };
}
