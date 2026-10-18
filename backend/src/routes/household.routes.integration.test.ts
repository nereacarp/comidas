import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  householdMember: { findUnique: vi.fn(), update: vi.fn() },
  household: { findUniqueOrThrow: vi.fn() },
  transaction: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    householdMember: mocks.householdMember,
    household: mocks.household,
    $transaction: mocks.transaction,
  },
}));

import { householdRoutes } from './household.routes.js';

describe('household routes (Fastify integration)', () => {
  const apps: Array<ReturnType<typeof Fastify>> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      householdMember: mocks.householdMember,
      household: mocks.household,
    }));
  });

  afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

  async function createApp(userId = 'owner') {
    const app = Fastify({ logger: false });
    apps.push(app);
    app.decorate('authenticate', async (request) => {
      request.user = { id: userId, email: `${userId}@example.com`, sessionVersion: 1 };
    });
    await app.register(householdRoutes);
    await app.ready();
    return app;
  }

  it('transfers property through the real HTTP route', async () => {
    mocks.householdMember.findUnique
      .mockResolvedValueOnce({ id: 'guard', userId: 'owner', role: 'OWNER' })
      .mockResolvedValueOnce({ id: 'owner-membership', userId: 'owner', role: 'OWNER' })
      .mockResolvedValueOnce({ id: 'next-membership', userId: 'next', role: 'EDITOR' });
    mocks.householdMember.update.mockResolvedValue({});
    mocks.household.findUniqueOrThrow.mockResolvedValue({ id: 'home', members: [{ userId: 'next', role: 'OWNER' }] });
    const app = await createApp();

    const response = await app.inject({ method: 'POST', url: '/households/home/transfer-ownership', payload: { newOwnerUserId: 'next' } });

    expect(response.statusCode).toBe(200);
    expect(response.json().members[0].role).toBe('OWNER');
  });

  it('blocks access across households before executing the transfer', async () => {
    mocks.householdMember.findUnique.mockResolvedValueOnce(null);
    const app = await createApp('outsider');
    const response = await app.inject({ method: 'POST', url: '/households/home/transfer-ownership', payload: { newOwnerUserId: 'next' } });
    expect(response.statusCode).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('validates the target member in the request body', async () => {
    mocks.householdMember.findUnique.mockResolvedValueOnce({ id: 'guard', role: 'OWNER' });
    const app = await createApp();
    const response = await app.inject({ method: 'POST', url: '/households/home/transfer-ownership', payload: {} });
    expect(response.statusCode).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
