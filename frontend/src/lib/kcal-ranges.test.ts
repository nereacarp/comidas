import { describe, it, expect } from 'vitest';
import { kcalRangeToQueryParams } from './kcal-ranges';

describe('kcalRangeToQueryParams', () => {
  it('returns empty for "Todas"', () => {
    expect(kcalRangeToQueryParams(0)).toEqual({});
  });

  it('maps under-200 range with exclusive upper bound', () => {
    expect(kcalRangeToQueryParams(1)).toEqual({ maxKcal: '200' });
  });

  it('maps middle ranges with min and max', () => {
    expect(kcalRangeToQueryParams(2)).toEqual({ minKcal: '200', maxKcal: '350' });
    expect(kcalRangeToQueryParams(3)).toEqual({ minKcal: '350', maxKcal: '500' });
  });

  it('maps +500 with min only', () => {
    expect(kcalRangeToQueryParams(4)).toEqual({ minKcal: '500' });
  });
});
