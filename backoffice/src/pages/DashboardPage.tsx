import { Link } from 'react-router-dom';
import { useAdminResource } from '../hooks/useAdminResource';

interface Stats { users: number; suspendedUsers: number; households: number; recipes: number; tags: number; recentAdminActions: number }
export function DashboardPage() {
  const { data, loading, error } = useAdminResource<Stats>('/stats');
  const metrics = data ? [
    { label: 'Usuarios', value: data.users, detail: `${data.suspendedUsers} suspendidos`, to: '/users' },
    { label: 'Hogares', value: data.households, detail: 'Espacios compartidos', to: '/households' },
    { label: 'Recetas', value: data.recipes, detail: 'Contenido total', to: '/recipes' },
    { label: 'Tags', value: data.tags, detail: 'Etiquetas creadas', to: '/tags' },
    { label: 'Acciones (24 h)', value: data.recentAdminActions, detail: 'Cambios administrativos', to: '/audit' },
  ] : [];
  return <section>
    <div className="admin-page-heading"><div><h1>Resumen</h1><p>Estado general de Comidas y accesos rápidos de administración.</p></div></div>
    {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
    {loading ? <div className="admin-empty">Cargando métricas…</div> : <div className="admin-metrics">{metrics.map((metric) => <Link key={metric.label} to={metric.to} className="admin-metric"><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></Link>)}</div>}
    <div className="admin-note"><strong>Flujo recomendado:</strong> suspende antes de borrar. La suspensión cierra las sesiones del usuario y permite restaurarlo; la eliminación definitiva exige transferir antes cualquier hogar compartido.</div>
  </section>;
}
