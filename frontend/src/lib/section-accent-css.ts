import { accentPastelTint, accentReadableLabel } from '../utils/color-styles';

/** Shared accent tokens (same pattern as Por comprar: pastel bg + darker same-hue text). */
/** User location hex is the dark/icon tone; derive a pastel bg like list-accent-bg. */
export function sectionAccentCssVarsFromHex(accentHex: string): Record<string, string> {
  return {
    '--section-accent-bg': accentPastelTint(accentHex, 62),
    '--section-accent-text': accentReadableLabel(accentHex),
  };
}
