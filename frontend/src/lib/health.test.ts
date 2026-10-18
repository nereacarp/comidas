import { describe, it, expect } from 'vitest';
import {
  calculateWaterGoal,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoals,
  calculateBMI,
  getWeightGoalSafetyError,
  isAdultHealthAge,
  KCAL_PER_KG,
} from './health';

describe('calculateWaterGoal', () => {
  it('returns 33ml/kg for sedentary', () => {
    expect(calculateWaterGoal(70, 'sedentary')).toBe(2.3);
  });

  it('adds 0.5L bonus for active level', () => {
    expect(calculateWaterGoal(70, 'active')).toBe(2.8);
  });

  it('adds 0.5L bonus for very_active level', () => {
    expect(calculateWaterGoal(60, 'very_active')).toBe(2.5);
  });

  it('no bonus for light or moderate', () => {
    expect(calculateWaterGoal(60, 'light')).toBe(2.0);
    expect(calculateWaterGoal(60, 'moderate')).toBe(2.0);
  });
});

describe('calculateBMR', () => {
  it('calculates male BMR correctly', () => {
    expect(calculateBMR(70, 175, 30, 'male')).toBe(1649);
  });

  it('calculates female BMR correctly', () => {
    expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
  });
});

describe('calculateTDEE', () => {
  it('multiplies BMR by sedentary factor 1.2', () => {
    expect(calculateTDEE(1600, 'sedentary')).toBe(1920);
  });

  it('multiplies BMR by moderate factor 1.55', () => {
    expect(calculateTDEE(1600, 'moderate')).toBe(2480);
  });
});

describe('calculateCalorieGoals', () => {
  const maleBmr = 1649;

  it('returns physiology-based goals for a typical male TDEE', () => {
    const goals = calculateCalorieGoals(2100, maleBmr, 'male');
    expect(goals.maintain).toBe(2100);
    expect(goals.loseSlow).toBe(Math.round(2100 * 0.85));
    expect(goals.loseModerate).toBe(Math.max(maleBmr, Math.round(2100 * 0.75)));
    expect(goals.loseAggressive).toBe(Math.max(maleBmr, Math.round(2100 * 0.68)));
    expect(goals.gain).toBe(2400);
  });

  it('never goes below BMR floor for female', () => {
    const bmr = 1200;
    const goals = calculateCalorieGoals(1500, bmr, 'female');
    expect(goals.loseAggressive).toBeGreaterThanOrEqual(bmr);
    expect(goals.loseModerate).toBeGreaterThanOrEqual(bmr);
  });

  it('never goes below max(BMR, sex minimum) for male', () => {
    const bmr = 1400;
    const goals = calculateCalorieGoals(1800, bmr, 'male');
    expect(goals.loseAggressive).toBeGreaterThanOrEqual(1500);
  });

  it('caps the fast plan at 1 kg/week even with a very high TDEE', () => {
    const goals = calculateCalorieGoals(4000, 1800, 'male');
    expect(goals.loseAggressive).toBe(2900);
  });
});

describe('adult and BMI safety checks', () => {
  it('only accepts adult ages supported by the health calculator', () => {
    expect(isAdultHealthAge(17)).toBe(false);
    expect(isAdultHealthAge(18)).toBe(true);
    expect(isAdultHealthAge(100)).toBe(true);
    expect(isAdultHealthAge(101)).toBe(false);
  });

  it('blocks a loss goal that would end below BMI 18.5', () => {
    expect(calculateBMI(30, 165)).toBe(11);
    expect(
      getWeightGoalSafetyError({
        currentWeightKg: 63,
        targetWeightKg: 30,
        heightCm: 165,
      }),
    ).toContain('IMC 18.5');
  });

  it('does not block a healthy loss goal', () => {
    expect(
      getWeightGoalSafetyError({
        currentWeightKg: 63,
        targetWeightKg: 58,
        heightCm: 165,
      }),
    ).toBeNull();
  });
});

describe('KCAL_PER_KG', () => {
  it('uses 7700 kcal per kg', () => {
    expect(KCAL_PER_KG).toBe(7700);
  });
});
