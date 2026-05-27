import type { ApiClient } from './client';
import type { Tag } from '../types';

export function createTagsApi(client: ApiClient) {
  return {
    list: (householdId: string) =>
      client.get<Tag[]>(`/households/${householdId}/tags`),

    create: (householdId: string, data: { name: string; color?: string }) =>
      client.post<Tag>(`/households/${householdId}/tags`, data),

    update: (householdId: string, tagId: string, data: { name: string; color?: string }) =>
      client.put<Tag>(`/households/${householdId}/tags/${tagId}`, data),

    delete: (householdId: string, tagId: string) =>
      client.delete<void>(`/households/${householdId}/tags/${tagId}`),
  };
}
