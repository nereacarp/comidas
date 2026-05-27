import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string };
    user: { id: string; email: string };
  }
}

async function authPlugin(fastify: FastifyInstance) {
  const secret = process.env.JWT_SECRET || 'dev-secret';

  if (process.env.NODE_ENV === 'production' && secret === 'dev-secret') {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }

  await fastify.register(fjwt, {
    secret,
    sign: { expiresIn: '7d' },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
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
