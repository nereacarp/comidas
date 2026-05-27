import { APP_PALETTE } from './app-palette';
import { COLOR_PICKER_PRESETS } from './color-picker-presets';

/** All hex values that count as an intentional app palette choice (picker + icon tones). */
const APP_PALETTE_HEX_VALUES: readonly string[] = [
  ...COLOR_PICKER_PRESETS.map((p) => p.hex),
  ...Object.values(APP_PALETTE),
];

const APP_PALETTE_HEX_SET = new Set(
  APP_PALETTE_HEX_VALUES.map((hex) => hex.toLowerCase()),
);

export function isAppPaletteHex(color: string | null | undefined): boolean {
  const trimmed = color?.trim().toLowerCase();
  return Boolean(trimmed && APP_PALETTE_HEX_SET.has(trimmed));
}
