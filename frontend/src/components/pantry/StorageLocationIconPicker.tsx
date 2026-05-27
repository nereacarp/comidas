import {
  STORAGE_LOCATION_ICON_OPTIONS,
  type StorageLocationIconId,
  renderStorageLocationIcon,
} from '../../lib/storage-location-icons';
import { accentChipStyle } from '../../utils/color-styles';

interface StorageLocationIconPickerProps {
  value: StorageLocationIconId;
  onChange: (iconId: StorageLocationIconId) => void;
  /** Accent for the selected icon button (matches location color picker). */
  accentColor: string;
}

export function StorageLocationIconPicker({
  value,
  onChange,
  accentColor,
}: Readonly<StorageLocationIconPickerProps>) {
  return (
    <div
      className="icon-picker-panel max-h-44 overflow-y-auto rounded-2xl border p-3"
      style={{
        borderColor: 'color-mix(in oklab, var(--border-subtle) 80%, transparent)',
        background: 'color-mix(in oklab, var(--page-bg) 40%, var(--surface))',
      }}
    >
      <div
        className="grid grid-cols-5 sm:grid-cols-7 gap-2.5"
        role="radiogroup"
        aria-label="Icono de la ubicación"
      >
        {STORAGE_LOCATION_ICON_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={option.label}
              onClick={() => onChange(option.id)}
              className={`icon-picker-btn ${selected ? 'icon-picker-btn-active' : 'icon-picker-btn-inactive'}`}
              style={selected ? accentChipStyle(accentColor, true) : undefined}
            >
              {renderStorageLocationIcon(option.id, 'w-6 h-6')}
              <span className="sr-only">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
