import { timingSafeEqual } from 'crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const MAX_PAGE_SIZE = 100;

function parseListParams(
  query: Record<string, string>,
  allowedSortFields: readonly string[],
  defaultSort: string,
) {
  const skip = Math.max(0, parseInt(query._start ?? '0') || 0);
  const end = Math.max(skip, parseInt(query._end ?? '10') || 10);
  const take = Math.min(end - skip, MAX_PAGE_SIZE);
  const sort = allowedSortFields.includes(query._sort ?? '') ? (query._sort as string) : defaultSort;
  const order = (query._order ?? 'DESC').toUpperCase() === 'ASC' ? 'asc' : ('desc' as const);
  return { skip, take, sort, order };
}

async function adminAuth(_request: FastifyRequest, reply: FastifyReply) {
  const auth = _request.headers.authorization;
  const expected = ADMIN_SECRET ? `Bearer ${ADMIN_SECRET}` : null;
  if (!expected || !auth) {
    return reply.status(401).send({ error: 'Acceso de administrador requerido' });
  }
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  const safe = a.length === b.length && timingSafeEqual(a, b);
  if (!safe) {
    return reply.status(401).send({ error: 'Acceso de administrador requerido' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', adminAuth);

  const USER_SORT_FIELDS = ['id', 'email', 'name', 'createdAt', 'updatedAt'] as const;
  const HOUSEHOLD_SORT_FIELDS = ['id', 'name', 'createdAt', 'updatedAt'] as const;
  const RECIPE_SORT_FIELDS = ['id', 'title', 'createdAt', 'updatedAt'] as const;
  const TAG_SORT_FIELDS = ['id', 'name', 'createdAt', 'updatedAt'] as const;

  // Users
  fastify.get('/admin/users', async (request, reply) => {
    const { skip, take, sort, order } = parseListParams(request.query as Record<string, string>, USER_SORT_FIELDS, 'createdAt');
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { [sort]: order },
        select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count(),
    ]);
    reply.header('Content-Range', `users ${skip}-${skip + users.length}/${total}`);
    reply.header('Access-Control-Expose-Headers', 'Content-Range');
    return users;
  });

  fastify.get<{ Params: { id: string } }>('/admin/users/:id', async (request) => {
    return prisma.user.findUniqueOrThrow({
      where: { id: request.params.id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  });

  fastify.delete<{ Params: { id: string } }>('/admin/users/:id', async (request, reply) => {
    await prisma.user.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });

  // Households
  fastify.get('/admin/households', async (request, reply) => {
    const { skip, take, sort, order } = parseListParams(request.query as Record<string, string>, HOUSEHOLD_SORT_FIELDS, 'createdAt');
    const [households, total] = await Promise.all([
      prisma.household.findMany({
        skip,
        take,
        orderBy: { [sort]: order },
        include: { _count: { select: { members: true, recipes: true } } },
      }),
      prisma.household.count(),
    ]);
    reply.header('Content-Range', `households ${skip}-${skip + households.length}/${total}`);
    reply.header('Access-Control-Expose-Headers', 'Content-Range');
    return households;
  });

  fastify.get<{ Params: { id: string } }>('/admin/households/:id', async (request) => {
    return prisma.household.findUniqueOrThrow({
      where: { id: request.params.id },
      include: {
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
        _count: { select: { recipes: true, tags: true, mealPlanItems: true, shoppingLists: true } },
      },
    });
  });

  fastify.delete<{ Params: { id: string } }>('/admin/households/:id', async (request, reply) => {
    await prisma.household.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });

  // Recipes
  fastify.get('/admin/recipes', async (request, reply) => {
    const { skip, take, sort, order } = parseListParams(request.query as Record<string, string>, RECIPE_SORT_FIELDS, 'createdAt');
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        skip,
        take,
        orderBy: { [sort]: order },
        include: { household: { select: { name: true } }, categories: true, _count: { select: { ingredients: true } } },
      }),
      prisma.recipe.count(),
    ]);
    reply.header('Content-Range', `recipes ${skip}-${skip + recipes.length}/${total}`);
    reply.header('Access-Control-Expose-Headers', 'Content-Range');
    return recipes;
  });

  fastify.get<{ Params: { id: string } }>('/admin/recipes/:id', async (request) => {
    return prisma.recipe.findUniqueOrThrow({
      where: { id: request.params.id },
      include: {
        household: { select: { id: true, name: true } },
        ingredients: { orderBy: { order: 'asc' } },
        categories: true,
        tags: { include: { tag: true } },
      },
    });
  });

  fastify.delete<{ Params: { id: string } }>('/admin/recipes/:id', async (request, reply) => {
    await prisma.recipe.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });

  // Tags
  fastify.get('/admin/tags', async (request, reply) => {
    const { skip, take, sort, order } = parseListParams(request.query as Record<string, string>, TAG_SORT_FIELDS, 'createdAt');
    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        skip,
        take,
        orderBy: { [sort]: order },
        include: { household: { select: { name: true } }, _count: { select: { recipes: true } } },
      }),
      prisma.tag.count(),
    ]);
    reply.header('Content-Range', `tags ${skip}-${skip + tags.length}/${total}`);
    reply.header('Access-Control-Expose-Headers', 'Content-Range');
    return tags;
  });

  fastify.delete<{ Params: { id: string } }>('/admin/tags/:id', async (request, reply) => {
    await prisma.tag.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });
}
