import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDaysToMealPlanDate, parseMealPlanDate } from '../lib/meal-plan-dates.js';
import { createMealPlanService } from './meal-plan.service.js';

function createMockPrisma() {
  return {
    recipe: {
      findFirst: vi.fn(),
    },
    mealPlanItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

describe('MealPlanService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createMealPlanService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createMealPlanService(mockPrisma as any);
  });

  describe('addItem', () => {
    it('should create a meal plan item with recipe', async () => {
      mockPrisma.recipe.findFirst.mockResolvedValue({ id: 'r1' });
      mockPrisma.mealPlanItem.create.mockResolvedValue({
        id: 'mp1',
        date: new Date('2024-01-15'),
        mealType: 'COMIDA',
        recipeId: 'r1',
      });

      const result = await service.addItem('h1', {
        date: '2024-01-15',
        mealType: 'COMIDA' as any,
        recipeId: 'r1',
      });

      expect(result.mealType).toBe('COMIDA');
      expect(mockPrisma.mealPlanItem.create).toHaveBeenCalled();
    });

    it('should create a meal plan item with custom name', async () => {
      mockPrisma.mealPlanItem.create.mockResolvedValue({
        id: 'mp2',
        date: new Date('2024-01-15'),
        mealType: 'CENA',
        customMealName: 'Comer fuera',
      });

      const result = await service.addItem('h1', {
        date: '2024-01-15',
        mealType: 'CENA' as any,
        customMealName: 'Comer fuera',
      });

      expect(result.customMealName).toBe('Comer fuera');
    });
  });

  describe('getByDateRange', () => {
    it('should return items for date range', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        { id: 'mp1', date: new Date('2024-01-15'), mealType: 'COMIDA' },
      ]);

      const result = await service.getByDateRange('h1', '2024-01-15', '2024-01-21');
      expect(result).toHaveLength(1);
    });
  });

  describe('copyDay', () => {
    it('should replace target day then copy items from source', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        { mealType: 'COMIDA', recipeId: 'r1', customMealName: null },
        { mealType: 'CENA', recipeId: null, customMealName: 'Pizza' },
      ]);
      mockPrisma.mealPlanItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.mealPlanItem.create.mockResolvedValue({ id: 'new' });

      const result = await service.copyDay('h1', '2024-01-15', '2024-01-16');
      expect(result).toHaveLength(2);
      expect(mockPrisma.mealPlanItem.deleteMany).toHaveBeenCalledWith({
        where: { householdId: 'h1', date: parseMealPlanDate('2024-01-16') },
      });
      expect(mockPrisma.mealPlanItem.create).toHaveBeenCalledTimes(2);
    });

    it('should not clear target when source and target are the same day', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        { mealType: 'COMIDA', recipeId: 'r1', customMealName: null },
      ]);
      mockPrisma.mealPlanItem.create.mockResolvedValue({ id: 'new' });

      await service.copyDay('h1', '2024-01-15', '2024-01-15');
      expect(mockPrisma.mealPlanItem.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('clearDay', () => {
    it('should delete all items for a day', async () => {
      mockPrisma.mealPlanItem.deleteMany.mockResolvedValue({ count: 3 });

      await service.clearDay('h1', '2024-01-15');
      expect(mockPrisma.mealPlanItem.deleteMany).toHaveBeenCalledWith({
        where: { householdId: 'h1', date: parseMealPlanDate('2024-01-15') },
      });
    });
  });

  describe('copyWeek', () => {
    it('should replace target week then copy items from source week', async () => {
      const monday = new Date('2024-01-15T12:00:00.000Z');
      const wednesday = new Date('2024-01-17T12:00:00.000Z');
      const targetStart = parseMealPlanDate('2024-01-22');
      const targetEnd = addDaysToMealPlanDate('2024-01-22', 6);
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        { date: monday, mealType: 'COMIDA', recipeId: 'r1', customMealName: null },
        { date: wednesday, mealType: 'CENA', recipeId: null, customMealName: 'Pizza' },
      ]);
      mockPrisma.mealPlanItem.deleteMany.mockResolvedValue({ count: 4 });
      mockPrisma.mealPlanItem.create.mockResolvedValue({ id: 'new' });

      const result = await service.copyWeek('h1', '2024-01-15', '2024-01-22');
      expect(result).toHaveLength(2);
      expect(mockPrisma.mealPlanItem.deleteMany).toHaveBeenCalledWith({
        where: {
          householdId: 'h1',
          date: { gte: targetStart, lte: targetEnd },
        },
      });
      expect(mockPrisma.mealPlanItem.create).toHaveBeenCalledTimes(2);
    });
  });
});
