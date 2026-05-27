import type { PrismaClientType } from '../lib/prisma.js';

interface AddPantryItemInput {
  name: string;
  quantity: number;
  unit: string;
  locationId?: string;
}

interface UpdatePantryItemInput {
  name?: string;
  quantity?: number;
  unit?: string;
  locationId?: string | null;
}

export function createPantryService(prisma: PrismaClientType) {
  return {
    async list(householdId: string) {
      return prisma.pantryItem.findMany({
        where: { householdId },
        include: { location: { select: { id: true, name: true, icon: true, order: true } } },
        orderBy: { name: 'asc' },
      });
    },

    async add(householdId: string, input: AddPantryItemInput) {
      const existing = await prisma.pantryItem.findFirst({
        where: {
          householdId,
          name: { equals: input.name, mode: 'insensitive' },
          unit: { equals: input.unit, mode: 'insensitive' },
        },
      });

      if (existing) {
        return prisma.pantryItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + input.quantity,
            ...(input.locationId !== undefined ? { locationId: input.locationId } : {}),
          },
        });
      }

      return prisma.pantryItem.create({
        data: {
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          locationId: input.locationId || null,
          householdId,
        },
      });
    },

    async update(itemId: string, householdId: string, input: UpdatePantryItemInput) {
      const item = await prisma.pantryItem.findFirst({ where: { id: itemId, householdId } });
      if (!item) throw new Error('Ingrediente no encontrado');
      return prisma.pantryItem.update({
        where: { id: itemId },
        data: input,
      });
    },

    async delete(itemId: string, householdId: string) {
      const item = await prisma.pantryItem.findFirst({ where: { id: itemId, householdId } });
      if (!item) throw new Error('Ingrediente no encontrado');
      return prisma.pantryItem.delete({ where: { id: itemId } });
    },

    async consume(householdId: string, name: string, unit: string, requestedQty: number) {
      const item = await prisma.pantryItem.findFirst({
        where: {
          householdId,
          name: { equals: name, mode: 'insensitive' },
          unit: { equals: unit, mode: 'insensitive' },
        },
      });

      if (!item) {
        return { consumed: 0, remaining: requestedQty };
      }

      const consumed = Math.min(item.quantity, requestedQty);
      const newStock = item.quantity - consumed;

      if (newStock <= 0) {
        await prisma.pantryItem.delete({ where: { id: item.id } });
      } else {
        await prisma.pantryItem.update({
          where: { id: item.id },
          data: { quantity: newStock },
        });
      }

      return { consumed, remaining: requestedQty - consumed };
    },
  };
}
