import { describe, it, expect, vi } from 'vitest';
import { createTagsApi } from './tags';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };
}

describe('TagsApi', () => {
  it('should list tags', async () => {
    const client = createMockClient();
    const api = createTagsApi(client);

    await api.list('h1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/tags');
  });

  it('should create a tag', async () => {
    const client = createMockClient();
    const api = createTagsApi(client);

    await api.create('h1', { name: 'Vegano', color: '#00ff00' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/tags', { name: 'Vegano', color: '#00ff00' });
  });

  it('should update a tag', async () => {
    const client = createMockClient();
    const api = createTagsApi(client);

    await api.update('h1', 't1', { name: 'Vegano', color: '#00ff00' });
    expect(client.put).toHaveBeenCalledWith('/households/h1/tags/t1', { name: 'Vegano', color: '#00ff00' });
  });

  it('should delete a tag', async () => {
    const client = createMockClient();
    const api = createTagsApi(client);

    await api.delete('h1', 't1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/tags/t1');
  });
});
