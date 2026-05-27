/** Payd pastel storage defaults — keep in sync with frontend `pantry-location-colors.ts`. */
export const PANTRY_PASTEL_HEX = {
  mint: '#a8e6cf',
  lavender: '#e6ccff',
  peach: '#ffd8a8',
  cyan: '#9bf6ff',
  coral: '#ffadad',
} as const;

export const DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS = [
  { name: 'Nevera', icon: 'fridge', color: PANTRY_PASTEL_HEX.mint, order: 0, layoutColumn: 0 },
  { name: 'Congelador', icon: 'snowflake', color: PANTRY_PASTEL_HEX.lavender, order: 0, layoutColumn: 1 },
  { name: 'Despensa', icon: 'cabinet', color: PANTRY_PASTEL_HEX.peach, order: 0, layoutColumn: 2 },
  { name: 'Armario', icon: 'shelf', color: PANTRY_PASTEL_HEX.cyan, order: 0, layoutColumn: 3 },
  { name: 'Otros', icon: 'box', color: PANTRY_PASTEL_HEX.coral, order: 0, layoutColumn: 4 },
] as const;

/** Cycle for user-created locations (same order as list accents). */
export const PANTRY_RANDOM_PASTEL_HEX = [
  PANTRY_PASTEL_HEX.lavender,
  PANTRY_PASTEL_HEX.mint,
  PANTRY_PASTEL_HEX.peach,
  PANTRY_PASTEL_HEX.cyan,
  PANTRY_PASTEL_HEX.coral,
] as const;

const APP_PALETTE_HEX = new Set(
  [
    '#8b6fc0',
    '#f5a623',
    ...Object.values(PANTRY_PASTEL_HEX),
    '#5a4578',
    '#3d7a5c',
    '#7a5a20',
    '#9e4a4a',
    '#2f6f82',
  ].map((h) => h.toLowerCase()),
);

const ICON_DEFAULT_PASTELS: Record<string, string> = {
  fridge: PANTRY_PASTEL_HEX.mint,
  snowflake: PANTRY_PASTEL_HEX.lavender,
  freezerDrawer: PANTRY_PASTEL_HEX.lavender,
  cabinet: PANTRY_PASTEL_HEX.peach,
  shelf: PANTRY_PASTEL_HEX.cyan,
  box: PANTRY_PASTEL_HEX.coral,
};

export function pantryColorForNewLocation(existingCount: number): string {
  const i = ((existingCount % PANTRY_RANDOM_PASTEL_HEX.length) + PANTRY_RANDOM_PASTEL_HEX.length)
    % PANTRY_RANDOM_PASTEL_HEX.length;
  return PANTRY_RANDOM_PASTEL_HEX[i]!;
}

export function defaultStorageLocationColor(icon: string): string {
  return ICON_DEFAULT_PASTELS[icon] ?? PANTRY_RANDOM_PASTEL_HEX[0]!;
}

export function normalizeStorageLocationColor(icon: string, color?: string | null): string {
  const trimmed = color?.trim().toLowerCase();
  if (trimmed && APP_PALETTE_HEX.has(trimmed)) return trimmed;
  return defaultStorageLocationColor(icon || 'cabinet');
}
