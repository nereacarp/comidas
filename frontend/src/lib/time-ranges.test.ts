import { describe, it, expect } from 'vitest';
import { timeRangeToQueryParams } from './time-ranges';

describe('timeRangeToQueryParams', () => {
  it('returns empty for "Todos"', () => {
    expect(timeRangeToQueryParams(0)).toEqual({});
  });

  it('maps under-15 range', () => {
    expect(timeRangeToQueryParams(1)).toEqual({ maxTotalTime: '15' });
  });

  it('maps middle ranges', () => {
    expect(timeRangeToQueryParams(2)).toEqual({ minTotalTime: '15', maxTotalTime: '30' });
  });

  it('maps +60 with min only', () => {
    expect(timeRangeToQueryParams(5)).toEqual({ minTotalTime: '60' });
  });
});
