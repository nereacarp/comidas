import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { PrismaClientType } from '../lib/prisma.js';
import { appPublicUrl, sendMail } from './mail.service.js';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function createAccountTokenService(prisma: PrismaClientType) {
  return {
    async sendVerification(userId: string, email: string) {
      const token = newToken();
      await prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } });
      await prisma.emailVerificationToken.create({
        data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) },
      });
      const url = `${appPublicUrl()}/verify-email?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: email,
        subject: 'Verifica tu cuenta de Comidas',
        text: `Verifica tu cuenta abriendo este enlace: ${url}`,
        html: `<p>Verifica tu cuenta de Comidas:</p><p><a href="${url}">Verificar mi correo</a></p>`,
      });
    },

    async verifyEmail(token: string) {
      const record = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: hashToken(token) },
      });
      if (!record || record.usedAt || record.expiresAt <= new Date()) {
        throw new Error('El enlace de verificación no es válido o ha caducado');
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
        prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      ]);
    },

    async requestPasswordReset(email: string) {
      const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
      if (!user || user.status === 'SUSPENDED') return;
      const token = newToken();
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      });
      const url = `${appPublicUrl()}/reset-password?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: user.email,
        subject: 'Restablece tu contraseña de Comidas',
        text: `Restablece tu contraseña abriendo este enlace durante la próxima hora: ${url}`,
        html: `<p>Restablece tu contraseña de Comidas:</p><p><a href="${url}">Elegir una contraseña nueva</a></p>`,
      });
    },

    async resetPassword(token: string, newPassword: string) {
      const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
      if (!record || record.usedAt || record.expiresAt <= new Date()) {
        throw new Error('El enlace para restablecer la contraseña no es válido o ha caducado');
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash, sessionVersion: { increment: 1 } },
        }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      ]);
    },
  };
}
