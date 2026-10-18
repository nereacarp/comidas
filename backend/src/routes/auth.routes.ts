import type { FastifyInstance } from 'fastify';
import { createAuthService } from '../services/auth.service.js';
import {
  createAuthRateLimiter,
  getClientIp,
  sendAuthRateLimitReply,
} from '../services/auth-rate-limit.service.js';
import { prisma } from '../lib/prisma.js';
import {
  registerSchema,
  loginSchema,
  updateUserPreferencesSchema,
  deleteAccountSchema,
  changePasswordSchema,
  emailOnlySchema,
  resetPasswordSchema,
  tokenSchema,
  inspectUserInvitationSchema,
  acceptUserInvitationSchema,
} from '../lib/validation.js';
import { createAccountTokenService } from '../services/account-token.service.js';
import { createUserInvitationService } from '../services/user-invitation.service.js';

const authRateLimiter = createAuthRateLimiter();
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function setSessionCookie(reply: import('fastify').FastifyReply, token: string) {
  reply.setCookie('session', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

function clearSessionCookie(reply: import('fastify').FastifyReply) {
  reply.clearCookie('session', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  const authService = createAuthService(prisma);
  const accountTokens = createAccountTokenService(prisma);
  const userInvitations = createUserInvitationService(prisma);

  fastify.post('/auth/register', async (request, reply) => {
    if (process.env.NODE_ENV === 'production' && process.env.PUBLIC_REGISTRATION !== 'true') {
      return reply.status(403).send({ error: 'El registro público no está habilitado' });
    }
    const ip = getClientIp(request);
    const registerLimit = authRateLimiter.checkRegisterAttempt(ip);
    if (!registerLimit.allowed) {
      return sendAuthRateLimitReply(reply, registerLimit);
    }
    authRateLimiter.markRegisterAttempt(ip);

    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    try {
      const user = await authService.register(parsed.data);
      if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        await accountTokens.sendVerification(user.id, user.email);
        return reply.status(201).send({ requiresEmailVerification: true });
      }
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        sessionVersion: user.sessionVersion,
      });
      setSessionCookie(reply, token);
      return reply.status(201).send({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      return reply.status(409).send({ error: message });
    }
  });

  fastify.post('/auth/user-invitation/inspect', async (request, reply) => {
    const parsed = inspectUserInvitationSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    try {
      return reply.send(await userInvitations.inspect(parsed.data.token));
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'No se pudo consultar la invitación',
      });
    }
  });

  fastify.post('/auth/user-invitation/accept', async (request, reply) => {
    const parsed = acceptUserInvitationSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });

    const ip = getClientIp(request);
    const registerLimit = authRateLimiter.checkRegisterAttempt(ip);
    if (!registerLimit.allowed) return sendAuthRateLimitReply(reply, registerLimit);
    authRateLimiter.markRegisterAttempt(ip);

    try {
      const user = await userInvitations.accept(parsed.data.token, parsed.data);
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        sessionVersion: user.sessionVersion,
      });
      setSessionCookie(reply, token);
      return reply.status(201).send({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo aceptar la invitación';
      const status = message.includes('Ya existe') ? 409 : 400;
      return reply.status(status).send({ error: message });
    }
  });

  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const ip = getClientIp(request);
    const email = parsed.data.email;
    const loginLimit = authRateLimiter.checkLoginAttempt(ip, email);
    if (!loginLimit.allowed) {
      return sendAuthRateLimitReply(reply, loginLimit);
    }
    authRateLimiter.markLoginAttempt(email);

    try {
      const user = await authService.login(parsed.data);
      authRateLimiter.loginSucceeded(email);
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        sessionVersion: user.sessionVersion,
      });
      setSessionCookie(reply, token);
      return reply.send({ user });
    } catch (error) {
      authRateLimiter.loginFailed(email);
      const rawMessage = error instanceof Error ? error.message : 'Error al iniciar sesion';
      const message =
        rawMessage === 'Credenciales incorrectas'
          ? authRateLimiter.loginFailureMessage(email)
          : rawMessage;
      const status = rawMessage === 'Cuenta suspendida' ? 403 : 401;
      return reply.status(status).send({ error: message });
    }
  });

  fastify.post('/auth/verify-email', async (request, reply) => {
    const parsed = tokenSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    try {
      await accountTokens.verifyEmail(parsed.data.token);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'No se pudo verificar el correo' });
    }
  });

  fastify.post('/auth/resend-verification', async (request, reply) => {
    const parsed = emailOnlySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.email, mode: 'insensitive' } } });
    if (user && !user.emailVerifiedAt && user.status === 'ACTIVE') {
      await accountTokens.sendVerification(user.id, user.email);
    }
    return reply.status(204).send();
  });

  fastify.post('/auth/forgot-password', async (request, reply) => {
    const parsed = emailOnlySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    await accountTokens.requestPasswordReset(parsed.data.email);
    return reply.status(204).send();
  });

  fastify.post('/auth/reset-password', async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    try {
      await accountTokens.resetPassword(parsed.data.token, parsed.data.newPassword);
      clearSessionCookie(reply);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'No se pudo restablecer la contraseña' });
    }
  });

  fastify.get('/auth/profile', { onRequest: [fastify.authenticate] }, async (request) => {
    return authService.getProfile(request.user.id);
  });

  fastify.post('/auth/logout', async (_request, reply) => {
    clearSessionCookie(reply);
    return reply.status(204).send();
  });

  fastify.patch('/auth/preferences', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const parsed = updateUserPreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    try {
      const user = await authService.updatePreferences(request.user.id, parsed.data.showCalories);
      return { user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar preferencias';
      return reply.status(500).send({ error: message });
    }
  });

  fastify.get('/auth/export', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const data = await authService.exportUserData(request.user.id);
    reply.header('Content-Disposition', `attachment; filename="comidas-datos-${new Date().toISOString().slice(0, 10)}.json"`);
    return reply.send(data);
  });

  fastify.post('/auth/change-password', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    try {
      const session = await authService.changePassword(
        request.user.id,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      const token = fastify.jwt.sign({
        id: request.user.id,
        email: session.email,
        sessionVersion: session.sessionVersion,
      });
      setSessionCookie(reply, token);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña';
      return reply.status(message === 'Contraseña actual incorrecta' ? 401 : 400).send({ error: message });
    }
  });

  fastify.delete('/auth/account', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const parsed = deleteAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const ip = getClientIp(request);
    const userId = request.user.id;
    const deleteLimit = authRateLimiter.checkDeleteAccountAttempt(ip, userId);
    if (!deleteLimit.allowed) {
      return sendAuthRateLimitReply(reply, deleteLimit);
    }
    authRateLimiter.markDeleteAccountAttempt(userId);

    try {
      await authService.deleteAccount(userId, parsed.data.password);
      authRateLimiter.deleteAccountSucceeded(userId);
      clearSessionCookie(reply);
      return reply.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la cuenta';
      if (message === 'Contraseña incorrecta') {
        authRateLimiter.deleteAccountFailed(userId);
        return reply.status(401).send({ error: authRateLimiter.deleteAccountFailureMessage(userId) });
      }
      return reply.status(400).send({ error: message });
    }
  });
}
