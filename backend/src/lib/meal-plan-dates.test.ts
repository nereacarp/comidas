import { describe, expect, it } from 'vitest';
import {
  addDaysToMealPlanDate,
  daysBetweenIso,
  mealPlanDateToIso,
  parseMealPlanDate,
} from './meal-plan-dates.js';

describe('parseMealPlanDate', () => {
  it('parses ISO dates at noon UTC', () => {
    expect(mealPlanDateToIso(parseMealPlanDate('2024-01-15'))).toBe('2024-01-15');
  });

  it('adds calendar days', () => {
    expect(mealPlanDateToIso(addDaysToMealPlanDate('2024-01-15', 6))).toBe('2024-01-21');
  });

  it('computes day offsets between ISO dates', () => {
    expect(daysBetweenIso('2024-01-15', '2024-01-17')).toBe(2);
  });
});
