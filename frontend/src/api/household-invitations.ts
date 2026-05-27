import type { ApiClient } from './client';
import type { HouseholdInvitation, HouseholdMember } from '../types';

export function createHouseholdInvitationsApi(client: ApiClient) {
  return {
    listMine: () => client.get<HouseholdInvitation[]>('/invitations/mine'),

    listForHousehold: (householdId: string) =>
      client.get<HouseholdInvitation[]>(`/households/${householdId}/invitations`),

    accept: (invitationId: string) =>
      client.post<HouseholdMember>(`/invitations/${invitationId}/accept`),

    decline: (invitationId: string) =>
      client.post<HouseholdInvitation>(`/invitations/${invitationId}/decline`),

    cancel: (householdId: string, invitationId: string) =>
      client.delete<void>(`/households/${householdId}/invitations/${invitationId}`),
  };
}
