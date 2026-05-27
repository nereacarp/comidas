import { describe, expect, it } from 'vitest';
import { getDayKcalStatus, kcalStatusLabel } from './meal-plan-kcal-status';

describe('meal-plan-kcal-status', () => {
  it('classifies calorie intake vs target', () => {
    expect(getDayKcalStatus(0, 2000)).toBe('empty');
    expect(getDayKcalStatus(1500, 2000)).toBe('under');
    expect(getDayKcalStatus(1950, 2000)).toBe('on-track');
    expect(getDayKcalStatus(2150, 2000)).toBe('over');
    expect(getDayKcalStatus(1200, null)).toBe('no-target');
  });

  it('returns labels for tracked states', () => {
    expect(kcalStatusLabel('on-track')).toBe('En rango');
    expect(kcalStatusLabel('over')).toBe('Por encima');
    expect(kcalStatusLabel('empty')).toBeNull();
  });
});
