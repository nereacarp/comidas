/** Whether any pantry item name contains the ingredient (same idea as backend pantry match). */
export function isIngredientInPantry(ingredientName: string, pantryNames: string[]): boolean {
  const key = ingredientName.trim().toLowerCase();
  if (!key) return false;
  return pantryNames.some((pantryName) => pantryName.trim().toLowerCase().includes(key));
}
