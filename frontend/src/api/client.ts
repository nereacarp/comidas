/** Empty string = same-origin (Vite dev proxy). Otherwise direct API URL. */
const API_URL = import.meta.env.VITE_API_URL ?? '';

let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export interface ApiClient {
  get: <T>(path: string, signal?: AbortSignal) => Promise<T>;
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<T>;
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<T>;
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<T>;
  delete: <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<T>;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const message = error.error || error.message || `HTTP ${response.status}`;
    if (response.status === 401 && getToken()) {
      _onUnauthorized?.();
    }
    if (response.status === 404) {
      throw new Error(
        `${message}. Comprueba que el backend está en marcha (puerto 3001 con Docker).`
      );
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient: ApiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('POST', path, body, signal),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('PUT', path, body, signal),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('PATCH', path, body, signal),
  delete: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('DELETE', path, body, signal),
};
