import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createHouseholdsApi } from '../api/households';
import { createHouseholdInvitationsApi } from '../api/household-invitations';
import { apiClient } from '../api/client';
import { HouseholdContext } from '../hooks/useHousehold';
import {
  clearStoredHouseholdId,
  getStoredHouseholdId,
  pickHouseholdId,
  setStoredHouseholdId,
} from '../lib/active-household';
import { HouseholdSetupScreen } from '../components/HouseholdSetupScreen';
import type { Household, HouseholdInvitation } from '../types';

const householdsApi = createHouseholdsApi(apiClient);
const invitationsApi = createHouseholdInvitationsApi(apiClient);

interface HouseholdProviderProps {
  children: ReactNode;
}

export function HouseholdProvider({ children }: Readonly<HouseholdProviderProps>) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<HouseholdInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const loadInvitations = useCallback(async () => {
    try {
      const invites = await invitationsApi.listMine();
      setPendingInvitations(invites);
    } catch {
      setPendingInvitations([]);
    }
  }, []);

  const loadHouseholdById = useCallback(async (id: string) => {
    const fresh = await householdsApi.getById(id);
    setHousehold(fresh);
    setStoredHouseholdId(id);
  }, []);

  const loadHouseholds = useCallback(async () => {
    const list = await householdsApi.list();
    if (list.length === 0) {
      setShowSetup(true);
      return;
    }
    setShowSetup(false);
    setHouseholds(list);

    const selectedId = pickHouseholdId(list, getStoredHouseholdId());
    if (!selectedId) {
      setHousehold(null);
      clearStoredHouseholdId();
      return;
    }

    await loadHouseholdById(selectedId);
    await loadInvitations();
  }, [loadHouseholdById, loadInvitations]);

  useEffect(() => {
    loadHouseholds()
      .catch(() => setHousehold(null))
      .finally(() => setIsLoading(false));
  }, [loadHouseholds]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadInvitations();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadInvitations]);

  const refreshHousehold = useCallback(async () => {
    if (!household) {
      await loadHouseholds();
      return;
    }
    const updated = await householdsApi.getById(household.id);
    setHousehold(updated);
    setHouseholds((prev) =>
      prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h)),
    );
    await loadInvitations();
  }, [household, loadHouseholds, loadInvitations]);

  const reloadHousehold = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadHouseholds();
    } finally {
      setIsLoading(false);
    }
  }, [loadHouseholds]);

  const switchHousehold = useCallback(
    async (householdId: string) => {
      setIsLoading(true);
      try {
        await loadHouseholdById(householdId);
        const list = await householdsApi.list();
        setHouseholds(list);
      } finally {
        setIsLoading(false);
      }
    },
    [loadHouseholdById],
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      await invitationsApi.accept(invitationId);
      await reloadHousehold();
    },
    [reloadHousehold],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      await invitationsApi.decline(invitationId);
      await loadInvitations();
    },
    [loadInvitations],
  );

  const handleCreateHousehold = useCallback(
    async (name: string) => {
      const created = await householdsApi.create({ name });
      setHouseholds([created]);
      setShowSetup(false);
      await loadHouseholdById(created.id);
      await loadInvitations();
    },
    [loadHouseholdById, loadInvitations],
  );

  const canEdit = household?.role !== 'VIEWER';

  if (showSetup) {
    return <HouseholdSetupScreen onSubmit={handleCreateHousehold} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--pastel-lavender)] border-t-[var(--brand)] animate-spin"
          role="status"
          aria-label="Cargando hogar"
        />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <p className="text-muted text-sm">No se pudo cargar tu hogar. Recarga la página.</p>
      </div>
    );
  }

  return (
    <HouseholdContext.Provider
      value={{
        household,
        households,
        householdId: household.id,
        pendingInvitations,
        canEdit,
        isLoading: false,
        refreshHousehold,
        reloadHousehold,
        switchHousehold,
        acceptInvitation,
        declineInvitation,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}
