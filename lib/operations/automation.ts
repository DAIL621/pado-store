import type { SupabaseClient } from "@supabase/supabase-js";
import { describeOperationEvent, serializeOperationEvent, type OperationActor, type OperationEvent } from "./events";
import type { DeliveryProvider, OperationNotificationPayload } from "./providers";
import { cjKoreaExpressProvider, createNotificationProvider } from "./providers";
import {
  isReviewEligibleStatus,
  isStockReleaseStatus,
  orderStatusLabels,
  type OperationOrderStatus
} from "./status";

export type OrderAutomationInput = {
  orderId: string;
  orderNo?: string | null;
  recipientPhone?: string | null;
  fromStatus: OperationOrderStatus;
  toStatus: OperationOrderStatus;
  carrier?: string | null;
  trackingNumber?: string | null;
  actor: OperationActor;
  note?: string;
};

export type OrderAutomationResult = {
  summary: string[];
  events: OperationEvent[];
  notificationResults: {
    ok: boolean;
    provider: string;
    message: string;
  }[];
  optionalTables: string[];
};

export type InventoryAutomationInput = {
  optionId: string;
  productName?: string | null;
  previousStock: number;
  nextStock: number;
  reason: "payment_confirmed" | "cancelled" | "returned" | "manual";
  lowStockThreshold?: number;
  actor: OperationActor;
};

const notificationProvider = createNotificationProvider();

function buildStatusNotification(input: OrderAutomationInput): OperationNotificationPayload {
  const title = `${orderStatusLabels[input.toStatus]} 안내`;
  const orderLabel = input.orderNo ? `주문 ${input.orderNo}` : "주문";
  const trackingText = input.trackingNumber ? ` 송장번호 ${input.trackingNumber}` : "";

  return {
    event: `order.${input.toStatus === "delivery_ready" ? "delivery_ready" : input.toStatus}` as OperationNotificationPayload["event"],
    orderId: input.orderId,
    orderNo: input.orderNo ?? undefined,
    to: input.recipientPhone ?? null,
    status: input.toStatus,
    title,
    message: `${orderLabel} 상태가 ${orderStatusLabels[input.toStatus]}(으)로 변경되었습니다.${trackingText}`,
    variables: {
      orderNo: input.orderNo ?? null,
      carrier: input.carrier ?? null,
      trackingNumber: input.trackingNumber ?? null
    }
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function buildOrderStatusAutomation(input: OrderAutomationInput): Promise<OrderAutomationResult> {
  const events: OperationEvent[] = [
    {
      type: "order_status_changed",
      orderId: input.orderId,
      orderNo: input.orderNo,
      from: input.fromStatus,
      to: input.toStatus,
      actor: input.actor,
      note: input.note
    }
  ];

  if (input.carrier || input.trackingNumber) {
    events.push({
      type: "delivery_updated",
      orderId: input.orderId,
      orderNo: input.orderNo,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      actor: input.actor
    });
  }

  if (isReviewEligibleStatus(input.toStatus)) {
    events.push({
      type: "review_request_scheduled",
      orderId: input.orderId,
      orderNo: input.orderNo,
      scheduledAt: addDays(new Date(), 2).toISOString()
    });
  }

  if (isStockReleaseStatus(input.toStatus)) {
    events.push({
      type: "notification_queued",
      payload: {
        event: input.toStatus === "refunded" ? "order.refunded" : input.toStatus === "returned" ? "order.returned" : "order.cancelled",
        orderId: input.orderId,
        orderNo: input.orderNo ?? undefined,
        to: input.recipientPhone ?? null,
        status: input.toStatus,
        title: `${orderStatusLabels[input.toStatus]} 처리 안내`,
        message: "취소/반품/환불에 따른 재고 복구와 결제 처리 확인이 필요합니다."
      }
    });
  } else {
    events.push({ type: "notification_queued", payload: buildStatusNotification(input) });
  }

  const notificationEvents = events.filter((event): event is Extract<OperationEvent, { type: "notification_queued" }> => event.type === "notification_queued");
  const notificationResults = await Promise.all(
    notificationEvents.map(async (event) => {
      const result = await notificationProvider.send(event.payload);
      return { ok: result.ok, provider: result.provider, message: result.message };
    })
  );

  return {
    summary: events.map(describeOperationEvent),
    events,
    notificationResults,
    optionalTables: ["operation_logs", "order_status_history", "notification_events", "review_requests"]
  };
}

export async function buildInventoryAutomation(input: InventoryAutomationInput): Promise<OrderAutomationResult> {
  const events: OperationEvent[] = [
    {
      type: "inventory_adjusted",
      optionId: input.optionId,
      productName: input.productName,
      previousStock: input.previousStock,
      nextStock: input.nextStock,
      reason: input.reason,
      actor: input.actor
    }
  ];

  const lowStockThreshold = input.lowStockThreshold ?? 3;
  if (input.nextStock <= lowStockThreshold) {
    events.push({
      type: "notification_queued",
      payload: {
        event: input.nextStock <= 0 ? "stock.soldout" : "stock.low",
        title: input.nextStock <= 0 ? "품절 자동 확인 필요" : "재고 부족 알림",
        message: `${input.productName ?? input.optionId} 재고가 ${input.nextStock}개 남았습니다.`,
        variables: {
          optionId: input.optionId,
          previousStock: input.previousStock,
          nextStock: input.nextStock
        }
      }
    });
  }

  const notificationEvents = events.filter((event): event is Extract<OperationEvent, { type: "notification_queued" }> => event.type === "notification_queued");
  const notificationResults = await Promise.all(
    notificationEvents.map(async (event) => {
      const result = await notificationProvider.send(event.payload);
      return { ok: result.ok, provider: result.provider, message: result.message };
    })
  );

  return {
    summary: events.map(describeOperationEvent),
    events,
    notificationResults,
    optionalTables: ["operation_logs", "inventory_logs", "notification_events"]
  };
}

export function buildDeliveryTrackingContext(carrier: string, trackingNumber: string, provider: DeliveryProvider = cjKoreaExpressProvider) {
  return {
    carrier,
    trackingNumber,
    provider: provider.name,
    trackingUrl: provider.buildTrackingUrl(carrier, trackingNumber)
  };
}

export async function writeOperationLogBestEffort(
  supabase: Pick<SupabaseClient, "from">,
  orderId: string | null,
  events: OperationEvent[]
) {
  if (!events.length) return { ok: true as const };
  const rows = events.map((event) => ({
    order_id: orderId,
    actor: "actor" in event ? event.actor ?? {} : {},
    ...serializeOperationEvent(event)
  }));

  const { error } = await supabase.from("operation_logs").insert(rows);
  if (error) return { ok: false as const, message: error.message, skipped: true };
  return { ok: true as const };
}

export async function writeNotificationEventsBestEffort(
  supabase: Pick<SupabaseClient, "from">,
  events: OperationEvent[]
) {
  const rows = events
    .filter((event): event is Extract<OperationEvent, { type: "notification_queued" }> => event.type === "notification_queued")
    .map((event) => ({
      order_id: event.payload.orderId ?? null,
      event: event.payload.event,
      channel: "mock",
      recipient: event.payload.to ?? null,
      title: event.payload.title,
      message: event.payload.message,
      payload: event.payload,
      status: "queued",
      provider: notificationProvider.name
    }));

  if (!rows.length) return { ok: true as const };
  const { error } = await supabase.from("notification_events").insert(rows);
  if (error) return { ok: false as const, message: error.message, skipped: true };
  return { ok: true as const };
}

export async function writeReviewRequestsBestEffort(
  supabase: Pick<SupabaseClient, "from">,
  events: OperationEvent[],
  userId?: string | null
) {
  const rows = events
    .filter((event): event is Extract<OperationEvent, { type: "review_request_scheduled" }> => event.type === "review_request_scheduled")
    .map((event) => ({
      order_id: event.orderId,
      user_id: userId ?? null,
      status: "scheduled",
      scheduled_at: event.scheduledAt,
      channel: "mock",
      payload: event
    }));

  if (!rows.length) return { ok: true as const };
  const { error } = await supabase.from("review_requests").insert(rows);
  if (error) return { ok: false as const, message: error.message, skipped: true };
  return { ok: true as const };
}

export async function writeInventoryLogsBestEffort(
  supabase: Pick<SupabaseClient, "from">,
  orderId: string | null,
  events: OperationEvent[]
) {
  const rows = events
    .filter((event): event is Extract<OperationEvent, { type: "inventory_adjusted" }> => event.type === "inventory_adjusted")
    .map((event) => ({
      option_id: event.optionId,
      order_id: orderId,
      previous_stock: event.previousStock,
      next_stock: event.nextStock,
      delta: event.nextStock - event.previousStock,
      reason: event.reason,
      actor: event.actor
    }));

  if (!rows.length) return { ok: true as const };
  const { error } = await supabase.from("inventory_logs").insert(rows);
  if (error) return { ok: false as const, message: error.message, skipped: true };
  return { ok: true as const };
}

export async function writeOrderStatusHistoryBestEffort(
  supabase: Pick<SupabaseClient, "from">,
  event: Extract<OperationEvent, { type: "order_status_changed" }>
) {
  const { error } = await supabase.from("order_status_history").insert({
    order_id: event.orderId,
    from_status: event.from,
    to_status: event.to,
    actor: event.actor,
    note: event.note ?? null
  });
  if (error) return { ok: false as const, message: error.message, skipped: true };
  return { ok: true as const };
}

export const operationAutomationSchemaSql = `
-- Full version: supabase/migrations/202607060400_operation_automation.sql
create table if not exists operation_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  event_type text not null,
  summary text not null,
  actor jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text not null,
  to_status text not null,
  actor jsonb not null default '{}'::jsonb,
  note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  event text not null,
  channel text not null default 'mock',
  recipient text,
  title text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  provider text,
  provider_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  status text not null default 'scheduled',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  channel text not null default 'mock',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  option_id uuid references product_options(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  previous_stock integer not null,
  next_stock integer not null,
  delta integer not null,
  reason text not null,
  actor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
`;
