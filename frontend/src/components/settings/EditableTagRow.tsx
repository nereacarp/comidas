import { ColorPicker } from '../ui/ColorPicker';
import { routes } from '../../lib/routes';
import { getSectionBtnClass } from '../../lib/section-accents';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);

interface EditableTagRowProps {
  name: string;
  color: string;
  isEditing: boolean;
  editName: string;
  editColor: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onColorConfirm: (color: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isSaving?: boolean;
}

export function EditableTagRow({
  name,
  color,
  isEditing,
  editName,
  editColor,
  onEditNameChange,
  onEditColorChange,
  onColorConfirm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isSaving = false,
}: Readonly<EditableTagRowProps>) {
  return (
    <div className="flex flex-wrap items-center gap-2 surface-row">
      <ColorPicker
        value={isEditing ? editColor : color}
        onChange={isEditing ? onEditColorChange : undefined}
        onConfirm={isEditing ? undefined : onColorConfirm}
        label={`Color de ${name}`}
      />

      {isEditing ? (
        <>
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="input min-w-0 flex-1"
            aria-label="Nombre del tag"
          />
          <button
            type="button"
            onClick={onSaveEdit}
            disabled={!editName.trim() || isSaving}
            className={`${SETTINGS_BTN} !px-3 !py-2 !text-xs disabled:opacity-50`}
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSaving}
            className="btn-neutral !px-3 !py-2 !text-xs"
          >
            Cancelar
          </button>
        </>
      ) : (
        <>
          <span
            className="inline-flex min-w-0 flex-1 items-center px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={{
              background: `color-mix(in oklab, ${color} 28%, var(--surface))`,
              borderColor: `color-mix(in oklab, ${color} 45%, var(--border-subtle))`,
              color: 'var(--text-primary)',
            }}
          >
            {name}
          </span>
          <button
            type="button"
            onClick={onStartEdit}
            className="btn-ghost !px-3 !py-2 !text-xs"
          >
            Editar
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={isSaving}
        className="btn-danger-ghost !px-3 !py-2 !text-xs"
        aria-label={`Eliminar ${name}`}
      >
        Eliminar
      </button>
    </div>
  );
}
