import type { DataProvider, BaseRecord, GetListParams, GetOneParams } from '@refinedev/core';

export function createAdminDataProvider(apiUrl: string, secret: string): DataProvider {
  function headers(): HeadersInit {
    return { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
  }

  async function apiFetch(path: string, init: RequestInit = {}) {
    const res = await fetch(`${apiUrl}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }
    return res;
  }

  return {
    getApiUrl: () => apiUrl,

    async getList({ resource, pagination }: GetListParams) {
      const page = pagination?.current ?? 1;
      const perPage = pagination?.pageSize ?? 10;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const res = await apiFetch(`/${resource}?_start=${start}&_end=${end}&_sort=createdAt&_order=DESC`);
      const data = await res.json();
      const contentRange = res.headers.get('Content-Range') ?? '';
      const total = parseInt(contentRange.split('/')[1] ?? '0', 10) || data.length;
      return { data, total };
    },

    async getOne({ resource, id }: GetOneParams) {
      const res = await apiFetch(`/${resource}/${id}`);
      return { data: await res.json() };
    },

    async create() {
      throw new Error('No permitido desde el backoffice');
    },

    async update() {
      throw new Error('No permitido desde el backoffice');
    },

    deleteOne: (async (params) => {
      const { resource, id } = params;
      await apiFetch(`/${resource}/${id}`, { method: 'DELETE' });
      return { data: { id } as BaseRecord };
    }) as DataProvider['deleteOne'],
  };
}
