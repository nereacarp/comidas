import type { HouseholdRole } from '../types';

export const ROLE_LABELS: Record<HouseholdRole, string> = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  VIEWER: 'Solo lectura',
};

export const ROLE_BADGE_CLASS: Record<HouseholdRole, string> = {
  OWNER: 'role-badge role-badge--owner',
  EDITOR: 'role-badge role-badge--editor',
  VIEWER: 'role-badge role-badge--viewer',
};
