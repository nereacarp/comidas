import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { HouseholdRole } from '@prisma/client';
import type { PrismaClientType } from '../lib/prisma.js';
import { appPublicUrl } from './mail.service.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface CreateUserInvitationInput {
  email: string;
  name?: string;
  householdId?: string;
  role?: 'EDITOR' | 'VIEWER';
}

export interface AcceptUserInvitationInput {
  name: string;
  password: string;
}

export function createUserInvitationService(prisma: PrismaClientType) {
  return {
    async create(input: CreateUserInvitationInput, invitedByActor: string) {
      const email = normalizeEmail(input.email);
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existingUser) throw new Error('Ya existe una cuenta con este email');

      let household: { id: string; name: string } | null = null;
      if (input.householdId) {
        household = await prisma.household.findUnique({
          where: { id: input.householdId },
          select: { id: true, name: true },
        });
        if (!household) throw new Error('El hogar seleccionado no existe');
      }

      const token = newToken();
      const now = new Date();
      const role: HouseholdRole = input.role === 'EDITOR' ? 'EDITOR' : 'VIEWER';
      await prisma.userInvitation.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: now },
      });
      const invitation = await prisma.userInvitation.create({
        data: {
          email,
          name: input.name?.trim() || null,
          tokenHash: hashToken(token),
          invitedByActor: invitedByActor.slice(0, 100),
          householdId: household?.id,
          role,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          expiresAt: true,
          createdAt: true,
          household: { select: { id: true, name: true } },
        },
      });

      return {
        ...invitation,
        inviteUrl: `${appPublicUrl()}/accept-invitation?token=${encodeURIComponent(token)}`,
      };
    },

    async inspect(token: string) {
      const invitation = await prisma.userInvitation.findUnique({
        where: { tokenHash: hashToken(token) },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          expiresAt: true,
          usedAt: true,
          household: { select: { id: true, name: true } },
        },
      });
      if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date()) {
        throw new Error('La invitación no es válida o ha caducado');
      }
      const { usedAt: _usedAt, ...safeInvitation } = invitation;
      return safeInvitation;
    },

    async accept(token: string, input: AcceptUserInvitationInput) {
      const tokenHash = hashToken(token);
      const invitation = await prisma.userInvitation.findUnique({ where: { tokenHash } });
      const now = new Date();
      if (!invitation || invitation.usedAt || invitation.expiresAt <= now) {
        throw new Error('La invitación no es válida o ha caducado');
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      return prisma.$transaction(async (transaction) => {
        const consumed = await transaction.userInvitation.updateMany({
          where: { id: invitation.id, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now },
        });
        if (consumed.count !== 1) throw new Error('La invitación ya se ha utilizado');

        const existingUser = await transaction.user.findFirst({
          where: { email: { equals: invitation.email, mode: 'insensitive' } },
          select: { id: true },
        });
        if (existingUser) throw new Error('Ya existe una cuenta con este email');

        const user = await transaction.user.create({
          data: {
            email: invitation.email,
            name: input.name.trim(),
            passwordHash,
            emailVerifiedAt: now,
            households: invitation.householdId
              ? { create: { householdId: invitation.householdId, role: invitation.role } }
              : undefined,
          },
          select: {
            id: true,
            email: true,
            name: true,
            showCalories: true,
            sessionVersion: true,
            emailVerifiedAt: true,
            status: true,
            createdAt: true,
          },
        });

        if (invitation.householdId) {
          await transaction.householdInvitation.updateMany({
            where: {
              householdId: invitation.householdId,
              email: invitation.email,
              status: 'PENDING',
            },
            data: { status: 'ACCEPTED', respondedAt: now },
          });
        }
        return user;
      });
    },
  };
}
