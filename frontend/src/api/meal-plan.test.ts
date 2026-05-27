import { describe, it, expect, vi } from 'vitest';
import { createMealPlanApi } from './meal-plan';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('MealPlanApi', () => {
  it('should get items by date range', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.getByDateRange('h1', '2024-01-15', '2024-01-21');
    expect(client.get).toHaveBeenCalledWith(
      '/households/h1/meal-plan?startDate=2024-01-15&endDate=2024-01-21',
      undefined,
    );
  });

  it('should add item', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.addItem('h1', { date: '2024-01-15', mealType: 'COMIDA', recipeId: 'r1' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/meal-plan', {
      date: '2024-01-15',
      mealType: 'COMIDA',
      recipeId: 'r1',
    });
  });

  it('should delete item', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.deleteItem('h1', 'mp1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/meal-plan/mp1');
  });

  it('should copy day', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.copyDay('h1', '2024-01-15', '2024-01-16');
    expect(client.post).toHaveBeenCalledWith('/households/h1/meal-plan/copy-day', {
      sourceDate: '2024-01-15',
      targetDate: '2024-01-16',
    });
  });

  it('should clear day', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.clearDay('h1', '2024-01-15');
    expect(client.post).toHaveBeenCalledWith('/households/h1/meal-plan/clear-day', {
      date: '2024-01-15',
    });
  });

  it('should copy week', async () => {
    const client = createMockClient();
    const api = createMealPlanApi(client);

    await api.copyWeek('h1', '2024-01-15', '2024-01-22');
    expect(client.post).toHaveBeenCalledWith('/households/h1/meal-plan/copy-week', {
      sourceStartDate: '2024-01-15',
      targetStartDate: '2024-01-22',
    });
  });
});
