import { describe, it, expect } from 'vitest';
import { computePantrySurplus } from './pantry-surplus';

describe('computePantrySurplus', () => {
  it('returns excess over needed', () => {
    expect(computePantrySurplus(12, 6)).toBe(6);
  });

  it('returns zero when exact amount purchased', () => {
    expect(computePantrySurplus(6, 6)).toBe(0);
  });

  it('returns full purchase when list need is unknown', () => {
    expect(computePantrySurplus(3, 0)).toBe(3);
  });
});
