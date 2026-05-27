import { describe, it, expect, vi } from 'vitest';
import { createHouseholdInvitationsApi } from './household-invitations';
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

describe('HouseholdInvitationsApi', () => {
  it('lists pending invitations for the user', async () => {
    const client = createMockClient();
    const api = createHouseholdInvitationsApi(client);

    await api.listMine();

    expect(client.get).toHaveBeenCalledWith('/invitations/mine');
  });

  it('accepts an invitation', async () => {
    const client = createMockClient();
    const api = createHouseholdInvitationsApi(client);

    await api.accept('inv1');

    expect(client.post).toHaveBeenCalledWith('/invitations/inv1/accept');
  });

  it('declines an invitation', async () => {
    const client = createMockClient();
    const api = createHouseholdInvitationsApi(client);

    await api.decline('inv1');

    expect(client.post).toHaveBeenCalledWith('/invitations/inv1/decline');
  });
});
