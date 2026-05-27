import type { DietPlan } from '../stores/health.store';
import type { PlanRowStyle } from '../components/health/CaloriePlanRow';
import { tierPlanKey, type DeficitTier } from './deficit-planning';

/** Colores de plan calórico alineados con la paleta Payd del proyecto. */
export const HEALTH_PLAN_STYLES: Record<DietPlan, PlanRowStyle> = {
  maintain: {
    iconBg: 'var(--pastel-mint)',
    iconColor: 'var(--pastel-mint-icon)',
    badgeBg: 'var(--pastel-mint)',
    badgeText: 'var(--pastel-mint-icon)',
    badgeBorder: 'var(--border-subtle)',
    badge: 'M',
  },
  loseSlow: {
    iconBg: 'var(--pastel-peach)',
    iconColor: 'var(--pastel-peach-icon)',
    badgeBg: 'var(--pastel-peach)',
    badgeText: 'var(--pastel-peach-icon)',
    badgeBorder: 'var(--border-subtle)',
    badge: '15',
  },
  loseModerate: {
    iconBg: 'var(--pastel-coral)',
    iconColor: 'var(--pastel-coral-icon)',
    badgeBg: 'var(--pastel-coral)',
    badgeText: 'var(--pastel-coral-icon)',
    badgeBorder: 'var(--border-subtle)',
    badge: '20',
  },
  loseAggressive: {
    iconBg: 'var(--pastel-lavender)',
    iconColor: 'var(--pastel-lavender-icon)',
    badgeBg: 'var(--pastel-lavender)',
    badgeText: 'var(--pastel-lavender-icon)',
    badgeBorder: 'var(--border-subtle)',
    badge: '25',
  },
  gain: {
    iconBg: 'var(--pastel-cyan)',
    iconColor: 'var(--pastel-cyan-icon)',
    badgeBg: 'var(--pastel-cyan)',
    badgeText: 'var(--pastel-cyan-icon)',
    badgeBorder: 'var(--border-subtle)',
    badge: '+',
  },
};

const TIER_TITLE_INK: DeficitTier[] = ['not_recommended', 'floor_limited'];

/** Color del título de ritmo en la vista previa, alineado con el plan del panel derecho. */
export function tierTitleColor(tier: DeficitTier): string {
  if (TIER_TITLE_INK.includes(tier)) return 'var(--ink)';
  return HEALTH_PLAN_STYLES[tierPlanKey(tier)].iconColor;
}
