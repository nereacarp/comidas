import { FormEvent, useState } from 'react';

interface Props {
  apiUrl: string;
  onLogin: (actor: string, secret: string) => void;
}

export function AdminLogin({ apiUrl, onLogin }: Props) {
  const [actor, setActor] = useState('admin');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedActor = actor.trim();
    const normalizedSecret = secret.trim();

    if (!normalizedActor || !normalizedSecret) {
      setError('Introduce tu identificador y contraseña de administración.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${normalizedSecret}`,
          'X-Admin-Actor': normalizedActor,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (response.status === 401) {
          setError('Credenciales de administración incorrectas.');
        } else if (response.status === 429) {
          setError('Demasiados intentos. Espera un momento antes de volver a probar.');
        } else {
          setError(body?.error || `No se pudo acceder al panel (${response.status}).`);
        }
        return;
      }

      onLogin(normalizedActor, normalizedSecret);
    } catch {
      setError('No se puede conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__main">
        <div className="auth-shell__inner">
          <section className="auth-shell__form-area" aria-labelledby="auth-form-heading">
            <div className="auth-shell__form-header">
              <h1 id="auth-form-heading" className="auth-shell__form-title">Iniciar sesión</h1>
              <p className="auth-shell__form-footer">
                Panel de administración de <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Comidas</span>
              </p>
            </div>

            <div className="auth-card">
              <div className="auth-card__accent" aria-hidden />
              <div className="auth-card__body">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && <p className="auth-form-error" role="alert">{error}</p>}

                  <div>
                    <label htmlFor="admin-actor" className="mb-1.5 block text-sm font-medium">Identificador</label>
                    <input
                      id="admin-actor"
                      value={actor}
                      onChange={(event) => setActor(event.target.value)}
                      autoComplete="username"
                      className="input"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium">Contraseña</label>
                    <input
                      id="admin-password"
                      type="password"
                      value={secret}
                      onChange={(event) => setSecret(event.target.value)}
                      autoComplete="current-password"
                      className="input"
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Verificando…' : 'Entrar'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
