import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { createAuthService } from './auth.service.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    householdMember: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    household: {
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (ops: unknown[]) => {
      for (const op of ops) {
        await op;
      }
    }),
  };
}

describe('AuthService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let service: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = createAuthService(mockPrisma as any);
    vi.mocked(bcrypt.compare).mockReset();
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
  });

  describe('register', () => {
    it('should create a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        showCalories: true,
        createdAt: new Date(),
      });

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test',
      });

      expect(result.email).toBe('test@test.com');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@test.com',
            name: 'Test',
          }),
        })
      );
    });

    it('should throw if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test',
        })
      ).rejects.toThrow('El email ya esta registrado');
    });
  });

  describe('login', () => {
    it('should throw for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: 'password123' })
      ).rejects.toThrow('Credenciales incorrectas');
    });

    it('should throw for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        passwordHash: '$2a$10$invalidhash',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow('Credenciales incorrectas');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        showCalories: true,
        createdAt: new Date(),
        households: [],
      });

      const result = await service.getProfile('1');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('999')).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('deleteAccount', () => {
    it('throws when password is wrong', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'hash',
      });

      await expect(service.deleteAccount('1', 'wrong')).rejects.toThrow('Contraseña incorrecta');
    });

    it('throws when user owns a household with other members', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'hash',
      });
      mockPrisma.householdMember.findMany
        .mockResolvedValueOnce([
          {
            householdId: 'h1',
            household: { _count: { members: 2 } },
          },
        ])
        .mockResolvedValueOnce([]);

      await expect(service.deleteAccount('1', 'password123')).rejects.toThrow(
        'Eres propietario de un hogar con otros miembros',
      );
    });

    it('deletes sole-member households and the user', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        passwordHash: 'hash',
      });
      mockPrisma.householdMember.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ householdId: 'h1' }]);
      mockPrisma.householdMember.count.mockResolvedValue(1);

      await service.deleteAccount('1', 'password123');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('updatePreferences', () => {
    it('updates showCalories for the user', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        name: 'Test',
        showCalories: false,
        createdAt: new Date(),
      });

      const result = await service.updatePreferences('1', false);
      expect(result.showCalories).toBe(false);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { showCalories: false },
        select: expect.objectContaining({ showCalories: true }),
      });
    });
  });
});
