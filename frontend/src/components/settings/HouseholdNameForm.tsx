import { useEffect, useState } from 'react';
import { routes } from '../../lib/routes';
import { getSectionBtnClass, getSectionSoftBtnClass } from '../../lib/section-accents';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);
const SETTINGS_SOFT_BTN = getSectionSoftBtnClass(routes.settings);

export function normalizeHouseholdName(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface HouseholdNameFormProps {
  name: string;
  canEdit: boolean;
  onSave: (name: string) => Promise<void>;
}

export function HouseholdNameForm({
  name,
  canEdit,
  onSave,
}: Readonly<HouseholdNameFormProps>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      setDraftName(name);
    }
  }, [name, isEditing]);

  const startEdit = () => {
    setDraftName(name);
    setLocalError('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftName(name);
    setLocalError('');
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeHouseholdName(draftName);
    if (!normalized) {
      setLocalError('El nombre no puede estar vacío');
      return;
    }
    if (normalized === name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setLocalError('');
    try {
      await onSave(normalized);
      setIsEditing(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al guardar el nombre');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {localError && (
        <p className="text-sm font-semibold text-[var(--danger-text)] mb-3" role="alert">
          {localError}
        </p>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label htmlFor="household-name" className="sr-only">
            Nombre del hogar
          </label>
          <input
            id="household-name"
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="input flex-1"
            autoFocus
            maxLength={80}
            disabled={isSaving}
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="submit"
              disabled={!normalizeHouseholdName(draftName) || isSaving}
              className={`${SETTINGS_BTN} !px-4 !py-2.5 disabled:opacity-50`}
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={isSaving}
              className="btn-neutral !px-4 !py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold text-ink min-w-0 break-words">{name}</p>
          {canEdit && (
            <button
              type="button"
              onClick={startEdit}
              className={`${SETTINGS_SOFT_BTN} !text-xs !py-2`}
            >
              Cambiar nombre
            </button>
          )}
        </div>
      )}

      {!canEdit && !isEditing && (
        <p className="type-hint mt-2">
          Tu rol es solo lectura; no puedes cambiar el nombre del hogar.
        </p>
      )}
    </div>
  );
}
