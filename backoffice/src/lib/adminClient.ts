let apiUrl = '';
let actor = '';
let secret = '';

export function initAdminClient(url: string, adminActor: string, adminSecret: string) {
  apiUrl = url;
  actor = adminActor;
  secret = adminSecret;
}

function headers(contentType = false): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
    'X-Admin-Actor': actor,
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function adminFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { ...headers(Boolean(init.body)), ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? `Error ${response.status}`);
  }
  return response;
}

export async function adminGet<T>(path: string): Promise<T> {
  const response = await adminFetch(path);
  return response.json() as Promise<T>;
}

export async function adminPost<T = void>(path: string, body?: unknown): Promise<T> {
  const response = await adminFetch(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export async function adminDelete(resource: string, id: string): Promise<void> {
  await adminFetch(`/${resource}/${id}`, { method: 'DELETE' });
}
