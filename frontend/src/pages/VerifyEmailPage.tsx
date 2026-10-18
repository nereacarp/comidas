import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';

const authApi = createAuthApi(apiClient);

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    authApi.verifyEmail(token).then(() => setState('done')).catch(() => setState('error'));
  }, [token]);

  return (
    <AuthLayout title="Verificar correo" footer={<Link className="auth-link" to="/login">Ir al inicio de sesión</Link>}>
      <p className="text-center text-sm text-muted">
        {state === 'loading' && 'Verificando…'}
        {state === 'done' && 'Correo verificado correctamente. Ya puedes iniciar sesión.'}
        {state === 'error' && 'El enlace no es válido o ha caducado. Solicita uno nuevo desde el inicio de sesión.'}
      </p>
    </AuthLayout>
  );
}
