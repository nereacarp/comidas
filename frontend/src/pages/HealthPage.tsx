import { useState, useEffect, useMemo } from 'react';
import { useHealthStore } from '../stores/health.store';
import type { DietPlan } from '../stores/health.store';
import { CaloriePlanRow } from '../components/health/CaloriePlanRow';
import { WeightGoalCard } from '../components/health/WeightGoalCard';
import { CalorieTargetStatus } from '../components/health/CalorieTargetStatus';
import { HEALTH_PLAN_STYLES } from '../utils/health-plan-styles';
import { Card } from '../components/ui/Card';
import { CaloriePreferenceToggle } from '../components/settings/CaloriePreferenceToggle';
import { useShowCalories } from '../hooks/useShowCalories';
import { useHealthCalorieTarget } from '../hooks/useHealthCalorieTarget';
import { useHouseholdId } from '../hooks/useHousehold';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import type { MealPlanItem } from '../types';
import { CheckIcon, FlameIcon, HealthIcon, WaterDropIcon } from '../components/ui/Icons';
import {
  ACTIVITY_LABELS,
  calculateBMR,
  calculateCalorieGoals,
  calculateTDEE,
  calculateWaterGoal,
} from '../utils/health';
import type { ActivityLevel, Sex } from '../utils/health';
import { DIET_PLAN_LABELS } from '../utils/health-plans';
import { dailyKcalForWeightGoalSave, resolveWeightGoalByPlan } from '../utils/weight-goal';

const WATER_SHORTCUTS = [
  { label: '+50 ml', ml: 50 },
  { label: '+100 ml', ml: 100 },
  { label: '+200 ml', ml: 200 },
  { label: '+500 ml', ml: 500 },
] as const;

export function HealthPage() {
  const showCalories = useShowCalories();
  const {
    profile,
    waterIntakeMl,
    weightGoal,
    liveCaloriePreview,
    selectedPlan,
    setProfile,
    setSelectedPlan,
    applyWeightGoal,
    addWater,
    removeWater,
    checkDailyReset,
  } = useHealthStore();

  const [form, setForm] = useState({
    weight: profile.weight?.toString() ?? '',
    height: profile.height?.toString() ?? '',
    age: profile.age?.toString() ?? '',
    sex: profile.sex ?? '',
    activityLevel: profile.activityLevel,
  });
  const [saved, setSaved] = useState(false);
  const [todayMeals, setTodayMeals] = useState<MealPlanItem[]>([]);
  const householdId = useHouseholdId();
  const mealPlanApi = useMemo(() => createMealPlanApi(apiClient), []);
  const calorieTarget = useHealthCalorieTarget();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  useEffect(() => {
    if (!householdId || !showCalories) return;
    mealPlanApi
      .getByDateRange(householdId, today, today)
      .then(setTodayMeals)
      .catch(() => setTodayMeals([]));
  }, [householdId, showCalories, today, mealPlanApi]);

  const todayTotalKcal = useMemo(
    () =>
      todayMeals
        .filter((i) => i.recipe?.kcal)
        .reduce((sum, i) => sum + (i.recipe?.kcal ?? 0), 0),
    [todayMeals],
  );

  const handleSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfile({
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      age: form.age ? Number(form.age) : null,
      sex: (form.sex === 'male' || form.sex === 'female' ? form.sex : null) as Sex | null,
      activityLevel: form.activityLevel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const profileComplete = Boolean(profile.weight && profile.height && profile.age && profile.sex);

  const waterGoalL = profileComplete
    ? calculateWaterGoal(profile.weight!, profile.activityLevel)
    : null;
  const waterIntakeL = waterIntakeMl / 1000;
  const waterPercent = waterGoalL ? Math.min(100, Math.round((waterIntakeL / waterGoalL) * 100)) : 0;

  const bmr = profileComplete
    ? calculateBMR(profile.weight!, profile.height!, profile.age!, profile.sex!)
    : null;
  const tdee = bmr ? calculateTDEE(bmr, profile.activityLevel) : null;
  const goals = tdee && bmr ? calculateCalorieGoals(tdee, bmr, profile.sex!) : null;

  const dietPlans = goals
    ? (['maintain', 'loseSlow', 'loseModerate', 'loseAggressive', 'gain'] as DietPlan[]).map((plan) => ({
        plan,
        kcal: goals[plan],
        style: HEALTH_PLAN_STYLES[plan],
      }))
    : [];

  return (
    <div className="space-y-5">
      <h2 className="type-section-title">Salud</h2>

      <Card className="p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Preferencias de tu cuenta</h2>
        <p className="mt-1 text-sm text-muted">Solo aplican a tu usuario, no al hogar.</p>
        <div className="mt-4">
          <CaloriePreferenceToggle id="show-calories-health" showDescription={false} />
        </div>
      </Card>

      {profileComplete && (waterGoalL || (showCalories && bmr && tdee)) && (
        <div
          className={
            showCalories && bmr && tdee && waterGoalL
              ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3'
              : 'grid grid-cols-1 gap-2 sm:gap-3'
          }
        >
          {showCalories && bmr && tdee && (
            <>
              <div className="health-stat-pill health-stat-pill--lavender p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">TMB</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-ink sm:text-2xl">{bmr}</p>
                <p className="text-xs text-muted">kcal</p>
              </div>
              <div className="health-stat-pill health-stat-pill--mint p-3 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">TDEE</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-ink sm:text-2xl">{tdee}</p>
                <p className="text-xs text-muted">kcal</p>
              </div>
            </>
          )}
          {waterGoalL && (
            <div
              className={
                showCalories && bmr && tdee
                  ? 'health-stat-pill health-stat-pill--cyan col-span-2 p-3 sm:col-span-1 sm:p-4'
                  : 'health-stat-pill health-stat-pill--cyan p-3 sm:p-4'
              }
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Agua objetivo</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-ink sm:text-2xl">{waterGoalL}</p>
              <p className="text-xs text-muted">litros / día</p>
            </div>
          )}
        </div>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4 sm:space-y-5">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--pastel-lavender)', color: 'var(--pastel-lavender-icon)' }}
            >
              <HealthIcon className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Tu perfil</h2>
          </div>
          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Field label="Peso (kg)" id="weight">
                <input
                  id="weight"
                  type="number"
                  min="30"
                  max="300"
                  placeholder="70"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="Altura (cm)" id="height">
                <input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="170"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="Edad" id="age">
                <input
                  id="age"
                  type="number"
                  min="10"
                  max="120"
                  placeholder="30"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="input"
                />
              </Field>
              <Field label="Sexo" id="sex">
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                  className="select"
                >
                  <option value="">Seleccionar</option>
                  <option value="female">Mujer</option>
                  <option value="male">Hombre</option>
                </select>
              </Field>
            </div>

            <Field label="Nivel de actividad" id="activityLevel">
              <select
                id="activityLevel"
                value={form.activityLevel}
                onChange={(e) => setForm((f) => ({ ...f, activityLevel: e.target.value as ActivityLevel }))}
                className="select"
              >
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            <button type="submit" className="btn-health">
              {saved ? (
                <>
                  <CheckIcon className="h-5 w-5" />
                  Guardado
                </>
              ) : (
                'Guardar perfil'
              )}
            </button>
          </form>
        </Card>

        {showCalories && profileComplete && tdee && profile.sex && profile.weight && (
          <WeightGoalCard
            currentWeightKg={profile.weight}
            heightCm={profile.height!}
            age={profile.age!}
            sex={profile.sex}
            activityLevel={profile.activityLevel}
            profileComplete={profileComplete}
          />
        )}
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--pastel-cyan)', color: 'var(--pastel-cyan-icon)' }}
                >
                  <WaterDropIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">Agua de hoy</h2>
                  {waterGoalL ? (
                    <p className="text-xs text-muted">Objetivo: {waterGoalL} L</p>
                  ) : (
                    <p className="text-xs text-muted">Completa el perfil para calcular el objetivo</p>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold tabular-nums text-ink sm:text-3xl">{waterIntakeL.toFixed(2)} L</p>
                {waterGoalL && (
                  <p className="text-xs font-semibold" style={{ color: 'var(--pastel-cyan-icon)' }}>
                    {waterPercent}% del objetivo
                  </p>
                )}
              </div>
            </div>

            {waterGoalL ? (
              <div className="mt-5 space-y-4">
                <div className="health-water-panel p-4">
                  <div className="progress-track h-3">
                    <div className="health-water-progress-fill" style={{ width: `${waterPercent}%` }} />
                  </div>

                  {waterPercent >= 100 && (
                    <p
                      className="mt-3 rounded-[var(--radius-control)] px-4 py-2.5 text-center text-sm font-semibold"
                      style={{ background: 'var(--pastel-cyan)', color: 'var(--pastel-cyan-icon)' }}
                    >
                      Objetivo de agua alcanzado
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WATER_SHORTCUTS.map((s) => (
                    <button
                      key={s.ml}
                      type="button"
                      onClick={() => addWater(s.ml)}
                      className="health-water-btn min-h-11"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={() => removeWater(200)} className="btn-neutral w-full">
                  Quitar 200 ml
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-[var(--radius-control)] bg-page px-4 py-6 text-center text-sm text-muted">
                Indica peso, altura, edad y sexo para ver tu objetivo de hidratación.
              </p>
            )}
          </Card>

          {showCalories && (
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--pastel-peach)', color: 'var(--pastel-peach-icon)' }}
                >
                  <FlameIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">Calorías diarias</h2>
                  <p className="text-xs text-muted">Mifflin-St Jeor · objetivo según tu meta</p>
                </div>
              </div>
            </div>

            {calorieTarget.profileComplete && calorieTarget.bmr && calorieTarget.tdee && (
              <div className="mt-4">
                <CalorieTargetStatus
                  bmr={calorieTarget.bmr}
                  tdee={calorieTarget.tdee}
                  dailyTarget={calorieTarget.dailyTarget}
                  todayTotalKcal={todayTotalKcal}
                />
              </div>
            )}

            {!selectedPlan && goals && (
              <p className="mt-4 rounded-[var(--radius-control)] bg-page px-3 py-2.5 text-xs text-muted">
                Define un objetivo de peso o elige un plan para el plan de comidas.
              </p>
            )}

            {goals ? (
              <div className="mt-4 space-y-2">
                {dietPlans.map(({ plan, kcal, style }) => {
                  const linked = weightGoal.linkedPlan;
                  const goalActive = weightGoal.active;
                  const isTimeline = goalActive && weightGoal.mode === 'timeline';
                  const live = liveCaloriePreview;
                  const isClosestMatch =
                    live?.closestPlan != null && live.closestPlan === plan;
                  const savedRowActive =
                    goalActive && linked != null
                      ? isTimeline
                        ? linked === plan
                        : selectedPlan === plan
                      : selectedPlan === plan;
                  const adaptedKcal = live
                    ? isClosestMatch
                      ? live.activeDailyKcal
                      : null
                    : goalActive && savedRowActive && weightGoal.dailyKcalTarget != null
                      ? weightGoal.dailyKcalTarget
                      : null;
                  return (
                    <CaloriePlanRow
                      key={plan}
                      label={DIET_PLAN_LABELS[plan]}
                      kcal={kcal}
                      adaptedKcal={adaptedKcal}
                      style={style}
                      isSelected={savedRowActive && !live}
                      isClosestMatch={Boolean(live && isClosestMatch)}
                      isRecommended={
                        !live && isTimeline && linked === plan && !isClosestMatch
                      }
                      onSelect={() => {
                        if (!goals || !bmr || !tdee || !profile.sex || !profile.weight) return;

                        if (!goalActive || !weightGoal.targetWeight) {
                          setSelectedPlan(selectedPlan === plan ? null : plan);
                          return;
                        }

                        const resolution = resolveWeightGoalByPlan({
                          currentWeightKg: profile.weight,
                          targetWeightKg: weightGoal.targetWeight,
                          tdee,
                          bmr,
                          sex: profile.sex,
                          goals,
                          fromDate: today,
                          plan,
                        });
                        const { dailyKcalTarget, linkedPlan } = dailyKcalForWeightGoalSave(
                          'plan',
                          resolution,
                          plan,
                        );
                        applyWeightGoal({
                          targetWeight: weightGoal.targetWeight,
                          targetDate: resolution.result.targetDate,
                          targetWeeks: null,
                          mode: 'plan',
                          linkedPlan,
                          dailyKcalTarget,
                        });
                      }}
                    />
                  );
                })}
                <p className="pt-2 text-xs text-muted">
                  {liveCaloriePreview
                    ? '«Tu cálculo» sigue las kcal del plazo; debajo de cada plan ves cuándo llegarías a tu peso objetivo con ese déficit.'
                    : weightGoal.active && weightGoal.mode === 'timeline'
                      ? 'Las kcal activas son las calculadas para tu fecha; el plan marcado es la referencia más cercana.'
                      : 'Con objetivo de peso activo, el plan elegido fija las kcal del calendario.'}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-[var(--radius-control)] bg-page px-4 py-6 text-center text-sm text-muted">
                Indica peso, altura, edad y sexo para ver tus objetivos calóricos.
              </p>
            )}
          </Card>
          )}
        </div>
        <p className="pt-2 text-center text-xs text-muted">
          Los datos de salud se guardan solo en este dispositivo y no se sincronizan entre navegadores.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: Readonly<{ label: string; id: string; children: React.ReactNode }>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
