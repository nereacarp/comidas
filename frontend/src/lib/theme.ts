export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'comidas-theme';

function systemIsDark(): boolean {
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return systemIsDark() ? 'dark' : 'light';
  }
  return preference;
}

export function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function applyThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference);
  document.documentElement.dataset.theme = resolveTheme(preference);
}

/** Call once before React mount to avoid flash of wrong theme. */
export function initTheme(): void {
  applyThemePreference(getThemePreference());

  globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemePreference() === 'system') {
      document.documentElement.dataset.theme = resolveTheme('system');
    }
  });
}
