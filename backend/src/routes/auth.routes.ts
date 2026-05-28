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
} from '../lib/validation.js';

const authRateLimiter = createAuthRateLimiter();

export async function authRoutes(fastify: FastifyInstance) {
  const authService = createAuthService(prisma);

  fastify.post('/auth/register', async (request, reply) => {
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
      const token = fastify.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '30d' });
      return reply.status(201).send({ user, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      return reply.status(409).send({ error: message });
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
      const token = fastify.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '30d' });
      return reply.send({ user, token });
    } catch (error) {
      authRateLimiter.loginFailed(email);
      const message =
        error instanceof Error && error.message === 'Credenciales incorrectas'
          ? authRateLimiter.loginFailureMessage(email)
          : error instanceof Error
            ? error.message
            : 'Error al iniciar sesion';
      return reply.status(401).send({ error: message });
    }
  });

  fastify.get('/auth/profile', { onRequest: [fastify.authenticate] }, async (request) => {
    return authService.getProfile(request.user.id);
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
