import type { ShoppingListItem } from '../types';

export interface GroupedItem {
  key: string;
  name: string;
  quantities: string;
  /** Total needed when the group uses a single unit; null if mixed or unknown units */
  neededQuantity: number | null;
  /** Unit for purchase flow when neededQuantity is set */
  purchaseUnit: string | null;
  /** True when the user can enter purchased qty and send surplus to the pantry */
  supportsPurchaseFlow: boolean;
  allChecked: boolean;
  partiallyChecked: boolean;
  allIds: string[];
  isManual: boolean;
  sourceRecipes: Array<{ id: string; title: string }>;
}

function buildPurchaseMetrics(unitQtys: Map<string, number | null>): {
  neededQuantity: number | null;
  purchaseUnit: string | null;
  supportsPurchaseFlow: boolean;
} {
  const measurable = [...unitQtys.entries()].filter(
    ([unit, qty]) => unit.trim() !== '' && qty != null && qty > 0,
  );
  if (measurable.length !== 1) {
    return { neededQuantity: null, purchaseUnit: null, supportsPurchaseFlow: false };
  }
  const [unit, qty] = measurable[0];
  return { neededQuantity: qty, purchaseUnit: unit, supportsPurchaseFlow: true };
}

export function formatQty(qty: number | null | undefined): string {
  if (!qty) return '';
  return Number.isInteger(qty) ? qty.toString() : (Math.round(qty * 100) / 100).toString();
}

export function groupShoppingItems(items: ShoppingListItem[]): GroupedItem[] {
  const groups = new Map<string, {
    name: string;
    unitQtys: Map<string, number | null>;
    ids: string[];
    isManual: boolean;
    sourceRecipes: Array<{ id: string; title: string }>;
    checkedCount: number;
  }>();

  for (const item of items) {
    const nameKey = item.name.toLowerCase().trim();
    const unitKey = (item.unit ?? '').trim();
    const g = groups.get(nameKey);

    if (g) {
      const prev = g.unitQtys.get(unitKey) ?? null;
      if (item.quantity != null) {
        g.unitQtys.set(unitKey, (prev ?? 0) + item.quantity);
      } else if (!g.unitQtys.has(unitKey)) {
        g.unitQtys.set(unitKey, null);
      }
      g.ids.push(item.id);
      if (item.checked) g.checkedCount++;
      if (!item.isManual) g.isManual = false;
      if (item.sourceRecipe && !g.sourceRecipes.find((r) => r.id === item.sourceRecipe!.id)) {
        g.sourceRecipes.push(item.sourceRecipe);
      }
    } else {
      const unitQtys = new Map<string, number | null>();
      unitQtys.set(unitKey, item.quantity ?? null);
      groups.set(nameKey, {
        name: item.name,
        unitQtys,
        ids: [item.id],
        isManual: item.isManual,
        sourceRecipes: item.sourceRecipe ? [item.sourceRecipe] : [],
        checkedCount: item.checked ? 1 : 0,
      });
    }
  }

  return Array.from(groups.entries()).map(([key, g]) => {
    const parts: string[] = [];
    for (const [unit, qty] of g.unitQtys) {
      const q = qty && qty > 0 ? formatQty(qty) : '';
      const part = [q, unit].filter(Boolean).join(' ');
      if (part) parts.push(part);
    }
    const purchase = buildPurchaseMetrics(g.unitQtys);
    return {
      key,
      name: g.name,
      quantities: parts.join(' + '),
      ...purchase,
      allChecked: g.checkedCount === g.ids.length,
      partiallyChecked: g.checkedCount > 0 && g.checkedCount < g.ids.length,
      allIds: g.ids,
      isManual: g.isManual,
      sourceRecipes: g.sourceRecipes,
    };
  });
}
