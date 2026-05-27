import { ColorPicker } from '../ui/ColorPicker';
import { StorageLocationIconPicker } from '../pantry/StorageLocationIconPicker';
import {
  getDefaultColorForIcon,
  renderStorageLocationIcon,
  type StorageLocationIconId,
} from '../../lib/storage-location-icons';
import { resolveLocationColor } from '../../utils/color-styles';
import { routes } from '../../lib/routes';
import { getSectionBtnClass } from '../../lib/section-accents';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);

interface EditableLocationRowProps {
  name: string;
  icon: string | null | undefined;
  color: string | null | undefined;
  isEditing: boolean;
  editName: string;
  editIcon: StorageLocationIconId;
  editColor: string;
  onEditNameChange: (name: string) => void;
  onEditIconChange: (icon: StorageLocationIconId) => void;
  onEditColorChange: (color: string) => void;
  onColorConfirm: (color: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  isSaving?: boolean;
}

export function EditableLocationRow({
  name,
  icon,
  color,
  isEditing,
  editName,
  editIcon,
  editColor,
  onEditNameChange,
  onEditIconChange,
  onEditColorChange,
  onColorConfirm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isSaving = false,
}: Readonly<EditableLocationRowProps>) {
  const displayIcon: StorageLocationIconId = isEditing
    ? editIcon
    : ((icon as StorageLocationIconId) || 'cabinet');
  const displayColor = resolveLocationColor(displayIcon, isEditing ? editColor : color);

  const handleIconChange = (iconId: StorageLocationIconId) => {
    onEditIconChange(iconId);
    onEditColorChange(getDefaultColorForIcon(iconId));
  };

  return (
    <div className="surface-row space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ColorPicker
          value={displayColor}
          onChange={
            isEditing
              ? (next) => onEditColorChange(resolveLocationColor(editIcon, next))
              : undefined
          }
          onConfirm={isEditing ? undefined : onColorConfirm}
          label={`Color de ${name}`}
        />

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="input min-w-0 flex-1"
            aria-label="Nombre de la ubicación"
          />
        ) : (
          <span className="inline-flex min-w-0 flex-1 items-center gap-2.5 text-sm font-semibold text-ink">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border"
              style={{
                background: `color-mix(in oklab, ${displayColor} 22%, var(--surface))`,
                borderColor: `color-mix(in oklab, ${displayColor} 40%, var(--border-subtle))`,
                color: displayColor,
              }}
            >
              {renderStorageLocationIcon(displayIcon, 'w-4 h-4')}
            </span>
            <span className="truncate">{name}</span>
          </span>
        )}

        {isEditing ? (
          <>
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
          <button
            type="button"
            onClick={onStartEdit}
            className="btn-ghost !px-3 !py-2 !text-xs"
          >
            Editar
          </button>
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

      {isEditing && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">Icono</p>
          <StorageLocationIconPicker
            value={editIcon}
            onChange={handleIconChange}
            accentColor={resolveLocationColor(editIcon, editColor)}
          />
        </div>
      )}
    </div>
  );
}
