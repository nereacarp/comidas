import { createContext, useContext } from 'react';
import type { Household, HouseholdInvitation } from '../types';

interface HouseholdContextValue {
  household: Household | null;
  households: Household[];
  householdId: string | null;
  pendingInvitations: HouseholdInvitation[];
  canEdit: boolean;
  isLoading: boolean;
  refreshHousehold: () => Promise<void>;
  reloadHousehold: () => Promise<void>;
  switchHousehold: (householdId: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
}

export const HouseholdContext = createContext<HouseholdContextValue>({
  household: null,
  households: [],
  householdId: null,
  pendingInvitations: [],
  canEdit: true,
  isLoading: true,
  refreshHousehold: async () => {},
  reloadHousehold: async () => {},
  switchHousehold: async () => {},
  acceptInvitation: async () => {},
  declineInvitation: async () => {},
});

export function useHousehold() {
  return useContext(HouseholdContext);
}

export function useHouseholdId(): string {
  const { householdId, isLoading } = useHousehold();
  if (isLoading) return '';
  if (!householdId) {
    throw new Error('No hay hogar disponible');
  }
  return householdId;
}
