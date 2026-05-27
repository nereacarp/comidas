import { describe, it, expect, vi } from 'vitest';
import { createRecipesApi } from './recipes';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('RecipesApi', () => {
  it('should list recipes', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);

    await api.list('h1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/recipes', undefined);
  });

  it('should list recipes with filters', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);

    await api.list('h1', { search: 'tortilla', mealType: 'COMIDA' });
    expect(client.get).toHaveBeenCalledWith('/households/h1/recipes?search=tortilla&mealType=COMIDA', undefined);
  });

  it('should create a recipe', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);
    const data = { title: 'Tortilla', categories: ['COMIDA' as const] };

    await api.create('h1', data);
    expect(client.post).toHaveBeenCalledWith('/households/h1/recipes', data);
  });

  it('should update a recipe', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);
    const data = { title: 'Tortilla Updated' };

    await api.update('h1', 'r1', data);
    expect(client.put).toHaveBeenCalledWith('/households/h1/recipes/r1', data);
  });

  it('should delete a recipe', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);

    await api.delete('h1', 'r1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/recipes/r1');
  });

  it('should import a recipe from URL', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);

    await api.importFromUrl('h1', 'https://example.com/recipe');
    expect(client.post).toHaveBeenCalledWith('/households/h1/recipes/import-url', {
      url: 'https://example.com/recipe',
    });
  });

  it('should estimate kcal from ingredients', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);
    const payload = {
      servings: 2,
      ingredients: [{ name: 'Pasta', quantity: 80, unit: 'g' }],
    };

    await api.estimateKcal('h1', payload);
    expect(client.post).toHaveBeenCalledWith('/households/h1/recipes/estimate-kcal', payload);
  });

  it('should get recipe suggestions', async () => {
    const client = createMockClient();
    const api = createRecipesApi(client);

    await api.suggestions('h1', 'COMIDA', '2024-01-15');
    expect(client.get).toHaveBeenCalledWith(
      '/households/h1/recipes/suggestions?mealType=COMIDA&date=2024-01-15'
    );
  });
});
