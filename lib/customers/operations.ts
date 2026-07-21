export type CustomerGrade = "new" | "regular" | "loyal" | "vip";
export type CustomerStats = { orderCount: number; totalSpent: number; averageSpent: number; firstOrderAt: string | null; lastOrderAt: string | null; last30DaysSpent: number };

export const customerGradeLabels: Record<CustomerGrade, string> = { new: "신규", regular: "일반", loyal: "단골", vip: "VIP" };

export function calculateCustomerGrade(stats: Pick<CustomerStats, "orderCount" | "totalSpent">): CustomerGrade {
  if (stats.orderCount >= 8 || stats.totalSpent >= 1_000_000) return "vip";
  if (stats.orderCount >= 3 || stats.totalSpent >= 300_000) return "loyal";
  if (stats.orderCount >= 1) return "regular";
  return "new";
}

export function calculateCustomerStats(orders: Array<{ total_amount?: number | null; status?: string | null; created_at?: string | null }>): CustomerStats {
  const valid = orders.filter((order) => !["cancelled", "refunded"].includes(String(order.status)));
  const sorted = valid.filter((order) => order.created_at).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const cutoff = Date.now() - 30 * 86400000;
  const totalSpent = valid.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  return { orderCount: valid.length, totalSpent, averageSpent: valid.length ? Math.round(totalSpent / valid.length) : 0, firstOrderAt: sorted[0]?.created_at ?? null, lastOrderAt: sorted.at(-1)?.created_at ?? null, last30DaysSpent: valid.filter((order) => new Date(String(order.created_at)).getTime() >= cutoff).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) };
}

export function customerEventLabel(eventType: string) {
  const labels: Record<string, string> = { "customer.note": "관리자 메모", "customer.cs_record": "CS 응대", "customer.tags_changed": "태그 변경", "cs.case_created": "CS 접수", "cs.status_changed": "CS 상태 변경", "cs.note": "CS 처리 메모", "cs.workflow": "CS Workflow", order_created: "주문", payment_confirmed: "결제 완료", shipment_updated: "송장 등록", order_status_changed: "주문 상태 변경", payment_refunded: "환불" };
  return labels[eventType] ?? eventType.replaceAll("_", " ");
}
