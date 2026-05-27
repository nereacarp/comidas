import { useCallback, useState } from 'react';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import { getDayClipboardAction, getDayClipboardLabel } from '../lib/meal-plan-day-clipboard';

const mealPlanApi = createMealPlanApi(apiClient);

interface UseMealPlanDayClipboardOptions {
  householdId: string;
  dayHasMeals: (date: string) => boolean;
  reload: () => Promise<void>;
  onNavigateToDate?: (date: string) => void;
}

export function useMealPlanDayClipboard({
  householdId,
  dayHasMeals,
  reload,
  onNavigateToDate,
}: UseMealPlanDayClipboardOptions) {
  const [copiedDate, setCopiedDate] = useState<string | null>(null);
  const [busyDate, setBusyDate] = useState<string | null>(null);

  const getAction = useCallback(
    (date: string) => getDayClipboardAction(date, copiedDate, dayHasMeals(date)),
    [copiedDate, dayHasMeals],
  );

  const getLabel = useCallback(
    (date: string) => {
      const action = getAction(date);
      return getDayClipboardLabel(action, busyDate === date);
    },
    [getAction, busyDate],
  );

  const handleDayAction = useCallback(
    async (date: string) => {
      const action = getAction(date);
      if (!action || busyDate) return;

      if (action === 'copy') {
        if (!dayHasMeals(date)) return;
        setCopiedDate(date);
        return;
      }

      if (!copiedDate || copiedDate === date) return;

      setBusyDate(date);
      try {
        await mealPlanApi.copyDay(householdId, copiedDate, date);
        setCopiedDate(null);
        await reload();
        onNavigateToDate?.(date);
      } catch {
        // handle error
      } finally {
        setBusyDate(null);
      }
    },
    [busyDate, copiedDate, dayHasMeals, getAction, householdId, onNavigateToDate, reload],
  );

  const clearClipboard = useCallback(() => setCopiedDate(null), []);

  return {
    copiedDate,
    busyDate,
    getAction,
    getLabel,
    handleDayAction,
    clearClipboard,
  };
}

