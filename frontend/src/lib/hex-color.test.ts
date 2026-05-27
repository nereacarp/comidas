import { describe, expect, it } from 'vitest';
import { hexToHsv, hsvToHex } from './hex-color';

describe('hex-color', () => {
  it('round-trips indigo', () => {
    const hex = '#6366f1';
    const hsv = hexToHsv(hex);
    expect(hsvToHex(hsv.h, hsv.s, hsv.v)).toBe(hex);
  });

  it('round-trips amber', () => {
    const hex = '#d97706';
    const hsv = hexToHsv(hex);
    expect(hsvToHex(hsv.h, hsv.s, hsv.v)).toBe(hex);
  });
});
