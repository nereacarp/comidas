import { APP_PALETTE } from './app-palette';

/** Swatches for the color picker: Payd pastels + marca + acento (same order as list accents). */
export const COLOR_PICKER_PRESETS = [
  { hex: APP_PALETTE.pastelLavender, label: 'Lavanda' },
  { hex: APP_PALETTE.pastelMint, label: 'Menta' },
  { hex: APP_PALETTE.pastelPeach, label: 'Melocotón' },
  { hex: APP_PALETTE.pastelCyan, label: 'Cian' },
  { hex: APP_PALETTE.pastelCoral, label: 'Coral' },
  { hex: APP_PALETTE.brand, label: 'Marca' },
  { hex: APP_PALETTE.accent, label: 'Acento' },
] as const;
