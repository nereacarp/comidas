import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordInput } from '../components/ui/PasswordInput';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';

const authApi = createAuthApi(apiClient);

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await authApi.resetPassword(params.get('token') ?? '', password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    }
  };

  return (
    <AuthLayout title="Nueva contraseña" footer={<Link className="auth-link" to="/login">Volver al inicio de sesión</Link>}>
      {done ? <p className="text-sm text-muted text-center">Contraseña actualizada. Ya puedes iniciar sesión.</p> : (
        <form onSubmit={submit} className="space-y-5">
          {error && <p className="alert-error" role="alert">{error}</p>}
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-ink">Nueva contraseña</label>
            <PasswordInput id="new-password" minLength={10} required autoComplete="new-password" value={password} onChange={setPassword} />
          </div>
          <button className="btn-primary w-full">Guardar contraseña</button>
        </form>
      )}
    </AuthLayout>
  );
}
