import { describe, it, expect, vi } from 'vitest';
import { createFavoritesApi } from './favorites';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('FavoritesApi', () => {
  it('should toggle favorite', async () => {
    const client = createMockClient();
    const api = createFavoritesApi(client);

    await api.toggle('r1');
    expect(client.post).toHaveBeenCalledWith('/favorites/toggle', { recipeId: 'r1' });
  });

  it('should list favorites', async () => {
    const client = createMockClient();
    const api = createFavoritesApi(client);

    await api.list();
    expect(client.get).toHaveBeenCalledWith('/favorites');
  });
});
