import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
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

const fastify = Fastify({ logger: true });

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
  });

  // Fix: browser translation extensions modify the body without updating Content-Length
  fastify.addHook('preParsing', async (request) => {
    delete (request.headers as Record<string, unknown>)['content-length'];
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
