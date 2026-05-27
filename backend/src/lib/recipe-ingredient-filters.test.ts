import { describe, expect, it } from 'vitest';
import { buildRecipeIngredientWhereClauses, uniqueIngredientNames } from './recipe-ingredient-filters.js';

describe('recipe-ingredient-filters', () => {
  it('deduplicates ingredient names', () => {
    expect(uniqueIngredientNames(['Pollo', ' pollo ', 'Arroz'])).toEqual(['Pollo', 'Arroz']);
  });

  it('builds pantry clause for ingredients you have', () => {
    const clauses = buildRecipeIngredientWhereClauses({ pantryIngredients: ['Pollo'] });
    expect(clauses).toHaveLength(1);
    expect(clauses[0]).toEqual({
      ingredients: {
        some: { name: { contains: 'Pollo', mode: 'insensitive' } },
      },
    });
  });

  it('builds buy clause requiring ingredient not in pantry', () => {
    const clauses = buildRecipeIngredientWhereClauses({ buyIngredients: ['Salmón'] });
    expect(clauses).toHaveLength(1);
    expect(clauses[0]).toEqual({
      AND: [
        {
          ingredients: {
            some: { name: { contains: 'Salmón', mode: 'insensitive' } },
          },
        },
        {
          household: {
            pantryItems: {
              none: { name: { contains: 'Salmón', mode: 'insensitive' } },
            },
          },
        },
      ],
    });
  });

  it('returns separate clauses when both pantry and buy filters are set', () => {
    expect(
      buildRecipeIngredientWhereClauses({
        pantryIngredients: ['Arroz'],
        buyIngredients: ['Salmón'],
      }),
    ).toHaveLength(2);
  });
});
