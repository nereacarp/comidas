import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFavoriteService } from './favorite.service.js';

function createMockPrisma() {
  return {
    recipe: { findUnique: vi.fn() },
    householdMember: { findUnique: vi.fn() },
    userFavorite: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

describe('FavoriteService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createFavoriteService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createFavoriteService(mockPrisma as any);
  });

  describe('toggle', () => {
    beforeEach(() => {
      mockPrisma.recipe.findUnique.mockResolvedValue({ householdId: 'h1' });
      mockPrisma.householdMember.findUnique.mockResolvedValue({ userId: 'u1', householdId: 'h1' });
    });

    it('should add favorite if not exists', async () => {
      mockPrisma.userFavorite.findUnique.mockResolvedValue(null);
      mockPrisma.userFavorite.create.mockResolvedValue({ id: 'f1' });

      const result = await service.toggle('u1', 'r1');
      expect(result.favorited).toBe(true);
      expect(mockPrisma.userFavorite.create).toHaveBeenCalled();
    });

    it('should remove favorite if exists', async () => {
      mockPrisma.userFavorite.findUnique.mockResolvedValue({ id: 'f1' });
      mockPrisma.userFavorite.delete.mockResolvedValue({ id: 'f1' });

      const result = await service.toggle('u1', 'r1');
      expect(result.favorited).toBe(false);
      expect(mockPrisma.userFavorite.delete).toHaveBeenCalled();
    });

    it('should throw 404 if recipe not found', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);
      await expect(service.toggle('u1', 'r1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw 403 if user is not member of the household', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);
      await expect(service.toggle('u1', 'r1')).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('list', () => {
    it('should return favorite recipes', async () => {
      mockPrisma.userFavorite.findMany.mockResolvedValue([
        { recipe: { id: 'r1', title: 'A', ingredients: [], categories: [], tags: [] } },
      ]);

      const result = await service.list('u1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('A');
    });
  });

  describe('isFavorited', () => {
    it('should return true when favorited', async () => {
      mockPrisma.userFavorite.findUnique.mockResolvedValue({ id: 'f1' });
      expect(await service.isFavorited('u1', 'r1')).toBe(true);
    });

    it('should return false when not favorited', async () => {
      mockPrisma.userFavorite.findUnique.mockResolvedValue(null);
      expect(await service.isFavorited('u1', 'r1')).toBe(false);
    });
  });
});
