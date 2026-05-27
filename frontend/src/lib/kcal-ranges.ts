/** Calorie range chips (shared with meal plan recipe picker). */
export const KCAL_RANGES = [
  { label: 'Todas', min: 0, max: Number.POSITIVE_INFINITY },
  { label: '-200', min: 0, max: 200 },
  { label: '200-350', min: 200, max: 350 },
  { label: '350-500', min: 350, max: 500 },
  { label: '+500', min: 500, max: Number.POSITIVE_INFINITY },
] as const;

export function kcalRangeToQueryParams(rangeIdx: number): { minKcal?: string; maxKcal?: string } {
  if (rangeIdx <= 0 || rangeIdx >= KCAL_RANGES.length) return {};

  const range = KCAL_RANGES[rangeIdx];
  const params: { minKcal?: string; maxKcal?: string } = {};

  if (range.min > 0) params.minKcal = String(range.min);
  if (Number.isFinite(range.max)) params.maxKcal = String(range.max);

  return params;
}
