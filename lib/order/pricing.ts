// 파도스토리 운영 상품은 주문 금액과 관계없이 기본 무료배송입니다.
export const FREE_SHIPPING_THRESHOLD = 0;
export const DEFAULT_SHIPPING_FEE = 0;

export function calculateShipping(subtotal: number) {
  void subtotal;
  return 0;
}

export function calculateFreeShippingProgress(subtotal: number) {
  void subtotal;
  return 100;
}

export function calculateRemainingForFreeShipping(subtotal: number) {
  void subtotal;
  return 0;
}
