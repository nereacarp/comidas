import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createStorageLocationsApi } from '../../api/storage-locations';
import { apiClient } from '../../api/client';
import { usePantryVisibleColumns } from '../../hooks/usePantryVisibleColumns';
import type { PantryItem, StorageLocation } from '../../types';
import { resolveLocationColor } from '../../utils/color-styles';
import { pantryGroupsItemsKey, type PantryLocationGroupData } from '../../utils/pantry-groups';
import {
  PANTRY_LAYOUT_COLUMNS,
  columnsToPlacements,
  finalizeColumns,
  flattenToMobileStack,
  groupsToColumns,
  moveGroupInStack,
  moveGroupToColumn,
  placementSignature,
  type LocatedPantryGroup,
  type PantryDropPosition,
} from '../../utils/pantry-layout';
import { PantryLocationGroup } from './PantryLocationGroup';

const locationsApi = createStorageLocationsApi(apiClient);

type DropTarget =
  | { kind: 'before'; id: string }
  | { kind: 'after'; id: string }
  | { kind: 'column'; column: number };

interface PantryLocationsBoardProps {
  householdId: string;
  groups: PantryLocationGroupData[];
  canEdit: boolean;
  unassignedAccentHex: string;
  unassignedSectionRef?: RefObject<HTMLDivElement | null>;
  onLocationsChange: (locations: StorageLocation[]) => void;
  onEditItem: (item: PantryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

function layoutKey(groups: LocatedPantryGroup[]): string {
  return groups
    .map((g) => `${g.location.id}:${g.location.layoutColumn}:${g.location.order}`)
    .sort()
    .join('|');
}

function ColumnDropFooter({
  colIndex,
  isActive,
  onActivate,
  onDrop,
}: Readonly<{
  colIndex: number;
  isActive: boolean;
  onActivate: () => void;
  onDrop: () => void;
}>) {
  return (
    <div
      className={[
        'pantry-column-stack__placeholder',
        'pantry-column-stack__placeholder--footer',
        isActive ? 'pantry-column-stack__placeholder--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Soltar en columna ${colIndex + 1}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        onActivate();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop();
      }}
    >
      Soltar aquí
    </div>
  );
}

function isSameDropTarget(a: DropTarget | null, b: DropTarget): boolean {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === 'column' && b.kind === 'column') return a.column === b.column;
  if (a.kind === 'before' || a.kind === 'after') {
    return b.kind !== 'column' && a.id === b.id && a.kind === b.kind;
  }
  return false;
}

export function PantryLocationsBoard({
  householdId,
  groups,
  canEdit,
  unassignedAccentHex,
  unassignedSectionRef,
  onLocationsChange,
  onEditItem,
  onDeleteItem,
}: Readonly<PantryLocationsBoardProps>) {
  const withLocation = useMemo(
    () => groups.filter((g): g is LocatedPantryGroup => g.location !== null),
    [groups],
  );
  const unassigned = useMemo(
    () => groups.filter((g) => g.location === null),
    [groups],
  );

  const syncKey = layoutKey(withLocation);
  const itemsKey = pantryGroupsItemsKey(groups);
  const boardSyncKey = `${syncKey}|${itemsKey}`;
  const [columns, setColumns] = useState(() => finalizeColumns(groupsToColumns(withLocation)));
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const withLocationRef = useRef(withLocation);
  withLocationRef.current = withLocation;
  const dragIdRef = useRef<string | null>(null);
  const pendingSyncKeyRef = useRef<string | null>(null);
  const lastSyncedKeyRef = useRef(boardSyncKey);

  const refreshColumnsFromGroups = useCallback(() => {
    setColumns(finalizeColumns(groupsToColumns(withLocationRef.current)));
  }, []);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const visibleColumns = usePantryVisibleColumns();
  const isMobileStack = visibleColumns <= 1;

  useEffect(() => {
    if (pendingSyncKeyRef.current !== null) {
      if (pendingSyncKeyRef.current === syncKey) {
        pendingSyncKeyRef.current = null;
        lastSyncedKeyRef.current = boardSyncKey;
        refreshColumnsFromGroups();
      }
      return;
    }
    if (lastSyncedKeyRef.current === boardSyncKey) return;

    lastSyncedKeyRef.current = boardSyncKey;
    refreshColumnsFromGroups();
  }, [boardSyncKey, syncKey, refreshColumnsFromGroups]);

  useEffect(() => {
    if (!draggingId) return;

    const allowDrop = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    };

    document.addEventListener('dragover', allowDrop);
    return () => document.removeEventListener('dragover', allowDrop);
  }, [draggingId]);

  const persistColumns = useCallback(
    async (next: LocatedPantryGroup[][]) => {
      const normalized = finalizeColumns(next);
      const previous = columnsRef.current;
      const sig = placementSignature(columnsToPlacements(normalized));
      const prevSig = placementSignature(columnsToPlacements(previous));
      if (sig === prevSig) return;

      const itemsByLocation = new Map(
        normalized.flat().map((g) => [g.location.id, g.items]),
      );

      const expectedIds = withLocationRef.current.map((g) => g.location.id);
      const placements = columnsToPlacements(normalized);
      if (placements.length !== expectedIds.length) {
        setSaveError('No se pudo guardar: faltan ubicaciones en el tablero');
        return;
      }

      setIsSaving(true);
      setSaveError(null);
      try {
        const updated = await locationsApi.reorder(householdId, placements);
        const syncedGroups = updated.map((location) => ({
          location,
          items: itemsByLocation.get(location.id) ?? [],
        }));
        const savedKey = layoutKey(syncedGroups);
        pendingSyncKeyRef.current = savedKey;
        lastSyncedKeyRef.current = savedKey;
        onLocationsChange(updated);
        setColumns(groupsToColumns(syncedGroups));
      } catch (err) {
        setColumns(previous);
        setSaveError(
          err instanceof Error ? err.message : 'No se pudo guardar la disposición',
        );
      } finally {
        setIsSaving(false);
      }
    },
    [householdId, onLocationsChange],
  );

  const handleDragStart = (id: string) => {
    dragIdRef.current = id;
    setDraggingId(id);
    setSaveError(null);
  };

  const clearDrag = useCallback(() => {
    dragIdRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (dragIdRef.current !== null) {
          clearDrag();
        }
      });
    });
  }, [clearDrag]);

  const resolveDropPosition = (event: React.DragEvent): PantryDropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
  };

  const applyDrop = useCallback(
    async (target: DropTarget) => {
      const dragId = dragIdRef.current;
      if (!dragId || !canEdit) return;

      dragIdRef.current = null;
      setDraggingId(null);
      setDropTarget(null);

      const previous = columnsRef.current;
      const next =
        target.kind === 'column'
          ? moveGroupToColumn(previous, dragId, target.column)
          : moveGroupInStack(
              previous,
              dragId,
              target.id,
              target.kind === 'before' ? 'before' : 'after',
            );

      setColumns(next);
      await persistColumns(next);
    },
    [canEdit, persistColumns],
  );

  const mobileStack = useMemo(
    () => (isMobileStack ? flattenToMobileStack(columns) : []),
    [columns, isMobileStack],
  );

  const showDragHint = canEdit && withLocation.length > 1;

  const renderSlot = (group: LocatedPantryGroup) => {
    const id = group.location.id;
    const beforeTarget: DropTarget = { kind: 'before', id };
    const afterTarget: DropTarget = { kind: 'after', id };

    return (
      <div
        key={id}
        className={[
          'pantry-location-slot',
          draggingId === id ? 'pantry-location-slot--dragging' : '',
          isSameDropTarget(dropTarget, beforeTarget)
            ? 'pantry-location-slot--drop-before pantry-location-slot--drop-target'
            : '',
          isSameDropTarget(dropTarget, afterTarget)
            ? 'pantry-location-slot--drop-after pantry-location-slot--drop-target'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDragOver={(e) => {
          if (!canEdit || !dragIdRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          setDropTarget(resolveDropPosition(e) === 'before' ? beforeTarget : afterTarget);
        }}
        onDrop={(e) => {
          if (!canEdit) return;
          e.preventDefault();
          e.stopPropagation();
          void applyDrop(resolveDropPosition(e) === 'before' ? beforeTarget : afterTarget);
        }}
      >
        <PantryLocationGroup
          location={group.location}
          items={group.items}
          accentColor={resolveLocationColor(group.location.icon, group.location.color)}
          canEdit={canEdit}
          canDrag={showDragHint}
          onDragHandleStart={() => handleDragStart(id)}
          onDragHandleEnd={handleDragEnd}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {showDragHint && (
        <p className="text-xs text-muted" role="note">
          ⋮⋮ reordena arriba o abajo. Suelta en otra columna para mover la ubicación.
          {isSaving ? ' Guardando…' : ''}
        </p>
      )}
      {saveError && (
        <p className="text-xs text-danger" role="alert">
          {saveError}
        </p>
      )}

      {isMobileStack ? (
        <div className="pantry-column-stack pantry-column-stack--mobile">
          {mobileStack.map(renderSlot)}
        </div>
      ) : (
        <div className="pantry-locations-board" aria-busy={isSaving}>
          {Array.from({ length: PANTRY_LAYOUT_COLUMNS }, (_, colIndex) => {
            const stack = columns[colIndex] ?? [];
            const isColumnTarget =
              dropTarget?.kind === 'column' && dropTarget.column === colIndex;

            return (
              <div
                key={colIndex}
                className={[
                  'pantry-column-stack',
                  isColumnTarget ? 'pantry-column-stack--drop-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onDragOver={(e) => {
                  if (!dragIdRef.current || !canEdit) return;
                  e.preventDefault();
                  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                  setDropTarget({ kind: 'column', column: colIndex });
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDropTarget((current) =>
                    current?.kind === 'column' && current.column === colIndex ? null : current,
                  );
                }}
                onDrop={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  void applyDrop({ kind: 'column', column: colIndex });
                }}
              >
                {stack.map(renderSlot)}
                {canEdit && (
                  <ColumnDropFooter
                    colIndex={colIndex}
                    isActive={isColumnTarget}
                    onActivate={() => setDropTarget({ kind: 'column', column: colIndex })}
                    onDrop={() => void applyDrop({ kind: 'column', column: colIndex })}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <div ref={unassignedSectionRef} className="pantry-locations-unassigned">
          {unassigned.map((group) => (
            <PantryLocationGroup
              key="unassigned"
              location={null}
              items={group.items}
              accentColor={unassignedAccentHex}
              canEdit={canEdit}
              canDrag={false}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
