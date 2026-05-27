import type { FastifyInstance } from 'fastify';
import { createStorageLocationService } from '../services/storage-location.service.js';
import { prisma } from '../lib/prisma.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';
import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal invalido')
  .optional();

const createLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  icon: z.string().max(32).optional(),
  color: hexColorSchema,
});

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().max(32).optional(),
  color: hexColorSchema,
});

const reorderLocationsSchema = z.object({
  placements: z
    .array(
      z.object({
        id: z.string().min(1),
        column: z.number().int().min(0).max(9),
        row: z.number().int().min(0),
      }),
    )
    .min(1),
});

export async function storageLocationRoutes(fastify: FastifyInstance) {
  const locationService = createStorageLocationService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId/storage-locations',
    { preHandler: [householdGuard] },
    async (request) => {
      await locationService.ensureDefaults(request.params.householdId);
      return locationService.list(request.params.householdId);
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/storage-locations',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createLocationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const item = await locationService.create(request.params.householdId, parsed.data);
      return reply.status(201).send(item);
    }
  );

  fastify.put<{ Params: { householdId: string } }>(
    '/households/:householdId/storage-locations/reorder',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = reorderLocationsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        return await locationService.reorder(
          request.params.householdId,
          parsed.data.placements,
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'UBICACIONES_INVALIDAS') {
          return reply.status(400).send({
            error:
              'Lista de ubicaciones no valida (debe incluir todas las ubicaciones del hogar)',
          });
        }
        throw err;
      }
    },
  );

  fastify.put<{ Params: { householdId: string; locationId: string } }>(
    '/households/:householdId/storage-locations/:locationId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = updateLocationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return locationService.update(request.params.locationId, request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string; locationId: string } }>(
    '/households/:householdId/storage-locations/:locationId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await locationService.delete(request.params.locationId, request.params.householdId);
      return reply.status(204).send();
    }
  );
}
