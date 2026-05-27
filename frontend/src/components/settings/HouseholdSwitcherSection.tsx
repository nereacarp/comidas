import { useState } from 'react';
import { useHousehold } from '../../hooks/useHousehold';
import { createHouseholdsApi } from '../../api/households';
import { apiClient } from '../../api/client';
import { getHouseholdAccent, listAccentCssVars } from '../../lib/list-accents';
import { routes } from '../../lib/routes';
import { getSectionBtnClass } from '../../lib/section-accents';

const householdsApi = createHouseholdsApi(apiClient);
const SETTINGS_BTN = getSectionBtnClass(routes.settings);

const ROLE_LABELS = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  VIEWER: 'Solo lectura',
} as const;

export function HouseholdSwitcherSection() {
  const { household, households, switchHousehold, reloadHousehold } = useHousehold();
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const handleSwitch = async (householdId: string) => {
    if (householdId === household?.id) return;
    setIsSwitching(householdId);
    try {
      await switchHousehold(householdId);
    } finally {
      setIsSwitching(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      await householdsApi.create({ name });
      setNewName('');
      await reloadHousehold();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="card p-6">
      <h3 className="type-display-sm mb-4">Hogar activo</h3>
      <ul className="space-y-2 mb-4">
        {households.map((item) => {
          const isActive = item.id === household?.id;
          const isBusy = isSwitching === item.id;
          const accent = getHouseholdAccent(item.id, item.accentKey, households);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSwitch(item.id)}
                disabled={isActive || isBusy}
                className={`household-switcher-item w-full text-left ${isActive ? 'household-switcher-item--active' : ''}`}
                style={listAccentCssVars(accent)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className="household-switcher-item__swatch"
                  style={{ background: accent.bg }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink truncate">{item.name}</span>
                  <span className="block text-xs text-muted mt-0.5">
                    {ROLE_LABELS[item.role]}
                  </span>
                </span>
                {isActive ? (
                  <span className="household-switcher-item__badge">Activo</span>
                ) : isBusy ? (
                  <span className="text-xs text-muted">Cambiando…</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleCreate} className="settings-create-row">
        <input
          type="text"
          placeholder="Nombre del nuevo hogar"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="input settings-create-row__input"
        />
        <button
          type="submit"
          disabled={!newName.trim() || isCreating}
          className={`${SETTINGS_BTN} settings-create-row__submit disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isCreating ? 'Creando…' : 'Crear hogar'}
        </button>
      </form>
    </section>
  );
}
