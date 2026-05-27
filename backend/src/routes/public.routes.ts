import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createShoppingListService } from '../services/shopping-list.service.js';
import { prisma } from '../lib/prisma.js';

const ipCounters = new Map<string, { count: number; resetAt: number }>();

function checkPublicRateLimit(request: FastifyRequest, max: number): boolean {
  const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
  const now = Date.now();
  const state = ipCounters.get(ip);
  if (!state || now > state.resetAt) {
    ipCounters.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (state.count >= max) return false;
  state.count++;
  return true;
}

export async function publicRoutes(fastify: FastifyInstance) {
  const shoppingListService = createShoppingListService(prisma);

  fastify.get<{ Params: { token: string } }>(
    '/public/shopping-lists/:token',
    async (request, reply) => {
      if (!checkPublicRateLimit(request, 60)) {
        return reply.status(429).send({ error: 'Demasiadas peticiones. Espera un momento.' });
      }
      try {
        const list = await shoppingListService.getByShareToken(request.params.token);
        return list;
      } catch {
        return reply.status(404).send({ error: 'Lista no encontrada' });
      }
    }
  );

  fastify.put<{ Params: { token: string; itemId: string } }>(
    '/public/shopping-lists/:token/items/:itemId/toggle',
    async (request, reply) => {
      if (!checkPublicRateLimit(request, 30)) {
        return reply.status(429).send({ error: 'Demasiadas peticiones. Espera un momento.' });
      }
      try {
        return await shoppingListService.toggleItemByShareToken(
          request.params.token,
          request.params.itemId
        );
      } catch {
        return reply.status(404).send({ error: 'No encontrado' });
      }
    }
  );
}
