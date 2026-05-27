import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useHealthStore } from '../stores/health.store';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { calculateBMR, calculateCalorieGoals, calculateTDEE, calculateWaterGoal } from '../utils/health';
import { createRecipesApi } from '../api/recipes';
import { createMealPlanApi } from '../api/meal-plan';
import { apiClient } from '../api/client';
import { MembersModal } from '../components/MembersModal';
import { Card } from '../components/ui/Card';
import {
  BookOpenIcon,
  CalendarIcon,
  ChevronRightIcon,
  FlameIcon,
  HealthIcon,
  PantryIcon,
  ShoppingCartIcon,
  UsersIcon,
  WaterDropIcon,
} from '../components/ui/Icons';
import type { IconProps } from '../components/ui/Icons';
import { TodayMenuGrid } from '../components/dashboard/TodayMenuGrid';
import { useShowCalories } from '../hooks/useShowCalories';
import { getNavAccent } from '../lib/section-accents';
import { sectionEmptyIconStyle } from '../components/ui/SectionEmptyState';
import { routes } from '../lib/routes';
import { todayIsoLocal } from '../lib/meal-plan-dates';
import type { MealPlanItem } from '../types';

const recipesApi = createRecipesApi(apiClient);
const mealPlanApi = createMealPlanApi(apiClient);

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const QUICK_LINKS: {
  to: string;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  hoverColor: string;
  Icon: ComponentType<IconProps>;
}[] = [
  {
    to: routes.recipes,
    label: 'Recetas',
    desc: 'Tu colección de platos',
    iconBg: 'var(--pastel-lavender)',
    iconColor: 'var(--pastel-lavender-icon)',
    hoverColor: 'var(--pastel-lavender-icon)',
    Icon: BookOpenIcon,
  },
  {
    to: routes.mealPlan,
    label: 'Plan semanal',
    desc: 'Organiza la semana',
    iconBg: 'var(--pastel-mint)',
    iconColor: 'var(--pastel-mint-icon)',
    hoverColor: 'var(--pastel-mint-icon)',
    Icon: CalendarIcon,
  },
  {
    to: routes.pantry,
    label: 'Despensa',
    desc: 'Qué tienes en casa',
    iconBg: 'var(--pastel-cyan)',
    iconColor: 'var(--pastel-cyan-icon)',
    hoverColor: 'var(--pastel-cyan-icon)',
    Icon: PantryIcon,
  },
  {
    to: routes.shoppingLists,
    label: 'Lista de compra',
    desc: 'Genera la compra',
    iconBg: 'var(--pastel-peach)',
    iconColor: 'var(--pastel-peach-icon)',
    hoverColor: 'var(--pastel-peach-icon)',
    Icon: ShoppingCartIcon,
  },
];

export function DashboardPage() {
  const showCalories = useShowCalories();
  const { user } = useAuthStore();
  const { household, refreshHousehold, reloadHousehold } = useHousehold();
  const householdId = useHouseholdId();
  const { profile, waterIntakeMl, checkDailyReset } = useHealthStore();
  const [showMembers, setShowMembers] = useState(false);
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealPlanItem[]>([]);
  const [dashError, setDashError] = useState(false);

  const today = new Date();
  const todayStr = todayIsoLocal();
  const dayName = DAY_NAMES[today.getDay()];
  const dateLabel = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${today.getDate()} de ${MONTH_NAMES[today.getMonth()]}`;
  const firstName = user?.name?.split(' ')[0] ?? user?.name ?? '';

  const profileComplete = profile.weight && profile.height && profile.age && profile.sex;
  const waterGoalL = profileComplete ? calculateWaterGoal(profile.weight!, profile.activityLevel) : null;
  const waterIntakeL = waterIntakeMl / 1000;
  const waterPercent = waterGoalL ? Math.min(100, Math.round((waterIntakeL / waterGoalL) * 100)) : 0;
  const bmr = profileComplete ? calculateBMR(profile.weight!, profile.height!, profile.age!, profile.sex!) : null;
  const tdee = bmr ? calculateTDEE(bmr, profile.activityLevel) : null;
  const goals = tdee && bmr ? calculateCalorieGoals(tdee, bmr, profile.sex!) : null;
  const memberCount = household?.members?.length ?? 0;

  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  useEffect(() => {
    if (!householdId) return;
    const controller = new AbortController();
    Promise.all([
      recipesApi.list(householdId, { limit: '1' }, controller.signal),
      mealPlanApi.getByDateRange(householdId, todayStr, todayStr, controller.signal),
    ])
      .then(([recipesRes, mealsRes]) => {
        setRecipeCount(recipesRes.total);
        setTodayMeals(mealsRes);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setDashError(true);
      });
    return () => controller.abort();
  }, [householdId, todayStr]);

  return (
    <div className="page-shell">
      <header className="dashboard-page-header w-full min-w-0">
        <div className="dashboard-page-header__row">
          <div className="dashboard-page-header__intro min-w-0">
            <h1 className="dashboard-page-header__title">
              Hola,{' '}
              <span className="text-[var(--accent-greeting)]">{firstName}</span>
            </h1>
            <p className="dashboard-page-header__meta">
              <span className="text-ink font-medium">{household?.name}</span>
              <span className="text-muted">{` · ${dateLabel}`}</span>
            </p>
          </div>
          <div className="dashboard-page-header__actions">
            <button
              type="button"
              onClick={() => setShowMembers(true)}
              className="dashboard-header-chip dashboard-header-chip--members"
            >
              <UsersIcon className="w-4 h-4 shrink-0 opacity-90" />
              <span className="whitespace-nowrap">Miembros</span>
              <span className="tabular-nums opacity-75 whitespace-nowrap">({memberCount})</span>
            </button>
            <Link to={routes.health} className="dashboard-header-chip dashboard-header-chip--health">
              <HealthIcon className="w-4 h-4 shrink-0 opacity-90" />
              <span className="whitespace-nowrap">Salud</span>
              <ChevronRightIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </Link>
          </div>
        </div>
      </header>

      {dashError && (
        <p className="text-sm text-[var(--error)] bg-[color-mix(in_oklab,var(--error)_10%,var(--surface))] rounded-[var(--radius-card)] px-4 py-3">
          No se pudo cargar el menú de hoy. Recarga la página.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="card card-hover p-4 flex flex-col gap-2 group"
            style={{ '--quick-hover': link.hoverColor } as CSSProperties}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: link.iconBg, color: link.iconColor }}
            >
              <link.Icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink transition-colors group-hover:text-[var(--quick-hover)]">
                {link.label}
              </p>
              <p className="text-xs text-muted mt-0.5">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        <Card className="today-menu-card lg:col-span-2 flex h-full flex-col p-4 sm:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3 sm:mb-5">
            <div>
              <h2 className="type-display-sm">Menú de hoy</h2>
            </div>
            <Link to={routes.mealPlan} className="btn-soft !text-xs !py-2">
              Ver plan
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {todayMeals.length === 0 ? (
            <div
              className="rounded-[var(--radius-card)] p-8 text-center flex flex-col items-center"
              style={{ background: `color-mix(in oklab, ${getNavAccent(routes.mealPlan).bg} 35%, var(--page-bg))` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 [&_svg]:w-6 [&_svg]:h-6"
                style={sectionEmptyIconStyle(getNavAccent(routes.mealPlan))}
                aria-hidden
              >
                <CalendarIcon />
              </div>
              <p className="text-sm text-muted mb-4">Planifica desayuno, comida o cena en el calendario semanal.</p>
              <Link to={routes.mealPlan} className="btn-primary">
                Ir al plan semanal
              </Link>
            </div>
          ) : (
            <div className="today-menu-fill">
              <TodayMenuGrid meals={todayMeals} />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Resumen</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="stat-pill p-3">
                <p className="text-2xl font-bold text-ink tabular-nums">{recipeCount ?? '—'}</p>
                <p className="text-xs text-muted mt-1">Recetas</p>
              </div>
              <div className="stat-pill p-3">
                <p className="text-2xl font-bold text-ink tabular-nums">{todayMeals.length}</p>
                <p className="text-xs text-muted mt-1">Hoy</p>
              </div>
            </div>
            <Link to={routes.recipes} className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline">
              Explorar recetas
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-bold text-ink">Salud diaria</h2>
              <Link to={routes.health} className="text-xs font-semibold text-[var(--brand)] hover:underline">
                Ver todo
              </Link>
            </div>

            <div className="space-y-3">
              <div className="dashboard-metric-panel dashboard-metric-panel--mint">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold inline-flex items-center gap-2" style={{ color: 'var(--success-text)' }}>
                    <span className="health-metric-icon" style={{ color: 'var(--success-text)' }} aria-hidden>
                      <WaterDropIcon className="w-4 h-4" />
                    </span>
                    Agua
                  </p>
                  {waterGoalL && (
                    <p className="text-xs opacity-70" style={{ color: 'var(--success-text)' }}>{waterPercent}%</p>
                  )}
                </div>
                {waterGoalL ? (
                  <>
                    <p className="mt-1 text-xl font-bold text-ink tabular-nums">
                      {waterIntakeL.toFixed(1)} <span className="text-sm font-medium text-muted">/ {waterGoalL} L</span>
                    </p>
                    <div className="mt-2 progress-track">
                      <div className="progress-fill health-water-progress-fill" style={{ width: `${waterPercent}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-muted">Completa tu perfil en Salud.</p>
                )}
              </div>

              {showCalories && (
                <div className="dashboard-metric-panel dashboard-metric-panel--peach">
                  <p className="text-xs font-semibold text-ink inline-flex items-center gap-2">
                    <span className="health-metric-icon" style={{ color: 'var(--pastel-peach-icon)' }} aria-hidden>
                      <FlameIcon className="w-4 h-4" />
                    </span>
                    Calorías
                  </p>
                  {goals ? (
                    <p className="mt-1 text-xl font-bold text-ink tabular-nums">
                      {goals.maintain.toLocaleString('es-ES')} <span className="text-sm font-medium text-muted">kcal</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Configura tu perfil para ver el objetivo.</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <MembersModal
        household={showMembers ? household : null}
        currentUserId={user?.id}
        onClose={() => setShowMembers(false)}
        onHouseholdUpdated={async () => { await refreshHousehold(); }}
        onHouseholdDeleted={reloadHousehold}
      />
    </div>
  );
}
