import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ChevronRightIcon, ShoppingCartIcon } from '../ui/Icons';
import { getListAccent } from '../../lib/list-accents';
import { getShoppingListProgress } from '../../lib/shopping-list-stats';
import { getNavAccent } from '../../lib/section-accents';
import { routes } from '../../lib/routes';
import type { ShoppingList } from '../../types';

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split('-');
  return `${Number.parseInt(day)} ${MONTH_NAMES[Number.parseInt(month) - 1]}`;
}

interface ShoppingListCardProps {
  list: ShoppingList;
  accentIndex: number;
  featured?: boolean;
}

const SHOPPING_SECTION_ACCENT = getNavAccent(routes.shoppingLists);

export function ShoppingListCard({ list, accentIndex, featured = false }: Readonly<ShoppingListCardProps>) {
  const accent = featured
    ? { ...getListAccent('peach', 0), bg: SHOPPING_SECTION_ACCENT.bg, text: SHOPPING_SECTION_ACCENT.text }
    : getListAccent(list.accentKey, accentIndex);
  const { checked, total, progress, isComplete, pending } = getShoppingListProgress(list);
  const dateLabel = `${formatDate(list.startDate)} – ${formatDate(list.endDate)}`;

  const cardStyle: CSSProperties = {
    '--list-accent-bg': accent.bg,
    '--list-accent-text': accent.text,
  } as CSSProperties;

  const progressFillStyle: CSSProperties = { width: `${progress}%` };

  return (
    <Link
      to={routes.shoppingList(list.id)}
      className={`shopping-list-card block card card-hover min-h-[7.5rem] ${featured ? 'shopping-list-card--featured p-4 sm:p-5' : 'p-4'}`}
      style={cardStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-[color-mix(in_oklab,var(--pastel-mint)_55%,var(--surface))] text-[var(--pastel-mint-icon)]' : ''}`}
              style={isComplete ? undefined : { background: accent.bg, color: accent.text }}
            >
              {isComplete ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <ShoppingCartIcon className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`shopping-list-card__title truncate ${featured ? 'text-lg' : 'text-base'}`}>
                  {list.name}
                </h3>
                {featured && !isComplete && total > 0 && (
                  <span className="shopping-list-card__next-badge">
                    Siguiente
                  </span>
                )}
                {isComplete && (
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: 'color-mix(in oklab, var(--pastel-mint) 45%, var(--surface))',
                      color: 'var(--pastel-mint-icon)',
                    }}
                  >
                    Completada
                  </span>
                )}
              </div>
              <p className="shopping-list-card__date">{dateLabel}</p>
            </div>
          </div>

          {total > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="shopping-list-card__status">
                  {isComplete
                    ? `${total} artículos marcados`
                    : `${pending} pendiente${pending !== 1 ? 's' : ''} · ${checked} de ${total}`}
                </span>
                <span
                  className={`shopping-list-card__percent ${isComplete ? 'text-[var(--pastel-mint-icon)]' : 'shopping-list-card__percent--accent'}`}
                >
                  {progress}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill ${isComplete ? 'progress-fill--complete' : ''}`}
                  style={progressFillStyle}
                />
              </div>
            </div>
          ) : (
            <p className="shopping-list-card__status">Sin artículos</p>
          )}

          {featured && total > 0 && !isComplete && (
            <p className="shopping-list-card__cta">
              Continuar compra →
            </p>
          )}
        </div>

        {!featured && (
          <ChevronRightIcon className="shopping-list-card__chevron" />
        )}
      </div>
    </Link>
  );
}
