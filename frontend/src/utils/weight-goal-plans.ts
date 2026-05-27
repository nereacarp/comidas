import type { Sex } from './health';
import type { CalorieGoals, DietPlanKey } from './health-plans';
import { analyzePlanGoal, type DeficitTier } from './deficit-planning';

const TIERS_WITHOUT_PLAN_HIGHLIGHT: DeficitTier[] = ['not_recommended', 'floor_limited'];

export function shouldHighlightPlanForTier(tier: DeficitTier): boolean {
  return !TIERS_WITHOUT_PLAN_HIGHLIGHT.includes(tier);
}

export interface PlanProjection {
  plan: DietPlanKey;
  planKcal: number;
  targetDate: string;
  weeksToGoal: number;
  tier: DeficitTier;
}

const LOSS_PLANS: DietPlanKey[] = ['loseSlow', 'loseModerate', 'loseAggressive'];

export function buildPlanProjections(input: {
  currentWeightKg: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
  sex: Sex;
  goals: CalorieGoals;
  fromDate: string;
}): PlanProjection[] {
  const kgDelta = input.targetWeightKg - input.currentWeightKg;
  if (Math.abs(kgDelta) <= 0.1) return [];

  const plans: DietPlanKey[] =
    kgDelta < 0 ? LOSS_PLANS : ['gain'];

  return plans.map((plan) => {
    const planKcal = input.goals[plan];
    const result = analyzePlanGoal({
      currentWeightKg: input.currentWeightKg,
      targetWeightKg: input.targetWeightKg,
      tdee: input.tdee,
      bmr: input.bmr,
      sex: input.sex,
      fromDate: input.fromDate,
      dailyKcal: planKcal,
      plan,
    });
    return {
      plan,
      planKcal,
      targetDate: result.targetDate,
      weeksToGoal: Math.round(result.weeksToGoal * 10) / 10,
      tier: result.tier,
    };
  });
}

