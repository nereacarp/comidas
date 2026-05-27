export function formatPantryQuantity(quantity: number, unit: string): string {
  const value = Number.isInteger(quantity)
    ? quantity
    : Math.round(quantity * 100) / 100;
  return `${value} ${unit}`.trim();
}
