import { Link } from 'react-router-dom';
import type { PantrySearchMatch } from '../../lib/pantry-search';
import { settingsPantryLocationsPath } from '../../lib/settings-sections';
import { formatPantryQuantity } from '../../lib/ingredient-display';

interface PantryToolbarProps {
  hint?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  matches: PantrySearchMatch[];
  showManageLocations: boolean;
  onSelectMatch: (match: PantrySearchMatch) => void;
  unassignedAction?: { count: number; onClick: () => void };
}

export function PantryToolbar({
  hint,
  searchQuery,
  onSearchChange,
  matches,
  showManageLocations,
  onSelectMatch,
  unassignedAction,
}: Readonly<PantryToolbarProps>) {
  const trimmed = searchQuery.trim();
  const showResults = trimmed.length > 0;

  return (
    <div className="pantry-toolbar space-y-3">
      {hint ? <p className="pantry-toolbar__hint text-sm text-muted text-pretty">{hint}</p> : null}
      {unassignedAction && unassignedAction.count > 0 ? (
        <button
          type="button"
          onClick={unassignedAction.onClick}
          className="pantry-toolbar__unassigned"
        >
          {unassignedAction.count} sin ubicar
        </button>
      ) : null}
      <div className="pantry-toolbar__row">
        <label className="pantry-toolbar__search">
          <span className="sr-only">Buscar ingrediente</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pantry-toolbar__search-icon"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar ingrediente…"
            className="input pantry-toolbar__search-input"
            autoComplete="off"
          />
          {trimmed.length > 0 ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="pantry-toolbar__clear"
              aria-label="Borrar búsqueda"
            >
              ×
            </button>
          ) : null}
        </label>
        {showManageLocations ? (
          <Link to={settingsPantryLocationsPath()} className="btn-neutral pantry-toolbar__manage shrink-0">
            Gestionar ubicaciones
          </Link>
        ) : null}
      </div>

      {showResults ? (
        <section className="pantry-search-results" aria-live="polite" aria-label="Resultados de búsqueda">
          {matches.length === 0 ? (
            <p className="pantry-search-results__empty text-sm text-muted">
              Ningún ingrediente coincide con «{trimmed}».
            </p>
          ) : (
            <ul className="pantry-search-results__list">
              {matches.map((match) => {
                const qty = formatPantryQuantity(match.item.quantity, match.item.unit);
                return (
                  <li key={match.item.id}>
                    <button
                      type="button"
                      className="pantry-search-results__row"
                      onClick={() => onSelectMatch(match)}
                    >
                      <span className="pantry-search-results__name">{match.item.name}</span>
                      <span className="pantry-search-results__meta">
                        {qty ? <span className="pantry-search-results__qty">{qty}</span> : null}
                        <span className="pantry-search-results__location">{match.locationLabel}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
