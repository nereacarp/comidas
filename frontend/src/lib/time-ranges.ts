/** Total prep + cook time ranges (aligned with calorie range chips). */
export const TIME_RANGES = [
  { label: 'Todos', min: 0, max: Number.POSITIVE_INFINITY },
  { label: '-15 min', min: 0, max: 15 },
  { label: '15-30', min: 15, max: 30 },
  { label: '30-45', min: 30, max: 45 },
  { label: '45-60', min: 45, max: 60 },
  { label: '+60', min: 60, max: Number.POSITIVE_INFINITY },
] as const;

export function timeRangeToQueryParams(rangeIdx: number): {
  minTotalTime?: string;
  maxTotalTime?: string;
} {
  if (rangeIdx <= 0 || rangeIdx >= TIME_RANGES.length) return {};

  const range = TIME_RANGES[rangeIdx];
  const params: { minTotalTime?: string; maxTotalTime?: string } = {};

  if (range.min > 0) params.minTotalTime = String(range.min);
  if (Number.isFinite(range.max)) params.maxTotalTime = String(range.max);

  return params;
}
