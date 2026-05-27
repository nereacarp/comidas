import { routes } from './routes';

/** Pastel background + contrasting text for nav active state and dashboard icons. */
export interface SectionAccent {
  bg: string;
  text: string;
}

export const NAV_SECTION_ACCENTS: Record<string, SectionAccent> = {
  [routes.dashboard]: {
    bg: 'var(--nav-neutral-bg)',
    text: 'var(--nav-neutral-text)',
  },
  [routes.recipes]: {
    bg: 'var(--pastel-lavender)',
    text: 'var(--pastel-lavender-icon)',
  },
  [routes.mealPlan]: {
    bg: 'var(--pastel-mint)',
    text: 'var(--pastel-mint-icon)',
  },
  [routes.pantry]: {
    bg: 'var(--pastel-cyan)',
    text: 'var(--pastel-cyan-icon)',
  },
  [routes.shoppingLists]: {
    bg: 'var(--pastel-peach)',
    text: 'var(--pastel-peach-icon)',
  },
  [routes.health]: {
    bg: 'var(--pastel-coral)',
    text: 'var(--pastel-coral-icon)',
  },
  [routes.settings]: {
    bg: 'var(--nav-neutral-bg)',
    text: 'var(--nav-neutral-text)',
  },
};

export function getNavAccent(path: string): SectionAccent {
  if (path in NAV_SECTION_ACCENTS) {
    return NAV_SECTION_ACCENTS[path];
  }
  if (path.startsWith('/recipes') || path === routes.favorites) {
    return NAV_SECTION_ACCENTS[routes.recipes];
  }
  if (path.startsWith('/shopping-lists')) {
    return NAV_SECTION_ACCENTS[routes.shoppingLists];
  }
  return NAV_SECTION_ACCENTS[routes.dashboard];
}

export function navActiveStyle(accent: SectionAccent): Record<string, string> {
  return {
    '--nav-accent-bg': accent.bg,
    '--nav-accent-text': accent.text,
  };
}

/** Primary CTA on section pages (Inicio keeps btn-primary via dashboard fallback). */
export function getSectionBtnClass(path: string): string {
  if (path === routes.health) return 'btn-health';
  if (path === routes.pantry) return 'btn-section-cyan';
  if (path === routes.mealPlan) return 'btn-section-mint';
  if (path.startsWith('/shopping-lists') || path === routes.shoppingLists) {
    return 'btn-section-peach';
  }
  if (path.startsWith('/recipes') || path === routes.favorites) {
    return 'btn-section-lavender';
  }
  if (path === routes.settings) return 'btn-section-neutral';
  return 'btn-primary';
}

/** Secondary CTA tinted to the section (add row, soft actions). */
export function getSectionSoftBtnClass(path: string): string {
  if (path === routes.health) return 'btn-section-coral-soft';
  if (path === routes.pantry) return 'btn-section-cyan-soft';
  if (path === routes.mealPlan) return 'btn-section-mint-soft';
  if (path.startsWith('/shopping-lists') || path === routes.shoppingLists) {
    return 'btn-section-peach-soft';
  }
  if (path.startsWith('/recipes') || path === routes.favorites) {
    return 'btn-soft';
  }
  if (path === routes.settings) return 'btn-section-neutral-soft';
  return 'btn-soft';
}

/** Barra superior de formularios en tarjetas de sección. */
export function getSectionStripeClass(_path?: string): string {
  return 'section-stripe-accent';
}

export function sectionStripeStyle(path: string): Record<string, string> {
  const accent = getNavAccent(path);
  return {
    '--section-stripe-bg': accent.bg,
    '--section-stripe-text': accent.text,
  };
}
