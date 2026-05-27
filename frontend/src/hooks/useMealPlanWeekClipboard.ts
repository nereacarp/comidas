import { useCallback, useState } from 'react';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import {
  getWeekClipboardAction,
  getWeekClipboardLabel,
  getWeekClipboardLabelShort,
  type WeekClipboardAction,
} from '../lib/meal-plan-week-clipboard';

const mealPlanApi = createMealPlanApi(apiClient);

interface UseMealPlanWeekClipboardOptions {
  householdId: string;
  currentWeekStart: string;
  weekHasMeals: boolean;
  reload: () => Promise<void>;
  onCopyStarted?: () => void;
}

export function useMealPlanWeekClipboard({
  householdId,
  currentWeekStart,
  weekHasMeals,
  reload,
  onCopyStarted,
}: UseMealPlanWeekClipboardOptions) {
  const [copiedWeekStart, setCopiedWeekStart] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const getAction = useCallback(
    (): WeekClipboardAction | null =>
      getWeekClipboardAction(currentWeekStart, copiedWeekStart, weekHasMeals),
    [copiedWeekStart, currentWeekStart, weekHasMeals],
  );

  const getLabel = useCallback(
    (short = false) => {
      const action = getAction();
      return short
        ? getWeekClipboardLabelShort(action, busy)
        : getWeekClipboardLabel(action, busy);
    },
    [busy, getAction],
  );

  const handleWeekAction = useCallback(async () => {
    const action = getAction();
    if (!action || busy) return;

    if (action === 'copy') {
      if (!weekHasMeals) return;
      onCopyStarted?.();
      setCopiedWeekStart(currentWeekStart);
      return;
    }

    if (!copiedWeekStart) return;

    setBusy(true);
    try {
      await mealPlanApi.copyWeek(householdId, copiedWeekStart, currentWeekStart);
      setCopiedWeekStart(null);
      await reload();
    } catch {
      // handle error
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    copiedWeekStart,
    currentWeekStart,
    getAction,
    householdId,
    onCopyStarted,
    reload,
    weekHasMeals,
  ]);

  const clearClipboard = useCallback(() => setCopiedWeekStart(null), []);

  return {
    copiedWeekStart,
    busy,
    getAction,
    getLabel,
    handleWeekAction,
    clearClipboard,
  };
}
