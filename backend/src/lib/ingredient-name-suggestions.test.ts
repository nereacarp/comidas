import { describe, expect, it, vi } from 'vitest';
import { getIngredientNameSuggestions, isNameInPantry } from './ingredient-name-suggestions.js';

describe('isNameInPantry', () => {
  it('detects pantry membership by partial name match', () => {
    expect(isNameInPantry('pollo', ['Pechuga de pollo', 'Arroz'])).toBe(true);
    expect(isNameInPantry('salmón', ['Pechuga de pollo'])).toBe(false);
  });
});

describe('getIngredientNameSuggestions', () => {
  it('returns pantry and recipe recommendations when query is short', async () => {
    const prisma = {
      pantryItem: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ name: 'Tomate' }, { name: 'Arroz' }])
          .mockResolvedValueOnce([{ name: 'Tomate' }, { name: 'Arroz' }]),
      },
      recipeIngredient: {
        findMany: vi.fn().mockResolvedValue([{ name: 'Salmón' }, { name: 'Tomate' }]),
      },
    };

    const results = await getIngredientNameSuggestions(prisma as never, 'h1', '');

    expect(results).toEqual([
      { name: 'Tomate', inPantry: true },
      { name: 'Arroz', inPantry: true },
      { name: 'Salmón', inPantry: false },
    ]);
  });

  it('merges search matches from pantry and recipes with flags', async () => {
    const prisma = {
      pantryItem: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([{ name: 'Pollo' }]),
      },
      recipeIngredient: {
        findMany: vi.fn().mockResolvedValue([{ name: 'Pollo' }, { name: 'Salmón' }]),
      },
    };

    const results = await getIngredientNameSuggestions(prisma as never, 'h1', 'po');

    expect(results).toEqual([
      { name: 'Pollo', inPantry: true },
      { name: 'Salmón', inPantry: false },
    ]);
  });
});
