import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildPlanProjections,
  shouldHighlightPlanForTier,
} from '../../utils/weight-goal-plans';
import { tierPlanKey } from '../../utils/deficit-planning';
import { Card } from '../ui/Card';
import { CheckIcon, FlameIcon } from '../ui/Icons';
import { useHealthStore } from '../../stores/health.store';
import type { DietPlan } from '../../stores/health.store';
import {
  calculateBMR,
  calculateCalorieGoals,
  calculateTDEE,
  daysUntilDate,
  targetDateFromWeeks,
  todayIsoLocal,
  type Sex,
} from '../../utils/health';
import {
  dailyKcalForWeightGoalSave,
  recommendedWeeksHint,
  resolveWeightGoalByTimeline,
  type WeightGoalMode,
  type WeightGoalResolution,
} from '../../utils/weight-goal';
import { WeightGoalPreview } from './WeightGoalPreview';

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

interface WeightGoalCardProps {
  currentWeightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: import('../../utils/health').ActivityLevel;
  profileComplete: boolean;
}

export function WeightGoalCard({
  currentWeightKg,
  heightCm,
  age,
  sex,
  activityLevel,
  profileComplete,
}: Readonly<WeightGoalCardProps>) {
  const { weightGoal, applyWeightGoal, resetWeightGoal, selectedPlan, setLiveCaloriePreview } =
    useHealthStore();
  const today = todayIsoLocal();
  const bmr = useMemo(
    () => (profileComplete ? calculateBMR(currentWeightKg, heightCm, age, sex) : 0),
    [profileComplete, currentWeightKg, heightCm, age, sex],
  );
  const tdee = useMemo(() => calculateTDEE(bmr, activityLevel), [bmr, activityLevel]);
  const goals = useMemo(() => calculateCalorieGoals(tdee, bmr, sex), [tdee, bmr, sex]);

  const [mode, setMode] = useState<WeightGoalMode>('timeline');
  const [targetWeight, setTargetWeight] = useState(weightGoal.targetWeight?.toString() ?? '');
  const [targetDate, setTargetDate] = useState(weightGoal.targetDate ?? '');
  const [weeks, setWeeks] = useState(
    weightGoal.targetWeeks != null ? String(Math.round(weightGoal.targetWeeks)) : '',
  );
  const [pickedPlan, setPickedPlan] = useState<DietPlan>(
    weightGoal.linkedPlan ?? selectedPlan ?? 'loseModerate',
  );
  const [saved, setSaved] = useState(false);
  const formDirtyRef = useRef(false);

  const hydrateFromStore = () => {
    setMode('timeline');
    setTargetWeight(weightGoal.targetWeight?.toString() ?? '');
    setTargetDate(weightGoal.targetDate ?? '');
    setWeeks(weightGoal.targetWeeks != null ? String(Math.round(weightGoal.targetWeeks)) : '');
    if (weightGoal.linkedPlan) setPickedPlan(weightGoal.linkedPlan);
  };

  useEffect(() => {
    if (formDirtyRef.current) return;
    hydrateFromStore();
  }, [weightGoal]);

  const markDirty = () => {
    formDirtyRef.current = true;
  };

  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const targetKg = targetWeight ? Number(targetWeight) : null;

  const timelineTargetDate = useMemo(() => {
    const w = Number(weeks);
    if (w > 0 && w <= 104) return targetDateFromWeeks(today, w);
    if (targetDate && targetDate > today) return targetDate;
    return null;
  }, [weeks, targetDate, today]);

  const resolution: WeightGoalResolution | null = useMemo(() => {
    if (!profileComplete || !targetKg || targetKg <= 0 || !bmr || !tdee) return null;

    const base = {
      currentWeightKg,
      targetWeightKg: targetKg,
      tdee,
      bmr,
      sex,
      goals,
      fromDate: today,
    };

    if (!timelineTargetDate) return null;
    return resolveWeightGoalByTimeline({ ...base, targetDate: timelineTargetDate });
  }, [
    profileComplete,
    targetKg,
    timelineTargetDate,
    currentWeightKg,
    tdee,
    bmr,
    sex,
    goals,
    today,
  ]);

  const kgToLose =
    targetKg && targetKg < currentWeightKg ? currentWeightKg - targetKg : null;
  const medicalGuideHint = kgToLose && kgToLose >= 0.5
    ? recommendedWeeksHint(kgToLose, bmr > 0 ? { tdee, bmr, sex } : undefined)
    : null;

  useEffect(() => {
    if (!resolution?.result.isValid || !goals || !targetKg || Math.abs(targetKg - currentWeightKg) <= 0.1) {
      setLiveCaloriePreview(null);
      return;
    }
    const highlightPlan = shouldHighlightPlanForTier(resolution.result.tier);
    setLiveCaloriePreview({
      activeDailyKcal: resolution.result.dailyKcal,
      closestPlan: highlightPlan
        ? (tierPlanKey(resolution.result.tier) as DietPlan)
        : null,
      targetWeightKg: targetKg,
      planProjections: buildPlanProjections({
        currentWeightKg,
        targetWeightKg: targetKg,
        tdee,
        bmr,
        sex,
        goals,
        fromDate: today,
      }),
    });
  }, [resolution, goals, targetKg, currentWeightKg, tdee, bmr, sex, today, setLiveCaloriePreview]);

  useEffect(() => () => setLiveCaloriePreview(null), [setLiveCaloriePreview]);

  const handleWeeksChange = (value: string) => {
    if (!/^\d{0,2}$/.test(value)) return;
    markDirty();
    setWeeks(value);
    const w = Number(value);
    if (w > 0 && w <= 99) {
      setTargetDate(targetDateFromWeeks(today, w));
      return;
    }
    if (!value.trim()) setTargetDate('');
  };

  const handleDateChange = (iso: string) => {
    markDirty();
    setTargetDate(iso);
    if (iso > today) {
      const days = daysUntilDate(today, iso);
      setWeeks(String(Math.round(days / 7)));
    } else {
      setWeeks('');
    }
  };

  const handleSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resolution?.result.isValid) return;

    const { dailyKcalTarget, linkedPlan } = dailyKcalForWeightGoalSave(mode, resolution, pickedPlan);

    applyWeightGoal({
      targetWeight: targetKg,
      targetDate: resolution.result.targetDate,
      targetWeeks: mode === 'timeline' && weeks ? Number(weeks) : null,
      mode,
      linkedPlan,
      active: true,
      dailyKcalTarget,
    });
    setLiveCaloriePreview(null);
    formDirtyRef.current = false;
    setTargetDate(resolution.result.targetDate);
    if (mode === 'timeline' && resolution.result.targetDate > today) {
      const days = daysUntilDate(today, resolution.result.targetDate);
      setWeeks(String(Math.round(days / 7)));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLiveCaloriePreview(null);
    resetWeightGoal();
    formDirtyRef.current = false;
    setTargetWeight('');
    setTargetDate('');
    setWeeks('');
    setMode('timeline');
    setPickedPlan('loseModerate');
    setSaved(false);
  };

  const hasActiveGoal = weightGoal.active;

  if (!profileComplete) {
    return (
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--pastel-peach)', color: 'var(--pastel-peach-icon)' }}
          >
            <FlameIcon className="h-4 w-4" />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Objetivo de peso</h2>
        </div>
        <p className="mt-4 rounded-[var(--radius-control)] bg-page px-4 py-6 text-center text-sm text-muted">
          Guarda tu perfil con peso actual para planificar un objetivo.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--pastel-peach)', color: 'var(--pastel-peach-icon)' }}
        >
          <FlameIcon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Objetivo de peso</h2>
          <p className="mt-0.5 text-xs text-muted">
            TMB {bmr} · TDEE {tdee.toLocaleString('es-ES')} kcal
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <Field label="Peso objetivo (kg)" id="targetWeight">
          <input
            id="targetWeight"
            type="number"
            min="30"
            max="300"
            step="0.1"
            placeholder={String(currentWeightKg)}
            value={targetWeight}
            onChange={(e) => {
              markDirty();
              setTargetWeight(e.target.value);
            }}
            onKeyDown={preventEnterSubmit}
            className="input"
          />
        </Field>

        {medicalGuideHint && (
          <p className="text-xs text-muted">{medicalGuideHint}</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Field label="En (semanas)" id="weeks">
              <input
                id="weeks"
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="12"
                value={weeks}
                onChange={(e) => handleWeeksChange(e.target.value)}
                onKeyDown={preventEnterSubmit}
                className="input"
              />
            </Field>
            <Field label="Fecha objetivo" id="targetDate">
              <input
                id="targetDate"
                type="date"
                min={today}
                value={targetDate}
                onChange={(e) => handleDateChange(e.target.value)}
                onKeyDown={preventEnterSubmit}
                className="input"
              />
            </Field>
          </div>

        {resolution && (
          <WeightGoalPreview
            result={resolution.result}
          />
        )}

        {!resolution && targetKg && (
          <p className="text-xs text-muted">
            {'Indica semanas o una fecha futura.'}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" className="btn-health flex-1" disabled={!resolution?.result.isValid}>
            {saved ? (
              <>
                <CheckIcon className="h-5 w-5" />
                Guardado
              </>
            ) : (
              'Activar plan'
            )}
          </button>
          {(hasActiveGoal || targetWeight || targetDate) && (
            <button type="button" onClick={handleReset} className="btn-neutral min-h-11 sm:shrink-0">
              Restablecer
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
