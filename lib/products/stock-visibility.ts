export function getCustomerStockMessage(stock: number) {
  if (!Number.isFinite(stock) || stock <= 0) return "품절";
  if (stock < 10) return `재고 ${stock}개 남음`;
  return "";
}

export function isNeutralProductPlaceholder(url?: string | null) {
  return !url || url.includes("/images/product-placeholder.svg");
}
