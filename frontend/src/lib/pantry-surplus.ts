/** Quantity to store in pantry after a shopping purchase (excess over list need). */
export function computePantrySurplus(purchasedQuantity: number, totalNeeded: number): number {
  if (purchasedQuantity <= 0) return 0;
  if (totalNeeded <= 0) return purchasedQuantity;
  const surplus = purchasedQuantity - totalNeeded;
  return surplus > 1e-9 ? surplus : 0;
}
