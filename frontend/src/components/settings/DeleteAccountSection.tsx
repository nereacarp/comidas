import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAuthApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { Modal } from '../ui/Modal';

const authApi = createAuthApi(apiClient);

export function DeleteAccountSection() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputId = useId();

  useEffect(() => {
    if (!modalOpen) {
      setPassword('');
      setError('');
    }
  }, [modalOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await authApi.deleteAccount({ password });
      logout();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
        <h4 className="text-sm font-bold text-[var(--danger-text)] mb-2">Eliminar mi cuenta</h4>
        <p className="text-sm text-muted mb-4">
          Se eliminará tu perfil y perderás el acceso a todos los hogares. Los hogares donde solo tú
          eres miembro también se borrarán. Si eres propietario de un hogar con más gente, elimínalo o
          sal del hogar antes.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-danger-soft !px-4 !py-2.5"
        >
          Eliminar cuenta
        </button>
      </div>

      <Modal isOpen={modalOpen} onClose={() => !busy && setModalOpen(false)} title="Eliminar cuenta">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="type-hint">
            Esta acción es permanente. Introduce tu contraseña para confirmar que quieres borrar tu
            cuenta.
          </p>
          <div>
            <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
              Contraseña
            </label>
            <input
              id={inputId}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
          {error && (
            <p className="text-sm font-semibold text-[var(--danger-text)]" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-neutral" disabled={busy}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!password.trim() || busy}
            >
              {busy ? 'Eliminando…' : 'Eliminar cuenta'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
