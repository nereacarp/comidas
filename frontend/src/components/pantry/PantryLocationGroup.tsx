import { sectionAccentCssVarsFromHex } from '../../lib/section-accent-css';
import type { PantryItem, StorageLocation } from '../../types';
import { PantryItemGrid } from './PantryItemGrid';
import { PantryLocationHead } from './PantryLocationHead';

interface PantryLocationGroupProps {
  location: StorageLocation | null;
  items: PantryItem[];
  accentColor: string;
  canEdit: boolean;
  canDrag?: boolean;
  onDragHandleStart?: () => void;
  onDragHandleEnd?: () => void;
  onEdit: (item: PantryItem) => void;
  onDelete: (itemId: string) => void;
}

export function PantryLocationGroup({
  location,
  items,
  accentColor,
  canEdit,
  canDrag = false,
  onDragHandleStart,
  onDragHandleEnd,
  onEdit,
  onDelete,
}: Readonly<PantryLocationGroupProps>) {
  const label = location?.name ?? 'Sin ubicación';

  return (
    <section
      className="accent-panel card overflow-hidden"
      style={sectionAccentCssVarsFromHex(accentColor)}
      aria-label={label}
    >
      <PantryLocationHead
        label={label}
        count={items.length}
        canDrag={canDrag}
        onDragHandleStart={onDragHandleStart}
        onDragHandleEnd={onDragHandleEnd}
      />
      <PantryItemGrid
        items={items}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}
