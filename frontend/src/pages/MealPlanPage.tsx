import { useState } from 'react';
import { useHouseholdId } from '../hooks/useHousehold';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { MonthlyCalendar } from '../components/MonthlyCalendar';
import { PageHeader } from '../components/ui/PageHeader';
type ViewMode = 'weekly' | 'monthly';

export function MealPlanPage() {
  const householdId = useHouseholdId();
  const [view, setView] = useState<ViewMode>('weekly');

  return (
    <div className={`meal-plan-page page-shell space-y-5 md:space-y-6 ${view === 'monthly' ? 'md:h-auto h-[calc(100dvh-var(--app-bottom-safe))] overflow-hidden flex flex-col' : ''}`}>
      <PageHeader
        title="Plan semanal"
        actions={(
          <div className="meal-plan-view-toggle" role="group" aria-label="Vista del plan">
            <button
              type="button"
              onClick={() => setView('weekly')}
              className={`meal-plan-view-btn ${view === 'weekly' ? 'meal-plan-view-btn-active' : 'meal-plan-view-btn-inactive'}`}
              aria-pressed={view === 'weekly'}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => setView('monthly')}
              className={`meal-plan-view-btn ${view === 'monthly' ? 'meal-plan-view-btn-active' : 'meal-plan-view-btn-inactive'}`}
              aria-pressed={view === 'monthly'}
            >
              Mensual
            </button>
          </div>
        )}
      />

      <div className={`card meal-plan-page__panel p-4 sm:p-5 md:p-6 min-w-0 ${view === 'monthly' ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
        {view === 'weekly' ? (
          <WeeklyCalendar householdId={householdId} />
        ) : (
          <MonthlyCalendar householdId={householdId} />
        )}
      </div>
    </div>
  );
}
