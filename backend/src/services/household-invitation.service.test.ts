import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHouseholdInvitationService } from './household-invitation.service.js';

function createMockPrisma() {
  return {
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
    householdMember: { findUnique: vi.fn(), create: vi.fn() },
    householdInvitation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

describe('HouseholdInvitationService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createHouseholdInvitationService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createHouseholdInvitationService(mockPrisma as never);
  });

  describe('invite', () => {
    it('creates a pending invitation for an existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'owner@test.com' });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', email: 'guest@test.com' });
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);
      mockPrisma.householdInvitation.findUnique.mockResolvedValue(null);
      mockPrisma.householdInvitation.create.mockResolvedValue({
        id: 'inv1',
        email: 'guest@test.com',
        status: 'PENDING',
      });

      await service.invite('h1', 'u1', { email: 'guest@test.com' });

      expect(mockPrisma.householdInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            householdId: 'h1',
            email: 'guest@test.com',
            role: 'EDITOR',
          }),
        }),
      );
    });

    it('throws if user is already a member', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'owner@test.com' });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', email: 'guest@test.com' });
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1' });

      await expect(service.invite('h1', 'u1', { email: 'guest@test.com' })).rejects.toThrow(
        'El usuario ya es miembro',
      );
    });
  });

  describe('accept', () => {
    it('creates membership and marks invitation accepted', async () => {
      mockPrisma.householdInvitation.findUnique.mockResolvedValue({
        id: 'inv1',
        householdId: 'h1',
        email: 'guest@test.com',
        role: 'EDITOR',
        status: 'PENDING',
      });
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);
      mockPrisma.householdInvitation.update.mockResolvedValue({});
      mockPrisma.householdMember.create.mockResolvedValue({
        userId: 'u2',
        householdId: 'h1',
        role: 'EDITOR',
      });

      const result = await service.accept('inv1', 'u2', 'guest@test.com');
      expect(result.role).toBe('EDITOR');
      expect(mockPrisma.householdMember.create).toHaveBeenCalled();
    });
  });

  describe('decline', () => {
    it('marks invitation as declined', async () => {
      mockPrisma.householdInvitation.findUnique.mockResolvedValue({
        id: 'inv1',
        householdId: 'h1',
        email: 'guest@test.com',
        status: 'PENDING',
      });
      mockPrisma.householdInvitation.update.mockResolvedValue({ status: 'DECLINED' });

      await service.decline('inv1', 'guest@test.com');

      expect(mockPrisma.householdInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DECLINED' }),
        }),
      );
    });
  });
});
