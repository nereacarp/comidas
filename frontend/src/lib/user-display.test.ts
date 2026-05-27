import { describe, expect, it } from 'vitest';
import { getUserInitials } from './user-display';

describe('getUserInitials', () => {
  it('returns ? when name is missing', () => {
    expect(getUserInitials()).toBe('?');
    expect(getUserInitials('')).toBe('?');
    expect(getUserInitials('   ')).toBe('?');
  });

  it('returns up to two initials from the name', () => {
    expect(getUserInitials('Nerea')).toBe('N');
    expect(getUserInitials('Nerea Carpintero')).toBe('NC');
    expect(getUserInitials('  Ana   María   López  ')).toBe('AM');
  });
});
