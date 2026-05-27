import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useHouseholdId, useHousehold } from '../hooks/useHousehold';
import { createShoppingListsApi } from '../api/shopping-lists';
import { apiClient } from '../api/client';
import { ShoppingCartIcon } from '../components/ui/Icons';
import { SectionEmptyState } from '../components/ui/SectionEmptyState';
import { ShoppingListCard } from '../components/shopping/ShoppingListCard';
import { SectionContextBar } from '../components/ui/SectionContextBar';
import type { SectionContextItem } from '../components/ui/SectionContextBar';
import { ShoppingListsSkeleton } from '../components/shopping/ShoppingListsSkeleton';
import { routes } from '../lib/routes';
import { getShoppingListsOverview } from '../lib/shopping-list-stats';
import { getNavAccent, getSectionBtnClass, getSectionStripeClass, sectionStripeStyle } from '../lib/section-accents';
import { PageHeader } from '../components/ui/PageHeader';
import type { ShoppingList, PantrySubtraction } from '../types';

const shoppingListsApi = createShoppingListsApi(apiClient);
const SHOPPING_ACCENT = getNavAccent(routes.shoppingLists);
const SHOPPING_BTN = getSectionBtnClass(routes.shoppingLists);
const SHOPPING_STRIPE = getSectionStripeClass(routes.shoppingLists);
const MEAL_PLAN_ACCENT = getNavAccent(routes.mealPlan);
const MEAL_PLAN_BTN = getSectionBtnClass(routes.mealPlan);

function listsWithAccentIndex(lists: ShoppingList[]) {
  const byAge = [...lists].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const indexById = new Map(byAge.map((list, index) => [list.id, index]));
  return [...lists]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((list) => ({
      list,
      accentIndex: indexById.get(list.id) ?? 0,
    }));
}

export function ShoppingListPage() {
  const householdId = useHouseholdId();
  const { canEdit } = useHousehold();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pantrySubtractions, setPantrySubtractions] = useState<PantrySubtraction[]>([]);

  const listsForGrid = useMemo(() => listsWithAccentIndex(lists), [lists]);
  const overview = useMemo(() => getShoppingListsOverview(lists), [lists]);

  const featuredEntry = listsForGrid.find(({ list }) => list.id === overview.activeListId);
  const otherEntries = listsForGrid.filter(({ list }) => list.id !== overview.activeListId);

  const shoppingContextLead = useMemo(() => {
    if (lists.length === 0) return undefined;
    if (overview.pendingItems > 0) {
      return `${overview.pendingItems} artículo${overview.pendingItems === 1 ? '' : 's'} pendiente${overview.pendingItems === 1 ? '' : 's'} de comprar.`;
    }
    return 'Todas tus listas están completadas.';
  }, [lists.length, overview.pendingItems]);

  const shoppingContextItems = useMemo((): SectionContextItem[] => {
    const items: SectionContextItem[] = [];
    if (overview.activeListId && overview.pendingItems > 0) {
      items.push({
        id: 'active-list',
        label: 'Continuar compra',
        href: routes.shoppingList(overview.activeListId),
        emphasis: true,
      });
    }
    return items;
  }, [overview.activeListId, overview.pendingItems]);

  useEffect(() => {
    if (!householdId) return;
    shoppingListsApi
      .list(householdId)
      .then(setLists)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [householdId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !name.trim() || !startDate || !endDate) return;
    setIsGenerating(true);
    try {
      const result = await shoppingListsApi.generate(householdId, {
        name: name.trim(),
        startDate,
        endDate,
      });
      if (result.pantrySubtractions?.length > 0) {
        setPantrySubtractions(result.pantrySubtractions);
      }
      const updated = await shoppingListsApi.list(householdId);
      setLists(updated);
      setShowForm(false);
      setName('');
      setStartDate('');
      setEndDate('');
    } catch {
      // handle error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setName('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="shopping-page page-shell space-y-5 md:space-y-6">
      <PageHeader
        title="Lista de compra"
        description={
          !isLoading && lists.length > 0 && shoppingContextItems.length === 0
            ? shoppingContextLead
            : undefined
        }
        actions={
          canEdit && !showForm ? (
            <button type="button" onClick={() => setShowForm(true)} className={SHOPPING_BTN}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                  clipRule="evenodd"
                />
              </svg>
              Nueva lista
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <div className="card overflow-hidden">
          <div className={SHOPPING_STRIPE} style={sectionStripeStyle(routes.shoppingLists)} />
          <form onSubmit={handleGenerate} className="p-5 space-y-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">
              Generar nueva lista
            </p>
            <div>
              <label htmlFor="listName" className="block text-xs font-medium text-muted mb-1.5">
                Nombre
              </label>
              <input
                id="listName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Semana del 24 feb"
                required
                autoFocus
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-muted mb-1.5">
                  Desde
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-muted mb-1.5">
                  Hasta
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleCancel} className="flex-1 btn-neutral">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGenerating || !name.trim() || !startDate || !endDate}
                className={`flex-1 ${SHOPPING_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGenerating ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pantrySubtractions.length > 0 && (
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            background: 'color-mix(in oklab, var(--pastel-peach) 35%, var(--surface))',
            borderColor: 'color-mix(in oklab, var(--pastel-peach) 65%, var(--border-subtle))',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Descontado de la despensa</p>
              <p className="text-xs text-muted mt-0.5">
                {pantrySubtractions.map((s) => `${s.quantity}${s.unit} ${s.name}`).join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPantrySubtractions([])}
              className="text-muted hover:text-ink cursor-pointer transition-colors min-h-9 min-w-9"
              aria-label="Cerrar aviso"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <ShoppingListsSkeleton />
      ) : loadError ? (
        <p className="text-sm text-[var(--error)] bg-[color-mix(in_oklab,var(--error)_10%,var(--surface))] rounded-[var(--radius-card)] px-4 py-3">
          No se pudieron cargar las listas. Recarga la página.
        </p>
      ) : lists.length === 0 && !showForm ? (
        <SectionEmptyState
          sectionPath={routes.shoppingLists}
          icon={<ShoppingCartIcon />}
          title="Sin listas todavía"
          description="Genera una lista a partir de tu plan semanal"
        />
      ) : (
        <>
          {shoppingContextItems.length > 0 ? (
            <SectionContextBar
              lead={shoppingContextLead}
              items={shoppingContextItems}
              accentText={SHOPPING_ACCENT.text}
              accentBg={SHOPPING_ACCENT.bg}
            />
          ) : null}

          <div className="shopping-lists-layout">
            {featuredEntry && (
              <ShoppingListCard
                list={featuredEntry.list}
                accentIndex={featuredEntry.accentIndex}
                featured
              />
            )}
            {otherEntries.map(({ list, accentIndex }) => (
              <ShoppingListCard key={list.id} list={list} accentIndex={accentIndex} />
            ))}
          </div>

          {canEdit && (
            <section
              className="section-footer-hint"
              style={
                {
                  '--section-accent': MEAL_PLAN_ACCENT.text,
                  '--section-accent-bg': MEAL_PLAN_ACCENT.bg,
                } as CSSProperties
              }
            >
              <p className="section-footer-hint__copy">
                ¿Nueva semana? Genera otra lista cuando actualices el plan.
              </p>
              <Link to={routes.mealPlan} className={`${MEAL_PLAN_BTN} shrink-0`}>
                Ver plan semanal
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path
                    fillRule="evenodd"
                    d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
