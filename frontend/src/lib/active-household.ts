const STORAGE_KEY = 'comidas:activeHouseholdId';

export function getStoredHouseholdId(): string | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value && value.length > 0 ? value : null;
}

export function setStoredHouseholdId(householdId: string): void {
  localStorage.setItem(STORAGE_KEY, householdId);
}

export function clearStoredHouseholdId(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function pickHouseholdId(
  households: Array<{ id: string }>,
  preferredId: string | null,
): string | null {
  if (households.length === 0) return null;
  if (preferredId && households.some((h) => h.id === preferredId)) {
    return preferredId;
  }
  return households[0].id;
}
