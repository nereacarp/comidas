import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthFormError } from '../components/auth/AuthFormError';
import { PasswordInput } from '../components/ui/PasswordInput';

export function RegisterPage() {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requiresVerification = await register(email, password, name);
      if (requiresVerification) setVerificationSent(true);
      else navigate('/dashboard');
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
      {verificationSent ? (
        <div className="auth-card__body text-center">
          <h2 className="type-display-sm">Revisa tu correo</h2>
          <p className="mt-3 text-sm text-muted">Te hemos enviado un enlace para verificar la cuenta.</p>
          <Link to="/login" className="auth-link mt-5 inline-flex">Volver a iniciar sesión</Link>
        </div>
      ) : <form onSubmit={handleSubmit} className="space-y-5">
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
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 10 caracteres"
            disabled={isLoading}
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-6 text-muted">
          <input
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>
            He leído y acepto las <Link className="auth-link" to="/terms">condiciones de uso</Link>{' '}
            y he leído la <Link className="auth-link" to="/privacy">información de privacidad</Link>.
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading || !acceptedTerms}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>}
    </AuthLayout>
  );
}
