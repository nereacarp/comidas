import { describe, expect, it } from 'vitest';
import { sortMealPlanItemsByType } from './MonthDayCellMeals';
import type { MealPlanItem } from '../../types';

function item(mealType: MealPlanItem['mealType'], id: string): MealPlanItem {
  return {
    id,
    date: '2026-05-25',
    mealType,
    householdId: 'h1',
    createdAt: '2026-05-25T12:00:00.000Z',
  };
}

describe('sortMealPlanItemsByType', () => {
  it('orders meals breakfast through snack', () => {
    const sorted = sortMealPlanItemsByType([
      item('CENA', '3'),
      item('DESAYUNO', '1'),
      item('SNACK', '4'),
      item('COMIDA', '2'),
    ]);
    expect(sorted.map((i) => i.mealType)).toEqual(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']);
  });
});
