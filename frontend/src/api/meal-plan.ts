import type { ApiClient } from './client';
import type { MealPlanItem, MealType } from '../types';

export function createMealPlanApi(client: ApiClient) {
  return {
    getByDateRange: (householdId: string, startDate: string, endDate: string, signal?: AbortSignal) =>
      client.get<MealPlanItem[]>(
        `/households/${householdId}/meal-plan?startDate=${startDate}&endDate=${endDate}`,
        signal,
      ),

    addItem: (householdId: string, data: {
      date: string;
      mealType: MealType;
      recipeId?: string;
      customMealName?: string;
    }) => client.post<MealPlanItem>(`/households/${householdId}/meal-plan`, data),

    updateItem: (householdId: string, itemId: string, data: {
      recipeId?: string | null;
      customMealName?: string | null;
    }) => client.put<MealPlanItem>(`/households/${householdId}/meal-plan/${itemId}`, data),

    deleteItem: (householdId: string, itemId: string) =>
      client.delete<void>(`/households/${householdId}/meal-plan/${itemId}`),

    copyDay: (householdId: string, sourceDate: string, targetDate: string) =>
      client.post<MealPlanItem[]>(`/households/${householdId}/meal-plan/copy-day`, {
        sourceDate,
        targetDate,
      }),

    clearDay: (householdId: string, date: string) =>
      client.post<void>(`/households/${householdId}/meal-plan/clear-day`, { date }),

    copyWeek: (householdId: string, sourceStartDate: string, targetStartDate: string) =>
      client.post<MealPlanItem[]>(`/households/${householdId}/meal-plan/copy-week`, {
        sourceStartDate,
        targetStartDate,
      }),
  };
}
