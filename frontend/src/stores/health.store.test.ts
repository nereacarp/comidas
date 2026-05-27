import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHealthStore } from './health.store';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  useHealthStore.setState({
    profile: { weight: null, height: null, age: null, sex: null, activityLevel: 'moderate' },
    waterIntakeMl: 0,
    waterResetDate: new Date().toISOString().split('T')[0],
  });
});

describe('setProfile', () => {
  it('updates profile fields', () => {
    useHealthStore.getState().setProfile({ weight: 70, height: 175, age: 30, sex: 'male' });
    const { profile } = useHealthStore.getState();
    expect(profile.weight).toBe(70);
    expect(profile.height).toBe(175);
    expect(profile.age).toBe(30);
    expect(profile.sex).toBe('male');
  });

  it('merges partial updates without overwriting other fields', () => {
    useHealthStore.getState().setProfile({ weight: 70 });
    useHealthStore.getState().setProfile({ height: 175 });
    const { profile } = useHealthStore.getState();
    expect(profile.weight).toBe(70);
    expect(profile.height).toBe(175);
  });
});

describe('addWater / removeWater', () => {
  it('adds water correctly', () => {
    useHealthStore.getState().addWater(200);
    useHealthStore.getState().addWater(350);
    expect(useHealthStore.getState().waterIntakeMl).toBe(550);
  });

  it('removes water but never below 0', () => {
    useHealthStore.getState().addWater(200);
    useHealthStore.getState().removeWater(500);
    expect(useHealthStore.getState().waterIntakeMl).toBe(0);
  });
});

describe('checkDailyReset', () => {
  it('resets water if date has changed', () => {
    useHealthStore.setState({ waterIntakeMl: 1500, waterResetDate: '2020-01-01' });
    useHealthStore.getState().checkDailyReset();
    expect(useHealthStore.getState().waterIntakeMl).toBe(0);
    expect(useHealthStore.getState().waterResetDate).toBe(new Date().toISOString().split('T')[0]);
  });

  it('does not reset if date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    useHealthStore.setState({ waterIntakeMl: 1500, waterResetDate: today });
    useHealthStore.getState().checkDailyReset();
    expect(useHealthStore.getState().waterIntakeMl).toBe(1500);
  });
});

describe('persistence mock', () => {
  it('calls localStorage.setItem on profile update', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem');
    useHealthStore.getState().setProfile({ weight: 65 });
    expect(spy).toHaveBeenCalled();
  });
});

describe('weight goal', () => {
  it('applyWeightGoal activates plan and persists goal', () => {
    useHealthStore.getState().applyWeightGoal({
      targetWeight: 65,
      targetDate: '2026-08-01',
      targetWeeks: 12,
      mode: 'timeline',
      linkedPlan: 'loseModerate',
      dailyKcalTarget: 1550,
    });
    expect(useHealthStore.getState().weightGoal.active).toBe(true);
    expect(useHealthStore.getState().weightGoal.targetWeight).toBe(65);
    expect(useHealthStore.getState().weightGoal.dailyKcalTarget).toBe(1550);
    expect(useHealthStore.getState().selectedPlan).toBe('loseModerate');
  });

  it('resetWeightGoal clears goal and selected plan', () => {
    useHealthStore.getState().applyWeightGoal({
      targetWeight: 65,
      targetDate: '2026-08-01',
      mode: 'timeline',
      linkedPlan: 'loseModerate',
      dailyKcalTarget: 1550,
    });
    useHealthStore.getState().resetWeightGoal();
    expect(useHealthStore.getState().weightGoal.active).toBe(false);
    expect(useHealthStore.getState().selectedPlan).toBeNull();
  });
});
