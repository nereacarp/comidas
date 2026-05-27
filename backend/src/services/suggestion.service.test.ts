import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSuggestionService } from './suggestion.service.js';

function createMockPrisma() {
  return {
    mealPlanItem: {
      findMany: vi.fn(),
    },
    userFavorite: {
      findMany: vi.fn(),
    },
    recipe: {
      findMany: vi.fn(),
    },
  };
}

describe('SuggestionService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createSuggestionService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createSuggestionService(mockPrisma as any);
  });

  it('should return suggestions prioritizing favorites', async () => {
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
    mockPrisma.userFavorite.findMany.mockResolvedValue([
      { recipeId: 'r1' },
    ]);
    mockPrisma.recipe.findMany.mockResolvedValue([
      { id: 'r1', title: 'Favorita', categories: [{ mealType: 'COMIDA' }] },
      { id: 'r2', title: 'Normal', categories: [{ mealType: 'COMIDA' }] },
    ]);

    const result = await service.suggest('h1', 'u1', 'COMIDA' as any, '2024-01-15');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r1');
  });

  it('should return empty when no recipes match', async () => {
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
    mockPrisma.userFavorite.findMany.mockResolvedValue([]);
    mockPrisma.recipe.findMany.mockResolvedValue([]);

    const result = await service.suggest('h1', 'u1', 'DESAYUNO' as any, '2024-01-15');
    expect(result).toHaveLength(0);
  });

  it('should deprioritize recently used recipes', async () => {
    mockPrisma.mealPlanItem.findMany.mockResolvedValue([
      { recipeId: 'r1' },
    ]);
    mockPrisma.userFavorite.findMany.mockResolvedValue([]);
    mockPrisma.recipe.findMany.mockResolvedValue([
      { id: 'r1', title: 'Reciente', categories: [{ mealType: 'CENA' }] },
      { id: 'r2', title: 'No reciente', categories: [{ mealType: 'CENA' }] },
    ]);

    const result = await service.suggest('h1', 'u1', 'CENA' as any, '2024-01-15');
    expect(result).toHaveLength(2);
  });
});
