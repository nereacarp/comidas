import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), delete: vi.fn() },
  household: { count: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  recipe: { count: vi.fn() }, tag: { count: vi.fn() },
  adminAuditLog: { count: vi.fn(), create: vi.fn() },
  userInvitation: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  transaction: vi.fn(),
}));
vi.mock('../lib/prisma.js', () => ({ prisma: { user: db.user, household: db.household, recipe: db.recipe, tag: db.tag, adminAuditLog: db.adminAuditLog, userInvitation: db.userInvitation, householdMember: {}, $transaction: db.transaction } }));
import { adminRoutes } from './admin.routes.js';

describe('admin routes (Fastify integration)', () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_CREDENTIALS_JSON = JSON.stringify({ admin: 'test-secret' });
    process.env.APP_URL = 'https://comidas.example.test';
    db.adminAuditLog.create.mockResolvedValue({});
  });
  afterEach(async () => { delete process.env.ADMIN_CREDENTIALS_JSON; delete process.env.APP_URL; await Promise.all(apps.splice(0).map((app) => app.close())); });
  async function app() { const instance = Fastify({ logger: false }); apps.push(instance); await instance.register(adminRoutes); await instance.ready(); return instance; }
  const headers = { authorization: 'Bearer test-secret', 'x-admin-actor': 'admin' };

  it('rejects an invalid administrator before touching data', async () => {
    const instance = await app();
    const response = await instance.inject({ method: 'GET', url: '/admin/stats', headers: { authorization: 'Bearer wrong', 'x-admin-actor': 'admin' } });
    expect(response.statusCode).toBe(401);
    expect(db.user.count).not.toHaveBeenCalled();
  });

  it('returns operational metrics with named credentials', async () => {
    db.user.count.mockResolvedValueOnce(12).mockResolvedValueOnce(2);
    db.household.count.mockResolvedValue(4); db.recipe.count.mockResolvedValue(30); db.tag.count.mockResolvedValue(7); db.adminAuditLog.count.mockResolvedValue(3);
    const instance = await app();
    const response = await instance.inject({ method: 'GET', url: '/admin/stats', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ users: 12, suspendedUsers: 2, households: 4, recipes: 30, tags: 7 });
  });

  it('never deletes a user who owns a shared household', async () => {
    db.user.findUniqueOrThrow.mockResolvedValue({ households: [{ role: 'OWNER', household: { id: 'home', name: 'Casa', _count: { members: 2 } } }] });
    const instance = await app();
    const response = await instance.inject({ method: 'DELETE', url: '/admin/users/user-1', headers });
    expect(response.statusCode).toBe(409);
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it('exposes pagination metadata for lists', async () => {
    db.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]); db.user.count.mockResolvedValue(22);
    const instance = await app();
    const response = await instance.inject({ method: 'GET', url: '/admin/users?_start=10&_end=12', headers });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-range']).toBe('users 10-11/22');
  });

  it('creates a private invitation without exposing the stored token hash', async () => {
    db.user.findFirst.mockResolvedValue(null);
    db.household.findUnique.mockResolvedValue({ id: 'home', name: 'Casa' });
    db.userInvitation.updateMany.mockResolvedValue({ count: 0 });
    db.userInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'invite-1', email: data.email, name: data.name, role: data.role,
      expiresAt: data.expiresAt, createdAt: new Date(), household: { id: 'home', name: 'Casa' },
    }));
    const instance = await app();
    const response = await instance.inject({
      method: 'POST',
      url: '/admin/user-invitations',
      headers,
      payload: { email: 'family@example.com', householdId: 'home', role: 'VIEWER' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().inviteUrl).toMatch(/accept-invitation\?token=/);
    expect(response.body).not.toContain('tokenHash');
  });
});
