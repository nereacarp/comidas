import { describe, expect, it, beforeEach } from 'vitest';
import { applyLocalPreferences, getLocalShowCalories, setLocalShowCalories } from './user-preferences';

describe('user-preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and reads showCalories per user', () => {
    setLocalShowCalories('u1', false);
    expect(getLocalShowCalories('u1')).toBe(false);
    expect(getLocalShowCalories('u2')).toBeUndefined();
  });

  it('merges local preference over server user', () => {
    const merged = applyLocalPreferences({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      showCalories: true,
      createdAt: '',
    });
    setLocalShowCalories('u1', false);
    expect(applyLocalPreferences(merged).showCalories).toBe(false);
  });
});
