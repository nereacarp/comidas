import { describe, expect, it } from 'vitest';
import { isRecipesSectionPath } from './recipe-list-routes';

describe('isRecipesSectionPath', () => {
  it('returns true for recipe list and sub-routes', () => {
    expect(isRecipesSectionPath('/recipes')).toBe(true);
    expect(isRecipesSectionPath('/recipes/new')).toBe(true);
    expect(isRecipesSectionPath('/recipes/abc-123')).toBe(true);
    expect(isRecipesSectionPath('/recipes/abc-123/edit')).toBe(true);
  });

  it('returns false for other app sections', () => {
    expect(isRecipesSectionPath('/meal-plan')).toBe(false);
    expect(isRecipesSectionPath('/dashboard')).toBe(false);
    expect(isRecipesSectionPath('/favorites')).toBe(false);
  });
});
