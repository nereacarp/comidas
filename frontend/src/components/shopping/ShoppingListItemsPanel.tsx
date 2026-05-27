import type { ReactNode } from 'react';
import { ShoppingItemRow } from '../ShoppingItemRow';
import { ShoppingCartIcon } from '../ui/Icons';
import { SectionEmptyState } from '../ui/SectionEmptyState';
import { routes } from '../../lib/routes';
import type { ListAccentStyle } from '../../lib/list-accents';
import { listAccentCssVars } from '../../lib/list-accents';
import type { GroupedItem } from '../../utils/shopping';
import type { PantryAdditionResult, PantryItem, StorageLocation } from '../../types';

function sortByName(a: GroupedItem, b: GroupedItem): number {
  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
}

interface ShoppingListItemsPanelProps {
  grouped: GroupedItem[];
  accent: ListAccentStyle;
  canEdit: boolean;
  emptyDescription?: string;
  onToggle: (group: GroupedItem) => void;
  onDelete: (group: GroupedItem) => void;
  onCheckWithQuantity?: (
    group: GroupedItem,
    qty: number,
    locationId?: string,
  ) => Promise<PantryAdditionResult | null>;
  onClearDone?: () => void;
  locations: StorageLocation[];
  pantryItems: PantryItem[];
}

interface ItemsColumnProps {
  title: string;
  count: number;
  variant: 'pending' | 'done';
  emptyLabel: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

function ItemsColumn({ title, count, variant, emptyLabel, headerAction, children }: Readonly<ItemsColumnProps>) {
  const hasItems = count > 0;
  return (
    <section
      className={`shopping-items-column shopping-items-column--${variant}`}
      aria-label={title}
    >
      <div
        className={`accent-section-head shopping-items-section__head shopping-items-section__head--${variant} ${
          variant === 'pending' ? 'accent-section-head--emphasis' : 'accent-section-head--muted'
        }`}
      >
        <div className="accent-section-head__main shopping-items-section__head-main">
          <span className="accent-section-label shopping-items-section__label">{title}</span>
          <span className="accent-section-count shopping-items-section__count">{count}</span>
        </div>
        {headerAction}
      </div>
      {hasItems ? (
        <ul className="shopping-items-list">{children}</ul>
      ) : (
        <p className="shopping-items-column__empty">{emptyLabel}</p>
      )}
    </section>
  );
}

export function ShoppingListItemsPanel({
  grouped,
  accent,
  canEdit,
  emptyDescription = 'Añade artículos manualmente o genera una lista desde el plan semanal',
  onToggle,
  onDelete,
  onCheckWithQuantity,
  onClearDone,
  locations,
  pantryItems,
}: Readonly<ShoppingListItemsPanelProps>) {
  const pending = grouped.filter((g) => !g.allChecked).sort(sortByName);
  const done = grouped.filter((g) => g.allChecked).sort(sortByName);

  if (grouped.length === 0) {
    return (
      <div className="shopping-items-panel card" style={listAccentCssVars(accent)}>
        <SectionEmptyState
          sectionPath={routes.shoppingLists}
          icon={<ShoppingCartIcon />}
          title="Sin artículos en esta lista"
          description={emptyDescription}
          variant="inline"
          size="sm"
        />
      </div>
    );
  }

  const clearAction =
    canEdit && onClearDone && done.length > 0 ? (
      <button type="button" onClick={onClearDone} className="shopping-items-section__action">
        Vaciar
      </button>
    ) : undefined;

  return (
    <div className="shopping-items-panel card overflow-hidden" style={listAccentCssVars(accent)}>
      <div className="shopping-items-columns">
        <ItemsColumn
          title="Por comprar"
          count={pending.length}
          variant="pending"
          emptyLabel="Todo comprado"
          headerAction={undefined}
        >
          {pending.map((group) => (
            <ShoppingItemRow
              key={group.key}
              group={group}
              checked={false}
              canEdit={canEdit}
              onToggle={() => onToggle(group)}
              onDelete={() => onDelete(group)}
              onCheckWithQuantity={
                onCheckWithQuantity
                  ? (qty, locId) => onCheckWithQuantity(group, qty, locId)
                  : undefined
              }
              locations={locations}
              pantryItems={pantryItems}
            />
          ))}
        </ItemsColumn>

        <ItemsColumn
          title="Completado"
          count={done.length}
          variant="done"
          emptyLabel="Nada marcado aún"
          headerAction={clearAction}
        >
          {done.map((group) => (
            <ShoppingItemRow
              key={group.key}
              group={group}
              checked
              canEdit={canEdit}
              onToggle={() => onToggle(group)}
              onDelete={() => onDelete(group)}
              locations={locations}
              pantryItems={pantryItems}
            />
          ))}
        </ItemsColumn>
      </div>
    </div>
  );
}
