import type { CSSProperties } from 'react';
import type { MealType } from '../types';

/** Labels for meal type badges (recipes, filters, dashboard). */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  DESAYUNO: 'Desayuno',
  COMIDA: 'Comida',
  CENA: 'Cena',
  SNACK: 'Snack',
  POSTRE: 'Postre',
};

/** Payd pastel palette per meal type. */
export const MEAL_TYPE_COLORS: Record<MealType, string> = {
  DESAYUNO: '#ffd8a8',
  COMIDA: '#a8e6cf',
  CENA: '#e6ccff',
  SNACK: '#ffadad',
  POSTRE: '#9bf6ff',
};

/** Label on light surfaces (pastel chips). */
export const MEAL_TYPE_TEXT: Record<MealType, string> = {
  DESAYUNO: '#7a5a20',
  COMIDA: '#3d7a5c',
  CENA: '#5a4578',
  SNACK: '#9e4a4a',
  POSTRE: '#2f6f82',
};

/** Label on dark surfaces (readable accent text). */
export const MEAL_TYPE_TEXT_ON_DARK: Record<MealType, string> = {
  DESAYUNO: '#ecc98e',
  COMIDA: '#8fd9b8',
  CENA: '#d4c4f0',
  SNACK: '#efb5b5',
  POSTRE: '#9bf6ff',
};

export const MEAL_TYPES: Array<{ value: MealType; label: string; color: string }> = (
  ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK', 'POSTRE'] as MealType[]
).map((value) => ({
  value,
  label: MEAL_TYPE_LABELS[value],
  color: MEAL_TYPE_COLORS[value],
}));

function mealTypeLabelColor(mealType: MealType): string {
  return `light-dark(${MEAL_TYPE_TEXT[mealType]}, ${MEAL_TYPE_TEXT_ON_DARK[mealType]})`;
}

function mealTypeTint(mealType: MealType, percent: number): string {
  const color = MEAL_TYPE_COLORS[mealType];
  const light = `color-mix(in oklab, ${color} ${percent}%, var(--surface))`;
  const vivid = `color-mix(in oklab, ${color} 68%, white)`;
  const dark = `color-mix(in oklab, ${vivid} 32%, var(--surface-raised))`;
  return `light-dark(${light}, ${dark})`;
}

function mealTypeSelectedBg(mealType: MealType): string {
  const color = MEAL_TYPE_COLORS[mealType];
  const vivid = `color-mix(in oklab, ${color} 72%, white)`;
  const dark = `color-mix(in oklab, ${vivid} 50%, var(--surface-raised))`;
  return `light-dark(${color}, ${dark})`;
}

function mealTypeBorder(mealType: MealType, strong = false): string {
  const color = MEAL_TYPE_COLORS[mealType];
  const labelDark = MEAL_TYPE_TEXT_ON_DARK[mealType];
  const lightPct = strong ? 55 : 65;
  const light = `color-mix(in oklab, ${color} ${lightPct}%, var(--border-subtle))`;
  const dark = `color-mix(in oklab, ${labelDark} ${strong ? 45 : 35}%, var(--border-subtle))`;
  return `light-dark(${light}, ${dark})`;
}

export function mealTypeChipStyle(mealType: MealType, selected: boolean): CSSProperties {
  const text = mealTypeLabelColor(mealType);
  if (selected) {
    const bg = mealTypeSelectedBg(mealType);
    return {
      backgroundColor: bg,
      borderColor: bg,
      color: text,
    };
  }
  return {
    backgroundColor: mealTypeTint(mealType, 45),
    color: text,
    borderColor: mealTypeBorder(mealType),
  };
}

export function mealTypeBadgeStyle(mealType: MealType): CSSProperties {
  return {
    backgroundColor: mealTypeTint(mealType, 68),
    color: mealTypeLabelColor(mealType),
    borderColor: mealTypeBorder(mealType, true),
  };
}

export function mealTypeAvatarStyle(mealType: MealType): CSSProperties {
  return {
    background: mealTypeTint(mealType, 58),
    color: mealTypeLabelColor(mealType),
  };
}

/** Subtle meal-plan block tint (weekly day columns). */
export function mealTypePlanSectionStyle(mealType: MealType, variant: 'section' | 'empty-slot' = 'section'): CSSProperties {
  const color = MEAL_TYPE_COLORS[mealType];
  const amount = variant === 'empty-slot' ? 6 : 9;
  const light = `color-mix(in oklab, ${color} ${amount}%, var(--surface))`;
  const vivid = `color-mix(in oklab, ${color} 55%, white)`;
  const dark = `color-mix(in oklab, ${vivid} ${variant === 'empty-slot' ? 10 : 14}%, var(--surface-raised))`;
  return {
    background: `light-dark(${light}, ${dark})`,
  };
}

/** Mobile meal blocks: same palette as web plan sections, with a visible border. */
export function mealTypePlanMobileBlockStyle(mealType: MealType): CSSProperties {
  return {
    ...mealTypePlanSectionStyle(mealType),
    borderColor: mealTypeBorder(mealType),
  };
}

/** Dashed add buttons on mobile (matches unselected meal-type chips). */
export function mealTypePlanMobileAddStyle(mealType: MealType): CSSProperties {
  return mealTypeChipStyle(mealType, false);
}

export function mealTypePlanLabelStyle(mealType: MealType): CSSProperties {
  return { color: mealTypeLabelColor(mealType) };
}
