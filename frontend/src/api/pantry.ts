import type { ApiClient } from './client';
import type { PantryItem } from '../types';
import type { IngredientNameSuggestion } from '../types/ingredient-suggestion';

export function createPantryApi(client: ApiClient) {
  return {
    list: (householdId: string) =>
      client.get<PantryItem[]>(`/households/${householdId}/pantry`),

    add: (householdId: string, data: { name: string; quantity: number; unit: string; locationId?: string }) =>
      client.post<PantryItem>(`/households/${householdId}/pantry`, data),

    update: (householdId: string, itemId: string, data: { name?: string; quantity?: number; unit?: string; locationId?: string | null }) =>
      client.put<PantryItem>(`/households/${householdId}/pantry/${itemId}`, data),

    delete: (householdId: string, itemId: string) =>
      client.delete<void>(`/households/${householdId}/pantry/${itemId}`),

    ingredientNames: (householdId: string, q = '') =>
      client.get<IngredientNameSuggestion[]>(
        `/households/${householdId}/ingredient-names?q=${encodeURIComponent(q)}`,
      ),
  };
}
