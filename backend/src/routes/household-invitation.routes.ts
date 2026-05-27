import type { FastifyInstance } from 'fastify';
import { createHouseholdInvitationService } from '../services/household-invitation.service.js';
import { prisma } from '../lib/prisma.js';
import { householdGuard } from '../plugins/household-guard.js';

export async function householdInvitationRoutes(fastify: FastifyInstance) {
  const invitationService = createHouseholdInvitationService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/invitations/mine', async (request) => {
    return invitationService.listPendingForUser(request.user.email);
  });

  fastify.post<{ Params: { invitationId: string } }>(
    '/invitations/:invitationId/accept',
    async (request, reply) => {
      try {
        const member = await invitationService.accept(
          request.params.invitationId,
          request.user.id,
          request.user.email,
        );
        return reply.status(201).send(member);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al aceptar invitación';
        const status = message.includes('Ya perteneces') ? 409 : 400;
        return reply.status(status).send({ error: message });
      }
    },
  );

  fastify.post<{ Params: { invitationId: string } }>(
    '/invitations/:invitationId/decline',
    async (request, reply) => {
      try {
        const invitation = await invitationService.decline(
          request.params.invitationId,
          request.user.email,
        );
        return reply.send(invitation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al rechazar invitación';
        return reply.status(400).send({ error: message });
      }
    },
  );

  fastify.get<{ Params: { householdId: string } }>(
    '/households/:householdId/invitations',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const { createHouseholdService } = await import('../services/household.service.js');
      const householdService = createHouseholdService(prisma);
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id,
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden ver invitaciones' });
      }
      return invitationService.listPendingForHousehold(request.params.householdId);
    },
  );

  fastify.delete<{ Params: { householdId: string; invitationId: string } }>(
    '/households/:householdId/invitations/:invitationId',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const { createHouseholdService } = await import('../services/household.service.js');
      const householdService = createHouseholdService(prisma);
      const isOwner = await householdService.isOwner(
        request.params.householdId,
        request.user.id,
      );
      if (!isOwner) {
        return reply.status(403).send({ error: 'Solo los propietarios pueden cancelar invitaciones' });
      }
      try {
        await invitationService.cancel(
          request.params.invitationId,
          request.params.householdId,
        );
        return reply.status(204).send();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cancelar invitación';
        return reply.status(400).send({ error: message });
      }
    },
  );
}
