import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { createPantryApi } from '../api/pantry';
import { createStorageLocationsApi } from '../api/storage-locations';
import { apiClient } from '../api/client';
import { PantryLocationsBoard } from '../components/pantry/PantryLocationsBoard';
import { PantryLocationHead } from '../components/pantry/PantryLocationHead';
import { PantryItemGrid } from '../components/pantry/PantryItemGrid';
import { groupPantryByLocation } from '../utils/pantry-groups';
import { PantryIcon } from '../components/ui/Icons';
import { SectionEmptyState } from '../components/ui/SectionEmptyState';
import { routes } from '../lib/routes';
import { renderStorageLocationIcon } from '../lib/storage-location-icons';
import { getNavAccent, getSectionBtnClass, getSectionStripeClass, sectionStripeStyle } from '../lib/section-accents';
import { PageHeader } from '../components/ui/PageHeader';
import { PantryToolbar } from '../components/pantry/PantryToolbar';
import {
  filterPantryGroupsBySearch,
  findPantrySearchMatches,
  type PantrySearchMatch,
} from '../lib/pantry-search';
import { settingsPantryLocationsPath } from '../lib/settings-sections';
import { APP_PALETTE } from '../lib/app-palette';
import { sectionAccentCssVarsFromHex } from '../lib/section-accent-css';
import { accentChipStyle, resolveLocationColor } from '../utils/color-styles';

/** Sin ubicación: distinto del azul de sección pero no el color de otra ubicación. */
const UNASSIGNED_LOCATION_HEX = APP_PALETTE.pastelPeachIcon;
import type { PantryItem, StorageLocation } from '../types';

const PANTRY_ACCENT = getNavAccent(routes.pantry);
const PANTRY_BTN = getSectionBtnClass(routes.pantry);
const PANTRY_STRIPE = getSectionStripeClass(routes.pantry);
const pantryApi = createPantryApi(apiClient);
const locationsApi = createStorageLocationsApi(apiClient);

export function PantryPage() {
  const householdId = useHouseholdId();
  const { canEdit } = useHousehold();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [locationId, setLocationId] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const unassignedSectionRef = useRef<HTMLDivElement>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!householdId || value.trim().length < 2) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      return;
    }
    nameDebounceRef.current = setTimeout(async () => {
      try {
        const results = await pantryApi.ingredientNames(householdId, value.trim());
        setNameSuggestions(results.map((item) => item.name));
        setShowNameSuggestions(results.length > 0);
      } catch {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
      }
    }, 250);
  };

  const selectNameSuggestion = (selected: string) => {
    setName(selected);
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  useEffect(() => {
    if (!householdId) return;
    setLoadError(null);
    Promise.all([
      pantryApi.list(householdId),
      locationsApi.list(householdId),
    ])
      .then(([pantryItems, locs]) => {
        setItems(pantryItems);
        setLocations(locs);
      })
      .catch((err: unknown) => {
        setItems([]);
        setLocations([]);
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la despensa. Comprueba que el backend está en marcha.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [householdId]);

  const reload = async () => {
    if (!householdId) return;
    const [pantryItems, locs] = await Promise.all([
      pantryApi.list(householdId),
      locationsApi.list(householdId),
    ]);
    setItems(pantryItems);
    setLocations(locs);
  };

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('');
    setLocationId('');
    setShowForm(false);
    setEditingId(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !name.trim() || !quantity || !unit.trim()) return;

    setSubmitError(null);
    setSaveNotice(null);
    setIsSubmitting(true);
    try {
      const trimmedName = name.trim();
      const trimmedUnit = unit.trim();
      const qty = Number.parseFloat(quantity);
      const loc = locations.find((l) => l.id === locationId);

      if (editingId) {
        await pantryApi.update(householdId, editingId, {
          name: trimmedName,
          quantity: qty,
          unit: trimmedUnit,
          locationId: locationId || null,
        });
        await reload();
        resetForm();
        setSaveNotice(`${trimmedName} actualizado.`);
      } else {
        await pantryApi.add(householdId, {
          name: trimmedName,
          quantity: qty,
          unit: trimmedUnit,
          ...(locationId ? { locationId } : {}),
        });
        await reload();
        resetForm();
        setSaveNotice(
          loc
            ? `${trimmedName} añadido a ${loc.name}.`
            : `${trimmedName} añadido a la despensa.`,
        );
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el ingrediente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setLocationId(item.locationId || '');
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!householdId) return;
    await pantryApi.delete(householdId, itemId);
    await reload();
  };

  const groups = groupPantryByLocation(items, locations);
  const hasLocations = locations.length > 0;
  const unassignedCount = groups.find((g) => g.location === null)?.items.length ?? 0;
  const searchMatches = useMemo(
    () => findPantrySearchMatches(items, locations, searchQuery),
    [items, locations, searchQuery],
  );
  const displayGroups = useMemo(
    () => filterPantryGroupsBySearch(groups, searchQuery),
    [groups, searchQuery],
  );
  const hasSearch = searchQuery.trim().length > 0;
  const showPantryChrome = !loadError && !isLoading;

  const scrollToPantryItem = useCallback((match: PantrySearchMatch) => {
    const el = document.getElementById(`pantry-item-${match.item.id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('pantry-item--found');
    window.setTimeout(() => el.classList.remove('pantry-item--found'), 2200);
  }, []);

  const scrollToUnassigned = useCallback(() => {
    unassignedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const searchHint =
    items.length > 0 || hasLocations
      ? 'Busca un ingrediente para ver en qué ubicación está.'
      : undefined;

  return (
    <div className="pantry-page page-shell space-y-5 md:space-y-6">
      <PageHeader
        title="Despensa"
        actions={canEdit && !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className={PANTRY_BTN}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
            </svg>
            Añadir
          </button>
        ) : undefined}
      />

      {saveNotice && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          role="status"
          style={{
            background: 'color-mix(in oklab, var(--pastel-mint) 30%, var(--surface))',
            borderColor: 'color-mix(in oklab, var(--pastel-mint) 55%, var(--border-subtle))',
            color: 'var(--pastel-mint-icon)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{saveNotice}</p>
            <button
              type="button"
              onClick={() => setSaveNotice(null)}
              className="shrink-0 text-muted hover:text-ink"
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showPantryChrome ? (
        <>
          {(items.length > 0 || hasLocations) && (
            <PantryToolbar
              hint={searchHint}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              matches={searchMatches}
              showManageLocations={canEdit}
              onSelectMatch={scrollToPantryItem}
              unassignedAction={
                unassignedCount > 0
                  ? { count: unassignedCount, onClick: scrollToUnassigned }
                  : undefined
              }
            />
          )}
          {items.length === 0 && !hasLocations && canEdit ? (
            <p className="text-sm text-muted">
              <Link
                to={settingsPantryLocationsPath()}
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: PANTRY_ACCENT.text }}
              >
                Crea ubicaciones
              </Link>{' '}
              para agrupar ingredientes por nevera, congelador o despensa.
            </p>
          ) : null}
        </>
      ) : null}

      {showForm && (
        <div className="card overflow-hidden">
          <div className={PANTRY_STRIPE} style={sectionStripeStyle(routes.pantry)} />
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {editingId ? 'Editar ingrediente' : 'Nuevo ingrediente'}
            </p>
            {submitError && (
              <p className="text-sm text-danger" role="alert">
                {submitError}
              </p>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre (ej: Pasta)"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                autoFocus
                autoComplete="off"
                className="input"
              />
              {showNameSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
                  {nameSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={() => selectNameSuggestion(s)}
                      className="w-full cursor-pointer px-3 py-2 text-left text-sm text-ink transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-[color-mix(in_oklab,var(--pastel-cyan)_45%,var(--surface))] hover:text-[var(--pastel-cyan-icon)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Cantidad"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 input"
              />
              <input
                type="text"
                placeholder="Unidad (ej: g, kg, ml)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex-1 input"
              />
            </div>
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLocationId('')}
                  className={`${!locationId ? 'chip-on' : 'chip-off'} !text-xs !px-3 !py-1.5`}
                >
                  Sin ubicación
                </button>
                {locations.map((loc) => {
                  const selected = locationId === loc.id;
                  const locColor = resolveLocationColor(loc.icon, loc.color);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocationId(loc.id)}
                      className={`chip !text-xs !px-3 !py-1.5 border ${selected ? '' : 'chip-off'}`}
                      style={accentChipStyle(locColor, selected)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span style={selected ? { color: locColor } : undefined}>
                          {renderStorageLocationIcon(loc.icon, 'w-4 h-4')}
                        </span>
                        <span>{loc.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 btn-neutral"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !quantity || !unit.trim()}
                className={`flex-1 ${PANTRY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Guardando…' : editingId ? 'Guardar' : 'Añadir'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loadError ? (
        <div className="card p-5 border-[color-mix(in_oklab,var(--danger)_35%,var(--border-subtle))] bg-[color-mix(in_oklab,var(--pastel-coral)_25%,var(--surface))]">
          <p className="text-sm font-semibold text-ink">No se pudo conectar con la despensa</p>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
          <p className="mt-2 text-xs text-muted">
            Si usas Docker: reinicia el backend tras actualizar la base (<code className="text-xs">pnpm db:push</code>{' '}
            y <code className="text-xs">pnpm db:seed</code> en backend).
          </p>
        </div>
      ) : isLoading ? (
        <div className="pantry-loading" aria-busy="true" aria-label="Cargando despensa">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2"
            style={{ borderColor: PANTRY_ACCENT.bg, borderTopColor: PANTRY_ACCENT.text }}
          />
        </div>
      ) : items.length === 0 && !hasLocations ? (
        <SectionEmptyState
          sectionPath={routes.pantry}
          icon={<PantryIcon />}
          title="Tu despensa está vacía"
          description="Añade ingredientes que tengas en casa"
        />
      ) : hasSearch && displayGroups.length === 0 ? (
        <p className="text-sm text-muted px-1">
          Ningún ingrediente coincide con «{searchQuery.trim()}» en el tablero.
        </p>
      ) : hasLocations ? (
        householdId ? (
          <PantryLocationsBoard
            householdId={householdId}
            groups={displayGroups}
            canEdit={canEdit}
            unassignedAccentHex={UNASSIGNED_LOCATION_HEX}
            unassignedSectionRef={unassignedSectionRef}
            onLocationsChange={setLocations}
            onEditItem={handleEdit}
            onDeleteItem={handleDelete}
          />
        ) : null
      ) : (
        <section
          className="accent-panel card overflow-hidden"
          style={sectionAccentCssVarsFromHex(APP_PALETTE.pastelCyanIcon)}
          aria-label="Sin ubicación"
        >
          <PantryLocationHead label="Todos los ingredientes" count={items.length} />
          <PantryItemGrid
            items={hasSearch ? displayGroups[0]?.items ?? [] : items}
            canEdit={canEdit}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      )}
    </div>
  );
}
