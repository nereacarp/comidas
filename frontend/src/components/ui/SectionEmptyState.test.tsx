import { describe, expect, it } from 'vitest';
import { sectionEmptyIconStyle } from './SectionEmptyState';
import { getNavAccent } from '../../lib/section-accents';
import { routes } from '../../lib/routes';

describe('sectionEmptyIconStyle', () => {
  it('uses pantry cyan section accent', () => {
    expect(sectionEmptyIconStyle(getNavAccent(routes.pantry))).toEqual({
      background: 'var(--pastel-cyan)',
      color: 'var(--pastel-cyan-icon)',
    });
  });

  it('uses recipes lavender accent', () => {
    expect(sectionEmptyIconStyle(getNavAccent(routes.recipes))).toEqual({
      background: 'var(--pastel-lavender)',
      color: 'var(--pastel-lavender-icon)',
    });
  });

  it('uses shopping peach accent', () => {
    expect(sectionEmptyIconStyle(getNavAccent(routes.shoppingLists))).toEqual({
      background: 'var(--pastel-peach)',
      color: 'var(--pastel-peach-icon)',
    });
  });

  it('uses meal plan mint accent', () => {
    expect(sectionEmptyIconStyle(getNavAccent(routes.mealPlan))).toEqual({
      background: 'var(--pastel-mint)',
      color: 'var(--pastel-mint-icon)',
    });
  });
});
