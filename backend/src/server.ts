import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { householdRoutes } from './routes/household.routes.js';
import { householdInvitationRoutes } from './routes/household-invitation.routes.js';
import { recipeRoutes } from './routes/recipe.routes.js';
import { tagRoutes } from './routes/tag.routes.js';
import { favoriteRoutes } from './routes/favorite.routes.js';
import { mealPlanRoutes } from './routes/meal-plan.routes.js';
import { shoppingListRoutes } from './routes/shopping-list.routes.js';
import { pantryRoutes } from './routes/pantry.routes.js';
import { storageLocationRoutes } from './routes/storage-location.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { publicRoutes } from './routes/public.routes.js';
import { validateEnvironment } from './lib/env.js';

validateEnvironment();

const fastify = Fastify({
  logger: true,
  bodyLimit: 1024 * 1024,
  trustProxy: process.env.VERCEL
    ? true
    : process.env.NODE_ENV === 'production'
    ? ['loopback', 'linklocal', 'uniquelocal']
    : false,
});

async function start() {
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

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must be set in production');
  }

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

  const port = Number(process.env.PORT) || 3001;
  await fastify.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
