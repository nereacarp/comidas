import { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { MealPlanRecipeLink, mealPlanItemRecipeId } from './meal-plan/MealPlanRecipeLink';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import { RecipePicker } from './RecipePicker';
import { useHousehold } from '../hooks/useHousehold';
import { AppleIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, MoonIcon, SunIcon, UtensilsIcon } from './ui/Icons';
import { MonthDayCellMeals, sortMealPlanItemsByType } from './meal-plan/MonthDayCellMeals';
import {
  MEAL_TYPE_LABELS,
  mealTypeBadgeStyle,
  mealTypePlanLabelStyle,
  mealTypePlanMobileAddStyle,
  mealTypePlanMobileBlockStyle,
} from '../utils/meal-type';
import type { MealPlanItem, MealType, Recipe } from '../types';

const mealPlanApi = createMealPlanApi(apiClient);

const DAY_NAMES = ['Lun', 'Mar', 'Mi\u00e9', 'Jue', 'Vie', 'S\u00e1b', 'Dom'];
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MEAL_TYPES: Array<{ value: MealType; label: string; icon: ReactNode }> = [
  { value: 'DESAYUNO', label: 'Desayuno', icon: <SunIcon className="w-4 h-4" /> },
  { value: 'COMIDA', label: 'Comida', icon: <UtensilsIcon className="w-4 h-4" /> },
  { value: 'CENA', label: 'Cena', icon: <MoonIcon className="w-4 h-4" /> },
  { value: 'SNACK', label: 'Snack', icon: <AppleIcon className="w-4 h-4" /> },
  { value: 'POSTRE', label: 'Postre', icon: <HeartIcon className="w-4 h-4" /> },
];

const MEAL_ICONS: Record<MealType, ReactNode> = {
  DESAYUNO: <SunIcon className="w-4 h-4" />,
  COMIDA: <UtensilsIcon className="w-4 h-4" />,
  CENA: <MoonIcon className="w-4 h-4" />,
  SNACK: <AppleIcon className="w-4 h-4" />,
  POSTRE: <HeartIcon className="w-4 h-4" />,
};

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);

  const dates: string[] = [];
  const current = new Date(start);
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return { dates, startDate: dates[0], endDate: dates.at(-1) ?? dates.at(0) ?? '' };
}

interface MonthlyCalendarProps {
  householdId: string;
}

export function MonthlyCalendar({ householdId }: Readonly<MonthlyCalendarProps>) {
  const { canEdit } = useHousehold();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ date: string; mealType: MealType } | null>(null);

  const { dates, startDate, endDate } = getMonthDates(year, month);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await mealPlanApi.getByDateRange(householdId, startDate, endDate, signal);
      setItems(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }, [householdId, startDate, endDate]);

  useEffect(() => {
    const controller = new AbortController();
    loadItems(controller.signal);
    return () => controller.abort();
  }, [loadItems]);

  const getItemsForDate = (date: string) =>
    items.filter((i) => i.date.startsWith(date));

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleAdd = (date: string, mealType: MealType) => {
    setPickerTarget({ date, mealType });
    setPickerOpen(true);
  };

  const handleSelect = async (recipe: Recipe) => {
    if (!pickerTarget) return;
    await mealPlanApi.addItem(householdId, {
      date: pickerTarget.date,
      mealType: pickerTarget.mealType,
      recipeId: recipe.id,
    });
    await loadItems();
  };

  const handleCustomMeal = async (name: string) => {
    if (!pickerTarget) return;
    await mealPlanApi.addItem(householdId, {
      date: pickerTarget.date,
      mealType: pickerTarget.mealType,
      customMealName: name,
    });
    await loadItems();
  };

  const handleRemove = async (itemId: string) => {
    await mealPlanApi.deleteItem(householdId, itemId);
    await loadItems();
  };

  const today = new Date().toISOString().split('T')[0];
  const monthDates = dates.filter((d) => Number.parseInt(d.split('-')[1]) - 1 === month);

  return (
    <div className="flex-1 min-h-0 flex flex-col md:block">
      {/* Mobile: sticky month nav + scrollable feed */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between py-2 shrink-0 gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="meal-plan-week-nav-btn"
            aria-label="Mes anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="meal-plan-week-range capitalize">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="meal-plan-week-nav-btn"
            aria-label="Mes siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <MobileMonthFeed
          dates={monthDates}
          today={today}
          getItemsForDate={getItemsForDate}
          onAdd={handleAdd}
          onRemove={handleRemove}
          canEdit={canEdit}
        />
      </div>

      {/* Desktop: month nav */}
      <div className="hidden md:flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <button
          type="button"
          onClick={handlePrev}
          className="meal-plan-week-nav-btn"
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="meal-plan-week-range capitalize">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="meal-plan-week-nav-btn"
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop: grid calendar */}
      <div className="hidden md:block meal-plan-month">
        <div className="meal-plan-month-grid">
          {DAY_NAMES.map((day) => (
            <div key={day} className="meal-plan-month-weekday">
              {day}
            </div>
          ))}
          {dates.map((date) => {
            const dayNum = Number.parseInt(date.split('-')[2]);
            const dateMonth = Number.parseInt(date.split('-')[1]) - 1;
            const isCurrentMonth = dateMonth === month;
            const isToday = date === today;
            const dayItems = getItemsForDate(date);

            const cellClass = [
              'meal-plan-month-day-cell',
              !isCurrentMonth && 'meal-plan-month-day-cell--outside',
              isToday && 'meal-plan-month-day-cell--today',
            ]
              .filter(Boolean)
              .join(' ');

            const dayNumClass = [
              'meal-plan-month-day-num',
              !isCurrentMonth && 'meal-plan-month-day-num--outside',
              isToday && 'meal-plan-month-day-num--today',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div key={date} className={cellClass}>
                <span className={dayNumClass}>{dayNum}</span>
                <MonthDayCellMeals
                  date={date}
                  items={dayItems}
                  showEmptySlots={isCurrentMonth}
                  canEdit={canEdit}
                  onAdd={handleAdd}
                />
              </div>
            );
          })}
        </div>
      </div>

      <RecipePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        onCustomMeal={handleCustomMeal}
        householdId={householdId}
        mealType={pickerTarget?.mealType}
        date={pickerTarget?.date}
      />
    </div>
  );
}

interface MobileMonthFeedProps {
  dates: string[];
  today: string;
  getItemsForDate: (date: string) => MealPlanItem[];
  onAdd: (date: string, mealType: MealType) => void;
  onRemove: (itemId: string) => void;
  canEdit: boolean;
}

function MobileMonthFeed({ dates, today, getItemsForDate, onAdd, onRemove, canEdit }: Readonly<MobileMonthFeedProps>) {
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = todayRef.current;
      container.scrollTop = el.offsetTop - container.offsetTop;
    }
  }, [dates[0]]);

  return (
    <div ref={scrollRef} className="meal-plan-mobile-feed">
      {dates.map((date) => {
        const isToday = date === today;
        const dayItems = getItemsForDate(date);
        const d = new Date(date + 'T12:00:00');
        const dayName = DAY_NAMES_FULL[d.getDay()];
        const dayNum = d.getDate();
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        return (
          <MobileDayCard
            key={date}
            ref={isToday ? todayRef : undefined}
            date={date}
            dayName={dayName}
            dayNum={dayNum}
            isToday={isToday}
            isWeekend={isWeekend}
            dayItems={dayItems}
            onAdd={onAdd}
            onRemove={onRemove}
            canEdit={canEdit}
          />
        );
      })}
    </div>
  );
}

interface MobileDayCardProps {
  date: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  isWeekend: boolean;
  dayItems: MealPlanItem[];
  onAdd: (date: string, mealType: MealType) => void;
  onRemove: (itemId: string) => void;
  canEdit: boolean;
}

const MobileDayCard = forwardRef<HTMLDivElement, MobileDayCardProps>(
  function MobileDayCard({ date, dayName, dayNum, isToday, isWeekend, dayItems, onAdd, onRemove, canEdit }, ref) {
    const [expanded, setExpanded] = useState(false);
    const hasMeals = dayItems.length > 0;
    const showDetails = expanded || isToday;

    const dayClass = [
      'meal-plan-mobile-day',
      hasMeals && 'meal-plan-mobile-day--has-meals',
      isToday && 'meal-plan-mobile-day--today',
    ]
      .filter(Boolean)
      .join(' ');

    const dayNumClass = [
      'meal-plan-mobile-day__num',
      isToday && 'meal-plan-mobile-day__num--today',
      !isToday && isWeekend && 'meal-plan-mobile-day__num--weekend',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={dayClass}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="meal-plan-mobile-day__trigger"
          aria-expanded={showDetails}
        >
          <span className={dayNumClass}>{dayNum}</span>
          <div className="meal-plan-mobile-day__meta">
            <span className="meal-plan-mobile-day__title">{dayName}</span>
            {isToday && <span className="meal-plan-mobile-day__today-badge">Hoy</span>}
          </div>
          {hasMeals && !showDetails && (
            <div className="meal-plan-mobile-day__preview">
              <MonthDayCellMeals
                date={date}
                items={dayItems}
                showEmptySlots={false}
                canEdit={canEdit}
                onAdd={onAdd}
                previewOnly
              />
            </div>
          )}
          {!hasMeals && !showDetails && (
            <span className="meal-plan-mobile-day__empty">Sin comidas</span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`meal-plan-mobile-day__chevron ${showDetails ? 'meal-plan-mobile-day__chevron--open' : ''}`}
            aria-hidden
          >
            <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {showDetails && (
          <div className="meal-plan-mobile-day__body">
            {sortMealPlanItemsByType(dayItems).map((item) => (
              <MobileMealChip key={item.id} item={item} onRemove={onRemove} canEdit={canEdit} />
            ))}
            {canEdit && (
              <div className="flex flex-wrap gap-1.5">
                {MEAL_TYPES.map((mt) => {
                  const existing = dayItems.find((i) => i.mealType === mt.value);
                  if (existing) return null;
                  return (
                    <button
                      key={mt.value}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onAdd(date, mt.value); }}
                      className="meal-plan-mobile-add-slot"
                      style={mealTypePlanMobileAddStyle(mt.value)}
                    >
                      <span aria-hidden>{mt.icon}</span>
                      <span>{mt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

function MobileMealChip({
  item,
  onRemove,
  canEdit,
}: Readonly<{ item: MealPlanItem; onRemove: (id: string) => void; canEdit: boolean }>) {
  const label = item.recipe?.title || item.customMealName || '?';
  const imageUrl = item.recipe?.imageUrl;
  const isEatOut = item.customMealName === 'Comer fuera';

  let leading: ReactNode = (
    <span className="meal-plan-mobile-meal__type shrink-0" style={mealTypeBadgeStyle(item.mealType)}>
      {MEAL_ICONS[item.mealType]}
    </span>
  );
  if (isEatOut) {
    leading = (
      <span className="meal-plan-mobile-meal__type shrink-0" style={mealTypeBadgeStyle('COMIDA')}>
        <UtensilsIcon className="w-4 h-4" />
      </span>
    );
  } else if (imageUrl) {
    const recipeId = mealPlanItemRecipeId(item);
    const img = <img src={imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />;
    leading = recipeId ? (
      <MealPlanRecipeLink recipeId={recipeId} title={label} className="meal-plan-month-thumb--link shrink-0">
        {img}
      </MealPlanRecipeLink>
    ) : (
      img
    );
  }

  const blockStyle = mealTypePlanMobileBlockStyle(item.mealType);
  const labelStyle = mealTypePlanLabelStyle(item.mealType);

  return (
    <div className="meal-plan-mobile-meal" style={blockStyle}>
      {leading}
      <div className="meal-plan-mobile-meal__meta">
        <span className="meal-plan-mobile-meal__slot-label" style={labelStyle}>
          {MEAL_TYPE_LABELS[item.mealType]}
        </span>
        <p className="meal-plan-mobile-meal__label">{label}</p>
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="shrink-0 cursor-pointer p-0.5 text-muted transition-colors active:text-[var(--danger-text)]"
          aria-label="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
