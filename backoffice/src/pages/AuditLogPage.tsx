import { useState } from 'react';
import { useList } from '@refinedev/core';
import { AdminTable } from '../components/AdminTable';

interface AuditLog { id: string; actor: string; method: string; path: string; ip: string; statusCode: number; createdAt: string }
const PAGE_SIZE = 15;
export function AuditLogPage() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState('');
  const { data, isLoading } = useList<AuditLog>({ resource: 'audit-logs', pagination: { current: page, pageSize: PAGE_SIZE }, filters: search ? [{ field: 'q', operator: 'contains', value: search }] : [], sorters: [{ field: 'createdAt', order: 'desc' }] });
  return <AdminTable title="Auditoría" description="Registro de acciones que modifican datos, con administrador, resultado e IP."
    data={data?.data ?? []} total={data?.total ?? 0} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} isLoading={isLoading} emptyMessage="No hay acciones registradas."
    columns={[{ label: 'Fecha', render: (log) => new Date(log.createdAt).toLocaleString('es-ES') }, { label: 'Administrador', render: (log) => log.actor }, { label: 'Acción', render: (log) => `${log.method} ${log.path}` }, { label: 'Resultado', render: (log) => <span className={`admin-badge ${log.statusCode < 400 ? 'admin-badge--ok' : 'admin-badge--danger'}`}>{log.statusCode}</span> }, { label: 'IP', render: (log) => log.ip }]}
  />;
}
