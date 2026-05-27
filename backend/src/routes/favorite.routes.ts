import type { FastifyInstance } from 'fastify';
import { createFavoriteService } from '../services/favorite.service.js';
import { prisma } from '../lib/prisma.js';
import { toggleFavoriteSchema } from '../lib/validation.js';

export async function favoriteRoutes(fastify: FastifyInstance) {
  const favoriteService = createFavoriteService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/favorites/toggle', async (request, reply) => {
    const parsed = toggleFavoriteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    try {
      return await favoriteService.toggle(request.user.id, parsed.data.recipeId);
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 403 || statusCode === 404) {
        return reply.status(statusCode).send({ error: (err as Error).message });
      }
      throw err;
    }
  });

  fastify.get('/favorites', async (request) => {
    return favoriteService.list(request.user.id);
  });
}
