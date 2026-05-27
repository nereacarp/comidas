import { describe, it, expect } from 'vitest';
import { reorderInList } from './reorder-list';

describe('reorderInList', () => {
  it('moves an item forward', () => {
    expect(reorderInList(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item backward', () => {
    expect(reorderInList(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns a copy when indices are equal', () => {
    const input = ['a', 'b'];
    const result = reorderInList(input, 1, 1);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  it('appends when to equals list length', () => {
    expect(reorderInList(['a', 'b', 'c'], 0, 3)).toEqual(['b', 'c', 'a']);
  });
});
