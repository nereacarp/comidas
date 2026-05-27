import { useId, useState, type FormEvent } from 'react';

interface HouseholdSetupScreenProps {
  onSubmit: (name: string) => Promise<void>;
}

export function HouseholdSetupScreen({ onSubmit }: Readonly<HouseholdSetupScreenProps>) {
  const inputId = useId();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(trimmed);
    } catch {
      setError('No se pudo crear el hogar. Inténtalo de nuevo.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="modal-panel w-full max-w-sm">
        <div className="modal-panel__header">
          <h1 className="modal-panel__title">Bienvenido</h1>
        </div>
        <div className="modal-panel__body">
          <p className="text-sm text-muted mb-4">
            Ponle nombre a tu primer hogar para empezar a planificar tus comidas.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-muted">
                Nombre del hogar
              </label>
              <input
                id={inputId}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi hogar"
                maxLength={60}
                autoFocus
                className="input w-full"
                disabled={busy}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={busy || !name.trim()}
            >
              {busy ? 'Creando…' : 'Crear hogar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
