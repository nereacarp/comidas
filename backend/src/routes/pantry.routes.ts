import type { FastifyInstance } from 'fastify';
import { createPantryService } from '../services/pantry.service.js';
import { prisma } from '../lib/prisma.js';
import { getIngredientNameSuggestions } from '../lib/ingredient-name-suggestions.js';
import { addPantryItemSchema, updatePantryItemSchema } from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';

export async function pantryRoutes(fastify: FastifyInstance) {
  const pantryService = createPantryService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId/pantry',
    { preHandler: [householdGuard] },
    async (request) => {
      return pantryService.list(request.params.householdId);
    }
  );

  fastify.get<{ Params: { householdId: string }; Querystring: { q?: string } }>(
    '/households/:householdId/ingredient-names',
    { preHandler: [householdGuard] },
    async (request) => {
      return getIngredientNameSuggestions(
        prisma,
        request.params.householdId,
        request.query.q,
      );
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/pantry',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = addPantryItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const item = await pantryService.add(request.params.householdId, parsed.data);
      return reply.status(201).send(item);
    }
  );

  fastify.put<{ Params: { householdId: string; itemId: string } }>(
    '/households/:householdId/pantry/:itemId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = updatePantryItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return pantryService.update(request.params.itemId, request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string; itemId: string } }>(
    '/households/:householdId/pantry/:itemId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await pantryService.delete(request.params.itemId, request.params.householdId);
      return reply.status(204).send();
    }
  );
}
