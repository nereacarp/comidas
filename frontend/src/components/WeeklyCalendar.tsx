import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import { RecipePicker } from './RecipePicker';
import { useHousehold } from '../hooks/useHousehold';
import { useShowCalories } from '../hooks/useShowCalories';
import { useHealthCalorieTarget } from '../hooks/useHealthCalorieTarget';
import { getDayKcalStatus, kcalStatusLabel, kcalStatusTone } from '../lib/meal-plan-kcal-status';
import { WeeklyCalendarDesktop } from './meal-plan/WeeklyCalendarDesktop';
import type { PlanKcalColors } from './meal-plan/WeeklyDayColumn';
import { useMealPlanDayClipboard } from '../hooks/useMealPlanDayClipboard';
import { useMealPlanWeekClipboard } from '../hooks/useMealPlanWeekClipboard';
import { isPasteTarget } from '../lib/meal-plan-day-clipboard';
import { isWeekPasteTarget } from '../lib/meal-plan-week-clipboard';
import { getWeekDates, todayIsoLocal } from '../lib/meal-plan-dates';
import { MealPlanRecipeLink, mealPlanItemRecipeId } from './meal-plan/MealPlanRecipeLink';
import {
  mealTypeAvatarStyle,
  mealTypePlanLabelStyle,
  mealTypePlanMobileBlockStyle,
} from '../utils/meal-type';
import { AppleIcon, ChevronLeftIcon, ChevronRightIcon, FlameIcon, MoonIcon, SunIcon, UtensilsIcon } from './ui/Icons';
import type { MealPlanItem, MealType, Recipe } from '../types';

const mealPlanApi = createMealPlanApi(apiClient);

const MEAL_TYPES: Array<{ value: MealType; label: string; icon: ReactNode }> = [
  { value: 'DESAYUNO', label: 'Desayuno', icon: <SunIcon className="w-4 h-4" /> },
  { value: 'COMIDA', label: 'Comida', icon: <UtensilsIcon className="w-4 h-4" /> },
  { value: 'CENA', label: 'Cena', icon: <MoonIcon className="w-4 h-4" /> },
  { value: 'SNACK', label: 'Snack', icon: <AppleIcon className="w-4 h-4" /> },
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_NAMES_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MEAL_PLAN_KCAL_COLORS: PlanKcalColors = {
  onTrack: 'var(--success-text)',
  over: 'var(--danger-text)',
  under: 'var(--text-secondary)',
};

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number.parseInt(day)} ${MONTH_NAMES[Number.parseInt(month) - 1]}`;
}

interface WeeklyCalendarProps {
  householdId: string;
}

function getTodayIndex(dates: string[]): number {
  const today = todayIsoLocal();
  const idx = dates.findIndex((d) => d === today);
  return idx >= 0 ? idx : 0;
}

export function WeeklyCalendar({ householdId }: WeeklyCalendarProps) {
  const { canEdit } = useHousehold();
  const showCalories = useShowCalories();
  const { getCalorieTarget } = useHealthCalorieTarget();
  const planKcalColors = MEAL_PLAN_KCAL_COLORS;
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ date: string; mealType: MealType } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const dates = getWeekDates(weekOffset);
  const startDate = dates[0];
  const endDate = dates[6];

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

  const getItem = (date: string, mealType: MealType) =>
    items.find((i) => i.date.startsWith(date) && i.mealType === mealType);

  const getDayKcal = (date: string) =>
    items
      .filter((i) => i.date.startsWith(date) && i.recipe?.kcal)
      .reduce((sum, i) => sum + (i.recipe?.kcal ?? 0), 0);

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

  const handleEatOut = async (date: string, mealType: MealType) => {
    await mealPlanApi.addItem(householdId, {
      date,
      mealType,
      customMealName: 'Comer fuera',
    });
    await loadItems();
  };

  const handleRemove = async (itemId: string) => {
    await mealPlanApi.deleteItem(householdId, itemId);
    await loadItems();
  };

  const dayHasMeals = (date: string) => items.some((i) => i.date.startsWith(date));

  const navigateToDate = useCallback(
    (targetDate: string) => {
      if (dates.includes(targetDate)) return;
      if (targetDate > dates[6]) setWeekOffset((o) => o + 1);
      else if (targetDate < dates[0]) setWeekOffset((o) => o - 1);
    },
    [dates],
  );

  const {
    copiedDate,
    busyDate,
    getAction: getDayClipboardAction,
    getLabel: getDayClipboardLabel,
    handleDayAction,
    clearClipboard: clearDayClipboard,
  } = useMealPlanDayClipboard({
    householdId,
    dayHasMeals,
    reload: loadItems,
    onNavigateToDate: navigateToDate,
  });

  const weekHasMeals = items.length > 0;

  const {
    copiedWeekStart,
    busy: weekClipboardBusy,
    getAction: getWeekClipboardAction,
    getLabel: getWeekClipboardLabel,
    handleWeekAction,
    clearClipboard: clearWeekClipboard,
  } = useMealPlanWeekClipboard({
    householdId,
    currentWeekStart: startDate,
    weekHasMeals,
    reload: loadItems,
    onCopyStarted: clearDayClipboard,
  });

  const handleDayClipboard = (date: string) => {
    if (getDayClipboardAction(date) === 'copy') clearWeekClipboard();
    void handleDayAction(date);
  };

  const handleWeekClipboardClick = () => {
    if (getWeekClipboardAction() === 'copy') clearDayClipboard();
    void handleWeekAction();
  };

  const today = todayIsoLocal();
  const weekClipboardAction = getWeekClipboardAction();
  const showWeekClipboardBtn = canEdit && weekClipboardAction !== null;
  const weekToolbarPasteReady = isWeekPasteTarget(startDate, copiedWeekStart);

  useEffect(() => {
    setSelectedDayIndex(getTodayIndex(dates));
  }, [weekOffset]);

  return (
    <div>
      {/* Week navigation */}
      <div
        className={
          showWeekClipboardBtn
            ? 'meal-plan-week-toolbar meal-plan-week-toolbar--with-copy mb-3 md:mb-6'
            : 'meal-plan-week-toolbar mb-3 md:mb-6'
        }
      >
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="meal-plan-week-nav-btn meal-plan-week-toolbar__prev"
          aria-label="Semana anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div
          className={
            weekToolbarPasteReady
              ? 'meal-plan-week-toolbar__center meal-plan-week-toolbar__center--paste-ready'
              : 'meal-plan-week-toolbar__center'
          }
        >
          <span className="meal-plan-week-range">
            {formatShortDate(dates[0])} – {formatShortDate(dates[6])}
          </span>
          {showWeekClipboardBtn && (
            <button
              type="button"
              onClick={handleWeekClipboardClick}
              disabled={weekClipboardBusy}
              className={`meal-plan-copy-week-btn ${
                weekClipboardAction === 'paste' ? 'meal-plan-copy-week-btn--paste' : ''
              }`.trim()}
              title={
                weekClipboardAction === 'paste'
                  ? 'Pegar la semana copiada en esta semana'
                  : 'Copiar esta semana para pegarla en otra'
              }
            >
              {getWeekClipboardLabel(false)}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="meal-plan-week-nav-btn meal-plan-week-toolbar__next"
          aria-label="Semana siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {copiedDate && canEdit && (
        <div className="meal-plan-clipboard-hint mb-3 md:mb-4">
          <button
            type="button"
            onClick={clearDayClipboard}
            className="meal-plan-clipboard-hint__cancel"
          >
            Cancelar
          </button>
        </div>
      )}

      {copiedWeekStart && canEdit && (
        <div className="meal-plan-clipboard-hint meal-plan-clipboard-hint--week mb-3 md:mb-4">
          <button
            type="button"
            onClick={clearWeekClipboard}
            className="meal-plan-clipboard-hint__cancel"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Mobile: day selector pills + single day */}
      <div className="md:hidden">
        {/* Day pills */}
        <div className="meal-plan-week-daystrip">
          {dates.map((date, i) => {
            const isSelected = i === selectedDayIndex;
            const isToday = date === today;
            const canPaste = isPasteTarget(date, copiedDate);
            const dayNum = Number.parseInt(date.split('-')[2]);
            const pillClass = [
              'meal-plan-week-daypill',
              isSelected && 'meal-plan-week-daypill--selected',
              isToday && 'meal-plan-week-daypill--today',
              canPaste && 'meal-plan-week-daypill--paste-ready',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDayIndex(i)}
                className={pillClass}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
              >
                <span className="meal-plan-week-daypill__abbr">{DAY_NAMES_SHORT[i]}</span>
                <span className="meal-plan-week-daypill__num">{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Selected day header */}
        {(() => {
          const selectedDate = dates[selectedDayIndex];
          const isToday = selectedDate === today;
          const target = getCalorieTarget(selectedDate);
          return (
            <div className="meal-plan-week-dayhead">
              <div className="meal-plan-week-dayhead__row">
                <span className={`meal-plan-week-dayhead__title ${isToday ? 'meal-plan-week-dayhead__title--today' : ''}`}>
                  {DAY_NAMES_FULL[selectedDayIndex]}
                </span>
                {canEdit && getDayClipboardLabel(selectedDate) && (
                  <button
                    type="button"
                    onClick={() => handleDayClipboard(selectedDate)}
                    disabled={busyDate === selectedDate || weekClipboardBusy}
                    className={`meal-plan-copy-btn shrink-0 ${
                      getDayClipboardAction(selectedDate) === 'paste' ? 'meal-plan-paste-btn' : ''
                    }`}
                    title={
                      getDayClipboardAction(selectedDate) === 'paste'
                        ? 'Pegar comidas copiadas en este día'
                        : 'Copiar comidas de este día'
                    }
                  >
                    {getDayClipboardLabel(selectedDate)}
                  </button>
                )}
              </div>
              {showCalories && target && (
                <p className="meal-plan-week-dayhead__kcal">
                  Objetivo {target.toLocaleString('es-ES')} kcal
                </p>
              )}
            </div>
          );
        })()}

        {/* Meal rows for selected day */}
        <div className="meal-plan-week-meals-card divide-y divide-[var(--border-subtle)]">
          {MEAL_TYPES.map((mt) => {
            const selectedDate = dates[selectedDayIndex];
            const item = getItem(selectedDate, mt.value);
            return (
              <MobileMealRow
                key={mt.value}
                mealType={mt}
                item={item}
                onAdd={() => handleAdd(selectedDate, mt.value)}
                onEatOut={() => handleEatOut(selectedDate, mt.value)}
                onRemove={handleRemove}
                canEdit={canEdit}
              />
            );
          })}
          {showCalories && (() => {
            const selectedDate = dates[selectedDayIndex];
            const target = getCalorieTarget(selectedDate);
            const total = getDayKcal(selectedDate);
            const status = getDayKcalStatus(total, target);
            const diff = target !== null && total > 0 ? total - target : null;
            const statusHint = kcalStatusLabel(status);
            const accent = kcalStatusTone(status).color;
            if (total === 0 && !target) return null;
            return (
              <div className="px-4 py-3 flex flex-col gap-1 border-t border-[var(--border-subtle)] bg-[var(--surface)]">
                {statusHint && (
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>
                    {statusHint}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {target && total === 0 && (
                    <span className="text-xs text-muted">
                      Objetivo {target.toLocaleString('es-ES')} kcal
                    </span>
                  )}
                  {total > 0 && (
                    <span className="text-xs font-semibold inline-flex items-center gap-1.5" style={{ color: accent }}>
                      <FlameIcon className="w-4 h-4 shrink-0" />
                      {total.toLocaleString('es-ES')} kcal
                      {diff !== null && status !== 'on-track' && (
                        <span className="font-medium">
                          ({diff > 0 ? `+${diff.toLocaleString('es-ES')}` : diff.toLocaleString('es-ES')})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <WeeklyCalendarDesktop
        dates={dates}
        dayNames={DAY_NAMES}
        formatDayDate={formatShortDate}
        today={today}
        mealTypes={MEAL_TYPES}
        getItem={getItem}
        getDayKcal={getDayKcal}
        getCalorieTarget={getCalorieTarget}
        planKcalColors={planKcalColors}
        onAdd={handleAdd}
        onEatOut={handleEatOut}
        onRemove={handleRemove}
        copiedDate={copiedDate}
        busyDate={busyDate}
        onDayClipboard={handleDayClipboard}
        getDayClipboardLabel={getDayClipboardLabel}
        getDayClipboardAction={getDayClipboardAction}
        dayHasMeals={dayHasMeals}
        canEdit={canEdit}
        showCalories={showCalories}
      />

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

interface MobileMealRowProps {
  mealType: { value: MealType; label: string; icon: ReactNode };
  item?: MealPlanItem;
  onAdd: () => void;
  onEatOut: () => void;
  onRemove: (itemId: string) => void;
  canEdit: boolean;
}

function MobileMealRow({ mealType, item, onAdd, onEatOut, onRemove, canEdit }: MobileMealRowProps) {
  const isEatOut = item?.customMealName === 'Comer fuera';
  const label = item?.recipe?.title || item?.customMealName;
  const imageUrl = item?.recipe?.imageUrl;

  const rowStyle = mealTypePlanMobileBlockStyle(mealType.value);
  const labelStyle = mealTypePlanLabelStyle(mealType.value);
  const avatarStyle = mealTypeAvatarStyle(mealType.value);
  const recipeId = item ? mealPlanItemRecipeId(item) : undefined;

  if (!item) {
    if (!canEdit) {
      return (
        <div className="flex items-center gap-2.5 px-4 py-2.5" style={rowStyle}>
          <span className="text-base" style={labelStyle}>{mealType.icon}</span>
          <span className="text-xs font-semibold flex-1" style={labelStyle}>{mealType.label}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2.5 px-4 py-2" style={rowStyle}>
        <span className="text-base" style={labelStyle}>{mealType.icon}</span>
        <span className="text-xs font-semibold flex-1 opacity-70" style={labelStyle}>{mealType.label}</span>
        <button type="button" onClick={onEatOut} className="meal-plan-slot-empty-fuera !w-auto !px-2.5">
          Fuera
        </button>
        <button type="button" onClick={onAdd} className="btn-section-mint-soft !px-2.5 !py-1 !text-[10px]">
          Añadir
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-4 py-2" style={rowStyle}>
      {isEatOut ? (
        <div
          className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center"
          style={avatarStyle}
        >
          <UtensilsIcon className="w-5 h-5" />
        </div>
      ) : imageUrl ? (
        recipeId && label ? (
          <MealPlanRecipeLink recipeId={recipeId} title={label} className="meal-plan-month-thumb--link shrink-0">
            <img src={imageUrl} alt="" className="w-10 h-10 shrink-0 rounded-2xl object-cover" />
          </MealPlanRecipeLink>
        ) : (
          <img src={imageUrl} alt="" className="w-10 h-10 shrink-0 rounded-2xl object-cover" />
        )
      ) : (
        <div
          className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-sm"
          style={avatarStyle}
        >
          {mealType.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] uppercase font-semibold" style={labelStyle}>{mealType.label}</span>
        <p className="text-sm font-semibold text-ink truncate">{label}</p>
      </div>
      {canEdit && (
        <button
          onClick={() => onRemove(item.id)}
          className="shrink-0 p-1.5 text-muted hover:text-[var(--danger-text)] cursor-pointer transition-colors"
          aria-label="Eliminar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
