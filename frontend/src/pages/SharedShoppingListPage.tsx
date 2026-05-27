import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupShoppingItems } from '../utils/shopping';
import type { GroupedItem } from '../utils/shopping';
import { ShoppingListDetailHeader } from '../components/shopping/ShoppingListDetailHeader';
import { ShoppingListItemsPanel } from '../components/shopping/ShoppingListItemsPanel';
import { getListAccent, listAccentCssVars } from '../lib/list-accents';
import type { ShoppingList } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export function SharedShoppingListPage() {
  const { token } = useParams<{ token: string }>();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/public/shopping-lists/${token}`);
      if (!res.ok) throw new Error('Shared shopping list not found');
      setList(await res.json());
    } catch {
      setError('Esta lista no existe o ya no está compartida');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleToggleGroup = async (group: GroupedItem) => {
    if (!token || !list) return;
    const current = list.items.filter((i) => group.allIds.includes(i.id));
    const toToggle = group.allChecked ? current : current.filter((i) => !i.checked);
    await Promise.all(
      toToggle.map((item) =>
        fetch(`${API_URL}/public/shopping-lists/${token}/items/${item.id}/toggle`, { method: 'PUT' }),
      ),
    );
    await loadList();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div
          className="h-8 w-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--pastel-peach)', borderTopColor: 'var(--pastel-peach-icon)' }}
        />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-page">
        <div className="card p-8 text-center max-w-sm">
          <p className="font-semibold text-ink mb-1">Lista no disponible</p>
          <p className="text-sm text-muted mb-5">{error}</p>
          <Link to="/login" className="btn-primary">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const grouped = groupShoppingItems(list.items);
  const doneCount = grouped.filter((g) => g.allChecked).length;
  const progress = grouped.length > 0 ? Math.round((doneCount / grouped.length) * 100) : 0;
  const isComplete = grouped.length > 0 && progress === 100;
  const accent = getListAccent(list.accentKey);

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <span className="font-semibold text-ink">Comidas</span>
          <span className="ml-auto text-xs font-semibold text-muted rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-0.5">
            Lista compartida
          </span>
        </div>
      </header>

      <main className="shopping-detail py-6 pb-12" style={listAccentCssVars(accent)}>
        <ShoppingListDetailHeader
          list={list}
          accent={accent}
          progress={progress}
          doneCount={doneCount}
          totalCount={grouped.length}
          isComplete={isComplete}
          shareUrl=""
          isSharing={false}
          canEdit={false}
          showBackLink={false}
          onShare={() => {}}
          onStopSharing={() => {}}
          onDeleteList={() => {}}
        />

        <ShoppingListItemsPanel
          grouped={grouped}
          accent={accent}
          canEdit={false}
          emptyDescription="Esta lista aún no tiene artículos"
          onToggle={handleToggleGroup}
          onDelete={() => {}}
          locations={[]}
          pantryItems={[]}
        />
      </main>

      <footer className="pb-8 text-center">
        <p className="text-xs text-muted">
          Compartido desde{' '}
          <span className="font-semibold" style={{ color: accent.text }}>
            Comidas
          </span>
        </p>
      </footer>
    </div>
  );
}
