import { describe, expect, it } from 'vitest';
import {
  accentKeyAtIndex,
  getHouseholdAccent,
  getListAccent,
  householdAccentIndex,
  LIST_PALETTE_ACCENTS,
} from './list-accents';

describe('getListAccent', () => {
  it('returns the matching palette entry for a known key', () => {
    expect(getListAccent('cyan')).toEqual(LIST_PALETTE_ACCENTS.find((a) => a.key === 'cyan'));
  });

  it('falls back to peach when the key is missing or unknown', () => {
    expect(getListAccent(undefined).key).toBe('peach');
    expect(getListAccent('invalid').key).toBe('peach');
  });

  it('uses the fixed cycle index when accentKey is absent', () => {
    expect(getListAccent(undefined, 0).key).toBe('lavender');
    expect(getListAccent(undefined, 3).key).toBe('cyan');
    expect(accentKeyAtIndex(5)).toBe('lavender');
  });

  it('assigns stable accent index by sorted household id', () => {
    expect(householdAccentIndex('b', ['a', 'b', 'c'])).toBe(1);
    expect(householdAccentIndex('c', ['b', 'a', 'c'])).toBe(2);
  });
});

describe('getHouseholdAccent', () => {
  const households = [
    { id: 'a', accentKey: 'peach' },
    { id: 'b', accentKey: 'peach' },
    { id: 'c', accentKey: 'lavender' },
  ];

  it('uses stored key when it is unique', () => {
    expect(getHouseholdAccent('c', 'lavender', households).key).toBe('lavender');
  });

  it('uses stable index when accent key is duplicated', () => {
    expect(getHouseholdAccent('a', 'peach', households).key).toBe('lavender');
    expect(getHouseholdAccent('b', 'peach', households).key).toBe('mint');
  });
});
