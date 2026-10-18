import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import { createAuthApi } from '../api/auth';
import { apiClient } from '../api/client';

const authApi = createAuthApi(apiClient);

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Recuperar contraseña" footer={<Link className="auth-link" to="/login">Volver al inicio de sesión</Link>}>
      {sent ? (
        <p className="text-sm text-muted text-center">Si existe una cuenta con ese correo, recibirás un enlace válido durante una hora.</p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input id="recovery-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
