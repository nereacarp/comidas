import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';
import { AuthFormError } from '../components/auth/AuthFormError';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordInput } from '../components/ui/PasswordInput';
import { routes } from '../lib/routes';
import { useAuthStore } from '../stores/auth.store';
import type { UserInvitationInfo } from '../types';

const authApi = createAuthApi(apiClient);

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const acceptInvitation = useAuthStore((state) => state.acceptInvitation);
  const isSubmitting = useAuthStore((state) => state.isLoading);
  const submitError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [invitation, setInvitation] = useState<UserInvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    let active = true;
    clearError();
    if (!token) {
      setLoadError('El enlace de invitación no es válido.');
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    authApi.inspectUserInvitation(token)
      .then((result) => {
        if (!active) return;
        setInvitation(result);
        setName(result.name ?? '');
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'No se pudo abrir la invitación.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clearError, token]);

  const expiryLabel = useMemo(() => invitation
    ? new Date(invitation.expiresAt).toLocaleDateString('es-ES', { dateStyle: 'long' })
    : '', [invitation]);

  if (isAuthenticated) return <Navigate to={routes.dashboard} replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!invitation || !acceptedTerms) return;
    try {
      await acceptInvitation(token, name, password);
      navigate(routes.dashboard, { replace: true });
    } catch {
      // The store exposes the safe server message.
    }
  }

  return (
    <AuthLayout
      title="Aceptar invitación"
      footer={<><Link className="auth-link" to={routes.login}>Ya tengo una cuenta</Link></>}
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-muted">Comprobando invitación…</p>
      ) : loadError || !invitation ? (
        <div className="space-y-4">
          <div className="alert-error" role="alert">{loadError || 'La invitación no está disponible.'}</div>
          <Link className="btn-neutral flex w-full justify-center" to={routes.login}>Volver a iniciar sesión</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && <AuthFormError message={submitError} onDismiss={clearError} />}

          <div className="rounded-[var(--radius-control)] border border-border bg-page p-3 text-sm text-muted">
            <p><strong className="text-ink">Invitación para:</strong> {invitation.email}</p>
            {invitation.household && (
              <p className="mt-1">Entrarás en <strong className="text-ink">{invitation.household.name}</strong> como {invitation.role === 'EDITOR' ? 'editor' : 'lector'}.</p>
            )}
            <p className="mt-1 text-xs">El enlace caduca el {expiryLabel}.</p>
          </div>

          <div>
            <label htmlFor="invitation-name" className="mb-1.5 block text-sm font-medium text-ink">Nombre</label>
            <input id="invitation-name" className="input" required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div>
            <label htmlFor="invitation-password" className="mb-1.5 block text-sm font-medium text-ink">Contraseña</label>
            <PasswordInput id="invitation-password" required minLength={10} autoComplete="new-password" value={password} onChange={setPassword} placeholder="Mínimo 10 caracteres" disabled={isSubmitting} />
          </div>

          <label className="flex items-start gap-3 text-sm leading-6 text-muted">
            <input type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
            <span>He leído y acepto las <Link className="auth-link" to={routes.terms}>condiciones de uso</Link> y la <Link className="auth-link" to={routes.privacy}>información de privacidad</Link>.</span>
          </label>

          <button type="submit" className="btn-primary w-full" disabled={isSubmitting || !acceptedTerms}>
            {isSubmitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
