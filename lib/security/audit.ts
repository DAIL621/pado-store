export type AuditActor = { id: string | null; email?: string; role: "admin" | "customer" | "system" };
export type AuditAction = "order.status.update" | "shipment.update" | "product.create" | "product.update" | "product.delete" | "payment.refund";

export type AuditEntry = {
  action: AuditAction;
  actor: AuditActor;
  targetType: "order" | "shipment" | "product" | "payment";
  targetId: string;
  occurredAt: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export function createAuditEntry(input: Omit<AuditEntry, "occurredAt">): AuditEntry {
  return { ...input, occurredAt: new Date().toISOString() };
}
