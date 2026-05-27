import { isAppPaletteHex } from '../lib/app-palette-hex';
import { getDefaultColorForIcon } from '../lib/storage-location-icons';

const INK_ON_DARK = '#f3f4f8';

/** Inline styles for tinted chips and badges from a hex accent color. */
export function accentChipStyle(hex: string, selected: boolean): Record<string, string> | undefined {
  if (!selected) return undefined;
  const label = accentReadableLabel(hex);
  return {
    background: accentPastelTint(hex, 62),
    color: label,
    borderColor: `color-mix(in oklab, ${label} 18%, var(--border-subtle))`,
  };
}

/** Stored color only if it is from the app palette; otherwise icon default (Payd tones). */
export function resolveLocationColor(icon: string, color?: string | null): string {
  if (isAppPaletteHex(color)) return color!.trim();
  return getDefaultColorForIcon(icon);
}

/** Light background tint from accent hue (like list-accent-bg on shopping lists). */
export function accentPastelTint(hex: string, accentPercent = 38): string {
  const light = `color-mix(in oklab, ${hex} ${accentPercent}%, var(--surface))`;
  const vivid = `color-mix(in oklab, ${hex} 68%, white)`;
  const dark = `color-mix(in oklab, ${vivid} 32%, var(--surface-raised))`;
  return `light-dark(${light}, ${dark})`;
}

/** Label on the same hue: dark on light surfaces, light on dark surfaces. */
export function accentReadableLabel(hex: string): string {
  const light = `color-mix(in oklab, ${hex} 52%, black)`;
  const dark = `color-mix(in oklab, ${hex} 42%, ${INK_ON_DARK})`;
  return `light-dark(${light}, ${dark})`;
}

/** @deprecated Use sectionAccentCssVarsFromHex from lib/section-accent-css.ts */
export function pantryLocationCardVars(accentHex: string): Record<string, string> {
  return {
    '--section-accent-bg': accentPastelTint(accentHex, 62),
    '--section-accent-text': accentReadableLabel(accentHex),
  };
}
