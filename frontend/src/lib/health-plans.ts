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
  loseAggressive: 'Rápido (máximo recomendado)',
  gain: 'Ganar peso / masa muscular',
};
