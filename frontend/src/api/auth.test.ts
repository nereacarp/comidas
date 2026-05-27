import { describe, it, expect, vi } from 'vitest';
import { createAuthApi } from './auth';
import type { ApiClient } from './client';

function createMockClient(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

describe('AuthApi', () => {
  it('should call register endpoint', async () => {
    const client = createMockClient();
    const api = createAuthApi(client);
    const data = { email: 'test@test.com', password: '123456', name: 'Test' };

    await api.register(data);

    expect(client.post).toHaveBeenCalledWith('/auth/register', data);
  });

  it('should call login endpoint', async () => {
    const client = createMockClient();
    const api = createAuthApi(client);
    const data = { email: 'test@test.com', password: '123456' };

    await api.login(data);

    expect(client.post).toHaveBeenCalledWith('/auth/login', data);
  });

  it('should call profile endpoint', async () => {
    const client = createMockClient();
    const api = createAuthApi(client);

    await api.getProfile();

    expect(client.get).toHaveBeenCalledWith('/auth/profile');
  });

  it('should call preferences endpoint', async () => {
    const client = createMockClient();
    const api = createAuthApi(client);

    await api.updatePreferences({ showCalories: false });

    expect(client.patch).toHaveBeenCalledWith('/auth/preferences', { showCalories: false });
  });

  it('should call delete account endpoint', async () => {
    const client = createMockClient();
    const api = createAuthApi(client);

    await api.deleteAccount({ password: 'secret' });

    expect(client.delete).toHaveBeenCalledWith('/auth/account', { password: 'secret' });
  });
});
