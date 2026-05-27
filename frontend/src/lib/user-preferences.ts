const STORAGE_KEY = 'comidas_user_preferences';

type StoredPreferences = Record<string, { showCalories: boolean }>;

function readAll(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPreferences;
  } catch {
    return {};
  }
}

function writeAll(data: StoredPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function getLocalShowCalories(userId: string): boolean | undefined {
  return readAll()[userId]?.showCalories;
}

export function setLocalShowCalories(userId: string, showCalories: boolean) {
  const all = readAll();
  all[userId] = { showCalories };
  writeAll(all);
}

export function applyLocalPreferences<T extends { id: string; showCalories: boolean }>(user: T): T {
  const local = getLocalShowCalories(user.id);
  if (local === undefined) return user;
  return { ...user, showCalories: local };
}
