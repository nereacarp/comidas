import type { HouseholdInvitation, HouseholdMember } from '../../types';
import { routes } from '../../lib/routes';
import { getSectionBtnClass } from '../../lib/section-accents';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '../../lib/role-badges';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);

interface HouseholdMembersSectionProps {
  members: HouseholdMember[] | undefined;
  pendingInvites?: HouseholdInvitation[];
  currentUserId: string | undefined;
  isOwner: boolean;
  newMemberEmail: string;
  onNewMemberEmailChange: (email: string) => void;
  onAddMember: (e: React.FormEvent) => void;
  onRemoveMember: (userId: string) => void;
  onRoleChange: (userId: string, role: 'EDITOR' | 'VIEWER') => void;
  onTransferOwnership: (userId: string, name: string) => void;
  onCancelInvite?: (invitationId: string) => void;
}

export function HouseholdMembersSection({
  members,
  pendingInvites = [],
  currentUserId,
  isOwner,
  newMemberEmail,
  onNewMemberEmailChange,
  onAddMember,
  onRemoveMember,
  onRoleChange,
  onTransferOwnership,
  onCancelInvite,
}: Readonly<HouseholdMembersSectionProps>) {
  return (
    <section className="card p-6">
      {pendingInvites.length > 0 && (
        <ul className="space-y-2 mb-4">
          {pendingInvites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-2 surface-row border-dashed"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{invite.email}</p>
                <p className="text-xs text-muted mt-0.5">
                  Invitación pendiente · {ROLE_LABELS[invite.role]}
                </p>
              </div>
              {onCancelInvite && (
                <button
                  type="button"
                  onClick={() => onCancelInvite(invite.id)}
                  className="btn-neutral !px-3 !py-2 !text-xs shrink-0"
                >
                  Cancelar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-2 mb-4">
        {members?.map((m) => (
          <li key={m.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between surface-row">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-ink">{m.user.name}</span>
              <span className="text-sm text-muted hidden sm:inline">{m.user.email}</span>
              {(!isOwner || m.role === 'OWNER') && (
                <span className={ROLE_BADGE_CLASS[m.role]}>{ROLE_LABELS[m.role]}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {isOwner && m.role !== 'OWNER' && (
                <select
                  value={m.role}
                  onChange={(e) => onRoleChange(m.user.id, e.target.value as 'EDITOR' | 'VIEWER')}
                  className="select !w-auto !text-xs !py-1.5 !px-2 !rounded-full"
                  aria-label={`Rol de ${m.user.name}`}
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Solo lectura</option>
                </select>
              )}
              {m.user.id !== currentUserId && isOwner && (
                <button
                  type="button"
                  onClick={() => onTransferOwnership(m.user.id, m.user.name)}
                  className="btn-neutral !px-3 !py-2 !text-xs"
                >
                  Hacer propietario
                </button>
              )}
              {m.user.id !== currentUserId && isOwner && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(m.user.id)}
                  className="btn-danger-ghost !px-3 !py-2 !text-xs"
                >
                  Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={onAddMember} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="new-household-member-email" className="sr-only">
            Email de la persona que quieres invitar
          </label>
          <input
            id="new-household-member-email"
            type="email"
            placeholder="Email del nuevo miembro"
            value={newMemberEmail}
            onChange={(e) => onNewMemberEmailChange(e.target.value)}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={!newMemberEmail.trim()}
            className={`${SETTINGS_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Invitar
          </button>
          <p className="basis-full text-xs text-muted">
            Si todavía no tiene cuenta, recibirá un enlace para registrarse y aceptar la invitación.
          </p>
        </form>
      )}
    </section>
  );
}
