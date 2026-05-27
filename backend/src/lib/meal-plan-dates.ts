/** Parse YYYY-MM-DD as noon UTC for stable calendar-day math. */
export function parseMealPlanDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

export function addDaysToMealPlanDate(isoDate: string, days: number): Date {
  const d = parseMealPlanDate(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function mealPlanDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetweenIso(startIso: string, endIso: string): number {
  const ms = parseMealPlanDate(endIso).getTime() - parseMealPlanDate(startIso).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
