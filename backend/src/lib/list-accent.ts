export const LIST_ACCENT_KEYS = ['lavender', 'mint', 'peach', 'cyan', 'coral'] as const;

export type ListAccentKey = (typeof LIST_ACCENT_KEYS)[number];

export function isListAccentKey(value: string): value is ListAccentKey {
  return (LIST_ACCENT_KEYS as readonly string[]).includes(value);
}

/** Color fijo según posición: lavender → mint → peach → cyan → coral → … */
export function accentKeyAtIndex(index: number): ListAccentKey {
  const n = LIST_ACCENT_KEYS.length;
  const i = ((index % n) + n) % n;
  return LIST_ACCENT_KEYS[i];
}

/** Color aleatorio de la paleta, priorizando tonos aún no usados en los hogares del usuario. */
export function pickRandomHouseholdAccentKey(existingKeys: readonly string[]): ListAccentKey {
  const used = new Set(existingKeys.filter(isListAccentKey));
  const pool = LIST_ACCENT_KEYS.filter((key) => !used.has(key));
  const choices = pool.length > 0 ? pool : LIST_ACCENT_KEYS;
  const index = Math.floor(Math.random() * choices.length);
  return choices[index]!;
}

/** Siguiente color en el ciclo (solo para compatibilidad con llamadas antiguas). */
export function pickNextListAccentKey(previous?: string | null): ListAccentKey {
  if (!previous || !isListAccentKey(previous)) {
    return LIST_ACCENT_KEYS[0];
  }
  const idx = LIST_ACCENT_KEYS.indexOf(previous);
  return LIST_ACCENT_KEYS[(idx + 1) % LIST_ACCENT_KEYS.length];
}

export interface ListAccentRow {
  id: string;
  accentKey: string;
  createdAt: Date;
}

export interface HouseholdAccentRow {
  id: string;
  accentKey: string;
  createdAt: Date;
}

/** Asigna colores distintos de la paleta (corrige duplicados y el default peach). */
export function planHouseholdAccentUpdates(
  households: HouseholdAccentRow[],
): Map<string, ListAccentKey> {
  if (households.length <= 1) return new Map();

  const sorted = [...households].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const updates = new Map<string, ListAccentKey>();

  if (sorted.every((h) => h.accentKey === 'peach')) {
    sorted.forEach((h, index) => {
      updates.set(h.id, accentKeyAtIndex(index));
    });
    return updates;
  }

  const usedKeys = new Set<ListAccentKey>();
  for (const household of sorted) {
    const current = household.accentKey;
    if (isListAccentKey(current) && !usedKeys.has(current)) {
      usedKeys.add(current);
      continue;
    }
    const next =
      LIST_ACCENT_KEYS.find((key) => !usedKeys.has(key)) ??
      accentKeyAtIndex(usedKeys.size);
    updates.set(household.id, next);
    usedKeys.add(next);
  }

  return updates;
}

/** Asigna el color de la paleta según el orden de creación (siempre el mismo ciclo). */
export function planDistinctListAccentUpdates(
  lists: ListAccentRow[],
): Map<string, ListAccentKey> {
  const sorted = [...lists].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const updates = new Map<string, ListAccentKey>();

  sorted.forEach((list, index) => {
    const expected = accentKeyAtIndex(index);
    if (list.accentKey !== expected) {
      updates.set(list.id, expected);
    }
  });

  return updates;
}
