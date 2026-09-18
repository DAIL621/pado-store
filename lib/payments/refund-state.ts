export type RefundState = { status: string };

export function refundBlockCode(refunds: readonly RefundState[]) {
  if (refunds.some((refund) => refund.status === "reconciliation_required")) {
    return "REFUND_RECONCILIATION_REQUIRED";
  }
  if (refunds.some((refund) => ["pending", "processing"].includes(refund.status))) {
    return "REFUND_ALREADY_PROCESSING";
  }
  if (refunds.some((refund) => refund.status === "refunded")) return "REFUND_ALREADY_REFUNDED";
  return null;
}

export function classifyRefundResponse(status: number, body: unknown): "success" | "review" | "failed" {
  const result = body && typeof body === "object" ? body as {
    ok?: unknown; code?: unknown; refund?: { status?: unknown } | null;
  } : null;
  if (status === 202 || result?.code === "REFUND_RECONCILIATION_REQUIRED"
      || result?.code === "REFUND_ALREADY_PROCESSING") return "review";
  return status === 200 && result?.ok === true && result.refund?.status === "refunded"
    ? "success" : "failed";
}
