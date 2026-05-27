import { APP_PALETTE } from './app-palette';
import { COLOR_PICKER_PRESETS } from './color-picker-presets';

/** Defaults for the five locations created with a new household. */
export const HOUSEHOLD_DEFAULT_LOCATION_COLORS = {
  fridge: APP_PALETTE.pastelMint,
  snowflake: APP_PALETTE.pastelLavender,
  cabinet: APP_PALETTE.pastelPeach,
  shelf: APP_PALETTE.pastelCyan,
  box: APP_PALETTE.pastelCoral,
} as const;

/** Same cycle as shopping-list accents (user can change later in the picker). */
const PANTRY_RANDOM_PASTEL_HEX = COLOR_PICKER_PRESETS.slice(0, 5).map((p) => p.hex);

export function pantryColorForNewLocation(existingCount: number): string {
  const n = PANTRY_RANDOM_PASTEL_HEX.length;
  const i = ((existingCount % n) + n) % n;
  return PANTRY_RANDOM_PASTEL_HEX[i]!;
}
