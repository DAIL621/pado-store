export const FREE_SHIPPING_THRESHOLD = 50000;
export const DEFAULT_SHIPPING_FEE = 4000;

export function calculateShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : DEFAULT_SHIPPING_FEE;
}

export function calculateFreeShippingProgress(subtotal: number) {
  return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
}

export function calculateRemainingForFreeShipping(subtotal: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
