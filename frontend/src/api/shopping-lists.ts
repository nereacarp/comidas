import type { ApiClient } from './client';
import type {
  ShoppingList,
  ShoppingListItem,
  GenerateShoppingListResponse,
  CheckGroupedShoppingItemsResult,
} from '../types';

export function createShoppingListsApi(client: ApiClient) {
  return {
    generate: (householdId: string, data: { name: string; startDate: string; endDate: string }) =>
      client.post<GenerateShoppingListResponse>(`/households/${householdId}/shopping-lists/generate`, data),

    list: (householdId: string) =>
      client.get<ShoppingList[]>(`/households/${householdId}/shopping-lists`),

    getById: (householdId: string, listId: string) =>
      client.get<ShoppingList>(`/households/${householdId}/shopping-lists/${listId}`),

    addManualItem: (householdId: string, listId: string, data: { name: string; quantity?: number; unit?: string }) =>
      client.post<ShoppingListItem>(`/households/${householdId}/shopping-lists/${listId}/items`, data),

    toggleItem: (householdId: string, listId: string, itemId: string) =>
      client.put<ShoppingListItem>(`/households/${householdId}/shopping-lists/${listId}/items/${itemId}/toggle`, {}),

    deleteItem: (householdId: string, listId: string, itemId: string) =>
      client.delete<void>(`/households/${householdId}/shopping-lists/${listId}/items/${itemId}`),

    deleteList: (householdId: string, listId: string) =>
      client.delete<void>(`/households/${householdId}/shopping-lists/${listId}`),

    createShareToken: (householdId: string, listId: string) =>
      client.post<{ shareToken: string }>(`/households/${householdId}/shopping-lists/${listId}/share`, {}),

    removeShareToken: (householdId: string, listId: string) =>
      client.delete<void>(`/households/${householdId}/shopping-lists/${listId}/share`),

    checkItem: (householdId: string, listId: string, itemId: string, purchasedQuantity?: number, locationId?: string) =>
      client.put<ShoppingListItem>(
        `/households/${householdId}/shopping-lists/${listId}/items/${itemId}/check`,
        { purchasedQuantity, locationId },
      ),

    checkGroupedItems: (
      householdId: string,
      listId: string,
      data: { itemIds: string[]; purchasedQuantity?: number; locationId?: string },
    ) =>
      client.put<CheckGroupedShoppingItemsResult>(
        `/households/${householdId}/shopping-lists/${listId}/items/check-group`,
        data,
      ),
  };
}
