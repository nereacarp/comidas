import { describe, expect, it } from 'vitest';
import {
  resolveLocationColor,
  accentChipStyle,
  accentReadableLabel,
  accentPastelTint,
  pantryLocationCardVars,
} from './color-styles';

describe('resolveLocationColor', () => {
  it('uses stored color when it is from the app palette', () => {
    expect(resolveLocationColor('cabinet', '#8b6fc0')).toBe('#8b6fc0');
  });

  it('ignores legacy hex colors and uses icon default', () => {
    expect(resolveLocationColor('fridge', '#0ea5e9')).toBe('#a8e6cf');
    expect(resolveLocationColor('cabinet', '#ff00aa')).toBe('#ffd8a8');
  });

  it('falls back to icon default when color missing', () => {
    expect(resolveLocationColor('fridge', '')).toBe('#a8e6cf');
  });
});

describe('accentChipStyle', () => {
  it('returns styles only when selected', () => {
    expect(accentChipStyle('#0ea5e9', false)).toBeUndefined();
    expect(accentChipStyle('#0ea5e9', true)?.color).toBe(accentReadableLabel('#0ea5e9'));
  });
});

describe('accentReadableLabel', () => {
  it('uses light-dark for readable labels on both themes', () => {
    const label = accentReadableLabel('#e6ccff');
    expect(label).toContain('#e6ccff');
    expect(label).toContain('light-dark');
    expect(label).toContain('black');
    expect(label).toContain('#f3f4f8');
  });
});

describe('accentPastelTint', () => {
  it('uses light-dark for panel tints', () => {
    const tint = accentPastelTint('#3d7a5c', 62);
    expect(tint).toContain('light-dark');
    expect(tint).toContain('var(--surface-raised)');
  });
});

describe('pantryLocationCardVars', () => {
  it('exposes section accent bg and readable label on same hue', () => {
    const vars = pantryLocationCardVars('#0ea5e9');
    expect(vars['--section-accent-bg']).toBe(accentPastelTint('#0ea5e9', 62));
    expect(vars['--section-accent-text']).toBe(accentReadableLabel('#0ea5e9'));
    expect(vars['--section-accent-text']).toContain('light-dark');
  });
});
