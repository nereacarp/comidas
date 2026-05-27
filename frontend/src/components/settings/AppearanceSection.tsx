import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import {
  applyThemePreference,
  getThemePreference,
  type ThemePreference,
} from '../../lib/theme';

const OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'Sistema', hint: 'Sigue el tema del dispositivo' },
  { value: 'light', label: 'Claro', hint: 'Fondo claro' },
  { value: 'dark', label: 'Oscuro', hint: 'Fondo oscuro' },
];

export function AppearanceSection() {
  const [preference, setPreference] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="type-card-title">Apariencia</h2>
      <p className="type-hint mt-1">Elige cómo se ve la interfaz en este dispositivo.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tema de la aplicación">
        {OPTIONS.map(({ value, label, hint }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(value)}
              className={`rounded-[var(--radius-control)] border px-3 py-3 text-left transition-[background,border-color,box-shadow] duration-200 ease-out cursor-pointer ${
                selected
                  ? 'border-[color-mix(in_oklab,var(--brand)_40%,var(--border-subtle))] bg-[color-mix(in_oklab,var(--pastel-lavender)_35%,var(--surface))] shadow-[var(--shadow-card)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] hover:border-[color-mix(in_oklab,var(--brand)_22%,var(--border-subtle))]'
              }`}
            >
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs text-muted mt-0.5">{hint}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
