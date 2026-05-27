import { describe, expect, it } from 'vitest';
import {
  MEAL_TYPE_COLORS,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_TEXT,
  MEAL_TYPE_TEXT_ON_DARK,
  mealTypeBadgeStyle,
  mealTypeChipStyle,
  mealTypePlanMobileBlockStyle,
  mealTypePlanSectionStyle,
} from './meal-type';

describe('meal-type', () => {
  it('defines a label and palette color for each meal type', () => {
    for (const type of ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK'] as const) {
      expect(MEAL_TYPE_LABELS[type]).toBeTruthy();
      expect(MEAL_TYPE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('returns distinct styles for selected vs unselected chips', () => {
    const off = mealTypeChipStyle('COMIDA', false);
    const on = mealTypeChipStyle('COMIDA', true);
    expect(off.backgroundColor).not.toBe(on.backgroundColor);
    expect(String(on.color)).toContain('light-dark');
    expect(String(off.color)).toContain('light-dark');
    expect(String(on.color)).toContain(MEAL_TYPE_TEXT.COMIDA);
    expect(String(on.color)).toContain(MEAL_TYPE_TEXT_ON_DARK.COMIDA);
  });

  it('uses theme-aware label colors on badges', () => {
    const style = mealTypeBadgeStyle('DESAYUNO');
    expect(String(style.color)).toContain('light-dark');
    expect(String(style.color)).toContain(MEAL_TYPE_TEXT.DESAYUNO);
    expect(String(style.color)).toContain(MEAL_TYPE_TEXT_ON_DARK.DESAYUNO);
    expect(String(style.backgroundColor)).toContain('light-dark');
  });

  it('applies a borderless tint for meal plan sections', () => {
    const style = mealTypePlanSectionStyle('CENA');
    expect(String(style.background)).toContain(MEAL_TYPE_COLORS.CENA);
    expect(String(style.background)).toContain('light-dark');
    expect(style.border).toBeUndefined();
  });

  it('uses each meal type color on mobile plan blocks', () => {
    const snack = mealTypePlanMobileBlockStyle('SNACK');
    const breakfast = mealTypePlanMobileBlockStyle('DESAYUNO');
    expect(String(snack.borderColor)).toContain('light-dark');
    expect(String(breakfast.borderColor)).toContain('light-dark');
    expect(String(snack.background)).toContain(MEAL_TYPE_COLORS.SNACK);
    expect(String(breakfast.background)).toContain(MEAL_TYPE_COLORS.DESAYUNO);
  });
});
