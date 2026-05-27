import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPantryService } from './pantry.service.js';

function createMockPrisma() {
  return {
    pantryItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('PantryService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createPantryService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createPantryService(mockPrisma as any);
  });

  describe('list', () => {
    it('should return pantry items ordered by name', async () => {
      mockPrisma.pantryItem.findMany.mockResolvedValue([
        { id: 'p1', name: 'Arroz', quantity: 500, unit: 'g' },
        { id: 'p2', name: 'Pasta', quantity: 300, unit: 'g' },
      ]);

      const result = await service.list('h1');
      expect(result).toHaveLength(2);
      expect(mockPrisma.pantryItem.findMany).toHaveBeenCalledWith({
        where: { householdId: 'h1' },
        include: { location: { select: { id: true, name: true, icon: true, order: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('add', () => {
    it('should create a new item when none exists', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue(null);
      mockPrisma.pantryItem.create.mockResolvedValue({
        id: 'p1', name: 'Arroz', quantity: 500, unit: 'g',
      });

      const result = await service.add('h1', { name: 'Arroz', quantity: 500, unit: 'g' });
      expect(result.name).toBe('Arroz');
      expect(mockPrisma.pantryItem.create).toHaveBeenCalledWith({
        data: { name: 'Arroz', quantity: 500, unit: 'g', locationId: null, householdId: 'h1' },
      });
    });

    it('should merge quantity when item with same name+unit exists', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({
        id: 'p1', name: 'Arroz', quantity: 500, unit: 'g',
      });
      mockPrisma.pantryItem.update.mockResolvedValue({
        id: 'p1', name: 'Arroz', quantity: 800, unit: 'g',
      });

      const result = await service.add('h1', { name: 'arroz', quantity: 300, unit: 'g' });
      expect(result.quantity).toBe(800);
      expect(mockPrisma.pantryItem.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { quantity: 800 },
      });
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({ id: 'p1', name: 'Arroz', householdId: 'h1' });
      mockPrisma.pantryItem.update.mockResolvedValue({ id: 'p1', name: 'Arroz integral' });

      const result = await service.update('p1', 'h1', { name: 'Arroz integral' });
      expect(result.name).toBe('Arroz integral');
    });

    it('should throw if item not found', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue(null);
      await expect(service.update('x', 'h1', { name: 'Test' })).rejects.toThrow('Ingrediente no encontrado');
    });

    it('should throw if item does not belong to household', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue(null);
      await expect(service.update('p1', 'other', { name: 'Test' })).rejects.toThrow('Ingrediente no encontrado');
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.pantryItem.delete.mockResolvedValue({ id: 'p1' });
      await service.delete('p1', 'h1');
      expect(mockPrisma.pantryItem.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('should throw if item does not belong to household', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue(null);
      await expect(service.delete('p1', 'other')).rejects.toThrow('Ingrediente no encontrado');
    });
  });

  describe('consume', () => {
    it('should partially consume stock', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({
        id: 'p1', name: 'Pasta', quantity: 500, unit: 'g',
      });
      mockPrisma.pantryItem.update.mockResolvedValue({
        id: 'p1', name: 'Pasta', quantity: 300, unit: 'g',
      });

      const result = await service.consume('h1', 'Pasta', 'g', 200);
      expect(result).toEqual({ consumed: 200, remaining: 0 });
      expect(mockPrisma.pantryItem.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { quantity: 300 },
      });
    });

    it('should fully consume and delete item when stock runs out', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({
        id: 'p1', name: 'Pasta', quantity: 200, unit: 'g',
      });
      mockPrisma.pantryItem.delete.mockResolvedValue({ id: 'p1' });

      const result = await service.consume('h1', 'Pasta', 'g', 500);
      expect(result).toEqual({ consumed: 200, remaining: 300 });
      expect(mockPrisma.pantryItem.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('should fully consume and delete item when stock matches exactly', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue({
        id: 'p1', name: 'Pasta', quantity: 200, unit: 'g',
      });
      mockPrisma.pantryItem.delete.mockResolvedValue({ id: 'p1' });

      const result = await service.consume('h1', 'Pasta', 'g', 200);
      expect(result).toEqual({ consumed: 200, remaining: 0 });
      expect(mockPrisma.pantryItem.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    });

    it('should return zero consumed when item not found', async () => {
      mockPrisma.pantryItem.findFirst.mockResolvedValue(null);

      const result = await service.consume('h1', 'Leche', 'l', 1);
      expect(result).toEqual({ consumed: 0, remaining: 1 });
    });
  });
});
