import { describe, it, expect, vi } from 'vitest';
import { createStorageLocationsApi } from './storage-locations';

const client = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const api = createStorageLocationsApi(client as any);

describe('StorageLocationsApi', () => {
  it('should list locations', async () => {
    await api.list('h1');
    expect(client.get).toHaveBeenCalledWith('/households/h1/storage-locations');
  });

  it('should create a location', async () => {
    await api.create('h1', { name: 'Balcon' });
    expect(client.post).toHaveBeenCalledWith('/households/h1/storage-locations', { name: 'Balcon' });
  });

  it('should update a location', async () => {
    await api.update('h1', 'loc1', { name: 'Bodega', icon: 'cabinet', color: '#d97706' });
    expect(client.put).toHaveBeenCalledWith('/households/h1/storage-locations/loc1', {
      name: 'Bodega',
      icon: 'cabinet',
      color: '#d97706',
    });
  });

  it('should delete a location', async () => {
    await api.delete('h1', 'loc1');
    expect(client.delete).toHaveBeenCalledWith('/households/h1/storage-locations/loc1');
  });

  it('should reorder locations', async () => {
    const placements = [
      { id: 'loc2', column: 1, row: 0 },
      { id: 'loc1', column: 0, row: 0 },
    ];
    await api.reorder('h1', placements);
    expect(client.put).toHaveBeenCalledWith('/households/h1/storage-locations/reorder', {
      placements,
    });
  });
});
