import { IncomingMessage, ServerResponse } from 'http';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import authPlugin from '../src/plugins/auth.js';
import { authRoutes } from '../src/routes/auth.routes.js';
import { householdRoutes } from '../src/routes/household.routes.js';
import { householdInvitationRoutes } from '../src/routes/household-invitation.routes.js';
import { recipeRoutes } from '../src/routes/recipe.routes.js';
import { tagRoutes } from '../src/routes/tag.routes.js';
import { favoriteRoutes } from '../src/routes/favorite.routes.js';
import { mealPlanRoutes } from '../src/routes/meal-plan.routes.js';
import { shoppingListRoutes } from '../src/routes/shopping-list.routes.js';
import { pantryRoutes } from '../src/routes/pantry.routes.js';
import { storageLocationRoutes } from '../src/routes/storage-location.routes.js';
import { adminRoutes } from '../src/routes/admin.routes.js';
import { publicRoutes } from '../src/routes/public.routes.js';
import { validateEnvironment } from '../src/lib/env.js';

validateEnvironment();

const fastify = Fastify({
  logger: false,
  bodyLimit: 1024 * 1024,
  trustProxy: true,
});

let initialized = false;

async function initializeFastify() {
  if (initialized) return fastify;

  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  });

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  await fastify.register(cookie);

  fastify.addHook('onRequest', async (request, reply) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      return reply.status(403).send({ error: 'Origen no autorizado' });
    }
  });

  await fastify.register(authPlugin);
  await fastify.register(authRoutes);
  await fastify.register(householdRoutes);
  await fastify.register(householdInvitationRoutes);
  await fastify.register(recipeRoutes);
  await fastify.register(tagRoutes);
  await fastify.register(favoriteRoutes);
  await fastify.register(mealPlanRoutes);
  await fastify.register(shoppingListRoutes);
  await fastify.register(pantryRoutes);
  await fastify.register(storageLocationRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(publicRoutes);

  fastify.get('/health', async () => ({ ok: true, uptime: process.uptime() }));

  initialized = true;
  return fastify;
}

export default async (req: IncomingMessage, res: ServerResponse) => {
  const app = await initializeFastify();
  await app.ready();
  app.server.emit('request', req, res);
};
