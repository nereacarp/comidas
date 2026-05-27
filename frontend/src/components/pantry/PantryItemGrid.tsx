import type { PantryItem } from '../../types';
import { formatPantryQuantity } from '../../lib/ingredient-display';

interface PantryItemGridProps {
  items: PantryItem[];
  canEdit: boolean;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
}

export function PantryItemGrid({
  items,
  canEdit,
  onEdit,
  onDelete,
}: Readonly<PantryItemGridProps>) {
  return (
    <ul className="pantry-item-list">
      {items.map((item) => {
        const qtyLabel = formatPantryQuantity(item.quantity, item.unit);

        return (
          <li key={item.id} id={`pantry-item-${item.id}`} className="pantry-item">
            <p className="pantry-item__name">{item.name}</p>
            <div className="pantry-item__footer">
              {qtyLabel ? <span className="accent-pill">{qtyLabel}</span> : <span />}
              {canEdit && (
                <div className="pantry-item__actions">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="pantry-item__action"
                    aria-label={`Editar ${item.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden
                    >
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.05 10.476a.75.75 0 0 0-.198.34l-.823 3.294a.75.75 0 0 0 .914.914l3.294-.823a.75.75 0 0 0 .34-.198l7.963-7.963a1.75 1.75 0 0 0 0-2.475l-.052-.052Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="pantry-item__action pantry-item__action--danger"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <span aria-hidden>×</span>
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
