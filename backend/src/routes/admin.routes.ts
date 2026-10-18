import { timingSafeEqual } from 'crypto';
import type { Prisma } from '@prisma/client';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { createHouseholdService } from '../services/household.service.js';
import { createUserInvitationService } from '../services/user-invitation.service.js';
import { createUserInvitationSchema, transferOwnershipSchema } from '../lib/validation.js';

const MAX_PAGE_SIZE = 100;
const ADMIN_MAX_FAILURES = 5;
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
const adminFailures = new Map<string, number[]>();

declare module 'fastify' {
  interface FastifyRequest {
    adminActor?: string;
  }
}

function parseListParams(
  query: Record<string, string>,
  allowedSortFields: readonly string[],
  defaultSort: string,
) {
  const skip = Math.max(0, parseInt(query._start ?? '0') || 0);
  const end = Math.max(skip + 1, parseInt(query._end ?? '10') || 10);
  const take = Math.max(1, Math.min(end - skip, MAX_PAGE_SIZE));
  const sort = allowedSortFields.includes(query._sort ?? '') ? query._sort : defaultSort;
  const order: Prisma.SortOrder = query._order?.toUpperCase() === 'ASC' ? 'asc' : 'desc';
  const q = query.q?.trim().slice(0, 200) ?? '';
  return { skip, take, sort, order, q };
}

function adminCredentials(): Record<string, string> {
  const raw = process.env.ADMIN_CREDENTIALS_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
          .map(([actor, value]) => [actor.trim(), (value as string).trim()]),
      );
    } catch {
      return {};
    }
  }
  const secret = process.env.ADMIN_SECRET?.trim();
  return secret ? { admin: secret } : {};
}

function safeSecretMatch(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function adminAuth(request: FastifyRequest, reply: FastifyReply) {
  const now = Date.now();
  const ip = request.ip || 'unknown';
  const actor = String(request.headers['x-admin-actor'] ?? 'admin').trim().slice(0, 100);
  // Rate-limit by connection, not by actor. Otherwise an attacker could bypass
  // the limit by changing X-Admin-Actor on every request.
  const failureKey = ip;
  const recent = (adminFailures.get(failureKey) ?? []).filter((timestamp) => now - timestamp < ADMIN_WINDOW_MS);
  if (recent.length >= ADMIN_MAX_FAILURES) {
    reply.header('Retry-After', String(Math.ceil((ADMIN_WINDOW_MS - (now - recent[0]!)) / 1000)));
    return reply.status(429).send({ error: 'Acceso de administrador bloqueado temporalmente' });
  }

  const auth = request.headers.authorization;
  const suppliedSecret = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const expectedSecret = adminCredentials()[actor];
  if (!expectedSecret || !safeSecretMatch(suppliedSecret, expectedSecret)) {
    recent.push(now);
    adminFailures.set(failureKey, recent);
    request.log.warn({ ip, actor }, 'Intento de acceso administrativo rechazado');
    return reply.status(401).send({ error: 'Credenciales de administrador incorrectas' });
  }

  adminFailures.delete(failureKey);
  request.adminActor = actor;
}

function setRange(reply: FastifyReply, resource: string, skip: number, count: number, total: number) {
  const last = count === 0 ? skip : skip + count - 1;
  reply.header('Content-Range', `${resource} ${skip}-${last}/${total}`);
  reply.header('Access-Control-Expose-Headers', 'Content-Range');
}

export async function adminRoutes(fastify: FastifyInstance) {
  const householdService = createHouseholdService(prisma);
  const userInvitations = createUserInvitationService(prisma);
  fastify.addHook('onRequest', adminAuth);
  fastify.addHook('onResponse', async (request, reply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
    try {
      await prisma.adminAuditLog.create({
        data: {
          method: request.method,
          path: request.url.slice(0, 500),
          ip: (request.ip || 'unknown').slice(0, 100),
          actor: (request.adminActor || 'unknown').slice(0, 100),
          statusCode: reply.statusCode,
        },
      });
    } catch (error) {
      request.log.error({ error }, 'No se pudo guardar la auditoría administrativa');
    }
  });

  fastify.get('/admin/stats', async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, suspendedUsers, households, recipes, tags, recentAdminActions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.household.count(),
      prisma.recipe.count(),
      prisma.tag.count(),
      prisma.adminAuditLog.count({ where: { createdAt: { gte: since } } }),
    ]);
    return { users, suspendedUsers, households, recipes, tags, recentAdminActions };
  });

  fastify.get('/admin/audit-logs', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { skip, take, order, q } = parseListParams(query, ['createdAt', 'actor', 'statusCode'], 'createdAt');
    const where = q ? { OR: [{ actor: { contains: q, mode: 'insensitive' as const } }, { path: { contains: q, mode: 'insensitive' as const } }] } : {};
    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({ skip, take, orderBy: { createdAt: order }, where }),
      prisma.adminAuditLog.count({ where }),
    ]);
    setRange(reply, 'audit-logs', skip, logs.length, total);
    return logs;
  });

  fastify.get('/admin/user-invitations', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { skip, take, sort, order, q } = parseListParams(
      query,
      ['createdAt', 'expiresAt', 'email'],
      'createdAt',
    );
    const where: Prisma.UserInvitationWhereInput = {
      usedAt: null,
      expiresAt: { gt: new Date() },
      ...(q ? { email: { contains: q, mode: 'insensitive' as const } } : {}),
    };
    const [invitations, total] = await Promise.all([
      prisma.userInvitation.findMany({
        skip,
        take,
        where,
        orderBy: { [sort]: order },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          invitedByActor: true,
          expiresAt: true,
          createdAt: true,
          household: { select: { id: true, name: true } },
        },
      }),
      prisma.userInvitation.count({ where }),
    ]);
    setRange(reply, 'user-invitations', skip, invitations.length, total);
    return invitations;
  });

  fastify.post('/admin/user-invitations', async (request, reply) => {
    const parsed = createUserInvitationSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    try {
      const invitation = await userInvitations.create(parsed.data, request.adminActor || 'admin');
      return reply.status(201).send(invitation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la invitación';
      const status = message.includes('no existe') ? 404 : 409;
      return reply.status(status).send({ error: message });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/admin/user-invitations/:id', async (request, reply) => {
    const revoked = await prisma.userInvitation.updateMany({
      where: { id: request.params.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (revoked.count !== 1) return reply.status(404).send({ error: 'Invitación no encontrada' });
    return reply.status(204).send();
  });

  const USER_SORT_FIELDS = ['id', 'email', 'name', 'status', 'createdAt', 'updatedAt'] as const;
  fastify.get('/admin/users', async (request, reply) => {
    const query = request.query as Record<string, string>;
    const { skip, take, sort, order, q } = parseListParams(query, USER_SORT_FIELDS, 'createdAt');
    const status = query.status === 'ACTIVE' ? 'ACTIVE' : query.status === 'SUSPENDED' ? 'SUSPENDED' : undefined;
    const where: Prisma.UserWhereInput = {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }] } : {}),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { [sort]: order },
        where,
        select: {
          id: true, email: true, name: true, status: true, suspendedAt: true,
          emailVerifiedAt: true, createdAt: true, updatedAt: true,
          _count: { select: { households: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    setRange(reply, 'users', skip, users.length, total);
    return users;
  });

  fastify.get<{ Params: { id: string } }>('/admin/users/:id', async (request) => {
    return prisma.user.findUniqueOrThrow({
      where: { id: request.params.id },
      select: {
        id: true, email: true, name: true, status: true, suspendedAt: true,
        emailVerifiedAt: true, createdAt: true, updatedAt: true,
        households: { include: { household: { select: { id: true, name: true } } } },
      },
    });
  });

  fastify.post<{ Params: { id: string } }>('/admin/users/:id/suspend', async (request, reply) => {
    await prisma.user.update({
      where: { id: request.params.id },
      data: { status: 'SUSPENDED', suspendedAt: new Date(), sessionVersion: { increment: 1 } },
    });
    return reply.status(204).send();
  });

  fastify.post<{ Params: { id: string } }>('/admin/users/:id/restore', async (request, reply) => {
    await prisma.user.update({
      where: { id: request.params.id },
      data: { status: 'ACTIVE', suspendedAt: null },
    });
    return reply.status(204).send();
  });

  fastify.delete<{ Params: { id: string } }>('/admin/users/:id', async (request, reply) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.params.id },
      include: { households: { include: { household: { include: { _count: { select: { members: true } } } } } } },
    });
    const sharedOwned = user.households.filter((membership) => membership.role === 'OWNER' && membership.household._count.members > 1);
    if (sharedOwned.length > 0) {
      return reply.status(409).send({
        error: 'Transfiere la propiedad de los hogares compartidos antes de eliminar este usuario',
        households: sharedOwned.map((membership) => ({ id: membership.household.id, name: membership.household.name })),
      });
    }
    const soleOwnedIds = user.households
      .filter((membership) => membership.role === 'OWNER' && membership.household._count.members === 1)
      .map((membership) => membership.household.id);
    await prisma.$transaction([
      ...soleOwnedIds.map((id) => prisma.household.delete({ where: { id } })),
      prisma.user.delete({ where: { id: request.params.id } }),
    ]);
    return reply.status(204).send();
  });

  const HOUSEHOLD_SORT_FIELDS = ['id', 'name', 'createdAt', 'updatedAt'] as const;
  fastify.get('/admin/households', async (request, reply) => {
    const { skip, take, sort, order, q } = parseListParams(request.query as Record<string, string>, HOUSEHOLD_SORT_FIELDS, 'createdAt');
    const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};
    const [households, total] = await Promise.all([
      prisma.household.findMany({ skip, take, orderBy: { [sort]: order }, where, include: { _count: { select: { members: true, recipes: true } } } }),
      prisma.household.count({ where }),
    ]);
    setRange(reply, 'households', skip, households.length, total);
    return households;
  });

  fastify.get<{ Params: { id: string } }>('/admin/households/:id', async (request) => {
    return prisma.household.findUniqueOrThrow({
      where: { id: request.params.id },
      include: { members: { include: { user: { select: { id: true, email: true, name: true } } } }, _count: { select: { recipes: true, tags: true, mealPlanItems: true, shoppingLists: true } } },
    });
  });

  fastify.post<{ Params: { id: string } }>('/admin/households/:id/transfer-ownership', async (request, reply) => {
    const parsed = transferOwnershipSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0].message });
    const currentOwner = await prisma.householdMember.findFirst({ where: { householdId: request.params.id, role: 'OWNER' } });
    if (!currentOwner) return reply.status(409).send({ error: 'El hogar no tiene propietario; corrígelo manualmente' });
    const household = await householdService.transferOwnership(request.params.id, currentOwner.userId, parsed.data);
    return reply.send(household);
  });

  fastify.delete<{ Params: { id: string } }>('/admin/households/:id', async (request, reply) => {
    await prisma.household.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });

  const RECIPE_SORT_FIELDS = ['id', 'title', 'createdAt', 'updatedAt'] as const;
  fastify.get('/admin/recipes', async (request, reply) => {
    const { skip, take, sort, order, q } = parseListParams(request.query as Record<string, string>, RECIPE_SORT_FIELDS, 'createdAt');
    const where = q ? { OR: [{ title: { contains: q, mode: 'insensitive' as const } }, { household: { name: { contains: q, mode: 'insensitive' as const } } }] } : {};
    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({ skip, take, orderBy: { [sort]: order }, where, include: { household: { select: { name: true } }, categories: true, _count: { select: { ingredients: true } } } }),
      prisma.recipe.count({ where }),
    ]);
    setRange(reply, 'recipes', skip, recipes.length, total);
    return recipes;
  });

  fastify.get<{ Params: { id: string } }>('/admin/recipes/:id', async (request) => {
    return prisma.recipe.findUniqueOrThrow({ where: { id: request.params.id }, include: { household: { select: { id: true, name: true } }, ingredients: { orderBy: { order: 'asc' } }, categories: true, tags: { include: { tag: true } } } });
  });

  fastify.delete<{ Params: { id: string } }>('/admin/recipes/:id', async (request, reply) => {
    await prisma.recipe.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });

  const TAG_SORT_FIELDS = ['id', 'name', 'createdAt'] as const;
  fastify.get('/admin/tags', async (request, reply) => {
    const { skip, take, sort, order, q } = parseListParams(request.query as Record<string, string>, TAG_SORT_FIELDS, 'createdAt');
    const where = q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { household: { name: { contains: q, mode: 'insensitive' as const } } }] } : {};
    const [tags, total] = await Promise.all([
      prisma.tag.findMany({ skip, take, orderBy: { [sort]: order }, where, include: { household: { select: { name: true } }, _count: { select: { recipes: true } } } }),
      prisma.tag.count({ where }),
    ]);
    setRange(reply, 'tags', skip, tags.length, total);
    return tags;
  });

  fastify.delete<{ Params: { id: string } }>('/admin/tags/:id', async (request, reply) => {
    await prisma.tag.delete({ where: { id: request.params.id } });
    return reply.status(204).send();
  });
}
