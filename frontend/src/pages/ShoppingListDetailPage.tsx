import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createShoppingListsApi } from '../api/shopping-lists';
import { createPantryApi } from '../api/pantry';
import { createStorageLocationsApi } from '../api/storage-locations';
import { apiClient } from '../api/client';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { routes } from '../lib/routes';
import { getListAccent, listAccentCssVars } from '../lib/list-accents';
import { getNavAccent, getSectionBtnClass } from '../lib/section-accents';
import { groupShoppingItems } from '../utils/shopping';
import { ShoppingListDetailHeader } from '../components/shopping/ShoppingListDetailHeader';
import { ShoppingListItemsPanel } from '../components/shopping/ShoppingListItemsPanel';
import type { GroupedItem } from '../utils/shopping';
import type { ShoppingList, StorageLocation, PantryItem, PantryAdditionResult } from '../types';
import { formatQty } from '../utils/shopping';

const SHOPPING_ACCENT = getNavAccent(routes.shoppingLists);
const SHOPPING_BTN = getSectionBtnClass(routes.shoppingLists);

const shoppingListsApi = createShoppingListsApi(apiClient);
const pantryApi = createPantryApi(apiClient);
const locationsApi = createStorageLocationsApi(apiClient);

export function ShoppingListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const householdId = useHouseholdId();
  const navigate = useNavigate();
  const { canEdit } = useHousehold();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pantryFeedback, setPantryFeedback] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleNameChange = (value: string) => {
    setNewItemName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!householdId || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await pantryApi.ingredientNames(householdId, value.trim());
        setSuggestions(results.map((item) => item.name));
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
  };

  const selectSuggestion = (name: string) => {
    setNewItemName(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!householdId || !listId) return;
    Promise.all([
      shoppingListsApi.getById(householdId, listId),
      locationsApi.list(householdId),
      pantryApi.list(householdId),
    ])
      .then(([data, locs, pantry]) => {
        setList(data);
        setStorageLocations(locs);
        setPantryItems(pantry);
        if (data.shareToken) setShareUrl(`${window.location.origin}/shared/${data.shareToken}`);
      })
      .catch(() => navigate(routes.shoppingLists))
      .finally(() => setIsLoading(false));
  }, [householdId, listId, navigate]);

  const reload = async () => {
    if (!householdId || !listId) return;
    setList(await shoppingListsApi.getById(householdId, listId));
  };

  const handleToggleGroup = async (group: GroupedItem) => {
    if (!householdId || !listId || !list) return;
    const current = list.items.filter((i) => group.allIds.includes(i.id));
    const toToggle = group.allChecked ? current : current.filter((i) => !i.checked);
    await Promise.all(toToggle.map((i) => shoppingListsApi.toggleItem(householdId, listId, i.id)));
    await reload();
  };

  const formatPantryFeedback = (added: PantryAdditionResult | null, needed: number | null, unit: string | null) => {
    if (added) {
      const where = storageLocations.find((l) => l.id === added.locationId)?.name;
      const place = where ? ` en ${where}` : ' en la despensa';
      return `+${formatQty(added.quantity)} ${added.unit} de ${added.name}${place}.`;
    }
    if (needed != null && unit) {
      return `Marcado como comprado. Compraste justo lo necesario (${formatQty(needed)} ${unit}); no hay sobrante para la despensa.`;
    }
    return 'Marcado como comprado.';
  };

  const handleCheckWithQuantity = async (group: GroupedItem, purchasedQuantity: number, locationId?: string) => {
    if (!householdId || !listId || !list) return null;
    const uncheckedIds = list.items
      .filter((i) => group.allIds.includes(i.id) && !i.checked)
      .map((i) => i.id);
    if (uncheckedIds.length === 0) return null;
    const result = await shoppingListsApi.checkGroupedItems(householdId, listId, {
      itemIds: uncheckedIds,
      purchasedQuantity,
      locationId,
    });
    await reload();
    const pantry = await pantryApi.list(householdId);
    setPantryItems(pantry);
    setPantryFeedback(formatPantryFeedback(result.pantryAdded, group.neededQuantity, group.purchaseUnit));
    return result.pantryAdded;
  };

  const handleDeleteGroup = async (group: GroupedItem) => {
    if (!householdId || !listId) return;
    await Promise.all(group.allIds.map((id) => shoppingListsApi.deleteItem(householdId, listId, id)));
    await reload();
  };

  const handleClearDone = async () => {
    if (!householdId || !listId || !list) return;
    const doneIds = list.items.filter((i) => i.checked).map((i) => i.id);
    await Promise.all(doneIds.map((id) => shoppingListsApi.deleteItem(householdId, listId, id)));
    await reload();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !listId || !newItemName.trim()) return;
    await shoppingListsApi.addManualItem(householdId, listId, {
      name: newItemName.trim(),
      quantity: newItemQty ? parseFloat(newItemQty) : undefined,
      unit: newItemUnit.trim() || undefined,
    });
    await reload();
    setNewItemName('');
    setNewItemQty('');
    setNewItemUnit('');
    setShowAddForm(false);
  };

  const handleDeleteList = async () => {
    if (!householdId || !listId || !window.confirm('¿Eliminar esta lista?')) return;
    await shoppingListsApi.deleteList(householdId, listId);
    navigate(routes.shoppingLists);
  };

  const handleShare = async () => {
    if (!householdId || !listId) return;
    setIsSharing(true);
    try {
      const { shareToken } = await shoppingListsApi.createShareToken(householdId, listId);
      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (!householdId || !listId) return;
    await shoppingListsApi.removeShareToken(householdId, listId);
    setShareUrl('');
  };

  if (isLoading) {
    return (
      <div className="shopping-detail flex items-center justify-center min-h-[12rem]">
        <div
          className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: SHOPPING_ACCENT.bg, borderTopColor: SHOPPING_ACCENT.text }}
        />
      </div>
    );
  }

  if (!list) return null;

  const listAccent = getListAccent(list.accentKey);
  const grouped = groupShoppingItems(list.items);
  const doneCount = grouped.filter((g) => g.allChecked).length;
  const progress = grouped.length > 0 ? Math.round((doneCount / grouped.length) * 100) : 0;
  const isComplete = grouped.length > 0 && progress === 100;

  return (
    <div className="shopping-detail space-y-4" style={listAccentCssVars(listAccent)}>
      <ShoppingListDetailHeader
        list={list}
        accent={listAccent}
        progress={progress}
        doneCount={doneCount}
        totalCount={grouped.length}
        isComplete={isComplete}
        shareUrl={shareUrl}
        isSharing={isSharing}
        canEdit={canEdit}
        onShare={handleShare}
        onStopSharing={handleStopSharing}
        onDeleteList={handleDeleteList}
      />

      {pantryFeedback && (
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
            <p>{pantryFeedback}</p>
            <button
              type="button"
              onClick={() => setPantryFeedback(null)}
              className="shrink-0 text-muted hover:text-ink"
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <ShoppingListItemsPanel
        grouped={grouped}
        accent={listAccent}
        canEdit={canEdit}
        onToggle={handleToggleGroup}
        onDelete={handleDeleteGroup}
        onCheckWithQuantity={handleCheckWithQuantity}
        onClearDone={handleClearDone}
        locations={storageLocations}
        pantryItems={pantryItems}
      />

      {canEdit && (
        <div className={`shopping-add-card ${showAddForm ? 'border-solid' : ''}`}>
          {!showAddForm ? (
            <button type="button" onClick={() => setShowAddForm(true)} className="shopping-add-trigger">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] text-muted text-base leading-none">
                +
              </span>
              Añadir artículo
            </button>
          ) : (
            <form onSubmit={handleAddItem} className="p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Nuevo artículo</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nombre del artículo"
                  value={newItemName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoFocus
                  autoComplete="off"
                  className="input"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="dropdown-panel max-h-48"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-[color-mix(in_oklab,var(--list-accent-bg,var(--pastel-peach))_45%,var(--surface))] hover:text-[var(--list-accent-text,var(--pastel-peach-icon))] cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl"
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
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  className="flex-1 input"
                />
                <input
                  type="text"
                  placeholder="Unidad"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="flex-1 input"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItemName('');
                    setNewItemQty('');
                    setNewItemUnit('');
                  }}
                  className="flex-1 btn-neutral"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newItemName.trim()}
                  className={`flex-1 ${SHOPPING_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Añadir
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
