import { describe, expect, it } from 'vitest';
import { isIngredientInPantry } from './ingredient-pantry-match';

describe('isIngredientInPantry', () => {
  it('returns true when a pantry item contains the ingredient name', () => {
    expect(isIngredientInPantry('pollo', ['Pechuga de pollo', 'Arroz'])).toBe(true);
  });

  it('returns false when no pantry item matches', () => {
    expect(isIngredientInPantry('salmón', ['Pechuga de pollo', 'Arroz'])).toBe(false);
  });
});
