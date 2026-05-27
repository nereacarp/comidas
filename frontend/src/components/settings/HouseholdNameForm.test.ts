import { describe, expect, it } from 'vitest';
import { normalizeHouseholdName } from './HouseholdNameForm';

describe('normalizeHouseholdName', () => {
  it('returns trimmed name when non-empty', () => {
    expect(normalizeHouseholdName('  Mi hogar  ')).toBe('Mi hogar');
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(normalizeHouseholdName('')).toBeNull();
    expect(normalizeHouseholdName('   ')).toBeNull();
  });
});
