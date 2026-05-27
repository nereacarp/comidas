export type Sex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario (poco o nada de ejercicio)',
  light: 'Ligero (ejercicio 1-3 días/semana)',
  moderate: 'Moderado (ejercicio 3-5 días/semana)',
  active: 'Activo (ejercicio 6-7 días/semana)',
  very_active: 'Muy activo (trabajo físico intenso)',
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const EXERCISE_KCAL_BONUS = 250;

import type { CalorieGoals } from './health-plans';
import { calculateCalorieGoalsFromPhysiology } from './deficit-planning';

// Water goal in liters: 33ml/kg base + 500ml bonus for high activity
export function calculateWaterGoal(weightKg: number, activityLevel: ActivityLevel): number {
  const base = weightKg * 0.033;
  const bonus = activityLevel === 'active' || activityLevel === 'very_active' ? 0.5 : 0;
  return Math.round((base + bonus) * 10) / 10;
}

// Mifflin-St Jeor BMR formula
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
}

/** Planes derivados del TDEE/TMB con déficits fisiológicos (ligero ~15 %, moderado ~25 %, rápido ~32 %). */
export function calculateCalorieGoals(tdee: number, bmr: number, sex: Sex): CalorieGoals {
  return calculateCalorieGoalsFromPhysiology(tdee, bmr, sex);
}

/** Approximate kcal stored or released per kg of body weight change */
export const KCAL_PER_KG = 7700;

export function getMinDailyKcal(sex: Sex): number {
  return sex === 'female' ? 1200 : 1500;
}


export function daysUntilDate(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T12:00:00`);
  const to = new Date(`${toIso}T12:00:00`);
  const diff = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  return Math.max(1, diff);
}

/** Local calendar date (avoids UTC shift from toISOString). */
function formatIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatIsoLocal(d);
}

/** Fecha objetivo a partir de semanas (calendario local, coherente con el campo «semanas»). */
export function targetDateFromWeeks(fromIso: string, weeks: number): string {
  return addDaysToIso(fromIso, Math.round(weeks * 7));
}

/** Hoy en calendario local (evita desfases UTC de toISOString). */
export function todayIsoLocal(): string {
  return formatIsoLocal(new Date());
}

