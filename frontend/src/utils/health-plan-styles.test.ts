import { describe, expect, it } from 'vitest';
import { HEALTH_PLAN_STYLES } from './health-plan-styles';

describe('health-plan-styles', () => {
  it('maps each plan to the intended palette token', () => {
    expect(HEALTH_PLAN_STYLES.maintain.iconBg).toBe('var(--pastel-mint)');
    expect(HEALTH_PLAN_STYLES.loseSlow.iconBg).toBe('var(--pastel-peach)');
    expect(HEALTH_PLAN_STYLES.loseModerate.iconBg).toBe('var(--pastel-coral)');
    expect(HEALTH_PLAN_STYLES.loseAggressive.iconBg).toBe('var(--pastel-lavender)');
    expect(HEALTH_PLAN_STYLES.gain.iconBg).toBe('var(--pastel-cyan)');
  });
});
