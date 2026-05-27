import { describe, expect, it } from 'vitest';
import { normalizeHexColor } from './normalize-hex-color';

describe('normalizeHexColor', () => {
  it('accepts 6-digit hex with hash', () => {
    expect(normalizeHexColor('#6366F1')).toBe('#6366f1');
  });

  it('accepts 6-digit hex without hash', () => {
    expect(normalizeHexColor('d97706')).toBe('#d97706');
  });

  it('expands 3-digit shorthand', () => {
    expect(normalizeHexColor('#f0a')).toBe('#ff00aa');
  });

  it('returns fallback for invalid input', () => {
    expect(normalizeHexColor('not-a-color', '#111111')).toBe('#111111');
  });
});
