import { describe, it, expect } from 'vitest';
import { computePantrySurplus } from './pantry-surplus.js';

describe('computePantrySurplus', () => {
  it('returns purchased minus needed', () => {
    expect(computePantrySurplus(12, 6)).toBe(6);
  });

  it('returns zero when purchase matches need', () => {
    expect(computePantrySurplus(0.25, 0.25)).toBe(0);
  });

  it('returns full purchase when need is zero', () => {
    expect(computePantrySurplus(500, 0)).toBe(500);
  });
});
