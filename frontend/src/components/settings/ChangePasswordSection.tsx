import { useState } from 'react';
import { createAuthApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import { PasswordInput } from '../ui/PasswordInput';

const authApi = createAuthApi(apiClient);

export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmation) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setMessage('Contraseña actualizada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
      <h4 className="mb-2 text-sm font-bold text-ink">Cambiar contraseña</h4>
      <form onSubmit={handleSubmit} className="grid max-w-lg gap-3">
        <label htmlFor="current-password" className="text-sm font-semibold text-ink">Contraseña actual</label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          disabled={busy}
          placeholder="Contraseña actual"
        />
        <label htmlFor="new-password" className="text-sm font-semibold text-ink">Nueva contraseña</label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          disabled={busy}
          placeholder="Nueva contraseña (mínimo 10 caracteres)"
        />
        <label htmlFor="confirm-password" className="text-sm font-semibold text-ink">Repite la nueva contraseña</label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          value={confirmation}
          onChange={setConfirmation}
          disabled={busy}
          placeholder="Repite la nueva contraseña"
        />
        {error && <p className="text-sm font-semibold text-[var(--danger-text)]" role="alert">{error}</p>}
        {message && <p className="text-sm font-semibold text-[var(--success-text)]" role="status">{message}</p>}
        <button
          type="submit"
          className="btn-neutral w-fit"
          disabled={busy || !currentPassword || newPassword.length < 10 || !confirmation}
        >
          {busy ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
