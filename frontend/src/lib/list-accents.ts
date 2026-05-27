import type { CSSProperties } from 'react';
import { LIST_ACCENT_KEYS, type ListAccentKey } from './list-accent-keys';

export interface ListAccentStyle {
  key: ListAccentKey;
  bg: string;
  text: string;
}

export const LIST_PALETTE_ACCENTS: readonly ListAccentStyle[] = [
  { key: 'lavender', bg: 'var(--pastel-lavender)', text: 'var(--pastel-lavender-icon)' },
  { key: 'mint', bg: 'var(--pastel-mint)', text: 'var(--pastel-mint-icon)' },
  { key: 'peach', bg: 'var(--pastel-peach)', text: 'var(--pastel-peach-icon)' },
  { key: 'cyan', bg: 'var(--pastel-cyan)', text: 'var(--pastel-cyan-icon)' },
  { key: 'coral', bg: 'var(--pastel-coral)', text: 'var(--pastel-coral-icon)' },
] as const;

const ACCENT_BY_KEY = new Map(LIST_PALETTE_ACCENTS.map((a) => [a.key, a]));

/** Mismo ciclo que el backend: lavender → mint → peach → cyan → coral. */
export function accentKeyAtIndex(index: number): ListAccentKey {
  const n = LIST_ACCENT_KEYS.length;
  const i = ((index % n) + n) % n;
  return LIST_ACCENT_KEYS[i];
}

export function getListAccent(
  accentKey?: string | null,
  accentIndex?: number,
): ListAccentStyle {
  const key: ListAccentKey =
    accentKey && ACCENT_BY_KEY.has(accentKey as ListAccentKey)
      ? (accentKey as ListAccentKey)
      : accentIndex != null
        ? accentKeyAtIndex(accentIndex)
        : 'peach';
  return ACCENT_BY_KEY.get(key)!;
}

/** CSS variables for list-scoped UI (aliases section-accent-* for shared Por comprar styling). */
export function listAccentCssVars(accent: ListAccentStyle): CSSProperties {
  return {
    '--list-accent-text': accent.text,
    '--list-accent-bg': accent.bg,
    '--section-accent-text': accent.text,
    '--section-accent-bg': accent.bg,
  } as CSSProperties;
}

/** Stable accent index per household (sorted ids), same cycle as shopping lists. */
export function householdAccentIndex(householdId: string, householdIds: string[]): number {
  const sorted = [...householdIds].sort((a, b) => a.localeCompare(b));
  const index = sorted.indexOf(householdId);
  return index >= 0 ? index : 0;
}

/** Color de hogar: usa accentKey guardado o índice estable si falta o hay duplicados visuales. */
export function getHouseholdAccent(
  householdId: string,
  accentKey: string | undefined | null,
  households: ReadonlyArray<{ id: string; accentKey?: string | null }>,
): ListAccentStyle {
  const ids = households.map((h) => h.id);
  const index = householdAccentIndex(householdId, ids);

  if (accentKey && ACCENT_BY_KEY.has(accentKey as ListAccentKey)) {
    const duplicateCount = households.filter((h) => h.accentKey === accentKey).length;
    if (duplicateCount <= 1) {
      return getListAccent(accentKey);
    }
  }

  return getListAccent(undefined, index);
}
