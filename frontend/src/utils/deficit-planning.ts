import {
  KCAL_PER_KG,
  addDaysToIso,
  daysUntilDate,
  getMinDailyKcal,
  type Sex,
} from './health';
import type { CalorieGoals, DietPlanKey } from './health-plans';

export type DeficitTier =
  | 'very_light'
  | 'light'
  | 'moderate'
  | 'fast'
  | 'not_recommended'
  | 'floor_limited'
  | 'maintain'
  | 'gain';

type TierColor = 'green' | 'amber' | 'red' | 'neutral';

export interface TierMeta {
  label: string;
  color: TierColor;
  /** Plan del panel derecho cuyo color representa este ritmo. */
  planKey: DietPlanKey;
  hint?: string;
}

export const DEFICIT_TIER_META: Record<DeficitTier, TierMeta> = {
  very_light: { label: 'Muy ligero', color: 'green', planKey: 'loseSlow' },
  light: { label: 'Ligero', color: 'green', planKey: 'loseSlow' },
  moderate: {
    label: 'Moderado',
    color: 'green',
    planKey: 'loseModerate',
    hint: 'Ritmo saludable recomendado',
  },
  fast: {
    label: 'Rápido',
    color: 'amber',
    planKey: 'loseAggressive',
    hint: 'Más exigente: puede aumentar hambre o fatiga',
  },
  not_recommended: {
    label: 'No recomendado',
    color: 'red',
    planKey: 'loseModerate',
    hint: 'Por encima del límite habitualmente seguro',
  },
  floor_limited: {
    label: 'Limitado por TMB',
    color: 'amber',
    planKey: 'loseAggressive',
    hint: 'El mínimo seguro impide el déficit que pide tu plazo',
  },
  maintain: { label: 'Mantener', color: 'neutral', planKey: 'maintain' },
  gain: { label: 'Ganancia', color: 'neutral', planKey: 'gain' },
};

export function tierPlanKey(tier: DeficitTier): DietPlanKey {
  return DEFICIT_TIER_META[tier].planKey;
}

/** Absolute fallback bands (kg/week) — used when no physiology context is available. */
const KG_PER_WEEK_BANDS = {
  veryLightMax: 0.3,
  lightMax: 0.6,
  moderateMax: 0.85,
  fastMax: 1,
  aggressiveMax: 1.3,
} as const;

/** Relative tier thresholds as fraction of the person's max-safe rate. */
const RELATIVE_TIER = { fast: 0.8, moderate: 0.4 } as const;

export const TIMELINE_FLOOR_LIMIT_KG_PER_WEEK = KG_PER_WEEK_BANDS.fastMax;

export interface PhysiologyGoalResult {
  /** Kcal/día a seguir (tras suelo TMB si aplica). */
  dailyKcal: number;
  /** Déficit real: TDEE − dailyKcal (coherente con las kcal objetivo). */
  dailyDeficit: number;
  /** Déficit que exigiría el plazo antes del suelo TMB. */
  requestedDailyDeficit?: number;
  /** Ritmo que exigiría el plazo antes del suelo TMB. */
  requestedKgPerWeek?: number;
  deficitPercent: number;
  dailyAdjustment: number;
  kgDelta: number;
  /** Ritmo pedido según plazo (kg/sem). */
  kgPerWeek: number;
  weeksToGoal: number;
  targetDate: string;
  tier: DeficitTier;
  tierMeta: TierMeta;
  feedback: string;
  warnings: string[];
  isValid: boolean;
  /** Kcal/día ideales antes del suelo TMB (solo plazo). */
  requestedDailyKcal?: number;
  /** Ritmo alcanzable si el suelo TMB limita el déficit. */
  achievableKgPerWeek?: number;
  clampedToFloor?: boolean;
  /** Clasificación del plazo pedido (puede no ser alcanzable). */
  requestedTier?: DeficitTier;
}

function getCalorieFloor(bmr: number, sex: Sex): number {
  return Math.max(getMinDailyKcal(sex), Math.round(bmr));
}

function getMaxSafeKgPerWeek(tdee: number, bmr: number, sex: Sex): number {
  const floor = getCalorieFloor(bmr, sex);
  return Math.max(0, ((tdee - floor) * 7) / KCAL_PER_KG);
}

export function kgPerWeekFromDeficit(dailyDeficit: number): number {
  return Math.round(((Math.max(0, dailyDeficit) * 7) / KCAL_PER_KG) * 100) / 100;
}

export function dailyDeficitFromKgPerWeek(kgPerWeek: number): number {
  return Math.round((Math.abs(kgPerWeek) * KCAL_PER_KG) / 7);
}

/**
 * Clasifica por ritmo (kg/sem).
 * When maxSafeKgPerWeek is provided, uses physiology-relative bands (% of the person's safe max).
 * Without it, falls back to absolute bands.
 */
export function classifyDeficitTier(
  kgPerWeek: number,
  kgDelta: number,
  maxSafeKgPerWeek?: number,
): DeficitTier {
  if (kgDelta > 0.1) return 'gain';
  if (Math.abs(kgDelta) <= 0.1) return 'maintain';

  const rate = Math.abs(kgPerWeek);

  if (maxSafeKgPerWeek != null && maxSafeKgPerWeek > 0) {
    if (rate > maxSafeKgPerWeek + 0.001) return 'floor_limited';
    if (rate >= maxSafeKgPerWeek * RELATIVE_TIER.fast) return 'fast';
    if (rate >= maxSafeKgPerWeek * RELATIVE_TIER.moderate) return 'moderate';
    return 'light';
  }

  // Absolute fallback (no physiology context)
  if (rate > KG_PER_WEEK_BANDS.fastMax) return 'not_recommended';
  if (rate > KG_PER_WEEK_BANDS.moderateMax) return 'fast';
  if (rate >= KG_PER_WEEK_BANDS.lightMax) return 'moderate';
  if (rate >= KG_PER_WEEK_BANDS.veryLightMax) return 'light';
  return 'very_light';
}

/** Planes alineados a rangos de déficit (validados con TMB como suelo). */
export function calculateCalorieGoalsFromPhysiology(tdee: number, bmr: number, sex: Sex): CalorieGoals {
  const floor = getCalorieFloor(bmr, sex);
  return {
    maintain: tdee,
    loseSlow: Math.max(floor, Math.round(tdee * 0.85)),
    loseModerate: Math.max(floor, Math.round(tdee * 0.75)),
    loseAggressive: Math.max(floor, Math.round(tdee * 0.68)),
    gain: tdee + 300,
  };
}

function resolveTimelineTier(
  requestedKgPerWeek: number,
  kgDelta: number,
  belowCalorieFloor: boolean,
  maxSafeKgPerWeek: number,
): DeficitTier {
  if (belowCalorieFloor) return 'floor_limited';
  return classifyDeficitTier(requestedKgPerWeek, kgDelta, maxSafeKgPerWeek);
}

function capDeficitForSmallTarget(kgToLose: number, dailyDeficit: number, tdee: number): number {
  if (kgToLose < 3) return Math.min(dailyDeficit, Math.round(tdee * 0.25));
  if (kgToLose < 6) return Math.min(dailyDeficit, Math.round(tdee * 0.32));
  return dailyDeficit;
}

function applyPhysiologyFloor(
  idealKcal: number,
  tdee: number,
  bmr: number,
  sex: Sex,
): { dailyKcal: number; warnings: string[] } {
  const floor = getCalorieFloor(bmr, sex);
  const warnings: string[] = [];
  let dailyKcal = Math.round(idealKcal);

  if (dailyKcal < floor) {
    dailyKcal = floor;
    warnings.push(`Ajustado al mínimo seguro (${floor} kcal, no por debajo de tu TMB).`);
  }

  if (dailyKcal > tdee + 50) {
    dailyKcal = tdee;
    warnings.push('Las calorías no pueden superar el TDEE para perder peso.');
  }

  return { dailyKcal, warnings };
}

function buildFeedback(
  tier: DeficitTier,
  kgPerWeek: number,
  dailyDeficit: number,
  options?: { requestedKgPerWeek?: number; requestedDailyDeficit?: number },
): string {
  const meta = DEFICIT_TIER_META[tier];
  const deficitStr = dailyDeficit.toLocaleString('es-ES');
  const rateStr = kgPerWeek.toFixed(2);
  if (tier === 'floor_limited') {
    const reqRate = options?.requestedKgPerWeek?.toFixed(2) ?? '?';
    const reqDef = options?.requestedDailyDeficit?.toLocaleString('es-ES') ?? '?';
    return `Con ${deficitStr} kcal/día de déficit (~${rateStr} kg/sem) estás en tu mínimo seguro. Tu plazo pediría ~${reqDef} kcal/día (~${reqRate} kg/sem): alarga el plazo o ajusta el peso objetivo.`;
  }
  if (tier === 'not_recommended') {
    const reqRate = options?.requestedKgPerWeek?.toFixed(2) ?? rateStr;
    const reqDef = options?.requestedDailyDeficit?.toLocaleString('es-ES') ?? deficitStr;
    return `Tu plazo pide ~${reqRate} kg/sem (déficit ~${reqDef} kcal/día), por encima del límite recomendado. Objetivo real: ~${rateStr} kg/sem y ${deficitStr} kcal/día de déficit.`;
  }
  if (tier === 'fast') {
    return `~${rateStr} kg/sem (déficit ~${deficitStr} kcal/día). Ritmo rápido: exigente pero a menudo aceptable.`;
  }
  if (tier === 'moderate') {
    return `~${rateStr} kg/sem (déficit ~${deficitStr} kcal/día). Ritmo moderado, adecuado para la mayoría.`;
  }
  if (tier === 'very_light') {
    return `~${rateStr} kg/sem (déficit ~${deficitStr} kcal/día). Ritmo muy ligero.`;
  }
  if (tier === 'light') {
    return `~${rateStr} kg/sem (déficit ~${deficitStr} kcal/día). Ritmo ligero y sostenible.`;
  }
  if (tier === 'gain') return 'Superávit calórico para ganar peso.';
  if (tier === 'maintain') return 'Sin cambio neto de peso previsto.';
  return meta.hint ?? '';
}

function finalizePhysiologyResult(
  partial: Omit<PhysiologyGoalResult, 'tierMeta' | 'feedback' | 'deficitPercent' | 'dailyAdjustment'>,
  tdee: number,
  feedbackOptions?: { requestedKgPerWeek?: number; requestedDailyDeficit?: number },
): PhysiologyGoalResult {
  const tierMeta = DEFICIT_TIER_META[partial.tier];
  const feedback = buildFeedback(
    partial.tier,
    partial.kgPerWeek,
    partial.dailyDeficit,
    feedbackOptions,
  );
  return {
    ...partial,
    tierMeta,
    feedback,
    deficitPercent: Math.round((partial.dailyDeficit / Math.max(1, tdee)) * 1000) / 10,
    dailyAdjustment: -partial.dailyDeficit,
  };
}

export function analyzeTimelineGoal(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
  sex: Sex;
  fromDate: string;
  targetDate: string;
}): PhysiologyGoalResult {
  const kgDelta = input.targetWeightKg - input.currentWeightKg;
  const days = daysUntilDate(input.fromDate, input.targetDate);
  const weeks = Math.max(days / 7, 1 / 7);
  const kgToLose = Math.abs(kgDelta);

  if (kgDelta > 0.1) {
    const surplus = 300;
    const targetDate = addDaysToIso(input.fromDate, Math.ceil((kgToLose * KCAL_PER_KG) / surplus));
    return finalizePhysiologyResult(
      {
        dailyKcal: input.tdee + surplus,
        dailyDeficit: 0,
        kgDelta,
        kgPerWeek: kgToLose / (days / 7),
        weeksToGoal: days / 7,
        targetDate,
        tier: 'gain',
        warnings: [],
        isValid: true,
      },
      input.tdee,
    );
  }

  if (Math.abs(kgDelta) <= 0.1) {
    return finalizePhysiologyResult(
      {
        dailyKcal: input.tdee,
        dailyDeficit: 0,
        kgDelta,
        kgPerWeek: 0,
        weeksToGoal: weeks,
        targetDate: input.targetDate,
        tier: 'maintain',
        warnings: ['El peso objetivo es muy similar al actual.'],
        isValid: true,
      },
      input.tdee,
    );
  }

  const requestedKgPerWeek = Math.round((kgToLose / weeks) * 100) / 100;
  const requestedDailyDeficit = capDeficitForSmallTarget(
    kgToLose,
    Math.round((kgToLose * KCAL_PER_KG) / (weeks * 7)),
    input.tdee,
  );
  const requestedDailyKcal = Math.round(input.tdee - requestedDailyDeficit);
  const calorieFloor = getCalorieFloor(input.bmr, input.sex);
  const belowCalorieFloor = requestedDailyKcal < calorieFloor;
  const maxSafeKgPerWeek = getMaxSafeKgPerWeek(input.tdee, input.bmr, input.sex);

  const tier = resolveTimelineTier(requestedKgPerWeek, kgDelta, belowCalorieFloor, maxSafeKgPerWeek);
  // Block activation whenever the timeline would require going below the safe floor
  const shouldBlock = belowCalorieFloor;

  let dailyKcal = requestedDailyKcal;
  const warnings: string[] = [];

  if (shouldBlock) {
    dailyKcal = calorieFloor;
    warnings.push(
      `Este plazo necesitaría ~${requestedDailyKcal} kcal/día, por debajo del mínimo seguro (${calorieFloor} kcal). Amplía el plazo.`,
    );
  } else {
    if (tier === 'not_recommended') {
      warnings.push('Más de 1 kg/semana no se recomienda para el plazo indicado.');
    } else if (tier === 'fast') {
      warnings.push(DEFICIT_TIER_META.fast.hint!);
    }
  }

  const dailyDeficit = Math.max(0, input.tdee - dailyKcal);
  const effectiveDays = days;
  const targetDate = input.targetDate;

  // Show achievable pace at safe-floor kcal (informative, not used for date calculation)
  let displayKgPerWeek = requestedKgPerWeek;
  if (shouldBlock && dailyDeficit > 0) {
    const achievableDays = Math.ceil((kgToLose * KCAL_PER_KG) / dailyDeficit);
    displayKgPerWeek = Math.round((kgToLose / (achievableDays / 7)) * 100) / 100;
  }

  return finalizePhysiologyResult(
    {
      dailyKcal,
      dailyDeficit,
      kgDelta,
      kgPerWeek: displayKgPerWeek,
      weeksToGoal: effectiveDays / 7,
      targetDate,
      tier: shouldBlock ? 'floor_limited' : tier,
      warnings,
      isValid: !shouldBlock && !warnings.some((w) => w.startsWith('Para ')),
      requestedDailyKcal: shouldBlock ? requestedDailyKcal : undefined,
      requestedDailyDeficit: shouldBlock ? requestedDailyDeficit : undefined,
      requestedKgPerWeek: shouldBlock ? requestedKgPerWeek : undefined,
      requestedTier: shouldBlock ? classifyDeficitTier(requestedKgPerWeek, kgDelta) : undefined,
      clampedToFloor: shouldBlock,
    },
    input.tdee,
    shouldBlock ? { requestedKgPerWeek, requestedDailyDeficit } : undefined,
  );
}

export function analyzePlanGoal(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
  sex: Sex;
  fromDate: string;
  dailyKcal: number;
  plan: DietPlanKey;
}): PhysiologyGoalResult {
  const kgDelta = input.targetWeightKg - input.currentWeightKg;
  const { dailyKcal, warnings: floorWarnings } = applyPhysiologyFloor(
    input.dailyKcal,
    input.tdee,
    input.bmr,
    input.sex,
  );

  const adjustment = dailyKcal - input.tdee;

  if (Math.abs(kgDelta) <= 0.1) {
    return finalizePhysiologyResult(
      {
        dailyKcal,
        dailyDeficit: 0,
        kgDelta,
        kgPerWeek: 0,
        weeksToGoal: 0,
        targetDate: input.fromDate,
        tier: 'maintain',
        warnings: floorWarnings,
        isValid: true,
      },
      input.tdee,
    );
  }

  if (kgDelta < 0 && adjustment >= 0) {
    return finalizePhysiologyResult(
      {
        dailyKcal,
        dailyDeficit: 0,
        kgDelta,
        kgPerWeek: 0,
        weeksToGoal: 0,
        targetDate: input.fromDate,
        tier: 'not_recommended',
        warnings: [...floorWarnings, 'Para perder peso necesitas menos calorías que tu TDEE.'],
        isValid: false,
      },
      input.tdee,
    );
  }

  const dailyDeficit = Math.max(0, input.tdee - dailyKcal);
  const days =
    dailyDeficit > 0 ? Math.ceil((Math.abs(kgDelta) * KCAL_PER_KG) / dailyDeficit) : 999;
  const kgPerWeek = kgPerWeekFromDeficit(dailyDeficit);
  const maxSafeKgPerWeek = getMaxSafeKgPerWeek(input.tdee, input.bmr, input.sex);
  const tier = classifyDeficitTier(kgPerWeek, kgDelta, maxSafeKgPerWeek);
  const warnings = [...floorWarnings];
  if (tier === 'fast') warnings.push(DEFICIT_TIER_META.fast.hint!);
  if (tier === 'not_recommended') warnings.push(DEFICIT_TIER_META.not_recommended.hint!);

  return finalizePhysiologyResult(
    {
      dailyKcal,
      dailyDeficit,
      kgDelta,
      kgPerWeek,
      weeksToGoal: days / 7,
      targetDate: addDaysToIso(input.fromDate, days),
      tier,
      warnings,
      isValid: !warnings.some((w) => w.startsWith('Para ')),
    },
    input.tdee,
  );
}

export function recommendPlanForKcal(
  requiredDailyKcal: number,
  goals: CalorieGoals,
  kgDelta: number,
): { plan: DietPlanKey; planKcal: number; match: 'ok' | 'too_fast' | 'too_slow' } {
  if (Math.abs(kgDelta) < 0.1) {
    return { plan: 'maintain', planKcal: goals.maintain, match: 'ok' };
  }
  if (kgDelta > 0) {
    return { plan: 'gain', planKcal: goals.gain, match: 'ok' };
  }

  const lossPlans: { plan: DietPlanKey; planKcal: number }[] = [
    { plan: 'loseSlow', planKcal: goals.loseSlow },
    { plan: 'loseModerate', planKcal: goals.loseModerate },
    { plan: 'loseAggressive', planKcal: goals.loseAggressive },
  ];

  const meeting = lossPlans.filter((p) => p.planKcal <= requiredDailyKcal + 25);
  if (meeting.length > 0) {
    const best = meeting.reduce((a, b) => (a.planKcal > b.planKcal ? a : b));
    return { plan: best.plan, planKcal: best.planKcal, match: 'ok' };
  }

  const aggressive = lossPlans[lossPlans.length - 1];
  return { plan: aggressive.plan, planKcal: aggressive.planKcal, match: 'too_fast' };
}

export function recommendedWeeksRange(kgToLose: number): { moderateMin: number; moderateMax: number } | null {
  if (kgToLose < 0.5) return null;
  return {
    moderateMin: Math.ceil(kgToLose / KG_PER_WEEK_BANDS.moderateMax),
    moderateMax: Math.ceil(kgToLose / KG_PER_WEEK_BANDS.lightMax),
  };
}
