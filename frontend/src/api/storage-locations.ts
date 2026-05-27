import type { ApiClient } from './client';
import type { StorageLocation } from '../types';

export function createStorageLocationsApi(client: ApiClient) {
  return {
    list: (householdId: string) =>
      client.get<StorageLocation[]>(`/households/${householdId}/storage-locations`),

    create: (householdId: string, data: { name: string; icon?: string; color?: string }) =>
      client.post<StorageLocation>(`/households/${householdId}/storage-locations`, data),

    update: (householdId: string, locationId: string, data: { name?: string; icon?: string; color?: string }) =>
      client.put<StorageLocation>(`/households/${householdId}/storage-locations/${locationId}`, data),

    delete: (householdId: string, locationId: string) =>
      client.delete<void>(`/households/${householdId}/storage-locations/${locationId}`),

    reorder: (
      householdId: string,
      placements: { id: string; column: number; row: number }[],
    ) =>
      client.put<StorageLocation[]>(`/households/${householdId}/storage-locations/reorder`, {
        placements,
      }),
  };
}
