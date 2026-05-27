import type { ApiClient } from './client';
import type { Household, HouseholdRole } from '../types';

export function createHouseholdsApi(client: ApiClient) {
  return {
    list: () => client.get<Household[]>('/households'),

    getById: (id: string) => client.get<Household>(`/households/${id}`),

    create: (data: { name: string }) =>
      client.post<Household>('/households', data),

    update: (id: string, data: { name: string }) =>
      client.put<Household>(`/households/${id}`, data),

    delete: (id: string) => client.delete<void>(`/households/${id}`),

    addMember: (id: string, data: { email: string; role?: HouseholdRole }) =>
      client.post(`/households/${id}/members`, data),

    removeMember: (householdId: string, userId: string) =>
      client.delete(`/households/${householdId}/members/${userId}`),

    updateMemberRole: (householdId: string, userId: string, role: 'EDITOR' | 'VIEWER') =>
      client.patch(`/households/${householdId}/members/${userId}`, { role }),

    leaveHousehold: (householdId: string) =>
      client.post<void>(`/households/${householdId}/leave`),
  };
}

