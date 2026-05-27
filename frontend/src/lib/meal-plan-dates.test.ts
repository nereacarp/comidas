import { describe, expect, it } from 'vitest';
import { addDaysToIso, formatMealPlanDayLabel, getWeekDates, todayIsoLocal } from './meal-plan-dates';

describe('addDaysToIso', () => {
  it('adds days within the same month', () => {
    expect(addDaysToIso('2026-05-25', 1)).toBe('2026-05-26');
  });

  it('rolls into the next month', () => {
    expect(addDaysToIso('2026-05-31', 1)).toBe('2026-06-01');
  });

  it('formats a day label for pickers', () => {
    expect(formatMealPlanDayLabel('2026-05-25')).toBe('Lunes 25 May');
  });

  it('returns seven dates for a week offset', () => {
    const dates = getWeekDates(0, new Date('2026-05-25T12:00:00'));
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-05-25');
    expect(dates[6]).toBe('2026-05-31');
  });

  it('todayIsoLocal uses local calendar day', () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    expect(todayIsoLocal()).toBe(expected);
  });
});
