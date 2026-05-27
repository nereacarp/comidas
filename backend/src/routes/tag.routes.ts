import type { FastifyInstance } from 'fastify';
import { createTagService } from '../services/tag.service.js';
import { prisma } from '../lib/prisma.js';
import { createTagSchema } from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';

export async function tagRoutes(fastify: FastifyInstance) {
  const tagService = createTagService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/tags',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createTagSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        const tag = await tagService.create(request.params.householdId, parsed.data);
        return reply.status(201).send(tag);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al crear etiqueta';
        return reply.status(409).send({ error: message });
      }
    }
  );

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId/tags',
    { preHandler: [householdGuard] },
    async (request) => {
      return tagService.list(request.params.householdId);
    }
  );

  fastify.put<{ Params: { householdId: string; tagId: string } }>(
    '/households/:householdId/tags/:tagId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createTagSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return tagService.update(request.params.tagId, request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string; tagId: string } }>(
    '/households/:householdId/tags/:tagId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await tagService.delete(request.params.tagId, request.params.householdId);
      return reply.status(204).send();
    }
  );
}
