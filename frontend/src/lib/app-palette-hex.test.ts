import { describe, expect, it } from 'vitest';
import { isAppPaletteHex } from './app-palette-hex';

describe('isAppPaletteHex', () => {
  it('accepts picker and palette tones', () => {
    expect(isAppPaletteHex('#8b6fc0')).toBe(true);
    expect(isAppPaletteHex('#2f6f82')).toBe(true);
  });

  it('rejects legacy tailwind-style colors', () => {
    expect(isAppPaletteHex('#0ea5e9')).toBe(false);
    expect(isAppPaletteHex('#d97706')).toBe(false);
  });
});
