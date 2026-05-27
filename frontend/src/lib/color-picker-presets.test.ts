import { describe, expect, it } from 'vitest';
import { APP_PALETTE } from './app-palette';
import { COLOR_PICKER_PRESETS } from './color-picker-presets';

describe('COLOR_PICKER_PRESETS', () => {
  it('uses Payd pastel and accent tokens from the app palette', () => {
    const hexes = COLOR_PICKER_PRESETS.map((p) => p.hex);
    expect(hexes).toEqual([
      APP_PALETTE.pastelLavender,
      APP_PALETTE.pastelMint,
      APP_PALETTE.pastelPeach,
      APP_PALETTE.pastelCyan,
      APP_PALETTE.pastelCoral,
      APP_PALETTE.brand,
      APP_PALETTE.accent,
    ]);
  });

  it('does not suggest generic Tailwind-style accent colors', () => {
    const hexes = COLOR_PICKER_PRESETS.map((p) => p.hex.toLowerCase());
    expect(hexes).not.toContain('#d97706');
    expect(hexes).not.toContain('#6366f1');
  });
});
