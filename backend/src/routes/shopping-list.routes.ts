import type { FastifyInstance } from 'fastify';
import { createShoppingListService } from '../services/shopping-list.service.js';
import { createPantryService } from '../services/pantry.service.js';
import { prisma } from '../lib/prisma.js';
import {
  generateShoppingListSchema,
  addManualItemSchema,
  checkItemSchema,
  checkGroupedItemsSchema,
} from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';

export async function shoppingListRoutes(fastify: FastifyInstance) {
  const pantryService = createPantryService(prisma);
  const shoppingListService = createShoppingListService(prisma, pantryService);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/shopping-lists/generate',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = generateShoppingListSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const list = await shoppingListService.generate(request.params.householdId, parsed.data);
      return reply.status(201).send(list);
    }
  );

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId/shopping-lists',
    { preHandler: [householdGuard] },
    async (request) => {
      return shoppingListService.list(request.params.householdId);
    }
  );

  fastify.get<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId',
    { preHandler: [householdGuard] },
    async (request) => {
      return shoppingListService.getById(request.params.listId, request.params.householdId);
    }
  );

  fastify.post<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId/items',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = addManualItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const item = await shoppingListService.addManualItem(request.params.listId, request.params.householdId, parsed.data);
      return reply.status(201).send(item);
    }
  );

  fastify.put<{ Params: { householdId: string; listId: string; itemId: string } }>(
    '/households/:householdId/shopping-lists/:listId/items/:itemId/toggle',
    { preHandler: [householdGuard, canEditGuard] },
    async (request) => {
      return shoppingListService.toggleItem(request.params.itemId, request.params.householdId);
    }
  );

  fastify.delete<{ Params: { householdId: string; listId: string; itemId: string } }>(
    '/households/:householdId/shopping-lists/:listId/items/:itemId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await shoppingListService.deleteItem(request.params.itemId, request.params.householdId);
      return reply.status(204).send();
    }
  );

  fastify.delete<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await shoppingListService.deleteList(request.params.listId, request.params.householdId);
      return reply.status(204).send();
    }
  );

  fastify.put<{ Params: { householdId: string; listId: string; itemId: string } }>(
    '/households/:householdId/shopping-lists/:listId/items/:itemId/check',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = checkItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const { items } = await shoppingListService.checkGroupedItemsWithPurchase(
        request.params.householdId,
        [request.params.itemId],
        parsed.data.purchasedQuantity,
        parsed.data.locationId?.trim() || undefined,
      );
      return items[0];
    }
  );

  fastify.put<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId/items/check-group',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = checkGroupedItemsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return shoppingListService.checkGroupedItemsWithPurchase(
        request.params.householdId,
        parsed.data.itemIds,
        parsed.data.purchasedQuantity,
        parsed.data.locationId?.trim() || undefined,
      );
    }
  );

  fastify.post<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId/share',
    { preHandler: [householdGuard, canEditGuard] },
    async (request) => {
      return shoppingListService.createShareToken(request.params.listId, request.params.householdId);
    }
  );

  fastify.delete<{ Params: { householdId: string; listId: string } }>(
    '/households/:householdId/shopping-lists/:listId/share',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await shoppingListService.removeShareToken(request.params.listId, request.params.householdId);
      return reply.status(204).send();
    }
  );
}
