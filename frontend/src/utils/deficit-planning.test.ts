import { describe, it, expect } from 'vitest';
import {
  analyzePlanGoal,
  analyzeTimelineGoal,
  classifyDeficitTier,
  dailyDeficitFromKgPerWeek,
  kgPerWeekFromDeficit,
  recommendPlanForKcal,
  calculateCalorieGoalsFromPhysiology,
  TIMELINE_FLOOR_LIMIT_KG_PER_WEEK,
} from './deficit-planning';
import { calculateBMR } from './health';

describe('kgPerWeekFromDeficit', () => {
  it('derives ~0.75 kg/week from 825 kcal/day deficit', () => {
    expect(kgPerWeekFromDeficit(825)).toBeCloseTo(0.75, 2);
  });
});

describe('dailyDeficitFromKgPerWeek', () => {
  it('inverts kg/week using 7700 kcal/kg', () => {
    expect(dailyDeficitFromKgPerWeek(0.75)).toBe(825);
  });
});

describe('classifyDeficitTier', () => {
  it('labels >1.3 kg/week as not recommended', () => {
    expect(classifyDeficitTier(1.4, -10)).toBe('not_recommended');
  });

  it('labels 1.2 kg/week as not recommended', () => {
    expect(classifyDeficitTier(1.2, -10)).toBe('not_recommended');
  });

  it('labels 1.0 kg/week as fast', () => {
    expect(classifyDeficitTier(1, -10)).toBe('fast');
  });

  it('labels 0.9 kg/week as fast', () => {
    expect(classifyDeficitTier(0.9, -10)).toBe('fast');
  });

  it('labels 0.67 kg/week as moderate', () => {
    expect(classifyDeficitTier(0.67, -10)).toBe('moderate');
  });

  it('labels 0.5 kg/week as light', () => {
    expect(classifyDeficitTier(0.5, -10)).toBe('light');
  });

  it('labels 0.25 kg/week as very light', () => {
    expect(classifyDeficitTier(0.25, -3)).toBe('very_light');
  });
});

describe('analyzeTimelineGoal — kcal dinámicas por plazo', () => {
  const bmr = calculateBMR(70, 175, 30, 'male');
  const tdee = 1860;
  const from = '2026-05-25';

  it('9 kg: kcal bajan al acortar plazo; plazos que requieren bajar del TMB se fijan al suelo', () => {
    const bmrF = calculateBMR(63, 165, 30, 'female');
    const base = {
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee: 1860,
      bmr: bmrF,
      sex: 'female' as const,
      fromDate: from,
    };
    const w30 = analyzeTimelineGoal({ ...base, targetDate: '2026-12-24' });
    const w20 = analyzeTimelineGoal({ ...base, targetDate: '2026-10-12' });
    const w15 = analyzeTimelineGoal({ ...base, targetDate: '2026-09-07' });
    expect(w30.dailyKcal).toBeGreaterThan(w20.dailyKcal);
    expect(w20.dailyKcal).toBeGreaterThan(w15.dailyKcal);
    expect(w20.clampedToFloor).toBeFalsy(); // 20 sem ≈ 0.45 kg/sem, por encima del suelo
    expect(w15.clampedToFloor).toBe(true);  // 15 sem = 0.6 kg/sem requiere 1200 kcal < TMB
    expect(w30.dailyKcal - w15.dailyKcal).toBeGreaterThan(100);
  });

  it('10 kg en 10 semanas (1 kg/sem): por debajo del suelo TMB masculino, se fija al mínimo', () => {
    const result = analyzeTimelineGoal({
      currentWeightKg: 70,
      targetWeightKg: 60,
      tdee,
      bmr,
      sex: 'male',
      fromDate: from,
      targetDate: '2026-08-03',
    });
    expect(result.clampedToFloor).toBe(true);
    expect(result.requestedKgPerWeek).toBe(1);       // lo que pedía el plazo
    expect(result.kgPerWeek).toBeLessThan(1);         // ritmo real con el suelo
    expect(result.dailyKcal).toBeGreaterThanOrEqual(bmr); // nunca por debajo del TMB
  });

  it('9 kg en 9 semanas (1 kg/sem): por debajo del suelo TMB femenino, se ajusta al mínimo seguro', () => {
    const bmrF = calculateBMR(63, 165, 30, 'female');
    const result = analyzeTimelineGoal({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee: 1860,
      bmr: bmrF,
      sex: 'female',
      fromDate: from,
      targetDate: '2026-07-27',
    });
    expect(result.clampedToFloor).toBe(true);
    expect(result.requestedKgPerWeek).toBe(1);
    expect(result.kgPerWeek).toBeLessThan(1);
    expect(result.dailyKcal).toBeGreaterThanOrEqual(bmrF);
  });

  it('10 kg en 8 semanas (>1 kg/sem y bajo TMB): limitado por TMB', () => {
    const result = analyzeTimelineGoal({
      currentWeightKg: 70,
      targetWeightKg: 60,
      tdee,
      bmr,
      sex: 'male',
      fromDate: from,
      targetDate: '2026-07-20',
    });
    expect(result.requestedKgPerWeek).toBeGreaterThan(TIMELINE_FLOOR_LIMIT_KG_PER_WEEK);
    expect(result.tier).toBe('floor_limited');
    expect(result.dailyKcal).toBeGreaterThanOrEqual(bmr);
  });

  it('plazo muy corto (>1 kg/sem y bajo TMB): limitado por TMB', () => {
    const result = analyzeTimelineGoal({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee,
      bmr: calculateBMR(63, 165, 30, 'female'),
      sex: 'female',
      fromDate: from,
      targetDate: '2026-06-10',
    });
    expect(result.requestedKgPerWeek).toBeGreaterThan(TIMELINE_FLOOR_LIMIT_KG_PER_WEEK);
    expect(result.tier).toBe('floor_limited');
    expect(result.clampedToFloor).toBe(true);
  });
});

describe('analyzePlanGoal', () => {
  it('moderate plan yields tier from plan pace', () => {
    const bmr = calculateBMR(63, 165, 30, 'female');
    const result = analyzePlanGoal({
      currentWeightKg: 63,
      targetWeightKg: 54,
      tdee: 1860,
      bmr,
      sex: 'female',
      fromDate: '2026-05-25',
      dailyKcal: 1395,
      plan: 'loseModerate',
    });
    expect(result.kgPerWeek).toBeGreaterThan(0);
    expect(result.tier).not.toBe('floor_limited');
  });

  it('rejects surplus calories when losing weight', () => {
    const result = analyzePlanGoal({
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      bmr: 1700,
      sex: 'male',
      fromDate: '2026-01-01',
      dailyKcal: 2600,
      plan: 'maintain',
    });
    expect(result.isValid).toBe(false);
  });
});

describe('recommendPlanForKcal', () => {
  const goals = calculateCalorieGoalsFromPhysiology(1860, 1345, 'female');

  it('picks gentlest loss plan that meets timeline kcal', () => {
    const rec = recommendPlanForKcal(1500, goals, -9);
    expect(rec.plan).toBe('loseModerate');
    expect(rec.match).toBe('ok');
  });

  it('flags too_fast when timeline needs more deficit than any plan', () => {
    const rec = recommendPlanForKcal(1200, goals, -9);
    expect(rec.plan).toBe('loseAggressive');
    expect(rec.match).toBe('too_fast');
  });
});
