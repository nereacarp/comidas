import { ReactNode, useState } from 'react';

export interface AdminColumn<T> {
  label: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

interface SortOption { label: string; value: string }

interface Props<T extends { id: string }> {
  title: string;
  description?: string;
  data: T[];
  columns: AdminColumn<T>[];
  isLoading: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  sort?: string;
  sortOptions?: SortOption[];
  onSortChange?: (value: string) => void;
  onDelete?: (id: string, row: T) => Promise<void>;
  deleteMessage?: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  emptyMessage?: string;
  headerAction?: ReactNode;
}

export function AdminTable<T extends { id: string }>({
  title, description, data, columns, isLoading, total = data.length, page = 1, pageSize = 10,
  onPageChange, search = '', onSearchChange, sort, sortOptions, onSortChange, onDelete,
  deleteMessage, renderActions, emptyMessage = 'No hay datos.', headerAction,
}: Props<T>) {
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  async function remove(row: T) {
    if (!onDelete) return;
    const message = deleteMessage?.(row) ?? '¿Seguro que quieres eliminar este elemento? Esta acción no se puede deshacer.';
    if (!window.confirm(message)) return;
    setActionError('');
    setDeletingId(row.id);
    try {
      await onDelete(row.id, row);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo completar la eliminación.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby={`title-${title}`}>
      <div className="admin-page-heading">
        <div><h1 id={`title-${title}`}>{title}</h1>{description && <p>{description}</p>}</div>
        {headerAction}
      </div>

      {(onSearchChange || sortOptions) && (
        <div className="admin-toolbar">
          {onSearchChange && (
            <div className="admin-search">
              <label htmlFor={`search-${title}`}>Buscar</label>
              <input id={`search-${title}`} className="input" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={`Buscar en ${title.toLowerCase()}…`} />
            </div>
          )}
          {sortOptions && onSortChange && (
            <div className="admin-sort">
              <label htmlFor={`sort-${title}`}>Ordenar por</label>
              <select id={`sort-${title}`} className="input" value={sort} onChange={(event) => onSortChange(event.target.value)}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {actionError && <div className="admin-alert admin-alert--error" role="alert">{actionError}</div>}

      <div className="admin-table-card">
        {isLoading ? <div className="admin-empty">Cargando…</div> : data.length === 0 ? <div className="admin-empty">{emptyMessage}</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>{columns.map((column) => <th key={column.label} className={column.align === 'right' ? 'is-right' : ''}>{column.label}</th>)}{(renderActions || onDelete) && <th className="is-right">Acciones</th>}</tr></thead>
              <tbody>{data.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => <td key={column.label} data-label={column.label} className={column.align === 'right' ? 'is-right' : ''}>{column.render(row)}</td>)}
                  {(renderActions || onDelete) && <td data-label="Acciones" className="admin-actions">{renderActions?.(row)}{onDelete && <button type="button" className="admin-button admin-button--danger" disabled={deletingId === row.id} onClick={() => remove(row)}>{deletingId === row.id ? 'Eliminando…' : 'Eliminar'}</button>}</td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {onPageChange && total > 0 && (
          <div className="admin-pagination">
            <span>Mostrando {first}–{last} de {total}</span>
            <div><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button><span>Página {page} de {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Siguiente</button></div>
          </div>
        )}
      </div>
    </section>
  );
}
