import { useState } from 'react';
import { useHousehold } from '../../hooks/useHousehold';

const ROLE_LABELS = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  VIEWER: 'Solo lectura',
} as const;

export function HouseholdInvitationsSection() {
  const { pendingInvitations, acceptInvitation, declineInvitation } = useHousehold();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (pendingInvitations.length === 0) {
    return null;
  }

  const handleAccept = async (invitationId: string) => {
    setBusyId(invitationId);
    try {
      await acceptInvitation(invitationId);
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setBusyId(invitationId);
    try {
      await declineInvitation(invitationId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card p-6 border-[color-mix(in_oklab,var(--pastel-lavender)_55%,var(--border-subtle))]">
      <h3 className="type-display-sm mb-4">Invitaciones pendientes</h3>
      <ul className="space-y-3">
        {pendingInvitations.map((invite) => {
          const busy = busyId === invite.id;
          return (
            <li
              key={invite.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--pastel-lavender)_18%,var(--surface))] p-4"
            >
              <p className="text-sm font-semibold text-ink">
                {invite.household.name}
              </p>
              <p className="mt-1 text-xs text-muted">
                Te invita {invite.invitedBy.name} · {ROLE_LABELS[invite.role]}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAccept(invite.id)}
                  className="btn-primary !py-2 !text-xs disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDecline(invite.id)}
                  className="btn-neutral !py-2 !text-xs disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
