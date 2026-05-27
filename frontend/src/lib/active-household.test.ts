import { describe, expect, it } from 'vitest';
import { pickHouseholdId } from './active-household';

describe('pickHouseholdId', () => {
  const households = [{ id: 'h1' }, { id: 'h2' }];

  it('returns preferred id when it exists in the list', () => {
    expect(pickHouseholdId(households, 'h2')).toBe('h2');
  });

  it('falls back to first household when preferred is missing', () => {
    expect(pickHouseholdId(households, 'h9')).toBe('h1');
  });

  it('returns null for empty list', () => {
    expect(pickHouseholdId([], 'h1')).toBeNull();
  });
});
