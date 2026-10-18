import { useState } from 'react';
import { useList } from '@refinedev/core';
import { Link } from 'react-router-dom';
import { AdminTable } from '../components/AdminTable';
import { adminDelete, adminPost } from '../lib/adminClient';

interface User {
  id: string; email: string; name: string; status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt: string | null; createdAt: string; _count?: { households: number };
}
const PAGE_SIZE = 10;

export function UserList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const { data, isLoading, refetch } = useList<User>({
    resource: 'users', pagination: { current: page, pageSize: PAGE_SIZE },
    filters: search ? [{ field: 'q', operator: 'contains', value: search }] : [],
    sorters: [{ field: sort, order: sort === 'name' || sort === 'email' ? 'asc' : 'desc' }],
  });

  async function handleDelete(id: string) { await adminDelete('users', id); await refetch(); }
  async function toggleStatus(user: User) {
    await adminPost(`/users/${user.id}/${user.status === 'SUSPENDED' ? 'restore' : 'suspend'}`);
    await refetch();
  }

  return <AdminTable
    title="Usuarios" description="Consulta cuentas, suspéndelas de forma reversible o entra en su ficha."
    headerAction={<Link className="admin-button admin-button--primary" to="/users/invite">Invitar usuario</Link>}
    data={data?.data ?? []} total={data?.total ?? 0} page={page} pageSize={PAGE_SIZE}
    onPageChange={setPage} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }}
    sort={sort} onSortChange={(value) => { setSort(value); setPage(1); }}
    sortOptions={[{ label: 'Más recientes', value: 'createdAt' }, { label: 'Nombre', value: 'name' }, { label: 'Email', value: 'email' }, { label: 'Estado', value: 'status' }]}
    isLoading={isLoading} onDelete={handleDelete}
    deleteMessage={(user) => `Vas a eliminar definitivamente a ${user.name} (${user.email}). Se borrarán sus datos personales y los hogares que solo le pertenezcan. Si tiene hogares compartidos, primero tendrás que transferirlos. ¿Continuar?`}
    renderActions={(user) => <><Link className="admin-button" to={`/users/${user.id}`}>Ver ficha</Link><button type="button" className="admin-button" onClick={() => toggleStatus(user)}>{user.status === 'SUSPENDED' ? 'Restaurar' : 'Suspender'}</button></>}
    emptyMessage="No hay usuarios que coincidan."
    columns={[
      { label: 'Nombre', render: (user) => <Link className="admin-row-link" to={`/users/${user.id}`}>{user.name}</Link> },
      { label: 'Email', render: (user) => user.email },
      { label: 'Estado', render: (user) => <span className={`admin-badge ${user.status === 'SUSPENDED' ? 'admin-badge--danger' : 'admin-badge--ok'}`}>{user.status === 'SUSPENDED' ? 'Suspendido' : 'Activo'}</span> },
      { label: 'Hogares', render: (user) => user._count?.households ?? 0 },
      { label: 'Registro', render: (user) => new Date(user.createdAt).toLocaleDateString('es-ES') },
    ]}
  />;
}
