import type { DataProvider, BaseRecord, GetListParams, GetOneParams } from '@refinedev/core';

export function createAdminDataProvider(apiUrl: string, actor: string, secret: string): DataProvider {
  function headers(): HeadersInit {
    return { Authorization: `Bearer ${secret}`, 'X-Admin-Actor': actor, 'Content-Type': 'application/json' };
  }

  async function apiFetch(path: string, init: RequestInit = {}) {
    const res = await fetch(`${apiUrl}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? body.message ?? `HTTP ${res.status}`);
    }
    return res;
  }

  return {
    getApiUrl: () => apiUrl,

    async getList({ resource, pagination, filters, sorters }: GetListParams) {
      const page = pagination?.current ?? 1;
      const perPage = pagination?.pageSize ?? 10;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const search = filters?.find((filter) => 'field' in filter && filter.field === 'q' && filter.value)?.value;
      const sorter = sorters?.[0];
      const params = new URLSearchParams({
        _start: String(start),
        _end: String(end),
        _sort: sorter?.field ?? 'createdAt',
        _order: (sorter?.order ?? 'desc').toUpperCase(),
      });
      if (search) params.set('q', String(search));
      const status = filters?.find((filter) => 'field' in filter && filter.field === 'status' && filter.value)?.value;
      if (status) params.set('status', String(status));
      const res = await apiFetch(`/${resource}?${params.toString()}`);
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
