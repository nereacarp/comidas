import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStorageLocationService } from './storage-location.service.js';

function createMockPrisma() {
  return {
    storageLocation: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pantryItem: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

describe('StorageLocationService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createStorageLocationService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createStorageLocationService(mockPrisma as any);
  });

  describe('list', () => {
    it('should return locations ordered by order', async () => {
      mockPrisma.storageLocation.findMany.mockResolvedValue([
        { id: 'l1', name: 'Nevera', icon: 'fridge', color: '#0ea5e9', order: 0, layoutColumn: 0 },
        { id: 'l2', name: 'Congelador', icon: 'snowflake', color: '#3b82f6', order: 0, layoutColumn: 1 },
      ]);

      const result = await service.list('h1');
      expect(result).toHaveLength(2);
      expect(result[0].color).toBe('#a8e6cf');
      expect(result[1].color).toBe('#e6ccff');
      expect(mockPrisma.storageLocation.findMany).toHaveBeenCalledWith({
        where: { householdId: 'h1' },
        orderBy: [{ layoutColumn: 'asc' }, { order: 'asc' }],
      });
    });
  });

  describe('ensureDefaults', () => {
    it('should create defaults when no locations exist', async () => {
      mockPrisma.storageLocation.count.mockResolvedValue(0);
      mockPrisma.storageLocation.createMany.mockResolvedValue({ count: 5 });

      await service.ensureDefaults('h1');
      expect(mockPrisma.storageLocation.createMany).toHaveBeenCalled();
      const data = mockPrisma.storageLocation.createMany.mock.calls[0][0].data;
      expect(data).toHaveLength(5);
      expect(data[0]).toMatchObject({ name: 'Nevera', layoutColumn: 0 });
      expect(data[1]).toMatchObject({ name: 'Congelador', layoutColumn: 1 });
      expect(data[2]).toMatchObject({ name: 'Despensa', layoutColumn: 2 });
      expect(data[3]).toMatchObject({ name: 'Armario', layoutColumn: 3 });
      expect(data[4]).toMatchObject({ name: 'Otros', layoutColumn: 4 });
    });

    it('should not create defaults when locations already exist', async () => {
      mockPrisma.storageLocation.count.mockResolvedValue(3);

      await service.ensureDefaults('h1');
      expect(mockPrisma.storageLocation.createMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a location with next order and random pastel when no color', async () => {
      mockPrisma.storageLocation.findFirst.mockResolvedValue({ order: 4 });
      mockPrisma.storageLocation.count.mockResolvedValue(3);
      mockPrisma.storageLocation.create.mockResolvedValue({
        id: 'l1', name: 'Balcon', icon: 'cabinet', color: '#9bf6ff', order: 5,
      });

      const result = await service.create('h1', { name: 'Balcon' });
      expect(result.name).toBe('Balcon');
      expect(mockPrisma.storageLocation.create).toHaveBeenCalledWith({
        data: {
          name: 'Balcon',
          icon: 'cabinet',
          color: '#9bf6ff',
          layoutColumn: 3,
          order: 5,
          householdId: 'h1',
        },
      });
    });

    it('should persist icon and color when provided', async () => {
      mockPrisma.storageLocation.count.mockResolvedValue(2);
      mockPrisma.storageLocation.findFirst.mockResolvedValue({ order: 1 });
      mockPrisma.storageLocation.create.mockResolvedValue({
        id: 'l2', name: 'Bodega', icon: 'mapPin', color: '#2f6f82', order: 2,
      });

      await service.create('h1', { name: 'Bodega', icon: 'mapPin', color: '#2f6f82' });
      expect(mockPrisma.storageLocation.create).toHaveBeenCalledWith({
        data: {
          name: 'Bodega',
          icon: 'mapPin',
          color: '#2f6f82',
          layoutColumn: 2,
          order: 2,
          householdId: 'h1',
        },
      });
    });
  });

  describe('reorder', () => {
    it('updates column and row for every household location', async () => {
      const updatedRows = [
        { id: 'l2', name: 'B', icon: 'cabinet', color: '#8b6fc0', order: 0, layoutColumn: 1 },
        { id: 'l1', name: 'A', icon: 'cabinet', color: '#8b6fc0', order: 1, layoutColumn: 1 },
      ];
      mockPrisma.storageLocation.findMany
        .mockResolvedValueOnce([{ id: 'l1' }, { id: 'l2' }])
        .mockResolvedValue(updatedRows);
      mockPrisma.storageLocation.update.mockResolvedValue({});

      const result = await service.reorder('h1', [
        { id: 'l2', column: 1, row: 0 },
        { id: 'l1', column: 1, row: 1 },
      ]);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('rejects when ids do not match household locations', async () => {
      mockPrisma.storageLocation.findMany.mockResolvedValue([{ id: 'l1' }]);

      await expect(
        service.reorder('h1', [
          { id: 'l1', column: 0, row: 0 },
          { id: 'l2', column: 0, row: 1 },
        ]),
      ).rejects.toThrow('UBICACIONES_INVALIDAS');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a location when it belongs to the household', async () => {
      mockPrisma.storageLocation.findFirst.mockResolvedValue({ id: 'l1', icon: 'fridge', color: '#0ea5e9' });
      mockPrisma.storageLocation.update.mockResolvedValue({ id: 'l1', name: 'Nevera grande', icon: 'fridge', color: '#0ea5e9', order: 0, layoutColumn: 0 });

      await service.update('l1', 'h1', { name: 'Nevera grande' });
      expect(mockPrisma.storageLocation.update).toHaveBeenCalled();
    });

    it('should throw 404 when location belongs to another household', async () => {
      mockPrisma.storageLocation.findFirst.mockResolvedValue(null);

      await expect(service.update('l1', 'h1', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
      expect(mockPrisma.storageLocation.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should unlink pantry items before deleting when location belongs to household', async () => {
      mockPrisma.storageLocation.findFirst.mockResolvedValue({ id: 'l1', householdId: 'h1' });
      mockPrisma.pantryItem.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.storageLocation.delete.mockResolvedValue({ id: 'l1' });

      await service.delete('l1', 'h1');
      expect(mockPrisma.pantryItem.updateMany).toHaveBeenCalledWith({
        where: { locationId: 'l1' },
        data: { locationId: null },
      });
      expect(mockPrisma.storageLocation.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
    });

    it('should throw 404 when location belongs to another household', async () => {
      mockPrisma.storageLocation.findFirst.mockResolvedValue(null);

      await expect(service.delete('l1', 'h1')).rejects.toMatchObject({ statusCode: 404 });
      expect(mockPrisma.storageLocation.delete).not.toHaveBeenCalled();
    });
  });
});
