import { describe, it, expect, vi } from 'vitest';
import { createPantryApi } from './pantry';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('PantryApi', () => {
  it('should list pantry items', async () => {
    const client = createMockClient();
    const api = createPantryApi(client);

    await api.list('h1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/pantry');
  });

  it('should add a pantry item', async () => {
    const client = createMockClient();
    const api = createPantryApi(client);

    await api.add('h1', { name: 'Arroz', quantity: 500, unit: 'g' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/pantry', {
      name: 'Arroz', quantity: 500, unit: 'g',
    });
  });

  it('should update a pantry item', async () => {
    const client = createMockClient();
    const api = createPantryApi(client);

    await api.update('h1', 'p1', { quantity: 300 });
    expect(client.put).toHaveBeenCalledWith('/households/h1/pantry/p1', { quantity: 300 });
  });

  it('should delete a pantry item', async () => {
    const client = createMockClient();
    const api = createPantryApi(client);

    await api.delete('h1', 'p1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/pantry/p1');
  });
});
