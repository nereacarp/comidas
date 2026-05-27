import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function canEditGuard(
  request: FastifyRequest<{ Params: { householdId: string } }>,
  reply: FastifyReply
) {
  const { householdId } = request.params;
  const userId = request.user.id;

  const member = await prisma.householdMember.findUnique({
    where: { userId_householdId: { userId, householdId } },
  });

  if (!member || member.role === 'VIEWER') {
    return reply.status(403).send({ error: 'No tienes permiso para realizar esta acción' });
  }
}
