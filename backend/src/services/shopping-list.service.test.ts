import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LIST_ACCENT_KEYS } from '../lib/list-accent.js';
import { createShoppingListService } from './shopping-list.service.js';

function createMockPrisma() {
  const mock = {
    $transaction: vi.fn(),
    mealPlanItem: { findMany: vi.fn() },
    pantryItem: {
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    shoppingList: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shoppingListItem: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  };
  mock.$transaction.mockImplementation(async (fn: (tx: typeof mock) => Promise<unknown>) => fn(mock));
  return mock;
}

function createMockPantryService() {
  return {
    list: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    consume: vi.fn(),
  };
}

describe('ShoppingListService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createShoppingListService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createShoppingListService(mockPrisma as any);
  });

  describe('generate', () => {
    it('should aggregate ingredients from meal plan', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        {
          recipe: {
            id: 'r1',
            ingredients: [
              { name: 'Huevos', quantity: 4, unit: 'unidades' },
              { name: 'Patatas', quantity: 2, unit: 'kg' },
            ],
          },
        },
        {
          recipe: {
            id: 'r2',
            ingredients: [
              { name: 'huevos', quantity: 6, unit: 'unidades' },
            ],
          },
        },
      ]);

      mockPrisma.shoppingList.count.mockResolvedValue(0);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl1',
        ...data,
        items: (data.items as any).create.map((item: any, i: number) => ({
          id: `sli${i}`,
          ...item,
        })),
      }));

      const result = await service.generate('h1', {
        name: 'Semana 1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      const createCall = mockPrisma.shoppingList.create.mock.calls[0][0];
      const items = (createCall.data.items as any).create;

      const eggs = items.find((i: any) => i.name.toLowerCase() === 'huevos');
      expect(eggs.quantity).toBe(10);

      const potatoes = items.find((i: any) => i.name.toLowerCase() === 'patatas');
      expect(potatoes.quantity).toBe(2);
    });

    it('assigns lavender for the first list in the household', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
      mockPrisma.shoppingList.count.mockResolvedValue(0);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl1',
        ...data,
        items: [],
      }));

      await service.generate('h1', {
        name: 'Semana 2',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      const accentKey = mockPrisma.shoppingList.create.mock.calls[0][0].data.accentKey;
      expect(accentKey).toBe('lavender');
    });

    it('assigns the next color in the fixed cycle when creating another list', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([]);
      mockPrisma.shoppingList.count.mockResolvedValue(3);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl2',
        ...data,
        items: [],
      }));

      await service.generate('h1', {
        name: 'Semana 3',
        startDate: '2024-01-22',
        endDate: '2024-01-28',
      });

      const accentKey = mockPrisma.shoppingList.create.mock.calls[0][0].data.accentKey;
      expect(accentKey).toBe('cyan'); // 4th list → index 3
    });
  });

  describe('list', () => {
    it('should return all shopping lists', async () => {
      mockPrisma.shoppingList.findMany.mockResolvedValue([
        { id: 'sl1', name: 'Semana 1', accentKey: 'mint', createdAt: new Date(), items: [] },
      ]);

      const result = await service.list('h1');
      expect(result).toHaveLength(1);
    });

    it('reassigns accent keys when every list still has the default peach', async () => {
      mockPrisma.shoppingList.findMany.mockResolvedValue([
        {
          id: 'sl1',
          name: 'A',
          accentKey: 'peach',
          createdAt: new Date('2024-01-01'),
          items: [],
        },
        {
          id: 'sl2',
          name: 'B',
          accentKey: 'peach',
          createdAt: new Date('2024-01-02'),
          items: [],
        },
      ]);
      mockPrisma.shoppingList.update.mockImplementation(async ({ data }) => data);

      const result = await service.list('h1');

      expect(mockPrisma.shoppingList.update).toHaveBeenCalled();
      expect(result.find((l) => l.id === 'sl1')?.accentKey).toBe('lavender');
      expect(result.find((l) => l.id === 'sl2')?.accentKey).toBe('mint');
    });
  });

  describe('addManualItem', () => {
    it('should add a manual item', async () => {
      mockPrisma.shoppingList.findFirst.mockResolvedValue({ id: 'sl1' });
      mockPrisma.shoppingListItem.create.mockResolvedValue({
        id: 'sli1',
        name: 'Pan',
        isManual: true,
      });

      const result = await service.addManualItem('sl1', 'h1', { name: 'Pan' });
      expect(result.isManual).toBe(true);
    });

    it('should throw if list does not belong to household', async () => {
      mockPrisma.shoppingList.findFirst.mockResolvedValue(null);
      await expect(service.addManualItem('sl1', 'other', { name: 'Pan' })).rejects.toThrow('Lista de la compra no encontrada');
    });
  });

  describe('toggleItem', () => {
    it('should toggle checked status', async () => {
      mockPrisma.shoppingListItem.findFirst.mockResolvedValue({
        id: 'sli1',
        checked: false,
      });
      mockPrisma.shoppingListItem.update.mockResolvedValue({
        id: 'sli1',
        checked: true,
      });

      const result = await service.toggleItem('sli1', 'h1');
      expect(result.checked).toBe(true);
    });

    it('should throw if item not found', async () => {
      mockPrisma.shoppingListItem.findFirst.mockResolvedValue(null);
      await expect(service.toggleItem('x', 'h1')).rejects.toThrow('Articulo no encontrado');
    });
  });

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      mockPrisma.shoppingListItem.findFirst.mockResolvedValue({ id: 'sli1' });
      mockPrisma.shoppingListItem.delete.mockResolvedValue({ id: 'sli1' });
      await service.deleteItem('sli1', 'h1');
      expect(mockPrisma.shoppingListItem.delete).toHaveBeenCalledWith({ where: { id: 'sli1' } });
    });

    it('should throw if item does not belong to household', async () => {
      mockPrisma.shoppingListItem.findFirst.mockResolvedValue(null);
      await expect(service.deleteItem('sli1', 'other')).rejects.toThrow('Articulo no encontrado');
    });
  });

  describe('generate with pantry', () => {
    it('should deduct pantry stock from generated list', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        {
          recipe: {
            id: 'r1',
            ingredients: [
              { name: 'Pasta', quantity: 500, unit: 'g' },
              { name: 'Tomate', quantity: 3, unit: 'unidades' },
            ],
          },
        },
      ]);

      mockPrisma.pantryItem.findMany.mockResolvedValue([
        { id: 'p1', name: 'Pasta', quantity: 200, unit: 'g', householdId: 'h1' },
      ]);
      mockPrisma.shoppingList.count.mockResolvedValue(0);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl1',
        ...data,
        items: (data.items as any).create.map((item: any, i: number) => ({
          id: `sli${i}`,
          ...item,
        })),
      }));

      const result = await serviceWithPantry.generate('h1', {
        name: 'Semana 1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      const createCall = mockPrisma.shoppingList.create.mock.calls[0][0];
      const items = (createCall.data.items as any).create;
      const pasta = items.find((i: any) => i.name === 'Pasta');
      expect(pasta.quantity).toBe(300);

      expect(result.pantrySubtractions).toEqual([
        { name: 'Pasta', quantity: 200, unit: 'g' },
      ]);
    });

    it('should exclude item fully covered by pantry', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        {
          recipe: {
            id: 'r1',
            ingredients: [
              { name: 'Huevos', quantity: 6, unit: 'unidades' },
            ],
          },
        },
      ]);

      mockPrisma.pantryItem.findMany.mockResolvedValue([
        { id: 'p1', name: 'Huevos', quantity: 10, unit: 'unidades', householdId: 'h1' },
      ]);
      mockPrisma.shoppingList.count.mockResolvedValue(0);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl1',
        ...data,
        items: (data.items as any).create.map((item: any, i: number) => ({
          id: `sli${i}`,
          ...item,
        })),
      }));

      const result = await serviceWithPantry.generate('h1', {
        name: 'Semana 1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      const createCall = mockPrisma.shoppingList.create.mock.calls[0][0];
      const items = (createCall.data.items as any).create;
      expect(items).toHaveLength(0);

      expect(result.pantrySubtractions).toEqual([
        { name: 'Huevos', quantity: 6, unit: 'unidades' },
      ]);
    });

    it('should work without pantryService (retrocompatible)', async () => {
      mockPrisma.mealPlanItem.findMany.mockResolvedValue([
        {
          recipe: {
            id: 'r1',
            ingredients: [{ name: 'Leche', quantity: 1, unit: 'l' }],
          },
        },
      ]);

      mockPrisma.shoppingList.count.mockResolvedValue(0);
      mockPrisma.shoppingList.create.mockImplementation(async ({ data }) => ({
        id: 'sl1',
        ...data,
        items: (data.items as any).create.map((item: any, i: number) => ({
          id: `sli${i}`,
          ...item,
        })),
      }));

      const result = await service.generate('h1', {
        name: 'Semana 1',
        startDate: '2024-01-15',
        endDate: '2024-01-21',
      });

      expect(result.pantrySubtractions).toEqual([]);
    });
  });

  describe('checkItemWithPurchase', () => {
    const pastaItem = {
      id: 'sli1',
      name: 'Pasta',
      quantity: 300,
      unit: 'g',
      checked: false,
    };

    it('should mark item as checked without pantry interaction when no purchasedQuantity', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([{ ...pastaItem, quantity: 500 }]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });

      await serviceWithPantry.checkItemWithPurchase('h1', 'sli1');
      expect(mockPrisma.shoppingListItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['sli1'] } },
        data: { checked: true },
      });
      expect(mockPantry.add).not.toHaveBeenCalled();
    });

    it('should add surplus to pantry when purchasedQuantity exceeds needed', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([pastaItem]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });
      mockPantry.add.mockResolvedValue({ id: 'p1', name: 'Pasta', quantity: 200, unit: 'g' });

      await serviceWithPantry.checkItemWithPurchase('h1', 'sli1', 500);
      expect(mockPantry.add).toHaveBeenCalledWith('h1', {
        name: 'Pasta',
        quantity: 200,
        unit: 'g',
      });
    });

    it('should not create pantry item when exact quantity purchased', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([{ ...pastaItem, quantity: 500 }]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });

      await serviceWithPantry.checkItemWithPurchase('h1', 'sli1', 500);
      expect(mockPantry.add).not.toHaveBeenCalled();
    });

    it('should pass locationId to pantry when provided', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([pastaItem]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });
      mockPantry.add.mockResolvedValue({ id: 'p1', name: 'Pasta', quantity: 200, unit: 'g' });

      await serviceWithPantry.checkItemWithPurchase('h1', 'sli1', 500, 'loc1');
      expect(mockPantry.add).toHaveBeenCalledWith('h1', {
        name: 'Pasta',
        quantity: 200,
        unit: 'g',
        locationId: 'loc1',
      });
    });

    it('should not interact with pantry when item has no unit', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([
        { id: 'sli1', name: 'Pan', quantity: null, unit: null, checked: false },
      ]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });

      await serviceWithPantry.checkItemWithPurchase('h1', 'sli1', 2);
      expect(mockPantry.add).not.toHaveBeenCalled();
    });

    it('should add surplus once for grouped items with the same unit', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([
        { id: 'sli1', name: 'Huevos', quantity: 3, unit: 'uds', checked: false },
        { id: 'sli2', name: 'Huevos', quantity: 3, unit: 'uds', checked: false },
      ]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 2 });
      mockPantry.add.mockResolvedValue({ id: 'p1', name: 'Huevos', quantity: 6, unit: 'uds' });

      const result = await serviceWithPantry.checkGroupedItemsWithPurchase('h1', ['sli1', 'sli2'], 12);
      expect(mockPantry.add).toHaveBeenCalledWith('h1', {
        name: 'Huevos',
        quantity: 6,
        unit: 'uds',
      });
      expect(result.pantryAdded).toEqual({
        name: 'Huevos',
        quantity: 6,
        unit: 'uds',
      });
    });

    it('should add full purchased quantity when list items have no needed amount', async () => {
      const mockPantry = createMockPantryService();
      const serviceWithPantry = createShoppingListService(mockPrisma as any, mockPantry as any);

      mockPrisma.shoppingListItem.findMany.mockResolvedValue([
        { id: 'sli1', name: 'Sal', quantity: null, unit: 'g', checked: false },
      ]);
      mockPrisma.shoppingListItem.updateMany.mockResolvedValue({ count: 1 });
      mockPantry.add.mockResolvedValue({ id: 'p1', name: 'Sal', quantity: 500, unit: 'g' });

      await serviceWithPantry.checkGroupedItemsWithPurchase('h1', ['sli1'], 500, 'loc1');
      expect(mockPantry.add).toHaveBeenCalledWith('h1', {
        name: 'Sal',
        quantity: 500,
        unit: 'g',
        locationId: 'loc1',
      });
    });
  });
});
