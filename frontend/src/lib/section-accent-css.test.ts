import { describe, expect, it } from 'vitest';
import { accentPastelTint, accentReadableLabel } from '../utils/color-styles';
import { sectionAccentCssVarsFromHex } from './section-accent-css';

describe('sectionAccentCssVarsFromHex', () => {
  it('derives pastel bg and darker label from user accent hex', () => {
    const vars = sectionAccentCssVarsFromHex('#8b6fc0');
    expect(vars['--section-accent-bg']).toBe(accentPastelTint('#8b6fc0', 62));
    expect(vars['--section-accent-text']).toBe(accentReadableLabel('#8b6fc0'));
  });
});
