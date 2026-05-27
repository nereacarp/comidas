import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHouseholdService } from './household.service.js';

function createMockPrisma() {
  return {
    household: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    householdMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
}

describe('HouseholdService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createHouseholdService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createHouseholdService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create a household with owner and random accent', async () => {
      mockPrisma.householdMember.findMany.mockResolvedValue([
        { household: { accentKey: 'lavender' } },
      ]);
      const household = {
        id: 'h1',
        name: 'Mi Casa',
        accentKey: 'mint',
        members: [{ userId: 'u1', role: 'OWNER', user: { id: 'u1', email: 'a@b.com', name: 'A' } }],
      };
      mockPrisma.household.create.mockResolvedValue(household);

      const result = await service.create({ name: 'Mi Casa' }, 'u1');
      expect(result.name).toBe('Mi Casa');
      expect(mockPrisma.household.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Mi Casa',
            accentKey: expect.stringMatching(/^(lavender|mint|peach|cyan|coral)$/),
            members: { create: { userId: 'u1', role: 'OWNER' } },
          }),
        }),
      );
    });
  });

  describe('getUserHouseholds', () => {
    it('should return households for user', async () => {
      mockPrisma.householdMember.findMany.mockResolvedValue([
        {
          role: 'OWNER',
          household: { id: 'h1', name: 'Casa', members: [] },
        },
      ]);

      const result = await service.getUserHouseholds('u1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Casa');
      expect(result[0].role).toBe('OWNER');
    });
  });

  describe('isMember', () => {
    it('should return true for members', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1' });
      expect(await service.isMember('h1', 'u1')).toBe(true);
    });

    it('should return false for non-members', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);
      expect(await service.isMember('h1', 'u1')).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true for owners', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      expect(await service.isOwner('h1', 'u1')).toBe(true);
    });

    it('should return false for non-owners', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ role: 'EDITOR' });
      expect(await service.isOwner('h1', 'u1')).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should return true for owners and editors', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ role: 'EDITOR' });
      expect(await service.canEdit('h1', 'u1')).toBe(true);
    });

    it('should return false for viewers', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ role: 'VIEWER' });
      expect(await service.canEdit('h1', 'u1')).toBe(false);
    });

    it('should return false for non-members', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);
      expect(await service.canEdit('h1', 'u1')).toBe(false);
    });
  });

  describe('update', () => {
    it('should update household name', async () => {
      mockPrisma.household.update.mockResolvedValue({ id: 'h1', name: 'Nuevo nombre' });

      const result = await service.update('h1', { name: 'Nuevo nombre' });
      expect(result.name).toBe('Nuevo nombre');
      expect(mockPrisma.household.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: { name: 'Nuevo nombre' },
      });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1', role: 'EDITOR' });
      mockPrisma.householdMember.update.mockResolvedValue({
        id: 'm1',
        role: 'VIEWER',
        user: { id: 'u2', email: 'b@b.com', name: 'B' },
      });

      const result = await service.updateMemberRole('h1', 'u2', { role: 'VIEWER' });
      expect(result.role).toBe('VIEWER');
      expect(mockPrisma.householdMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: { role: 'VIEWER' },
        })
      );
    });

    it('should throw if member not found', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);

      await expect(service.updateMemberRole('h1', 'u2', { role: 'VIEWER' }))
        .rejects.toThrow('Miembro no encontrado');
    });

    it('should throw if trying to change owner role', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1', role: 'OWNER' });

      await expect(service.updateMemberRole('h1', 'u1', { role: 'VIEWER' }))
        .rejects.toThrow('No se puede cambiar el rol del propietario');
    });
  });

  describe('leaveHousehold', () => {
    it('should allow non-owner to leave', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1', role: 'EDITOR' });
      mockPrisma.householdMember.delete.mockResolvedValue({ id: 'm1' });

      await service.leaveHousehold('h1', 'u2');
      expect(mockPrisma.householdMember.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });

    it('should throw if member not found', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue(null);

      await expect(service.leaveHousehold('h1', 'u2'))
        .rejects.toThrow('Miembro no encontrado');
    });

    it('should throw if owner tries to leave', async () => {
      mockPrisma.householdMember.findUnique.mockResolvedValue({ id: 'm1', role: 'OWNER' });

      await expect(service.leaveHousehold('h1', 'u1'))
        .rejects.toThrow('El propietario no puede abandonar el hogar');
    });
  });
});
