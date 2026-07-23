export const orderStatuses = [
  "pending",
  "paid",
  "preparing",
  "delivery_ready",
  "shipped",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
  "refunded"
] as const;

export type OperationOrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OperationOrderStatus, string> = {
  pending: "결제대기",
  paid: "결제완료",
  preparing: "상품준비중",
  delivery_ready: "배송준비",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "주문취소",
  return_requested: "반품요청",
  returned: "반품완료",
  refunded: "환불완료"
};

export const orderStatusFlow: Record<OperationOrderStatus, OperationOrderStatus[]> = {
  pending: ["pending", "paid", "preparing", "cancelled"],
  paid: ["paid", "preparing", "delivery_ready", "cancelled", "refunded"],
  preparing: ["preparing", "delivery_ready", "shipped", "cancelled"],
  delivery_ready: ["delivery_ready", "shipped", "cancelled"],
  shipped: ["shipped", "delivered", "return_requested"],
  delivered: ["delivered", "return_requested"],
  cancelled: ["cancelled", "refunded"],
  return_requested: ["return_requested", "returned", "refunded"],
  returned: ["returned", "refunded"],
  refunded: ["refunded"]
};

export function isOperationOrderStatus(value: unknown): value is OperationOrderStatus {
  return typeof value === "string" && (orderStatuses as readonly string[]).includes(value);
}

export function canChangeOrderStatus(from: OperationOrderStatus, to: OperationOrderStatus) {
  return orderStatusFlow[from]?.includes(to) ?? false;
}

export function resolveTrackingSaveStatus(
  persistedStatus: OperationOrderStatus,
  selectedStatus: OperationOrderStatus,
  options: { hasTrackingNumber: boolean; autoAdvance: boolean }
) {
  if (!options.hasTrackingNumber || !options.autoAdvance || selectedStatus !== persistedStatus) return selectedStatus;
  const automaticTarget = persistedStatus === "paid"
    ? "preparing"
    : persistedStatus === "preparing" || persistedStatus === "delivery_ready"
      ? "shipped"
      : persistedStatus;
  return canChangeOrderStatus(persistedStatus, automaticTarget) ? automaticTarget : selectedStatus;
}

export function needsTrackingNumber(status: OperationOrderStatus) {
  return status === "shipped" || status === "delivered";
}

export function isReviewEligibleStatus(status: OperationOrderStatus) {
  return status === "delivered";
}

export function isStockReleaseStatus(status: OperationOrderStatus) {
  return status === "cancelled" || status === "returned" || status === "refunded";
}
