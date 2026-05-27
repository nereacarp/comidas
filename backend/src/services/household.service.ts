import type { PrismaClientType } from '../lib/prisma.js';
import { pickRandomHouseholdAccentKey, planHouseholdAccentUpdates } from '../lib/list-accent.js';
import type { CreateHouseholdInput, UpdateMemberRoleInput } from '../types/index.js';

export function createHouseholdService(prisma: PrismaClientType) {
  return {
    async create(input: CreateHouseholdInput, userId: string) {
      const memberships = await prisma.householdMember.findMany({
        where: { userId },
        select: { household: { select: { accentKey: true } } },
      });
      const existingKeys = memberships.map((m) => m.household.accentKey);
      const accentKey = pickRandomHouseholdAccentKey(existingKeys);

      const household = await prisma.household.create({
        data: {
          name: input.name,
          accentKey,
          members: {
            create: { userId, role: 'OWNER' },
          },
        },
        include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } },
      });
      return household;
    },

    async getUserHouseholds(userId: string) {
      const memberships = await prisma.householdMember.findMany({
        where: { userId },
        include: {
          household: {
            include: {
              members: {
                include: { user: { select: { id: true, email: true, name: true } } },
              },
            },
          },
        },
      });

      const households = memberships.map((m) => m.household);
      const accentUpdates = planHouseholdAccentUpdates(households);

      if (accentUpdates.size > 0) {
        await prisma.$transaction(
          [...accentUpdates.entries()].map(([id, accentKey]) =>
            prisma.household.update({ where: { id }, data: { accentKey } }),
          ),
        );
        for (const h of households) {
          const next = accentUpdates.get(h.id);
          if (next) h.accentKey = next;
        }
      }

      return memberships.map((m) => ({
        ...m.household,
        role: m.role,
      }));
    },

    async getById(householdId: string) {
      const household = await prisma.household.findUnique({
        where: { id: householdId },
        include: {
          members: {
            include: { user: { select: { id: true, email: true, name: true } } },
          },
        },
      });
      if (!household) {
        throw new Error('Hogar no encontrado');
      }
      return household;
    },

    async update(householdId: string, input: CreateHouseholdInput) {
      return prisma.household.update({
        where: { id: householdId },
        data: { name: input.name },
      });
    },

    async delete(householdId: string) {
      return prisma.household.delete({ where: { id: householdId } });
    },

    async updateMemberRole(householdId: string, userId: string, input: UpdateMemberRoleInput) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      if (!member) {
        throw new Error('Miembro no encontrado');
      }
      if (member.role === 'OWNER') {
        throw new Error('No se puede cambiar el rol del propietario');
      }
      return prisma.householdMember.update({
        where: { id: member.id },
        data: { role: input.role },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
    },

    async leaveHousehold(householdId: string, userId: string) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      if (!member) {
        throw new Error('Miembro no encontrado');
      }
      if (member.role === 'OWNER') {
        throw new Error('El propietario no puede abandonar el hogar');
      }
      return prisma.householdMember.delete({
        where: { id: member.id },
      });
    },

    async removeMember(householdId: string, userId: string) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      if (!member) {
        throw new Error('Miembro no encontrado');
      }
      if (member.role === 'OWNER') {
        throw new Error('No se puede eliminar al propietario del hogar');
      }
      return prisma.householdMember.delete({
        where: { id: member.id },
      });
    },

    async isMember(householdId: string, userId: string) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      return !!member;
    },

    async isOwner(householdId: string, userId: string) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      return member?.role === 'OWNER';
    },

    async canEdit(householdId: string, userId: string) {
      const member = await prisma.householdMember.findUnique({
        where: { userId_householdId: { userId, householdId } },
      });
      return !!member && member.role !== 'VIEWER';
    },
  };
}

