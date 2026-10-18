import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminDelete, initAdminClient } from './adminClient';

describe('adminClient', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the named admin credentials in headers, never in the URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    initAdminClient('http://localhost:3001/admin', 'admin', 'secret-value');
    await adminDelete('users', 'user-1');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/admin/users/user-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer secret-value', 'X-Admin-Actor': 'admin' },
    });
  });

  it('rejects failed administrative operations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }));
    initAdminClient('http://localhost:3001/admin', 'admin', 'wrong');
    await expect(adminDelete('users', 'user-1')).rejects.toThrow('Error 401');
  });
});
