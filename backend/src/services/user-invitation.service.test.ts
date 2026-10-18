import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserInvitationService } from './user-invitation.service.js';

function createDb() {
  const client = {
    user: { findFirst: vi.fn(), create: vi.fn() },
    household: { findUnique: vi.fn() },
    userInvitation: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    householdInvitation: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation(async (callback: (transaction: typeof client) => unknown) => callback(client));
  return client;
}

describe('UserInvitationService', () => {
  beforeEach(() => {
    process.env.APP_URL = 'https://comidas.example.test';
  });

  it('stores only a hash and returns a one-use URL to the administrator', async () => {
    const db = createDb();
    db.user.findFirst.mockResolvedValue(null);
    db.household.findUnique.mockResolvedValue({ id: 'home-1', name: 'Familia' });
    db.userInvitation.updateMany.mockResolvedValue({ count: 0 });
    db.userInvitation.create.mockImplementation(async ({ data }) => ({
      id: 'invite-1', email: data.email, name: data.name, role: data.role,
      expiresAt: data.expiresAt, createdAt: new Date(), household: { id: 'home-1', name: 'Familia' },
    }));

    const invitation = await createUserInvitationService(db as never).create({
      email: '  FAMILY@Example.com ', name: 'Familia', householdId: 'home-1', role: 'EDITOR',
    }, 'admin');

    const stored = db.userInvitation.create.mock.calls[0][0].data;
    expect(stored.email).toBe('family@example.com');
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(invitation.inviteUrl).toMatch(/^https:\/\/comidas\.example\.test\/accept-invitation\?token=/);
    expect(invitation.inviteUrl).not.toContain(stored.tokenHash);
  });

  it('rejects expired or already used links without exposing invitation details', async () => {
    const db = createDb();
    db.userInvitation.findUnique.mockResolvedValue({
      id: 'invite-1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(createUserInvitationService(db as never).inspect('x'.repeat(40)))
      .rejects.toThrow('La invitación no es válida o ha caducado');
  });

  it('creates the account, assigns its household and consumes the link atomically', async () => {
    const db = createDb();
    db.userInvitation.findUnique.mockResolvedValue({
      id: 'invite-1', email: 'family@example.com', householdId: 'home-1',
      role: 'VIEWER', usedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    db.userInvitation.updateMany.mockResolvedValue({ count: 1 });
    db.user.findFirst.mockResolvedValue(null);
    db.user.create.mockResolvedValue({
      id: 'user-1', email: 'family@example.com', name: 'Familiar', sessionVersion: 0,
    });
    db.householdInvitation.updateMany.mockResolvedValue({ count: 1 });

    const user = await createUserInvitationService(db as never).accept('x'.repeat(40), {
      name: 'Familiar', password: 'una-clave-segura',
    });

    expect(user.id).toBe('user-1');
    expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'family@example.com',
        households: { create: { householdId: 'home-1', role: 'VIEWER' } },
      }),
    }));
    expect(db.userInvitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'invite-1', usedAt: null }),
    }));
  });

  it('cannot reuse a link consumed by another request', async () => {
    const db = createDb();
    db.userInvitation.findUnique.mockResolvedValue({
      id: 'invite-1', email: 'family@example.com', householdId: null,
      role: 'VIEWER', usedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    db.userInvitation.updateMany.mockResolvedValue({ count: 0 });

    await expect(createUserInvitationService(db as never).accept('x'.repeat(40), {
      name: 'Familiar', password: 'una-clave-segura',
    })).rejects.toThrow('La invitación ya se ha utilizado');
    expect(db.user.create).not.toHaveBeenCalled();
  });
});
