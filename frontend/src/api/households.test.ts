import { describe, it, expect, vi } from 'vitest';
import { createHouseholdsApi } from './households';
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

describe('HouseholdsApi', () => {
  it('should list households', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.list();

    expect(client.get).toHaveBeenCalledWith('/households');
  });

  it('should create a household', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.create({ name: 'Mi Casa' });

    expect(client.post).toHaveBeenCalledWith('/households', { name: 'Mi Casa' });
  });

  it('should update a household name', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.update('h1', { name: 'Casa nueva' });

    expect(client.put).toHaveBeenCalledWith('/households/h1', { name: 'Casa nueva' });
  });

  it('should delete a household', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.delete('h1');

    expect(client.delete).toHaveBeenCalledWith('/households/h1');
  });

  it('should add a member', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.addMember('h1', { email: 'new@test.com' });

    expect(client.post).toHaveBeenCalledWith('/households/h1/members', { email: 'new@test.com' });
  });

  it('should update member role', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.updateMemberRole('h1', 'u2', 'VIEWER');

    expect(client.patch).toHaveBeenCalledWith('/households/h1/members/u2', { role: 'VIEWER' });
  });

  it('should leave a household', async () => {
    const client = createMockClient();
    const api = createHouseholdsApi(client);

    await api.leaveHousehold('h1');

    expect(client.post).toHaveBeenCalledWith('/households/h1/leave');
  });
});
