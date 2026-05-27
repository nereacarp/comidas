import { randomBytes } from 'crypto';
import type { PrismaClientType } from '../lib/prisma.js';
import { accentKeyAtIndex, planDistinctListAccentUpdates } from '../lib/list-accent.js';
import { computePantrySurplus } from '../lib/pantry-surplus.js';
import type { createPantryService } from './pantry.service.js';

export interface PantryAdditionResult {
  name: string;
  quantity: number;
  unit: string;
  locationId?: string;
}

export interface CheckGroupedItemsResult {
  items: Array<{ id: string; checked: boolean; name: string; quantity: number | null; unit: string | null }>;
  pantryAdded: PantryAdditionResult | null;
}

interface GenerateListInput {
  name: string;
  startDate: string;
  endDate: string;
}

interface AddManualItemInput {
  name: string;
  quantity?: number;
  unit?: string;
}

type PantryService = ReturnType<typeof createPantryService>;

function applyDistinctListAccents<T extends { id: string; accentKey: string; createdAt: Date }>(
  prisma: PrismaClientType,
  lists: T[],
): T[] {
  const updates = planDistinctListAccentUpdates(lists);
  if (updates.size === 0) return lists;

  void Promise.all(
    [...updates.entries()].map(([id, accentKey]) =>
      prisma.shoppingList.update({ where: { id }, data: { accentKey } }),
    ),
  ).catch(() => {});

  return lists.map((list) => {
    const accentKey = updates.get(list.id);
    return accentKey ? { ...list, accentKey } : list;
  });
}

export function createShoppingListService(
  prisma: PrismaClientType,
  pantryService?: PantryService,
) {
  async function checkGroupedItemsWithPurchase(
    householdId: string,
    itemIds: string[],
    purchasedQuantity?: number,
    locationId?: string,
  ): Promise<CheckGroupedItemsResult> {
    const items = await prisma.shoppingListItem.findMany({
      where: { id: { in: itemIds }, shoppingList: { householdId } },
    });
    if (items.length !== itemIds.length) throw new Error('Articulo no encontrado');

    await prisma.shoppingListItem.updateMany({
      where: { id: { in: itemIds } },
      data: { checked: true },
    });

    const checkedItems = items.map((item) => ({ ...item, checked: true }));
    const totalNeeded = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    const reference = items.find((item) => item.unit?.trim()) ?? items[0];
    const unit = reference.unit?.trim();

    let pantryAdded: PantryAdditionResult | null = null;
    if (pantryService && purchasedQuantity != null && unit) {
      const surplus = computePantrySurplus(purchasedQuantity, totalNeeded);
      if (surplus > 0) {
        const resolvedLocationId = locationId?.trim() || undefined;
        await pantryService.add(householdId, {
          name: reference.name,
          quantity: surplus,
          unit,
          ...(resolvedLocationId ? { locationId: resolvedLocationId } : {}),
        });
        pantryAdded = {
          name: reference.name,
          quantity: surplus,
          unit,
          ...(resolvedLocationId ? { locationId: resolvedLocationId } : {}),
        };
      }
    }

    return { items: checkedItems, pantryAdded };
  }

  return {
    async generate(householdId: string, input: GenerateListInput) {
      const mealPlanItems = await prisma.mealPlanItem.findMany({
        where: {
          householdId,
          date: { gte: new Date(input.startDate), lte: new Date(input.endDate) },
          recipeId: { not: null },
        },
        include: { recipe: { include: { ingredients: true } } },
      });

      // Aggregate ingredients from meal plan
      const aggregated = new Map<string, { name: string; quantity: number; unit: string; sourceRecipeId: string }>();
      for (const item of mealPlanItems) {
        if (!item.recipe) continue;
        for (const ing of item.recipe.ingredients) {
          const key = `${ing.name.toLowerCase()}_${(ing.unit || '').toLowerCase()}`;
          const existing = aggregated.get(key);
          if (existing) {
            existing.quantity += ing.quantity || 0;
          } else {
            aggregated.set(key, {
              name: ing.name,
              quantity: ing.quantity || 0,
              unit: ing.unit || '',
              sourceRecipeId: item.recipe.id,
            });
          }
        }
      }

      // Calculate pantry subtractions without writing to DB yet
      type PantryMutation =
        | { kind: 'delete'; id: string }
        | { kind: 'update'; id: string; quantity: number };

      const pantrySubtractions: Array<{ name: string; quantity: number; unit: string }> = [];
      const pantryMutations: PantryMutation[] = [];

      if (pantryService) {
        // Read all relevant pantry items in one query
        const names = Array.from(aggregated.values())
          .filter((i) => i.quantity > 0 && i.unit)
          .map((i) => i.name.toLowerCase());

        const pantryItems = names.length > 0
          ? await prisma.pantryItem.findMany({ where: { householdId } })
          : [];

        for (const [key, aggItem] of aggregated) {
          if (!aggItem.quantity || !aggItem.unit) continue;
          const pantry = pantryItems.find(
            (p) =>
              p.name.toLowerCase() === aggItem.name.toLowerCase() &&
              p.unit.toLowerCase() === aggItem.unit.toLowerCase(),
          );
          if (!pantry) continue;

          const consumed = Math.min(pantry.quantity, aggItem.quantity);
          const newStock = pantry.quantity - consumed;
          const remaining = aggItem.quantity - consumed;

          if (consumed > 0) {
            pantrySubtractions.push({ name: aggItem.name, quantity: consumed, unit: aggItem.unit });
            pantryMutations.push(
              newStock <= 0
                ? { kind: 'delete', id: pantry.id }
                : { kind: 'update', id: pantry.id, quantity: newStock },
            );
          }

          if (remaining <= 0) {
            aggregated.delete(key);
          } else {
            aggItem.quantity = remaining;
          }
        }
      }

      const listCount = await prisma.shoppingList.count({ where: { householdId } });
      const accentKey = accentKeyAtIndex(listCount);

      // Apply all mutations atomically: pantry updates + list creation
      const list = await prisma.$transaction(async (tx) => {
        for (const mut of pantryMutations) {
          if (mut.kind === 'delete') {
            await tx.pantryItem.delete({ where: { id: mut.id } });
          } else {
            await tx.pantryItem.update({ where: { id: mut.id }, data: { quantity: mut.quantity } });
          }
        }
        return tx.shoppingList.create({
          data: {
            name: input.name,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate),
            accentKey,
            householdId,
            items: {
              create: Array.from(aggregated.values()).map((item) => ({
                name: item.name,
                quantity: item.quantity || null,
                unit: item.unit || null,
                sourceRecipeId: item.sourceRecipeId,
              })),
            },
          },
          include: { items: { include: { sourceRecipe: { select: { id: true, title: true } } } } },
        });
      });

      return { ...list, pantrySubtractions };
    },

    async list(householdId: string) {
      const lists = await prisma.shoppingList.findMany({
        where: { householdId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      return applyDistinctListAccents(prisma, lists); // sync: returns immediately, writes to DB in background
    },

    async getById(listId: string, householdId: string) {
      const list = await prisma.shoppingList.findFirst({
        where: { id: listId, householdId },
        include: { items: { include: { sourceRecipe: { select: { id: true, title: true } } } } },
      });
      if (!list) throw new Error('Lista de la compra no encontrada');
      return list;
    },

    async addManualItem(listId: string, householdId: string, input: AddManualItemInput) {
      const list = await prisma.shoppingList.findFirst({ where: { id: listId, householdId } });
      if (!list) throw new Error('Lista de la compra no encontrada');
      return prisma.shoppingListItem.create({
        data: {
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          isManual: true,
          shoppingListId: listId,
        },
      });
    },

    async toggleItem(itemId: string, householdId: string) {
      const item = await prisma.shoppingListItem.findFirst({
        where: { id: itemId, shoppingList: { householdId } },
      });
      if (!item) throw new Error('Articulo no encontrado');
      return prisma.shoppingListItem.update({
        where: { id: itemId },
        data: { checked: !item.checked },
      });
    },

    async deleteItem(itemId: string, householdId: string) {
      const item = await prisma.shoppingListItem.findFirst({
        where: { id: itemId, shoppingList: { householdId } },
      });
      if (!item) throw new Error('Articulo no encontrado');
      return prisma.shoppingListItem.delete({ where: { id: itemId } });
    },

    async deleteList(listId: string, householdId: string) {
      const list = await prisma.shoppingList.findFirst({ where: { id: listId, householdId } });
      if (!list) throw new Error('Lista de la compra no encontrada');
      return prisma.shoppingList.delete({ where: { id: listId } });
    },

    async createShareToken(listId: string, householdId: string) {
      const list = await prisma.shoppingList.findFirst({ where: { id: listId, householdId } });
      if (!list) throw new Error('Lista de la compra no encontrada');
      const token = randomBytes(16).toString('hex');
      const updated = await prisma.shoppingList.update({
        where: { id: listId },
        data: { shareToken: token },
      });
      return { shareToken: updated.shareToken };
    },

    async removeShareToken(listId: string, householdId: string) {
      const list = await prisma.shoppingList.findFirst({ where: { id: listId, householdId } });
      if (!list) throw new Error('Lista de la compra no encontrada');
      await prisma.shoppingList.update({
        where: { id: listId },
        data: { shareToken: null },
      });
    },

    async getByShareToken(token: string) {
      const list = await prisma.shoppingList.findUnique({
        where: { shareToken: token },
        include: { items: true },
      });
      if (!list) throw new Error('Lista de la compra no encontrada');
      return list;
    },

    async checkItemWithPurchase(householdId: string, itemId: string, purchasedQuantity?: number, locationId?: string) {
      const { items } = await checkGroupedItemsWithPurchase(householdId, [itemId], purchasedQuantity, locationId);
      return items[0];
    },

    checkGroupedItemsWithPurchase,

    async toggleItemByShareToken(token: string, itemId: string) {
      const list = await prisma.shoppingList.findUnique({
        where: { shareToken: token },
        select: { id: true },
      });
      if (!list) throw new Error('Lista de la compra no encontrada');

      const item = await prisma.shoppingListItem.findFirst({
        where: { id: itemId, shoppingListId: list.id },
      });
      if (!item) throw new Error('Articulo no encontrado');

      return prisma.shoppingListItem.update({
        where: { id: itemId },
        data: { checked: !item.checked },
      });
    },
  };
}
