const DAY_NAMES_FULL = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado',
] as const;

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/** ISO date (YYYY-MM-DD) plus N calendar days, stable at noon UTC. */
export function addDaysToIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hoy en calendario local (evita que a medianoche UTC siga siendo «ayer»). */
export function todayIsoLocal(): string {
  return toLocalIsoDate(new Date());
}

/** Monday-based week of 7 ISO dates; offset 0 = current week. */
export function getWeekDates(offset: number, baseDate = new Date()): string[] {
  const monday = new Date(baseDate);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalIsoDate(d);
  });
}

export function formatMealPlanDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const day = d.getDate();
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  return `${DAY_NAMES_FULL[d.getDay()]} ${day} ${month}`;
}
