import { describe, expect, it } from 'vitest';
import {
  getNavAccent,
  getSectionBtnClass,
  getSectionSoftBtnClass,
  getSectionStripeClass,
  sectionStripeStyle,
  NAV_SECTION_ACCENTS,
} from './section-accents';
import { routes } from './routes';

describe('getNavAccent', () => {
  it('maps main routes to dashboard pastel accents', () => {
    expect(getNavAccent(routes.recipes).bg).toBe('var(--pastel-lavender)');
    expect(getNavAccent(routes.mealPlan).bg).toBe('var(--pastel-mint)');
    expect(getNavAccent(routes.pantry).bg).toBe('var(--pastel-cyan)');
    expect(getNavAccent(routes.shoppingLists).bg).toBe('var(--pastel-peach)');
  });

  it('uses coral for health', () => {
    expect(getNavAccent(routes.health).bg).toBe('var(--pastel-coral)');
  });

  it('uses neutral for home and settings', () => {
    expect(getNavAccent(routes.dashboard).bg).toBe('var(--nav-neutral-bg)');
    expect(getNavAccent(routes.settings).bg).toBe('var(--nav-neutral-bg)');
  });

  it('resolves nested recipe and shopping paths', () => {
    expect(getNavAccent('/recipes/abc').bg).toBe(NAV_SECTION_ACCENTS[routes.recipes].bg);
    expect(getNavAccent('/shopping-lists/1').bg).toBe(NAV_SECTION_ACCENTS[routes.shoppingLists].bg);
  });

  it('maps favorites to recipes accent', () => {
    expect(getNavAccent(routes.favorites).bg).toBe(NAV_SECTION_ACCENTS[routes.recipes].bg);
  });
});

describe('getSectionBtnClass', () => {
  it('returns section-specific button classes', () => {
    expect(getSectionBtnClass(routes.shoppingLists)).toBe('btn-section-peach');
    expect(getSectionBtnClass(routes.pantry)).toBe('btn-section-cyan');
    expect(getSectionBtnClass(routes.mealPlan)).toBe('btn-section-mint');
    expect(getSectionBtnClass(routes.health)).toBe('btn-health');
    expect(getSectionBtnClass(routes.recipes)).toBe('btn-section-lavender');
    expect(getSectionBtnClass('/recipes/abc/edit')).toBe('btn-section-lavender');
    expect(getSectionBtnClass(routes.favorites)).toBe('btn-section-lavender');
    expect(getSectionBtnClass(routes.settings)).toBe('btn-section-neutral');
    expect(getSectionBtnClass(routes.dashboard)).toBe('btn-primary');
  });
});

describe('getSectionSoftBtnClass', () => {
  it('returns section-tinted soft button classes', () => {
    expect(getSectionSoftBtnClass(routes.recipes)).toBe('btn-soft');
    expect(getSectionSoftBtnClass(routes.mealPlan)).toBe('btn-section-mint-soft');
    expect(getSectionSoftBtnClass(routes.settings)).toBe('btn-section-neutral-soft');
  });
});

describe('section stripe', () => {
  it('uses accent stripe class', () => {
    expect(getSectionStripeClass(routes.pantry)).toBe('section-stripe-accent');
  });

  it('exposes stripe colors from section accent', () => {
    expect(sectionStripeStyle(routes.pantry)['--section-stripe-bg']).toBe('var(--pastel-cyan)');
    expect(sectionStripeStyle(routes.shoppingLists)['--section-stripe-text']).toBe('var(--pastel-peach-icon)');
  });
});
