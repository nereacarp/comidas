import { Link, useParams } from 'react-router-dom';
import { useAdminResource } from '../hooks/useAdminResource';
import { adminPost } from '../lib/adminClient';

interface UserDetail { id: string; name: string; email: string; status: 'ACTIVE' | 'SUSPENDED'; emailVerifiedAt: string | null; createdAt: string; updatedAt: string; households: Array<{ role: string; household: { id: string; name: string } }> }
export function UserDetailPage() {
  const { id } = useParams(); const { data: user, loading, error, reload } = useAdminResource<UserDetail>(id ? `/users/${id}` : null);
  async function toggle() { if (!user) return; await adminPost(`/users/${user.id}/${user.status === 'SUSPENDED' ? 'restore' : 'suspend'}`); await reload(); }
  if (loading) return <div className="admin-empty">Cargando usuario…</div>;
  if (error || !user) return <div className="admin-alert admin-alert--error" role="alert">{error || 'Usuario no encontrado.'}</div>;
  return <section><Link to="/users" className="admin-back">← Volver a usuarios</Link><div className="admin-detail-header"><div><h1>{user.name}</h1><p>{user.email}</p></div><button type="button" className={`admin-button ${user.status === 'ACTIVE' ? 'admin-button--warning' : ''}`} onClick={toggle}>{user.status === 'ACTIVE' ? 'Suspender cuenta' : 'Restaurar cuenta'}</button></div>
    <div className="admin-detail-grid"><article className="admin-panel"><h2>Cuenta</h2><dl><div><dt>Estado</dt><dd><span className={`admin-badge ${user.status === 'ACTIVE' ? 'admin-badge--ok' : 'admin-badge--danger'}`}>{user.status === 'ACTIVE' ? 'Activa' : 'Suspendida'}</span></dd></div><div><dt>Email verificado</dt><dd>{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleString('es-ES') : 'No'}</dd></div><div><dt>Registro</dt><dd>{new Date(user.createdAt).toLocaleString('es-ES')}</dd></div><div><dt>Último cambio</dt><dd>{new Date(user.updatedAt).toLocaleString('es-ES')}</dd></div></dl></article>
    <article className="admin-panel"><h2>Hogares</h2>{user.households.length === 0 ? <p>No pertenece a ningún hogar.</p> : <ul className="admin-list">{user.households.map((membership) => <li key={membership.household.id}><Link to={`/households/${membership.household.id}`}>{membership.household.name}</Link><span>{membership.role}</span></li>)}</ul>}</article></div>
  </section>;
}
