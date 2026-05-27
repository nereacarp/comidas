interface PantryLocationHeadProps {
  label: string;
  count: number;
  canDrag?: boolean;
  onDragHandleStart?: () => void;
  onDragHandleEnd?: () => void;
}

export function PantryLocationHead({
  label,
  count,
  canDrag = false,
  onDragHandleStart,
  onDragHandleEnd,
}: Readonly<PantryLocationHeadProps>) {
  const countLabel = count === 1 ? '1 ingrediente' : `${count} ingredientes`;

  return (
    <div className="accent-section-head accent-section-head--emphasis">
      <div className="accent-section-head__main">
        {canDrag && (
          <span
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', label);
              onDragHandleStart?.();
            }}
            onDragEnd={() => onDragHandleEnd?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
            }}
            className="pantry-location-drag-handle"
            aria-label={`Reordenar ${label}`}
            title="Arrastrar para reordenar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </span>
        )}
        <span className="accent-section-label">{label}</span>
        <span className="accent-section-count" aria-label={countLabel}>
          {count}
        </span>
      </div>
    </div>
  );
}
