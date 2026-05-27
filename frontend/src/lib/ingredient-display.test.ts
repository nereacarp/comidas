import { describe, expect, it } from 'vitest';
import { formatPantryQuantity } from './ingredient-display';

describe('formatPantryQuantity', () => {
  it('formats integer and unit', () => {
    expect(formatPantryQuantity(3, 'uds')).toBe('3 uds');
  });

  it('rounds fractional quantities', () => {
    expect(formatPantryQuantity(1.256, 'kg')).toBe('1.26 kg');
  });
});
