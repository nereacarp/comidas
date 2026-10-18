import { afterEach, describe, expect, it, vi } from 'vitest';
import proxy from './[...path]';

describe('Vercel backoffice proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('forwards administrator credentials without exposing the backend URL', async () => {
    vi.stubEnv('BACKEND_URL', 'https://comidas-api.example.test');
    vi.stubEnv('VERCEL', '1');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await proxy.fetch(new Request(
      'https://admin-comidas.example.test/api/admin/stats',
      { headers: { authorization: 'Bearer secret', 'x-admin-actor': 'admin' } },
    ));

    const [target, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(target.toString()).toBe('https://comidas-api.example.test/admin/stats');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer secret');
    expect(response.status).toBe(200);
  });
});
