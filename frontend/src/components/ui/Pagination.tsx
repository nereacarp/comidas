import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'elementos',
}: Readonly<PaginationProps>) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2"
      aria-label="Paginación"
    >
      <p className="text-xs sm:text-sm text-muted text-center sm:text-left tabular-nums">
        {from}–{to} de {total} {itemLabel}
      </p>

      <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-neutral inline-flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-5 w-5 shrink-0" aria-hidden />
          <span>Anterior</span>
        </button>
        <span
          className="px-3 py-2 text-sm font-semibold text-ink tabular-nums min-w-[4.5rem] text-center rounded-[var(--radius-control)] bg-page border border-[var(--border-subtle)]"
          aria-current="page"
        >
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-neutral inline-flex flex-1 sm:flex-none min-h-11 items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <span>Siguiente</span>
          <ChevronRightIcon className="h-5 w-5 shrink-0" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
