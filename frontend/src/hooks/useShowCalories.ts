import { useAuthStore } from '../stores/auth.store';

export function resolveShowCalories(showCalories: boolean | undefined): boolean {
  return showCalories !== false;
}

/** Per-user preference: hide calorie counts across the app when false. */
export function useShowCalories(): boolean {
  const showCalories = useAuthStore((s) => s.user?.showCalories);
  return resolveShowCalories(showCalories);
}
