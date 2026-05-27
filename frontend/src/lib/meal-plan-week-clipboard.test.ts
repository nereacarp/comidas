import { describe, expect, it } from 'vitest';
import {
  getWeekClipboardAction,
  getWeekClipboardLabel,
  getWeekClipboardLabelShort,
  isWeekPasteTarget,
} from './meal-plan-week-clipboard';

describe('getWeekClipboardAction', () => {
  it('returns copy when nothing is copied and the week has meals', () => {
    expect(getWeekClipboardAction('2026-05-25', null, true)).toBe('copy');
  });

  it('returns paste on another week while a week is copied', () => {
    expect(getWeekClipboardAction('2026-06-01', '2026-05-25', false)).toBe('paste');
  });

  it('returns copy on the source week when it still has meals', () => {
    expect(getWeekClipboardAction('2026-05-25', '2026-05-25', true)).toBe('copy');
  });

  it('returns null when there is nothing to copy or paste', () => {
    expect(getWeekClipboardAction('2026-05-25', null, false)).toBeNull();
  });
});

describe('isWeekPasteTarget', () => {
  it('is true for other weeks while a week is copied', () => {
    expect(isWeekPasteTarget('2026-06-01', '2026-05-25')).toBe(true);
  });

  it('is false for the source week', () => {
    expect(isWeekPasteTarget('2026-05-25', '2026-05-25')).toBe(false);
  });
});

describe('getWeekClipboardLabel', () => {
  it('labels copy and paste actions', () => {
    expect(getWeekClipboardLabel('copy', false)).toBe('Copiar semana');
    expect(getWeekClipboardLabel('paste', false)).toBe('Pegar semana');
  });
});

describe('getWeekClipboardLabelShort', () => {
  it('uses short labels on small screens', () => {
    expect(getWeekClipboardLabelShort('paste', false)).toBe('Pegar sem.');
  });
});
