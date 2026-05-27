import { daysUntilDate, KCAL_PER_KG, getMinDailyKcal, type Sex } from './health';
import type { CalorieGoals, DietPlanKey } from './health-plans';
import {
  analyzePlanGoal,
  analyzeTimelineGoal,
  recommendPlanForKcal,
  recommendedWeeksRange,
  tierPlanKey,
  type PhysiologyGoalResult,
} from './deficit-planning';
import { shouldHighlightPlanForTier } from './weight-goal-plans';

export type WeightGoalMode = 'timeline' | 'plan';

export type TimelinePlanMatch = 'ok' | 'too_fast' | 'too_slow' | 'maintain';

export interface WeightGoalResolution {
  mode: WeightGoalMode;
  result: PhysiologyGoalResult;
  recommendedPlan: DietPlanKey;
  planKcal: number;
  timelineMatch: TimelinePlanMatch;
  requestedWeeks: number | null;
  weeksWithPlan: number;
}

export function resolveWeightGoalByTimeline(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
  sex: Sex;
  goals: CalorieGoals;
  fromDate: string;
  targetDate: string;
}): WeightGoalResolution {
  const result = analyzeTimelineGoal({
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: input.targetWeightKg,
    tdee: input.tdee,
    bmr: input.bmr,
    sex: input.sex,
    fromDate: input.fromDate,
    targetDate: input.targetDate,
  });

  const rec = recommendPlanForKcal(result.dailyKcal, input.goals, result.kgDelta);
  const planResult = analyzePlanGoal({
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: input.targetWeightKg,
    tdee: input.tdee,
    bmr: input.bmr,
    sex: input.sex,
    fromDate: input.fromDate,
    dailyKcal: rec.planKcal,
    plan: rec.plan,
  });

  const requestedWeeks = Math.round((daysUntilDate(input.fromDate, input.targetDate) / 7) * 10) / 10;

  return {
    mode: 'timeline',
    result,
    recommendedPlan: tierPlanKey(result.tier),
    planKcal: rec.planKcal,
    timelineMatch: rec.match,
    requestedWeeks,
    weeksWithPlan: planResult.weeksToGoal,
  };
}

export function resolveWeightGoalByPlan(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
  sex: Sex;
  goals: CalorieGoals;
  fromDate: string;
  plan: DietPlanKey;
}): WeightGoalResolution {
  const planKcal = input.goals[input.plan];
  const result = analyzePlanGoal({
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: input.targetWeightKg,
    tdee: input.tdee,
    bmr: input.bmr,
    sex: input.sex,
    fromDate: input.fromDate,
    dailyKcal: planKcal,
    plan: input.plan,
  });

  let timelineMatch: TimelinePlanMatch = 'ok';
  if (result.tier === 'not_recommended') timelineMatch = 'too_fast';
  if (result.kgDelta < -0.1 && planKcal >= input.tdee) timelineMatch = 'too_slow';

  return {
    mode: 'plan',
    result,
    recommendedPlan: input.plan,
    planKcal,
    timelineMatch,
    requestedWeeks: null,
    weeksWithPlan: result.weeksToGoal,
  };
}

/** Calorías y plan que deben persistirse según el modo elegido. */
export function dailyKcalForWeightGoalSave(
  mode: WeightGoalMode,
  resolution: WeightGoalResolution,
  pickedPlan: DietPlanKey,
): { dailyKcalTarget: number; linkedPlan: DietPlanKey | null } {
  if (mode === 'plan') {
    return { dailyKcalTarget: resolution.planKcal, linkedPlan: pickedPlan };
  }
  const linkPlan = shouldHighlightPlanForTier(resolution.result.tier);
  return {
    dailyKcalTarget: resolution.result.dailyKcal,
    linkedPlan: linkPlan ? resolution.recommendedPlan : null,
  };
}

export function recommendedWeeksHint(
  kgToLose: number,
  options?: { tdee: number; bmr: number; sex: Sex },
): string | null {
  if (kgToLose < 0.5) return null;

  if (options) {
    const floor = Math.max(getMinDailyKcal(options.sex), Math.round(options.bmr));
    const maxSafeDeficit = Math.max(0, options.tdee - floor);
    if (maxSafeDeficit > 0) {
      const floorMin = Math.ceil((kgToLose * KCAL_PER_KG) / (maxSafeDeficit * 7));
      const genericMin = Math.ceil(kgToLose / 0.85);
      if (floorMin > genericMin) {
        return `Mínimo seguro: ${floorMin} sem (tu TMB limita el déficit máximo)`;
      }
    }
  }

  const rec = recommendedWeeksRange(kgToLose);
  if (!rec) return null;
  return `Referencia: ${rec.moderateMin}–${rec.moderateMax} sem (ritmo moderado ~0,6–0,85 kg/sem)`;
}
