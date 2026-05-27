import { useMemo } from 'react';
import { useHealthStore } from '../stores/health.store';
import {
  calculateBMR,
  calculateCalorieGoals,
  calculateTDEE,
  EXERCISE_KCAL_BONUS,
} from '../utils/health';

export function useHealthCalorieTarget() {
  const { profile, selectedPlan, weightGoal, exerciseDays } = useHealthStore();

  const profileComplete = Boolean(
    profile.weight && profile.height && profile.age && profile.sex,
  );

  return useMemo(() => {
    if (!profileComplete) {
      return {
        profileComplete: false as const,
        bmr: null,
        tdee: null,
        goals: null,
        dailyTarget: null,
        presetPlanKcal: null,
        goalMode: null,
        usesExactTimelineKcal: false,
        isAdapted: false,
        getCalorieTarget: (_date: string) => null,
      };
    }

    const bmr = calculateBMR(profile.weight!, profile.height!, profile.age!, profile.sex!);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const goals = calculateCalorieGoals(tdee, bmr, profile.sex!);

    const presetPlanKcal = selectedPlan ? goals[selectedPlan] : null;
    const goalActive = weightGoal.active && weightGoal.dailyKcalTarget != null;
    const dailyTarget = goalActive ? weightGoal.dailyKcalTarget : presetPlanKcal;
    const goalMode = goalActive ? weightGoal.mode : null;

    const getCalorieTarget = (date: string) => {
      if (dailyTarget === null) return null;
      return dailyTarget + (exerciseDays[date] ? EXERCISE_KCAL_BONUS : 0);
    };

    return {
      profileComplete: true as const,
      bmr,
      tdee,
      goals,
      dailyTarget,
      goalMode,
      getCalorieTarget,
    };
  }, [profile, selectedPlan, weightGoal, exerciseDays, profileComplete]);
}
