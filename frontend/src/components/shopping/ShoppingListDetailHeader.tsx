import { Link } from 'react-router-dom';
import { CheckIcon, ChevronRightIcon, ShoppingCartIcon } from '../ui/Icons';
import { routes } from '../../lib/routes';
import type { ShoppingList } from '../../types';

interface ListAccent {
  text: string;
  bg: string;
}

interface ShoppingListDetailHeaderProps {
  list: ShoppingList;
  accent: ListAccent;
  progress: number;
  doneCount: number;
  totalCount: number;
  isComplete: boolean;
  shareUrl: string;
  isSharing: boolean;
  canEdit: boolean;
  onShare: () => void;
  onStopSharing: () => void;
  onDeleteList: () => void;
  showBackLink?: boolean;
}

export function ShoppingListDetailHeader({
  list,
  accent,
  progress,
  doneCount,
  totalCount,
  isComplete,
  shareUrl,
  isSharing,
  canEdit,
  onShare,
  onStopSharing,
  onDeleteList,
  showBackLink = true,
}: Readonly<ShoppingListDetailHeaderProps>) {
  const dateRange = `${list.startDate.slice(0, 10)} – ${list.endDate.slice(0, 10)}`;

  return (
    <div className="shopping-detail-header card p-5 sm:p-6">
      {showBackLink && (
        <Link
          to={routes.shoppingLists}
          className="shopping-detail-back inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink mb-4"
        >
          <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
          Listas de la compra
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`shopping-detail-header__icon ${isComplete ? 'shopping-detail-header__icon--done' : ''}`}
            style={isComplete ? undefined : { background: accent.bg, color: accent.text }}
          >
            {isComplete ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <ShoppingCartIcon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink truncate">
                {list.name}
              </h1>
              {isComplete && (
                <span className="shopping-detail-badge shopping-detail-badge--done">Completada</span>
              )}
            </div>
            <p className="text-sm text-muted mt-1">{dateRange}</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {shareUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="shopping-detail-chip"
                  style={{
                    color: accent.text,
                    background: accent.bg,
                    borderColor: `color-mix(in oklab, ${accent.text} 28%, var(--border-subtle))`,
                  }}
                >
                  Copiar enlace
                </button>
                <button type="button" onClick={onStopSharing} className="btn-neutral !px-3 !py-2 !text-xs">
                  Dejar de compartir
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onShare}
                disabled={isSharing}
                className="shopping-detail-chip disabled:opacity-50"
                style={{
                  color: accent.text,
                  background: accent.bg,
                  borderColor: `color-mix(in oklab, ${accent.text} 28%, var(--border-subtle))`,
                }}
              >
                {isSharing ? 'Compartiendo…' : 'Compartir'}
              </button>
            )}
            <button type="button" onClick={onDeleteList} className="btn-danger-soft !px-3 !py-2 !text-xs">
              Eliminar
            </button>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">
              {doneCount} de {totalCount} artículos
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${isComplete ? 'text-[var(--pastel-mint-icon)]' : ''}`}
              style={isComplete ? undefined : { color: accent.text }}
            >
              {progress}%
            </span>
          </div>
          <div className="progress-track h-2.5">
            <div
              className={`progress-fill h-full ${isComplete ? 'progress-fill--complete' : ''}`}
              style={
                isComplete
                  ? { width: `${progress}%` }
                  : {
                      width: `${progress}%`,
                      background: `color-mix(in oklab, ${accent.text} 60%, ${accent.bg})`,
                    }
              }
            />
          </div>
        </div>
      )}

      {shareUrl && (
        <div
          className="mt-4 rounded-2xl border px-3 py-2.5"
          style={{
            background: `color-mix(in oklab, ${accent.bg} 50%, var(--surface))`,
            borderColor: `color-mix(in oklab, ${accent.text} 22%, var(--border-subtle))`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Enlace público</p>
          <p className="text-xs text-ink break-all font-mono">{shareUrl}</p>
        </div>
      )}
    </div>
  );
}
