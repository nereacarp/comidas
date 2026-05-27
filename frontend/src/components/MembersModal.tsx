import { useState } from 'react';
import { Modal } from './ui/Modal';
import { createHouseholdsApi } from '../api/households';
import { apiClient } from '../api/client';
import type { Household, HouseholdMember } from '../types';
import { ROLE_BADGE_CLASS, ROLE_LABELS } from '../lib/role-badges';

const householdsApi = createHouseholdsApi(apiClient);

interface MembersModalProps {
  household: Household | null;
  currentUserId: string | undefined;
  onClose: () => void;
  onHouseholdUpdated: (id: string) => Promise<void>;
  onHouseholdDeleted: () => Promise<void>;
}

export function MembersModal({
  household,
  currentUserId,
  onClose,
  onHouseholdUpdated,
  onHouseholdDeleted,
}: Readonly<MembersModalProps>) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isOwner = household?.members?.some(
    (m) => m.user.id === currentUserId && m.role === 'OWNER'
  );

  const handleAddMember = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!household || !newMemberEmail.trim()) return;
    setError('');
    try {
      await householdsApi.addMember(household.id, { email: newMemberEmail.trim() });
      setNewMemberEmail('');
      await onHouseholdUpdated(household.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir miembro');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!household) return;
    try {
      await householdsApi.removeMember(household.id, userId);
      await onHouseholdUpdated(household.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar miembro');
    }
  };

  const handleRoleChange = async (userId: string, role: 'EDITOR' | 'VIEWER') => {
    if (!household) return;
    setError('');
    try {
      await householdsApi.updateMemberRole(household.id, userId, role);
      await onHouseholdUpdated(household.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar rol');
    }
  };

  const handleLeave = async () => {
    if (!household) return;
    try {
      await householdsApi.leaveHousehold(household.id);
      onClose();
      await onHouseholdDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al salir del hogar');
    }
  };

  const handleClose = () => {
    setConfirmLeave(false);
    setError('');
    setNewMemberEmail('');
    onClose();
  };

  return (
    <Modal
      isOpen={!!household}
      onClose={handleClose}
      title={household ? `Gestionar: ${household.name}` : ''}
    >
      {household && (
        <div className="space-y-5">
          {error && (
            <div className="alert-error" role="alert">
              <p>{error}</p>
            </div>
          )}

          <MemberList
            members={household.members}
            currentUserId={currentUserId}
            isOwner={!!isOwner}
            onRemove={handleRemoveMember}
            onRoleChange={handleRoleChange}
          />

          {isOwner && (
            <AddMemberForm
              email={newMemberEmail}
              onEmailChange={setNewMemberEmail}
              onSubmit={handleAddMember}
            />
          )}

          {!isOwner && (
            <LeaveSection
              confirmLeave={confirmLeave}
              onConfirmToggle={setConfirmLeave}
              onLeave={handleLeave}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function MemberList({
  members,
  currentUserId,
  isOwner,
  onRemove,
  onRoleChange,
}: Readonly<{
  members: HouseholdMember[];
  currentUserId: string | undefined;
  isOwner: boolean;
  onRemove: (userId: string) => void;
  onRoleChange: (userId: string, role: 'EDITOR' | 'VIEWER') => void;
}>) {
  return (
    <div>
      <h4 className="type-label mb-3">Miembros</h4>
      <ul className="space-y-2">
        {members?.map((m) => (
          <li key={m.id} className="flex items-center justify-between surface-row">
            <div className="flex items-center gap-2 min-w-0">
              <div className="avatar-initials">
                {m.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-ink">{m.user.name}</span>
                <span className="text-xs text-muted ml-1.5 hidden sm:inline">{m.user.email}</span>
              </div>
              {(!isOwner || m.role === 'OWNER') && (
                <span className={ROLE_BADGE_CLASS[m.role]}>
                  {ROLE_LABELS[m.role]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                  onClick={() => onRemove(m.user.id)}
                  className="btn-danger-ghost !px-3 !py-2 !text-xs"
                >
                  Quitar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddMemberForm({
  email,
  onEmailChange,
  onSubmit,
}: Readonly<{
  email: string;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}>) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="email"
        placeholder="Email del nuevo miembro"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={!email.trim()}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Añadir
      </button>
    </form>
  );
}

function LeaveSection({
  confirmLeave,
  onConfirmToggle,
  onLeave,
}: Readonly<{
  confirmLeave: boolean;
  onConfirmToggle: (v: boolean) => void;
  onLeave: () => void;
}>) {
  return (
    <div className="border-t border-[var(--border-subtle)] pt-4">
      {confirmLeave ? (
        <div className="alert-warning space-y-3">
          <p className="text-sm font-semibold text-ink">
            ¿Seguro que quieres salir de este hogar?
          </p>
          <p className="text-xs text-muted">
            Perderás acceso a las recetas, planes y listas de la compra de este hogar.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onLeave}
              className="btn-soft"
            >
              Sí, salir
            </button>
            <button
              onClick={() => onConfirmToggle(false)}
              className="btn-neutral"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onConfirmToggle(true)}
          className="w-full btn-soft"
        >
          Salir del hogar
        </button>
      )}
    </div>
  );
}
