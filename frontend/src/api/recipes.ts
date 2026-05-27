import type { ApiClient } from './client';
import type {
  Recipe,
  RecipeListResponse,
  CreateRecipeInput,
  ImportedRecipe,
  EstimateKcalInput,
  EstimateKcalResult,
} from '../types';

export function createRecipesApi(client: ApiClient) {
  return {
    list: (householdId: string, params?: Record<string, string>, signal?: AbortSignal) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return client.get<RecipeListResponse>(`/households/${householdId}/recipes${query}`, signal);
    },

    getById: (householdId: string, recipeId: string) =>
      client.get<Recipe>(`/households/${householdId}/recipes/${recipeId}`),

    create: (householdId: string, data: CreateRecipeInput) =>
      client.post<Recipe>(`/households/${householdId}/recipes`, data),

    update: (householdId: string, recipeId: string, data: CreateRecipeInput) =>
      client.put<Recipe>(`/households/${householdId}/recipes/${recipeId}`, data),

    delete: (householdId: string, recipeId: string) =>
      client.delete<void>(`/households/${householdId}/recipes/${recipeId}`),

    importFromUrl: (householdId: string, url: string) =>
      client.post<ImportedRecipe>(`/households/${householdId}/recipes/import-url`, { url }),

    estimateKcal: (householdId: string, data: EstimateKcalInput) =>
      client.post<EstimateKcalResult>(`/households/${householdId}/recipes/estimate-kcal`, data),

    suggestions: (householdId: string, mealType: string, date: string) =>
      client.get<Recipe[]>(`/households/${householdId}/recipes/suggestions?mealType=${mealType}&date=${date}`),
  };
}
