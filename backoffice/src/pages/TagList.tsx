import { useState } from 'react';
import { useList } from '@refinedev/core';
import { AdminTable } from '../components/AdminTable';
import { adminDelete } from '../lib/adminClient';

interface Tag { id: string; name: string; color?: string; household?: { name: string }; _count?: { recipes: number } }
const PAGE_SIZE = 10;
export function TagList() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [sort, setSort] = useState('createdAt');
  const { data, isLoading, refetch } = useList<Tag>({ resource: 'tags', pagination: { current: page, pageSize: PAGE_SIZE }, filters: search ? [{ field: 'q', operator: 'contains', value: search }] : [], sorters: [{ field: sort, order: sort === 'name' ? 'asc' : 'desc' }] });
  async function handleDelete(id: string) { await adminDelete('tags', id); await refetch(); }
  return <AdminTable title="Tags" description="Organización de recetas por hogar."
    data={data?.data ?? []} total={data?.total ?? 0} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} sort={sort} onSortChange={(value) => { setSort(value); setPage(1); }} sortOptions={[{ label: 'Más recientes', value: 'createdAt' }, { label: 'Nombre', value: 'name' }]}
    isLoading={isLoading} onDelete={handleDelete} deleteMessage={(tag) => `Vas a eliminar la etiqueta “${tag.name}” del hogar ${tag.household?.name ?? 'desconocido'}. Se quitará de ${tag._count?.recipes ?? 0} recetas. ¿Continuar?`} emptyMessage="No hay tags que coincidan."
    columns={[{ label: 'Nombre', render: (tag) => <span className="admin-tag"><i style={{ background: tag.color ?? '#999' }} />{tag.name}</span> }, { label: 'Hogar', render: (tag) => tag.household?.name ?? '—' }, { label: 'Recetas', render: (tag) => tag._count?.recipes ?? 0 }]}
  />;
}
