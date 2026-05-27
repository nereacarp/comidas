import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function householdGuard(
  request: FastifyRequest<{ Params: { householdId: string } }>,
  reply: FastifyReply
) {
  const { householdId } = request.params;
  const userId = request.user.id;

  const member = await prisma.householdMember.findUnique({
    where: { userId_householdId: { userId, householdId } },
  });

  if (!member) {
    return reply.status(403).send({ error: 'No eres miembro de este hogar' });
  }
}
