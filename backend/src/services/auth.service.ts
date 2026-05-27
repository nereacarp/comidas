import bcrypt from 'bcryptjs';
import type { PrismaClientType } from '../lib/prisma.js';
import type { RegisterInput, LoginInput } from '../types/index.js';

export function createAuthService(prisma: PrismaClientType) {
  return {
    async register(input: RegisterInput) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new Error('El email ya esta registrado');
      }
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
        },
        select: { id: true, email: true, name: true, showCalories: true, createdAt: true },
      });
      return user;
    },

    async login(input: LoginInput) {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new Error('Credenciales incorrectas');
      }
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error('Credenciales incorrectas');
      }
      return { id: user.id, email: user.email, name: user.name, showCalories: user.showCalories };
    },

    async getProfile(userId: string) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          showCalories: true,
          createdAt: true,
          households: {
            include: { household: true },
          },
        },
      });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    },

    async updatePreferences(userId: string, showCalories: boolean) {
      return prisma.user.update({
        where: { id: userId },
        data: { showCalories },
        select: { id: true, email: true, name: true, showCalories: true, createdAt: true },
      });
    },

    async deleteAccount(userId: string, password: string) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new Error('Contraseña incorrecta');
      }

      const ownerMemberships = await prisma.householdMember.findMany({
        where: { userId, role: 'OWNER' },
        include: { household: { include: { _count: { select: { members: true } } } } },
      });

      for (const membership of ownerMemberships) {
        if (membership.household._count.members > 1) {
          throw new Error(
            'Eres propietario de un hogar con otros miembros. Elimina ese hogar o transfiere la propiedad antes de borrar tu cuenta.',
          );
        }
      }

      const memberships = await prisma.householdMember.findMany({
        where: { userId },
        select: { householdId: true },
      });

      const soleHouseholdIds = new Set<string>();
      for (const { householdId } of memberships) {
        const count = await prisma.householdMember.count({ where: { householdId } });
        if (count === 1) {
          soleHouseholdIds.add(householdId);
        }
      }

      await prisma.$transaction([
        ...[...soleHouseholdIds].map((householdId) =>
          prisma.household.delete({ where: { id: householdId } }),
        ),
        prisma.user.delete({ where: { id: userId } }),
      ]);
    },
  };
}

