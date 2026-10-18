import { describe, expect, it } from 'vitest';
import { getUserInitials } from './user-display';

describe('getUserInitials', () => {
  it('returns ? when name is missing', () => {
    expect(getUserInitials()).toBe('?');
    expect(getUserInitials('')).toBe('?');
    expect(getUserInitials('   ')).toBe('?');
  });

  it('returns up to two initials from the name', () => {
    expect(getUserInitials('Ana')).toBe('A');
    expect(getUserInitials('Ana García')).toBe('AG');
    expect(getUserInitials('  Ana   María   López  ')).toBe('AM');
  });
});
