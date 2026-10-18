import { useState } from 'react';
import { useList } from '@refinedev/core';
import { Link } from 'react-router-dom';
import { AdminTable } from '../components/AdminTable';
import { adminDelete } from '../lib/adminClient';

interface Household { id: string; name: string; createdAt: string; _count?: { members: number; recipes: number } }
const PAGE_SIZE = 10;

export function HouseholdList() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [sort, setSort] = useState('createdAt');
  const { data, isLoading, refetch } = useList<Household>({ resource: 'households', pagination: { current: page, pageSize: PAGE_SIZE }, filters: search ? [{ field: 'q', operator: 'contains', value: search }] : [], sorters: [{ field: sort, order: sort === 'name' ? 'asc' : 'desc' }] });
  async function handleDelete(id: string) { await adminDelete('households', id); await refetch(); }
  return <AdminTable title="Hogares" description="Revisa miembros, contenido y propiedad de cada hogar."
    data={data?.data ?? []} total={data?.total ?? 0} page={page} pageSize={PAGE_SIZE} onPageChange={setPage}
    search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} sort={sort} onSortChange={(value) => { setSort(value); setPage(1); }} sortOptions={[{ label: 'Más recientes', value: 'createdAt' }, { label: 'Nombre', value: 'name' }]}
    isLoading={isLoading} onDelete={handleDelete} deleteMessage={(household) => `Vas a eliminar definitivamente el hogar “${household.name}” y todas sus recetas, planes, listas, despensa y configuración. ¿Continuar?`}
    renderActions={(household) => <Link className="admin-button" to={`/households/${household.id}`}>Ver ficha</Link>}
    emptyMessage="No hay hogares que coincidan."
    columns={[{ label: 'Nombre', render: (household) => <Link className="admin-row-link" to={`/households/${household.id}`}>{household.name}</Link> }, { label: 'Miembros', render: (household) => household._count?.members ?? 0 }, { label: 'Recetas', render: (household) => household._count?.recipes ?? 0 }, { label: 'Creado', render: (household) => new Date(household.createdAt).toLocaleDateString('es-ES') }]}
  />;
}
