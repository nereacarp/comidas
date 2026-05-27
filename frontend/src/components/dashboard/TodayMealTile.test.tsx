import { describe, expect, it } from 'vitest';
import { sortTodayMeals } from './TodayMealTile';
import type { MealPlanItem } from '../../types';

function meal(id: string, mealType: MealPlanItem['mealType']): MealPlanItem {
  return {
    id,
    date: '2024-01-01',
    mealType,
    householdId: 'h1',
    createdAt: '',
  };
}

describe('sortTodayMeals', () => {
  it('orders meals by breakfast, lunch, dinner, snack', () => {
    const sorted = sortTodayMeals([
      meal('4', 'SNACK'),
      meal('2', 'COMIDA'),
      meal('1', 'DESAYUNO'),
      meal('3', 'CENA'),
    ]);
    expect(sorted.map((m) => m.mealType)).toEqual(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']);
  });
});
