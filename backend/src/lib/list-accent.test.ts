import { describe, expect, it } from 'vitest';
import {
  LIST_ACCENT_KEYS,
  accentKeyAtIndex,
  pickNextListAccentKey,
  pickRandomHouseholdAccentKey,
  planDistinctListAccentUpdates,
  planHouseholdAccentUpdates,
} from './list-accent.js';

describe('accentKeyAtIndex', () => {
  it('cycles through the palette in a fixed order', () => {
    expect(accentKeyAtIndex(0)).toBe('lavender');
    expect(accentKeyAtIndex(1)).toBe('mint');
    expect(accentKeyAtIndex(2)).toBe('peach');
    expect(accentKeyAtIndex(3)).toBe('cyan');
    expect(accentKeyAtIndex(4)).toBe('coral');
    expect(accentKeyAtIndex(5)).toBe('lavender');
  });
});

describe('pickRandomHouseholdAccentKey', () => {
  it('returns a palette key', () => {
    const key = pickRandomHouseholdAccentKey([]);
    expect(LIST_ACCENT_KEYS).toContain(key);
  });

  it('prefers keys not already used by other households', () => {
    const key = pickRandomHouseholdAccentKey(['lavender', 'mint', 'peach', 'cyan']);
    expect(key).toBe('coral');
  });

  it('can return any palette key when all are used', () => {
    const key = pickRandomHouseholdAccentKey([...LIST_ACCENT_KEYS]);
    expect(LIST_ACCENT_KEYS).toContain(key);
  });
});

describe('pickNextListAccentKey', () => {
  it('returns the next key in the fixed cycle', () => {
    expect(pickNextListAccentKey('lavender')).toBe('mint');
    expect(pickNextListAccentKey('coral')).toBe('lavender');
    expect(pickNextListAccentKey(null)).toBe('lavender');
  });
});

describe('planHouseholdAccentUpdates', () => {
  it('returns empty map for a single household', () => {
    expect(
      planHouseholdAccentUpdates([
        { id: '1', accentKey: 'peach', createdAt: new Date('2024-01-01') },
      ]).size,
    ).toBe(0);
  });

  it('spreads palette colors when all households are peach', () => {
    const updates = planHouseholdAccentUpdates([
      { id: '1', accentKey: 'peach', createdAt: new Date('2024-01-01') },
      { id: '2', accentKey: 'peach', createdAt: new Date('2024-01-02') },
      { id: '3', accentKey: 'peach', createdAt: new Date('2024-01-03') },
    ]);
    expect(updates.get('1')).toBe('lavender');
    expect(updates.get('2')).toBe('mint');
    expect(updates.get('3')).toBe('peach');
  });

  it('fixes duplicate accent keys', () => {
    const updates = planHouseholdAccentUpdates([
      { id: '1', accentKey: 'lavender', createdAt: new Date('2024-01-01') },
      { id: '2', accentKey: 'lavender', createdAt: new Date('2024-01-02') },
    ]);
    expect(updates.has('1')).toBe(false);
    expect(updates.get('2')).toBe('mint');
  });
});

describe('planDistinctListAccentUpdates', () => {
  it('assigns lavender, mint, peach by creation order when all are peach', () => {
    const lists = [
      { id: '1', accentKey: 'peach', createdAt: new Date('2024-01-01') },
      { id: '2', accentKey: 'peach', createdAt: new Date('2024-01-02') },
      { id: '3', accentKey: 'peach', createdAt: new Date('2024-01-03') },
    ];
    const updates = planDistinctListAccentUpdates(lists);
    expect(updates.get('1')).toBe('lavender');
    expect(updates.get('2')).toBe('mint');
    expect(updates.has('3')).toBe(false);
  });
});
