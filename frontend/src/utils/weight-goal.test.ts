import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateCalorieGoals } from './health';
import {
  dailyKcalForWeightGoalSave,
  resolveWeightGoalByPlan,
  resolveWeightGoalByTimeline,
} from './weight-goal';

describe('resolveWeightGoalByTimeline', () => {
  it('warns and blocks when below-floor, keeps requested target date', () => {
    const bmr = calculateBMR(63, 165, 30, 'female');
    const tdee = 1860;
    const goals = calculateCalorieGoals(tdee, bmr, 'female');
    // 9 kg in 9 weeks = 1.0 kg/sem: exact fastMax boundary → floor_limited
    const result = resolveWeightGoalByTimeline({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee,
      bmr,
      sex: 'female',
      goals,
      fromDate: '2026-05-26',
      targetDate: '2026-07-28', // ~9 weeks
    });
    expect(result.result.dailyKcal).toBeGreaterThanOrEqual(bmr);
    expect(result.result.clampedToFloor).toBe(true);
    expect(result.result.requestedKgPerWeek).toBeDefined();
    // Achievable pace at floor is slower than what was requested
    expect(result.result.kgPerWeek).toBeLessThan(result.result.requestedKgPerWeek!);
    // Date is NOT extended — warn and block, user must adjust
    expect(result.result.targetDate).toBe('2026-07-28');
    expect(result.result.isValid).toBe(false);
  });

  it('projects realistic weeks with recommended plan when deadline is too short', () => {
    const bmr = calculateBMR(63, 165, 30, 'female');
    const tdee = 1860;
    const goals = calculateCalorieGoals(tdee, bmr, 'female');
    const result = resolveWeightGoalByTimeline({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee,
      bmr,
      sex: 'female',
      goals,
      fromDate: '2026-05-25',
      targetDate: '2026-06-10',
    });
    expect(result.recommendedPlan).toBe('loseAggressive');
    expect(result.weeksWithPlan).toBeGreaterThan(10);
    expect(result.requestedWeeks!).toBeLessThan(result.weeksWithPlan);
    expect(['floor_limited', 'not_recommended']).toContain(result.result.tier);
    expect(result.weeksWithPlan).toBeGreaterThan(result.requestedWeeks!);
    const save = dailyKcalForWeightGoalSave('timeline', result, 'loseModerate');
    expect(save.linkedPlan).toBeNull();
  });

  it('timeline mode uses exact kcal, plan mode uses generic plan kcal', () => {
    const bmr = calculateBMR(63, 165, 30, 'female');
    const tdee = 1860;
    const goals = calculateCalorieGoals(tdee, bmr, 'female');
    const timeline = resolveWeightGoalByTimeline({
      currentWeightKg: 63,
      targetWeightKg: 58,
      tdee,
      bmr,
      sex: 'female',
      goals,
      fromDate: '2026-05-25',
      targetDate: '2026-09-01',
    });
    const timelineSave = dailyKcalForWeightGoalSave('timeline', timeline, 'loseModerate');
    expect(timelineSave.dailyKcalTarget).toBe(timeline.result.dailyKcal);

    const plan = resolveWeightGoalByPlan({
      currentWeightKg: 63,
      targetWeightKg: 58,
      tdee,
      bmr,
      sex: 'female',
      goals,
      fromDate: '2026-05-25',
      plan: 'loseModerate',
    });
    const planSave = dailyKcalForWeightGoalSave('plan', plan, 'loseModerate');
    expect(planSave.dailyKcalTarget).toBe(goals.loseModerate);
    expect(planSave.linkedPlan).toBe('loseModerate');
  });
});
