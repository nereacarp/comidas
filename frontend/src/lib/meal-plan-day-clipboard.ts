export type DayClipboardAction = 'copy' | 'paste';

export function getDayClipboardAction(
  date: string,
  copiedDate: string | null,
  hasMeals: boolean,
): DayClipboardAction | null {
  if (copiedDate && copiedDate !== date) return 'paste';
  if (hasMeals) return 'copy';
  return null;
}

export function isPasteTarget(date: string, copiedDate: string | null): boolean {
  return copiedDate !== null && copiedDate !== date;
}

export function getDayClipboardLabel(
  action: DayClipboardAction | null,
  isBusy: boolean,
): string | null {
  if (!action) return null;
  if (isBusy) return action === 'paste' ? 'Pegando...' : 'Copiando...';
  return action === 'paste' ? 'Pegar' : 'Copiar';
}
