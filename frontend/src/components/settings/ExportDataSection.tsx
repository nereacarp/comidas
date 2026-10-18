import { useState } from 'react';
import { apiClient } from '../../api/client';
import { createAuthApi } from '../../api/auth';

const authApi = createAuthApi(apiClient);

export function ExportDataSection() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setBusy(true);
    setError('');
    try {
      const data = await authApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comidas-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo exportar la información.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
      <h4 className="mb-2 text-sm font-bold text-ink">Exportar mis datos</h4>
      <p className="type-hint mb-3">Descarga una copia JSON con tu perfil y los datos de tus hogares.</p>
      {error && <p className="mb-3 text-sm font-semibold text-[var(--danger-text)]" role="alert">{error}</p>}
      <button type="button" className="btn-neutral" disabled={busy} onClick={download}>
        {busy ? 'Preparando…' : 'Descargar mis datos'}
      </button>
    </div>
  );
}
