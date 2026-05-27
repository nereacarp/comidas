import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthFormError } from '../components/auth/AuthFormError';
import { PasswordInput } from '../components/ui/PasswordInput';

export function RegisterPage() {
  const { register, isLoading, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch {
      // error is set in store
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      footer={(
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link">
            Inicia sesión
          </Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthFormError message={error} onDismiss={clearError} />}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Cómo te llamamos"
          />
        </div>

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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
