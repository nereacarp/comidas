import { useEffect, useId, useRef, useState } from 'react';
import { useColorPickerPlacement } from '../../hooks/use-color-picker-placement';
import { COLOR_PICKER_PRESETS } from '../../lib/color-picker-presets';
import { routes } from '../../lib/routes';
import { getSectionBtnClass } from '../../lib/section-accents';

const SETTINGS_BTN = getSectionBtnClass(routes.settings);
import { normalizeHexColor } from '../../lib/normalize-hex-color';
import { HexColorWheel } from './HexColorWheel';

interface ColorPickerProps {
  value: string;
  /** Aplica el color al elegir (formularios de creación o edición inline). */
  onChange?: (value: string) => void;
  /** Muestra Guardar en el panel; solo persiste al confirmar (color rápido en ítems existentes). */
  onConfirm?: (value: string) => void;
  label?: string;
}

export function ColorPicker({
  value,
  onChange,
  onConfirm,
  label = 'Color',
}: Readonly<ColorPickerProps>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const placement = useColorPickerPlacement(open, rootRef, popoverRef);
  const popoverId = useId();
  const hex = normalizeHexColor(value);
  const draftHex = normalizeHexColor(draft, hex);
  const confirmMode = Boolean(onConfirm);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const applyColor = (next: string) => {
    const normalized = normalizeHexColor(next, hex);
    if (confirmMode) {
      setDraft(normalized);
      return;
    }
    onChange?.(normalized);
  };

  const handleConfirm = () => {
    const normalized = normalizeHexColor(draft, hex);
    onConfirm?.(normalized);
    setOpen(false);
  };

  const displayHex = open && confirmMode ? draftHex : hex;

  return (
    <div ref={rootRef} className="color-picker-root">
      <button
        type="button"
        className="color-picker"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-haspopup="dialog"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <span className="color-picker-swatch" style={{ backgroundColor: displayHex }} aria-hidden />
      </button>

      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          className={`color-picker-popover color-picker-popover--${placement}`}
          role="dialog"
          aria-label={label}
        >
          <HexColorWheel
            color={draftHex}
            onChange={applyColor}
            className="color-picker-panel"
          />
          <div className="color-picker-presets" role="list" aria-label="Colores sugeridos">
            {COLOR_PICKER_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                role="listitem"
                className="color-picker-preset"
                style={{ backgroundColor: preset.hex }}
                aria-label={preset.label}
                aria-pressed={draftHex === preset.hex}
                onClick={() => applyColor(preset.hex)}
              />
            ))}
          </div>
          <label className="color-picker-hex-field">
            <span className="sr-only">Código hexadecimal</span>
            <span className="color-picker-hex-prefix" aria-hidden>
              #
            </span>
            <input
              type="text"
              className="color-picker-hex-input"
              value={draftHex.slice(1)}
              maxLength={6}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6);
                if (raw.length === 6) applyColor(`#${raw}`);
              }}
            />
          </label>
          {confirmMode && (
            <div className="flex gap-2">
              <button
                type="button"
                className={`${SETTINGS_BTN} flex-1 !py-2 !text-xs`}
                onClick={handleConfirm}
              >
                Guardar
              </button>
              <button
                type="button"
                className="btn-neutral flex-1 !py-2 !text-xs"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
