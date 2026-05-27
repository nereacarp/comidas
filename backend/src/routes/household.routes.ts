import type { FastifyInstance } from 'fastify';
import { createHouseholdService } from '../services/household.service.js';
import { createHouseholdInvitationService } from '../services/household-invitation.service.js';
import { prisma } from '../lib/prisma.js';
import { createHouseholdSchema, addMemberSchema, updateMemberRoleSchema } from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';

export async function householdRoutes(fastify: FastifyInstance) {
  const householdService = createHouseholdService(prisma);
  const invitationService = createHouseholdInvitationService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/households', async (request, reply) => {
    const parsed = createHouseholdSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const household = await householdService.create(parsed.data, request.user.id);
    return reply.status(201).send(household);
  });

  fastify.get('/households', async (request) => {
    return householdService.getUserHouseholds(request.user.id);
  });

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId',
    { preHandler: [householdGuard] },
    async (request) => {
      return householdService.getById(request.params.householdId);
    }
  );

  fastify.put<{ Params: { householdId: string } }>(
    '/households/:householdId',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const canEdit = await householdService.canEdit(
        request.params.householdId,
        request.user.id
      );
      if (!canEdit) {
        return reply.status(403).send({ error: 'No tienes permiso para editar el hogar' });
      }
      const parsed = createHouseholdSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return householdService.update(request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string } }>(
    '/households/:householdId',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden eliminar un hogar' });
      }
      await householdService.delete(request.params.householdId);
      return reply.status(204).send();
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/members',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id,
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden invitar miembros' });
      }
      const parsed = addMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        const invitation = await invitationService.invite(
          request.params.householdId,
          request.user.id,
          parsed.data,
        );
        return reply.status(201).send(invitation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al invitar miembro';
        return reply.status(400).send({ error: message });
      }
    }
  );

  fastify.patch<{ Params: { householdId: string; userId: string } }>(
    '/households/:householdId/members/:userId',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden cambiar roles' });
      }
      const parsed = updateMemberRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        const member = await householdService.updateMemberRole(
          request.params.householdId,
          request.params.userId,
          parsed.data
        );
        return reply.send(member);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cambiar rol';
        return reply.status(400).send({ error: message });
      }
    }
  );

  fastify.delete<{ Params: { householdId: string; userId: string } }>(
    '/households/:householdId/members/:userId',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden eliminar miembros' });
      }
      try {
        await householdService.removeMember(
          request.params.householdId,
          request.params.userId
        );
        return reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al eliminar miembro';
        return reply.status(400).send({ error: message });
      }
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/leave',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      try {
        await householdService.leaveHousehold(
          request.params.householdId,
          request.user.id
        );
        return reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al salir del hogar';
        return reply.status(400).send({ error: message });
      }
    }
  );
}
