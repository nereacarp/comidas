import type { PrismaClientType } from '../lib/prisma.js';
import type { AddMemberInput } from '../types/index.js';

const invitationInclude = {
  household: { select: { id: true, name: true } },
  invitedBy: { select: { id: true, name: true, email: true } },
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createHouseholdInvitationService(prisma: PrismaClientType) {
  return {
    async invite(householdId: string, invitedById: string, input: AddMemberInput) {
      const email = normalizeEmail(input.email);
      const role = input.role === 'VIEWER' ? 'VIEWER' : 'EDITOR';

      const inviter = await prisma.user.findUnique({ where: { id: invitedById } });
      if (!inviter) {
        throw new Error('Usuario no encontrado');
      }
      if (normalizeEmail(inviter.email) === email) {
        throw new Error('No puedes invitarte a ti mismo');
      }

      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const existingMember = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId: user.id, householdId } },
      });
      if (existingMember) {
        throw new Error('El usuario ya es miembro');
      }

      const existingInvite = await prisma.householdInvitation.findUnique({
        where: { householdId_email: { householdId, email } },
      });

      if (existingInvite?.status === 'PENDING') {
        throw new Error('Ya hay una invitación pendiente para este email');
      }

      if (existingInvite) {
        return prisma.householdInvitation.update({
          where: { id: existingInvite.id },
          data: {
            role,
            status: 'PENDING',
            invitedById,
            respondedAt: null,
          },
          include: invitationInclude,
        });
      }

      return prisma.householdInvitation.create({
        data: {
          householdId,
          email,
          role,
          invitedById,
        },
        include: invitationInclude,
      });
    },

    async listPendingForUser(userEmail: string) {
      const email = normalizeEmail(userEmail);
      return prisma.householdInvitation.findMany({
        where: { email, status: 'PENDING' },
        include: invitationInclude,
        orderBy: { createdAt: 'desc' },
      });
    },

    async listPendingForHousehold(householdId: string) {
      return prisma.householdInvitation.findMany({
        where: { householdId, status: 'PENDING' },
        include: invitationInclude,
        orderBy: { createdAt: 'desc' },
      });
    },

    async accept(invitationId: string, userId: string, userEmail: string) {
      const invitation = await prisma.householdInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation || invitation.status !== 'PENDING') {
        throw new Error('Invitación no encontrada');
      }
      if (normalizeEmail(invitation.email) !== normalizeEmail(userEmail)) {
        throw new Error('No puedes aceptar esta invitación');
      }

      const existingMember = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: { userId, householdId: invitation.householdId },
        },
      });
      if (existingMember) {
        await prisma.householdInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        });
        throw new Error('Ya perteneces a este hogar');
      }

      const [, member] = await prisma.$transaction([
        prisma.householdInvitation.update({
          where: { id: invitationId },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        }),
        prisma.householdMember.create({
          data: {
            userId,
            householdId: invitation.householdId,
            role: invitation.role,
          },
          include: { user: { select: { id: true, email: true, name: true } } },
        }),
      ]);

      return member;
    },

    async decline(invitationId: string, userEmail: string) {
      const invitation = await prisma.householdInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation || invitation.status !== 'PENDING') {
        throw new Error('Invitación no encontrada');
      }
      if (normalizeEmail(invitation.email) !== normalizeEmail(userEmail)) {
        throw new Error('No puedes rechazar esta invitación');
      }

      return prisma.householdInvitation.update({
        where: { id: invitationId },
        data: { status: 'DECLINED', respondedAt: new Date() },
        include: invitationInclude,
      });
    },

    async cancel(invitationId: string, householdId: string) {
      const invitation = await prisma.householdInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation || invitation.householdId !== householdId || invitation.status !== 'PENDING') {
        throw new Error('Invitación no encontrada');
      }
      return prisma.householdInvitation.delete({ where: { id: invitationId } });
    },
  };
}
