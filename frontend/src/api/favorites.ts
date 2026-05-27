import type { ApiClient } from './client';
import type { Recipe } from '../types';

export function createFavoritesApi(client: ApiClient) {
  return {
    toggle: (recipeId: string) =>
      client.post<{ favorited: boolean }>('/favorites/toggle', { recipeId }),

    list: () => client.get<Recipe[]>('/favorites'),
  };
}
