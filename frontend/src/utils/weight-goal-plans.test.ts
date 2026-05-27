import { describe, it, expect } from 'vitest';
import { calculateBMR } from './health';
import { calculateCalorieGoalsFromPhysiology } from './deficit-planning';
import {
  buildPlanProjections,
  shouldHighlightPlanForTier,
} from './weight-goal-plans';

describe('shouldHighlightPlanForTier', () => {
  it('returns false for not_recommended and floor_limited', () => {
    expect(shouldHighlightPlanForTier('not_recommended')).toBe(false);
    expect(shouldHighlightPlanForTier('floor_limited')).toBe(false);
  });

  it('returns true for normal loss tiers', () => {
    expect(shouldHighlightPlanForTier('fast')).toBe(true);
    expect(shouldHighlightPlanForTier('moderate')).toBe(true);
  });
});

describe('buildPlanProjections', () => {
  it('returns one projection per loss plan with target date', () => {
    const tdee = 1860;
    const bmr = calculateBMR(63, 165, 30, 'female');
    const goals = calculateCalorieGoalsFromPhysiology(tdee, bmr, 'female');
    const rows = buildPlanProjections({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee,
      bmr,
      sex: 'female',
      goals,
      fromDate: '2026-05-25',
    });
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.targetDate && r.weeksToGoal > 0)).toBe(true);
  });
});
