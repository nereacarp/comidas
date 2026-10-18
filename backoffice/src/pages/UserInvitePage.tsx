import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminResource } from '../hooks/useAdminResource';
import { adminDelete, adminPost } from '../lib/adminClient';

interface Household {
  id: string;
  name: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name?: string | null;
  role: 'EDITOR' | 'VIEWER';
  invitedByActor: string;
  expiresAt: string;
  household?: Household | null;
}

interface CreatedInvitation extends PendingInvitation {
  inviteUrl: string;
}

export function UserInvitePage() {
  const households = useAdminResource<Household[]>('/households?_start=0&_end=100&_sort=name&_order=ASC');
  const pending = useAdminResource<PendingInvitation[]>('/user-invitations?_start=0&_end=100&_sort=createdAt&_order=DESC');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setCopied(false);
    try {
      const invitation = await adminPost<CreatedInvitation>('/user-invitations', {
        email,
        name,
        householdId,
        role,
      });
      setCreated(invitation);
      await pending.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la invitación.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function revoke(invitation: PendingInvitation) {
    if (!window.confirm(`¿Revocar la invitación enviada a ${invitation.email}? El enlace dejará de funcionar.`)) return;
    try {
      await adminDelete('user-invitations', invitation.id);
      if (created?.id === invitation.id) setCreated(null);
      await pending.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo revocar la invitación.');
    }
  }

  return (
    <section>
      <Link to="/users" className="admin-back">← Volver a usuarios</Link>
      <div className="admin-page-heading">
        <div>
          <h1>Invitar usuario</h1>
          <p>Genera un enlace privado que caduca en siete días y solo puede utilizarse una vez.</p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}

      <div className="admin-detail-grid">
        <form className="admin-panel admin-form" onSubmit={submit}>
          <h2>Nueva invitación</h2>
          <label htmlFor="invite-name">Nombre sugerido <small>La persona podrá cambiarlo.</small></label>
          <input id="invite-name" className="input" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} autoComplete="off" />

          <label htmlFor="invite-email">Email</label>
          <input id="invite-email" className="input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" />

          <label htmlFor="invite-household">Añadir al hogar</label>
          <select id="invite-household" className="input" value={householdId} onChange={(event) => setHouseholdId(event.target.value)}>
            <option value="">Sin hogar por ahora</option>
            {(households.data ?? []).map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}
          </select>

          <label htmlFor="invite-role">Permisos en el hogar</label>
          <select id="invite-role" className="input" value={role} disabled={!householdId} onChange={(event) => setRole(event.target.value as 'EDITOR' | 'VIEWER')}>
            <option value="VIEWER">Lector</option>
            <option value="EDITOR">Editor</option>
          </select>

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Generando…' : 'Generar enlace privado'}
          </button>
        </form>

        <article className="admin-panel">
          <h2>Enlace generado</h2>
          {created ? (
            <div className="admin-invite-result">
              <p>Envíalo únicamente a <strong>{created.email}</strong>.</p>
              <label htmlFor="generated-invite-url">Enlace de un solo uso</label>
              <textarea id="generated-invite-url" className="input" rows={4} readOnly value={created.inviteUrl} onFocus={(event) => event.currentTarget.select()} />
              <button type="button" className="admin-button admin-button--primary" onClick={copyLink}>{copied ? 'Copiado' : 'Copiar enlace'}</button>
              <small>Caduca el {new Date(created.expiresAt).toLocaleString('es-ES')}.</small>
            </div>
          ) : <p>El enlace aparecerá aquí después de crear la invitación.</p>}
        </article>
      </div>

      <article className="admin-panel admin-pending-invitations">
        <h2>Invitaciones pendientes</h2>
        {pending.loading ? <p>Cargando…</p> : pending.error ? <div className="admin-alert admin-alert--error">{pending.error}</div> : (pending.data ?? []).length === 0 ? <p>No hay invitaciones pendientes.</p> : (
          <ul className="admin-list">
            {(pending.data ?? []).map((invitation) => (
              <li key={invitation.id}>
                <div><span>{invitation.email}</span><small>{invitation.household ? `${invitation.household.name} · ${invitation.role === 'EDITOR' ? 'Editor' : 'Lector'}` : 'Sin hogar'} · caduca {new Date(invitation.expiresAt).toLocaleDateString('es-ES')}</small></div>
                <button type="button" className="admin-button admin-button--danger" onClick={() => revoke(invitation)}>Revocar</button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
