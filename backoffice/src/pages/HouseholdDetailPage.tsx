import { Link, useParams } from 'react-router-dom';
import { useAdminResource } from '../hooks/useAdminResource';
import { adminPost } from '../lib/adminClient';

interface HouseholdDetail { id: string; name: string; createdAt: string; members: Array<{ id: string; role: 'OWNER' | 'EDITOR' | 'VIEWER'; user: { id: string; name: string; email: string } }>; _count: { recipes: number; tags: number; mealPlanItems: number; shoppingLists: number } }
export function HouseholdDetailPage() {
  const { id } = useParams(); const { data: household, loading, error, reload } = useAdminResource<HouseholdDetail>(id ? `/households/${id}` : null);
  async function transfer(member: HouseholdDetail['members'][number]) { if (!household || !window.confirm(`¿Transferir la propiedad de “${household.name}” a ${member.user.name}? El propietario actual pasará a editor.`)) return; await adminPost(`/households/${household.id}/transfer-ownership`, { newOwnerUserId: member.user.id }); await reload(); }
  if (loading) return <div className="admin-empty">Cargando hogar…</div>;
  if (error || !household) return <div className="admin-alert admin-alert--error" role="alert">{error || 'Hogar no encontrado.'}</div>;
  return <section><Link to="/households" className="admin-back">← Volver a hogares</Link><div className="admin-detail-header"><div><h1>{household.name}</h1><p>Creado el {new Date(household.createdAt).toLocaleDateString('es-ES')}</p></div></div>
    <div className="admin-metrics admin-metrics--small">{Object.entries({ Recetas: household._count.recipes, Tags: household._count.tags, 'Comidas planificadas': household._count.mealPlanItems, 'Listas de compra': household._count.shoppingLists }).map(([label, value]) => <div className="admin-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <article className="admin-panel"><h2>Miembros y propiedad</h2><ul className="admin-list">{household.members.map((member) => <li key={member.id}><div><Link to={`/users/${member.user.id}`}>{member.user.name}</Link><small>{member.user.email}</small></div><div><span className={`admin-badge ${member.role === 'OWNER' ? 'admin-badge--owner' : ''}`}>{member.role}</span>{member.role !== 'OWNER' && <button type="button" className="admin-button" onClick={() => transfer(member)}>Hacer propietario</button>}</div></li>)}</ul></article>
  </section>;
}
