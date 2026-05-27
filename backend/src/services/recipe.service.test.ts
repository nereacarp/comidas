import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecipeService } from './recipe.service.js';

function createMockPrisma() {
  return {
    $queryRaw: vi.fn().mockResolvedValue([]),
    recipe: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    recipeIngredient: {
      deleteMany: vi.fn(),
    },
    recipeCategory: {
      deleteMany: vi.fn(),
    },
    recipeTag: {
      deleteMany: vi.fn(),
    },
  };
}

describe('RecipeService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createRecipeService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createRecipeService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create a recipe with ingredients and categories', async () => {
      const recipe = {
        id: 'r1',
        title: 'Tortilla',
        householdId: 'h1',
        ingredients: [{ name: 'Huevos', quantity: 4, unit: 'unidades' }],
        categories: [{ mealType: 'COMIDA' }],
        tags: [],
      };
      mockPrisma.recipe.create.mockResolvedValue(recipe);

      const result = await service.create('h1', {
        title: 'Tortilla',
        ingredients: [{ name: 'Huevos', quantity: 4, unit: 'unidades' }],
        categories: ['COMIDA' as any],
      });

      expect(result.title).toBe('Tortilla');
      expect(mockPrisma.recipe.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Tortilla',
            householdId: 'h1',
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a recipe', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({
        id: 'r1',
        title: 'Tortilla',
      });

      const result = await service.getById('r1', 'h1');
      expect(result.title).toBe('Tortilla');
    });

    it('should throw if not found', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);

      await expect(service.getById('r999', 'h1')).rejects.toThrow('Receta no encontrada');
    });
  });

  describe('list', () => {
    it('should list recipes with pagination', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([{ id: 'r1', title: 'A' }]);
      mockPrisma.recipe.count.mockResolvedValue(1);

      const result = await service.list('h1', { page: 1, limit: 10 });

      expect(result.recipes).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by search', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { search: 'tortilla' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            householdId: 'h1',
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'tortilla', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });

    it('should filter by user favorites when favoritesOnly is set', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { favoritesOnly: true, userId: 'u1' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            favorites: { some: { userId: 'u1' } },
          }),
        })
      );
    });

    it('should filter by meal type', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { mealType: 'CENA' as any });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: { some: { mealType: 'CENA' } },
          }),
        })
      );
    });


    it('should filter by ingredient name', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { ingredient: 'pollo' });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                ingredients: {
                  some: { name: { contains: 'pollo', mode: 'insensitive' } },
                },
              },
            ],
          }),
        })
      );
    });

    it('should filter by buy ingredients missing from pantry', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { buyIngredients: ['salmón'] });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                AND: [
                  {
                    ingredients: {
                      some: { name: { contains: 'salmón', mode: 'insensitive' } },
                    },
                  },
                  {
                    household: {
                      pantryItems: {
                        none: { name: { contains: 'salmón', mode: 'insensitive' } },
                      },
                    },
                  },
                ],
              },
            ]),
          }),
        })
      );
    });

    it('should filter by multiple ingredients with OR', async () => {
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { ingredients: ['pollo', 'arroz'] });

      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: [
                  { ingredients: { some: { name: { contains: 'pollo', mode: 'insensitive' } } } },
                  { ingredients: { some: { name: { contains: 'arroz', mode: 'insensitive' } } } },
                ],
              },
            ]),
          }),
        })
      );
    });

    it('should filter by total time range', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'r1' }]);
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { minTotalTime: 30, maxTotalTime: 45 });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['r1'] },
          }),
        })
      );
    });

    it('should filter by kcal range via raw query', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'r3' }]);
      mockPrisma.recipe.findMany.mockResolvedValue([]);
      mockPrisma.recipe.count.mockResolvedValue(0);

      await service.list('h1', { maxKcal: 200 });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['r3'] },
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should delete old relations and update', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.recipeIngredient.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.recipeCategory.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.recipeTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.recipe.update.mockResolvedValue({ id: 'r1', title: 'Updated' });

      const result = await service.update('r1', 'h1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockPrisma.recipeIngredient.deleteMany).toHaveBeenCalledWith({
        where: { recipeId: 'r1' },
      });
    });

    it('should throw if recipe does not belong to household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);
      await expect(service.update('r1', 'other-household', { title: 'X' })).rejects.toThrow('Receta no encontrada');
    });
  });

  describe('delete', () => {
    it('should delete a recipe', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.recipe.delete.mockResolvedValue({ id: 'r1' });

      await service.delete('r1', 'h1');

      expect(mockPrisma.recipe.delete).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });
    });

    it('should throw if recipe does not belong to household', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue(null);
      await expect(service.delete('r1', 'other-household')).rejects.toThrow('Receta no encontrada');
    });
  });
});
