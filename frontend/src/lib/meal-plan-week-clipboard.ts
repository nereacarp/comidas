export type WeekClipboardAction = 'copy' | 'paste';

export function getWeekClipboardAction(
  currentWeekStart: string,
  copiedWeekStart: string | null,
  weekHasMeals: boolean,
): WeekClipboardAction | null {
  if (copiedWeekStart && copiedWeekStart !== currentWeekStart) return 'paste';
  if (weekHasMeals) return 'copy';
  return null;
}

export function isWeekPasteTarget(
  currentWeekStart: string,
  copiedWeekStart: string | null,
): boolean {
  return copiedWeekStart !== null && copiedWeekStart !== currentWeekStart;
}

export function getWeekClipboardLabel(
  action: WeekClipboardAction | null,
  isBusy: boolean,
): string | null {
  if (!action) return null;
  if (isBusy) return action === 'paste' ? 'Pegando...' : 'Copiando...';
  return action === 'paste' ? 'Pegar semana' : 'Copiar semana';
}

/** Shorter labels for narrow week toolbar (mobile). */
export function getWeekClipboardLabelShort(
  action: WeekClipboardAction | null,
  isBusy: boolean,
): string | null {
  if (!action) return null;
  if (isBusy) return action === 'paste' ? 'Pegando...' : 'Copiar sem.';
  return action === 'paste' ? 'Pegar sem.' : 'Copiar sem.';
}
