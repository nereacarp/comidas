import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTagService } from './tag.service.js';

function createMockPrisma() {
  return {
    tag: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('TagService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createTagService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createTagService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create a tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 't1', name: 'Vegano', color: '#00ff00' });

      const result = await service.create('h1', { name: 'Vegano', color: '#00ff00' });
      expect(result.name).toBe('Vegano');
    });

    it('should throw if tag already exists', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 't1' });

      await expect(service.create('h1', { name: 'Vegano' })).rejects.toThrow('La etiqueta ya existe');
    });
  });

  describe('list', () => {
    it('should list tags for household', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([
        { id: 't1', name: 'Vegano' },
        { id: 't2', name: 'Rapido' },
      ]);

      const result = await service.list('h1');
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update a tag when it belongs to the household', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue({ id: 't1', name: 'Vegano', householdId: 'h1' });
      mockPrisma.tag.update.mockResolvedValue({ id: 't1', name: 'Vegetariano' });

      const result = await service.update('t1', 'h1', { name: 'Vegetariano' });
      expect(result.name).toBe('Vegetariano');
    });

    it('should throw 404 when tag belongs to another household', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.update('t1', 'h1', { name: 'Vegetariano' })).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(mockPrisma.tag.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a tag when it belongs to the household', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue({ id: 't1', householdId: 'h1' });
      mockPrisma.tag.delete.mockResolvedValue({ id: 't1' });

      await service.delete('t1', 'h1');
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });

    it('should throw 404 when tag belongs to another household', async () => {
      mockPrisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.delete('t1', 'h1')).rejects.toMatchObject({ statusCode: 404 });
      expect(mockPrisma.tag.delete).not.toHaveBeenCalled();
    });
  });
});
