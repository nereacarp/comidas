import { describe, expect, it } from 'vitest';
import { getDayClipboardAction, getDayClipboardLabel, isPasteTarget } from './meal-plan-day-clipboard';

describe('getDayClipboardAction', () => {
  it('returns copy when nothing is copied and the day has meals', () => {
    expect(getDayClipboardAction('2026-05-25', null, true)).toBe('copy');
  });

  it('returns paste on other days while a day is copied', () => {
    expect(getDayClipboardAction('2026-05-26', '2026-05-25', false)).toBe('paste');
  });

  it('returns copy on the source day when it still has meals', () => {
    expect(getDayClipboardAction('2026-05-25', '2026-05-25', true)).toBe('copy');
  });

  it('returns null when there is nothing to copy or paste', () => {
    expect(getDayClipboardAction('2026-05-25', null, false)).toBeNull();
  });
});

describe('isPasteTarget', () => {
  it('is true for other days while a day is copied', () => {
    expect(isPasteTarget('2026-06-02', '2026-05-25')).toBe(true);
  });

  it('is false for the source day', () => {
    expect(isPasteTarget('2026-05-25', '2026-05-25')).toBe(false);
  });
});

describe('getDayClipboardLabel', () => {
  it('labels copy and paste actions', () => {
    expect(getDayClipboardLabel('copy', false)).toBe('Copiar');
    expect(getDayClipboardLabel('paste', false)).toBe('Pegar');
  });

  it('shows busy labels', () => {
    expect(getDayClipboardLabel('paste', true)).toBe('Pegando...');
    expect(getDayClipboardLabel('copy', true)).toBe('Copiando...');
  });
});
