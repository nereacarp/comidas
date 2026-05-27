import { useState } from 'react';
import { CheckIcon } from './ui/Icons';
import { formatQty, type GroupedItem } from '../utils/shopping';
import { computePantrySurplus } from '../utils/pantry-surplus';
import type { PantryAdditionResult } from '../types';
import type { StorageLocation, PantryItem } from '../types';
import { renderStorageLocationIcon } from '../lib/storage-location-icons';
import { routes } from '../lib/routes';
import { getSectionBtnClass } from '../lib/section-accents';
import { accentChipStyle, resolveLocationColor } from '../utils/color-styles';

const SHOPPING_BTN = getSectionBtnClass(routes.shoppingLists);

interface ShoppingItemRowProps {
  group: GroupedItem;
  checked: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCheckWithQuantity?: (purchasedQuantity: number, locationId?: string) => Promise<PantryAdditionResult | null>;
  locations: StorageLocation[];
  pantryItems: PantryItem[];
}

export function ShoppingItemRow({
  group,
  checked,
  canEdit,
  onToggle,
  onDelete,
  onCheckWithQuantity,
  locations,
  pantryItems,
}: Readonly<ShoppingItemRowProps>) {
  const [showPurchaseInput, setShowPurchaseInput] = useState(false);
  const [purchasedQty, setPurchasedQty] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const showPurchaseFlow = group.supportsPurchaseFlow && canEdit && Boolean(onCheckWithQuantity);

  const purchasedNumber = Number.parseFloat(purchasedQty);
  const previewSurplus =
    group.neededQuantity != null && Number.isFinite(purchasedNumber)
      ? computePantrySurplus(purchasedNumber, group.neededQuantity)
      : 0;

  const handleToggle = () => {
    if (!checked && showPurchaseFlow) {
      setShowPurchaseInput(true);
      setConfirmError('');
      setPurchasedQty('');
      const existing = pantryItems.find(
        (p) => p.name.toLowerCase() === group.name.toLowerCase() && p.locationId,
      );
      setSelectedLocationId(existing?.locationId || '');
      return;
    }
    onToggle();
  };

  const handleConfirm = async () => {
    const qty = Number.parseFloat(purchasedQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setConfirmError('Indica cuánto has comprado.');
      return;
    }
    if (!onCheckWithQuantity) return;

    setIsConfirming(true);
    setConfirmError('');
    try {
      await onCheckWithQuantity(qty, selectedLocationId || undefined);
      setShowPurchaseInput(false);
      setPurchasedQty('');
      setSelectedLocationId('');
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSkip = () => {
    setShowPurchaseInput(false);
    setPurchasedQty('');
    setSelectedLocationId('');
    setConfirmError('');
    onToggle();
  };

  let checkClass = 'shopping-item__check';
  if (checked) {
    checkClass += ' shopping-item__check--on';
  } else if (group.partiallyChecked) {
    checkClass += ' shopping-item__check--partial';
  }

  return (
    <li className={`shopping-item ${checked ? 'shopping-item--done' : ''}`}>
      <div className="shopping-item__row group">
        <button
          type="button"
          onClick={handleToggle}
          className={checkClass}
          aria-label={checked ? `Desmarcar ${group.name}` : `Marcar ${group.name}`}
        >
          {checked && <CheckIcon className="h-2.5 w-2.5 text-white" />}
          {!checked && group.partiallyChecked && <span className="shopping-item__check-partial" aria-hidden />}
        </button>

        <button type="button" className="shopping-item__main" onClick={handleToggle}>
          <p className="shopping-item__name">{group.name}</p>
          {group.sourceRecipes.length > 0 && (
            <p className="shopping-item__recipes">
              {group.sourceRecipes.map((r) => r.title).join(' · ')}
            </p>
          )}
        </button>

        <div className="shopping-item__meta">
          {group.quantities && (
            <span className="shopping-item__qty">{group.quantities}</span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="shopping-item__delete"
              aria-label={`Eliminar ${group.name}`}
            >
              <span aria-hidden>×</span>
            </button>
          )}
        </div>
      </div>

      {showPurchaseInput && (
        <div className="shopping-item__purchase">
          {group.neededQuantity != null && group.purchaseUnit && (
            <p className="text-xs text-muted">
              Necesitas {formatQty(group.neededQuantity)} {group.purchaseUnit} para el plan. Escribe cuánto has
              comprado en total; solo el sobrante se guardará en la despensa.
            </p>
          )}
          {previewSurplus > 0 && group.purchaseUnit && (
            <p className="text-xs font-medium text-ink">
              Sobrante para despensa: {formatQty(previewSurplus)} {group.purchaseUnit}
            </p>
          )}
          {confirmError && (
            <p className="text-xs text-danger" role="alert">
              {confirmError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted shrink-0">Comprado</span>
            <input
              type="number"
              step="any"
              min="0"
              value={purchasedQty}
              onChange={(e) => setPurchasedQty(e.target.value)}
              placeholder={
                group.neededQuantity != null ? `ej. ${formatQty(group.neededQuantity)}` : 'Cantidad'
              }
              autoFocus
              className="input !w-24 !px-2 !py-1.5 !text-sm"
              aria-label="Cantidad comprada"
            />
            {group.purchaseUnit && (
              <span className="text-xs text-muted shrink-0">{group.purchaseUnit}</span>
            )}
          </div>
          {locations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted shrink-0">Guardar en</span>
              {locations.map((loc) => {
                const selected = selectedLocationId === loc.id;
                const locColor = resolveLocationColor(loc.icon, loc.color);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocationId(selected ? '' : loc.id)}
                    className={`chip !text-[11px] !py-1 !px-2 border ${selected ? '' : 'chip-off'}`}
                    style={accentChipStyle(locColor, selected)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <span className="shrink-0" style={selected ? { color: locColor } : undefined} aria-hidden>
                        {renderStorageLocationIcon(loc.icon || 'mapPin', 'w-3.5 h-3.5')}
                      </span>
                      {loc.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSkip} className="btn-ghost !px-2 !py-1.5 !text-xs">
              Saltar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming || !purchasedQty || Number.parseFloat(purchasedQty) <= 0}
              className={`${SHOPPING_BTN} !px-3 !py-1.5 !text-xs disabled:opacity-50`}
            >
              {isConfirming ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
