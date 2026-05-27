import { describe, it, expect, vi } from 'vitest';
import { createShoppingListsApi } from './shopping-lists';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('ShoppingListsApi', () => {
  it('should generate a shopping list', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.generate('h1', { name: 'Week 1', startDate: '2024-01-15', endDate: '2024-01-21' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/shopping-lists/generate', {
      name: 'Week 1',
      startDate: '2024-01-15',
      endDate: '2024-01-21',
    });
  });

  it('should list shopping lists', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.list('h1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/shopping-lists');
  });

  it('should get a shopping list by id', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.getById('h1', 'sl1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1');
  });

  it('should toggle item', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.toggleItem('h1', 'sl1', 'sli1');
    expect(client.put).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1/items/sli1/toggle', {});
  });

  it('should add manual item', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.addManualItem('h1', 'sl1', { name: 'Pan' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1/items', { name: 'Pan' });
  });

  it('should delete an item', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.deleteItem('h1', 'sl1', 'sli1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1/items/sli1');
  });

  it('should delete a list', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.deleteList('h1', 'sl1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1');
  });

  it('should create a share token', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.createShareToken('h1', 'sl1');
    expect(client.post).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1/share', {});
  });

  it('should remove a share token', async () => {
    const client = createMockClient();
    const api = createShoppingListsApi(client);

    await api.removeShareToken('h1', 'sl1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/shopping-lists/sl1/share');
  });
});
