import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthFormError } from '../components/auth/AuthFormError';
import { PasswordInput } from '../components/ui/PasswordInput';

export function LoginPage() {
  const { login, isLoading, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error is set in store
    }
  };

  return (
    <AuthLayout
      title="Iniciar sesión"
      footer={(
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">
            Regístrate
          </Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthFormError message={error} onDismiss={clearError} />}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
            Contraseña
          </label>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}
