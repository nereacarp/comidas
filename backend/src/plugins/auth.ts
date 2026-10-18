import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; sessionVersion: number };
    user: { id: string; email: string; sessionVersion: number };
  }
}

async function authPlugin(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET?.trim() || 'dev-secret';

  await fastify.register(fjwt, {
    secret,
    sign: { expiresIn: '7d' },
    cookie: { cookieName: 'session', signed: false },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const session = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: { sessionVersion: true, status: true },
      });
      if (!session || session.status !== 'ACTIVE' || session.sessionVersion !== request.user.sessionVersion) {
        reply.clearCookie('session', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        return reply.status(401).send({ error: 'Sesión caducada' });
      }
    } catch {
      return reply.status(401).send({ error: 'No autorizado' });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin);
