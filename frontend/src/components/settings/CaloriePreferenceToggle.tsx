import { useState } from 'react';
import { createAuthApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import { setLocalShowCalories } from '../../lib/user-preferences';
import { useAuthStore } from '../../stores/auth.store';

const authApi = createAuthApi(apiClient);

interface CaloriePreferenceToggleProps {
  id?: string;
  /** When false, only the checkbox label is shown (e.g. Salud already has section copy). */
  showDescription?: boolean;
}

export function CaloriePreferenceToggle({
  id = 'show-calories',
  showDescription = true,
}: Readonly<CaloriePreferenceToggleProps>) {
  const user = useAuthStore((s) => s.user);
  const showCalories = user?.showCalories !== false;
  const [saving, setSaving] = useState(false);
  const [syncWarning, setSyncWarning] = useState('');

  const handleChange = async (next: boolean) => {
    if (!user || saving) return;
    setSaving(true);
    setSyncWarning('');

    setLocalShowCalories(user.id, next);
    useAuthStore.setState({ user: { ...user, showCalories: next } });

    try {
      await authApi.updatePreferences({ showCalories: next });
    } catch {
      setSyncWarning(
        'Cambio aplicado en este dispositivo. No se pudo sincronizar con tu cuenta; inténtalo de nuevo más tarde.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-page p-4"
      >
        <input
          id={id}
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] accent-[var(--brand)]"
          checked={showCalories}
          disabled={saving || !user}
          onChange={(e) => handleChange(e.target.checked)}
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">Mostrar calorías</span>
          {showDescription && (
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              Opcional. La app sirve para planificar comidas; no hace falta contar ni registrar kcal.
              Desactívalo si prefieres una interfaz más simple.
            </span>
          )}
        </span>
      </label>
      {syncWarning && (
        <p className="text-xs leading-relaxed text-[var(--warning-text)]" role="status">
          {syncWarning}
        </p>
      )}
    </div>
  );
}
