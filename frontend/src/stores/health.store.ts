import { create } from 'zustand';
import type { Sex, ActivityLevel } from '../utils/health';
import type { CalorieGoals, DietPlanKey } from '../utils/health-plans';
import type { PlanProjection } from '../utils/weight-goal-plans';
import { todayIsoLocal } from '../lib/meal-plan-dates';

export type DietPlan = keyof CalorieGoals;

interface HealthProfile {
  weight: number | null;
  height: number | null;
  age: number | null;
  sex: Sex | null;
  activityLevel: ActivityLevel;
}

type WeightGoalMode = 'timeline' | 'plan';

interface LiveCaloriePreview {
  activeDailyKcal: number;
  /** null cuando el ritmo no debe vincularse a un plan (p. ej. limitado / no recomendado). */
  closestPlan: DietPlanKey | null;
  targetWeightKg: number;
  planProjections: PlanProjection[];
}

interface WeightGoal {
  active: boolean;
  targetWeight: number | null;
  targetDate: string | null;
  targetWeeks: number | null;
  mode: WeightGoalMode;
  linkedPlan: DietPlan | null;
  /** Daily kcal from calculator + weight goal (Mifflin-St Jeor), not only % TDEE preset */
  dailyKcalTarget: number | null;
}

const defaultWeightGoal = (): WeightGoal => ({
  active: false,
  targetWeight: null,
  targetDate: null,
  targetWeeks: null,
  mode: 'timeline',
  linkedPlan: null,
  dailyKcalTarget: null,
});

function normalizeWeightGoal(raw: Partial<WeightGoal> | undefined): WeightGoal {
  if (!raw) return defaultWeightGoal();
  const mode =
    raw.mode === 'plan' || raw.mode === 'timeline'
      ? raw.mode
      : (raw as { mode?: string }).mode === 'by_plan' || (raw as { mode?: string }).mode === 'by_calories'
        ? 'plan'
        : 'timeline';
  return {
    active: raw.active ?? false,
    targetWeight: raw.targetWeight ?? null,
    targetDate: raw.targetDate ?? null,
    targetWeeks: raw.targetWeeks ?? null,
    mode,
    linkedPlan: raw.linkedPlan ?? null,
    dailyKcalTarget: raw.dailyKcalTarget ?? null,
  };
}

interface HealthState {
  profile: HealthProfile;
  selectedPlan: DietPlan | null;
  weightGoal: WeightGoal;
  liveCaloriePreview: LiveCaloriePreview | null;
  exerciseDays: Record<string, boolean>;
  waterIntakeMl: number;
  waterResetDate: string;
  setProfile: (updates: Partial<HealthProfile>) => void;
  setSelectedPlan: (plan: DietPlan | null) => void;
  setWeightGoal: (updates: Partial<WeightGoal>) => void;
  applyWeightGoal: (
    updates: Partial<WeightGoal> & { linkedPlan: DietPlan | null; dailyKcalTarget: number },
  ) => void;
  setLiveCaloriePreview: (preview: LiveCaloriePreview | null) => void;
  clearWeightGoal: () => void;
  /** Quita objetivo de peso y plan calórico activo (vuelve a elegir manualmente). */
  resetWeightGoal: () => void;
  toggleExerciseDay: (date: string) => void;
  addWater: (ml: number) => void;
  removeWater: (ml: number) => void;
  checkDailyReset: () => void;
}

const STORAGE_KEY = 'health_store';
const HISTORY_DAYS = 90;

type Persisted = Pick<
  HealthState,
  'profile' | 'selectedPlan' | 'weightGoal' | 'exerciseDays' | 'waterIntakeMl' | 'waterResetDate'
>;

function trimOldDays(days: Record<string, boolean>): Record<string, boolean> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
  const y = cutoff.getFullYear();
  const m = String(cutoff.getMonth() + 1).padStart(2, '0');
  const d = String(cutoff.getDate()).padStart(2, '0');
  const cutoffStr = `${y}-${m}-${d}`;
  return Object.fromEntries(Object.entries(days).filter(([day]) => day >= cutoffStr));
}

function loadFromStorage(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error();
    const p = JSON.parse(raw);
    return {
      ...p,
      exerciseDays: p.exerciseDays ?? {},
      weightGoal: normalizeWeightGoal(p.weightGoal),
    };
  } catch {
    return {
      profile: { weight: null, height: null, age: null, sex: null, activityLevel: 'moderate' },
      selectedPlan: null,
      weightGoal: defaultWeightGoal(),
      exerciseDays: {},
      waterIntakeMl: 0,
      waterResetDate: todayIsoLocal(),
    };
  }
}

function persist(state: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      exerciseDays: trimOldDays(state.exerciseDays),
    }));
  } catch {}
}

const saved = loadFromStorage();
const today = todayIsoLocal();

export const useHealthStore = create<HealthState>((set, get) => {
  const snap = (): Persisted => {
    const s = get();
    return {
      profile: s.profile,
      selectedPlan: s.selectedPlan,
      weightGoal: s.weightGoal,
      exerciseDays: s.exerciseDays,
      waterIntakeMl: s.waterIntakeMl,
      waterResetDate: s.waterResetDate,
    };
  };

  return {
    profile: saved.profile,
    selectedPlan: saved.selectedPlan ?? null,
    weightGoal: saved.weightGoal ?? defaultWeightGoal(),
    liveCaloriePreview: null,
    exerciseDays: saved.exerciseDays,
    waterIntakeMl: saved.waterResetDate === today ? saved.waterIntakeMl : 0,
    waterResetDate: today,

    setProfile: (updates) => {
      const next = { ...get().profile, ...updates };
      set({ profile: next });
      persist({ ...snap(), profile: next });
    },

    setSelectedPlan: (plan) => {
      set({ selectedPlan: plan });
      persist({ ...snap(), selectedPlan: plan });
    },

    setWeightGoal: (updates) => {
      const next = { ...get().weightGoal, ...updates };
      set({ weightGoal: next });
      persist({ ...snap(), weightGoal: next });
    },

    applyWeightGoal: (updates) => {
      const next: WeightGoal = {
        ...get().weightGoal,
        ...updates,
        active: true,
        linkedPlan: updates.linkedPlan,
        dailyKcalTarget: updates.dailyKcalTarget,
      };
      set({ weightGoal: next, selectedPlan: updates.linkedPlan ?? null });
      persist({ ...snap(), weightGoal: next, selectedPlan: updates.linkedPlan ?? null });
    },

    setLiveCaloriePreview: (preview) => {
      set({ liveCaloriePreview: preview });
    },

    clearWeightGoal: () => {
      const next = defaultWeightGoal();
      set({ weightGoal: next, liveCaloriePreview: null });
      persist({ ...snap(), weightGoal: next });
    },

    resetWeightGoal: () => {
      const next = defaultWeightGoal();
      set({ weightGoal: next, selectedPlan: null, liveCaloriePreview: null });
      persist({ ...snap(), weightGoal: next, selectedPlan: null });
    },

    toggleExerciseDay: (date) => {
      const next = { ...get().exerciseDays, [date]: !get().exerciseDays[date] };
      set({ exerciseDays: next });
      persist({ ...snap(), exerciseDays: next });
    },

    addWater: (ml) => {
      get().checkDailyReset();
      const next = get().waterIntakeMl + ml;
      set({ waterIntakeMl: next });
      persist({ ...snap(), waterIntakeMl: next });
    },

    removeWater: (ml) => {
      get().checkDailyReset();
      const next = Math.max(0, get().waterIntakeMl - ml);
      set({ waterIntakeMl: next });
      persist({ ...snap(), waterIntakeMl: next });
    },

    checkDailyReset: () => {
      const now = todayIsoLocal();
      if (get().waterResetDate !== now) {
        set({ waterIntakeMl: 0, waterResetDate: now });
        persist({ ...snap(), waterIntakeMl: 0, waterResetDate: now });
      }
    },
  };
});
