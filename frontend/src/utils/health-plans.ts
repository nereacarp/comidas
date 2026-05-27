export interface CalorieGoals {
  maintain: number;
  loseSlow: number;
  loseModerate: number;
  loseAggressive: number;
  gain: number;
}

export type DietPlanKey = keyof CalorieGoals;

export const DIET_PLAN_LABELS: Record<DietPlanKey, string> = {
  maintain: 'Mantener peso',
  loseSlow: 'Déficit ligero',
  loseModerate: 'Déficit moderado',
  loseAggressive: 'Déficit rápido',
  gain: 'Ganar peso / masa muscular',
};

const LOSS_DIET_PLANS: DietPlanKey[] = ['loseSlow', 'loseModerate', 'loseAggressive'];

export const SELECTABLE_DIET_PLANS: DietPlanKey[] = [
  'maintain',
  ...LOSS_DIET_PLANS,
  'gain',
];
