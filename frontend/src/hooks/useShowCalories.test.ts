import { describe, expect, it } from 'vitest';
import { resolveShowCalories } from './useShowCalories';

describe('resolveShowCalories', () => {
  it('returns true when preference is enabled', () => {
    expect(resolveShowCalories(true)).toBe(true);
  });

  it('returns false when preference is disabled', () => {
    expect(resolveShowCalories(false)).toBe(false);
  });

  it('defaults to true when preference is undefined', () => {
    expect(resolveShowCalories(undefined)).toBe(true);
  });
});
