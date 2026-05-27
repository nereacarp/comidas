import type { ShoppingList } from '../types';

interface ShoppingListProgress {
  checked: number;
  total: number;
  progress: number;
  isComplete: boolean;
  pending: number;
}

export function getShoppingListProgress(list: ShoppingList): ShoppingListProgress {
  const checked = list.items.filter((item) => item.checked).length;
  const total = list.items.length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
  return {
    checked,
    total,
    progress,
    isComplete: total > 0 && checked === total,
    pending: total - checked,
  };
}

interface ShoppingListsOverview {
  listCount: number;
  totalItems: number;
  pendingItems: number;
  completedLists: number;
  activeListId: string | null;
}

export function getShoppingListsOverview(lists: ShoppingList[]): ShoppingListsOverview {
  let totalItems = 0;
  let pendingItems = 0;
  let completedLists = 0;
  let activeListId: string | null = null;

  const sorted = [...lists].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const list of lists) {
    const { total, pending, isComplete } = getShoppingListProgress(list);
    totalItems += total;
    pendingItems += pending;
    if (isComplete) completedLists += 1;
  }

  const active = sorted.find((list) => {
    const { total, isComplete } = getShoppingListProgress(list);
    return total > 0 && !isComplete;
  });
  activeListId = active?.id ?? sorted[0]?.id ?? null;

  return {
    listCount: lists.length,
    totalItems,
    pendingItems,
    completedLists,
    activeListId,
  };
}
