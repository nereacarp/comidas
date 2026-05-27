import { describe, expect, it } from 'vitest';
import { pantryColorForNewLocation } from './pantry-location-colors';

describe('pantryColorForNewLocation', () => {
  it('cycles through list accent pastels', () => {
    expect(pantryColorForNewLocation(0)).toBe('#e6ccff');
    expect(pantryColorForNewLocation(1)).toBe('#a8e6cf');
    expect(pantryColorForNewLocation(2)).toBe('#ffd8a8');
  });
});
