import type { OperationNotificationPayload } from "./providers";
import { orderStatusLabels, type OperationOrderStatus } from "./status";

export type OperationActor = {
  id?: string | null;
  email?: string | null;
  role: "admin" | "system" | "customer";
};

export type OperationEvent =
  | {
      type: "order_created";
      orderId: string;
      orderNo?: string | null;
      actor: OperationActor;
      totalAmount?: number | null;
    }
  | {
      type: "payment_approved";
      orderId: string;
      orderNo?: string | null;
      actor: OperationActor;
      amount?: number | null;
      provider?: string | null;
    }
  | {
      type: "payment_failed";
      orderId?: string | null;
      orderNo?: string | null;
      actor: OperationActor;
      amount?: number | null;
      provider?: string | null;
      reason?: string | null;
    }
  | {
      type: "refund_completed";
      orderId: string;
      orderNo?: string | null;
      actor: OperationActor;
      amount?: number | null;
      provider?: string | null;
      reason?: string | null;
    }
  | {
      type: "order_status_changed";
      orderId: string;
      orderNo?: string | null;
      from: OperationOrderStatus;
      to: OperationOrderStatus;
      actor: OperationActor;
      note?: string;
    }
  | {
      type: "delivery_updated";
      orderId: string;
      orderNo?: string | null;
      carrier?: string | null;
      trackingNumber?: string | null;
      actor: OperationActor;
    }
  | {
      type: "inventory_adjusted";
      optionId: string;
      productName?: string | null;
      previousStock: number;
      nextStock: number;
      reason: "payment_confirmed" | "cancelled" | "returned" | "manual";
      actor: OperationActor;
    }
  | {
      type: "review_request_scheduled";
      orderId: string;
      orderNo?: string | null;
      scheduledAt: string;
    }
  | {
      type: "notification_queued";
      payload: OperationNotificationPayload;
    };

export function describeOperationEvent(event: OperationEvent) {
  if (event.type === "order_created") {
    return `주문 생성: ${event.orderNo ?? event.orderId}`;
  }
  if (event.type === "payment_approved") {
    return `결제 승인: ${event.orderNo ?? event.orderId}`;
  }
  if (event.type === "payment_failed") {
    return `결제 실패: ${event.orderNo ?? event.orderId ?? "주문번호 미확인"}`;
  }
  if (event.type === "refund_completed") {
    return `환불 완료: ${event.orderNo ?? event.orderId}`;
  }
  if (event.type === "order_status_changed") {
    return `주문 상태: ${orderStatusLabels[event.from]} -> ${orderStatusLabels[event.to]}`;
  }
  if (event.type === "delivery_updated") {
    return `배송 정보 업데이트: ${event.carrier ?? "택배사 미입력"} / ${event.trackingNumber ?? "송장 미입력"}`;
  }
  if (event.type === "inventory_adjusted") {
    return `재고 변경: ${event.productName ?? event.optionId} ${event.previousStock} -> ${event.nextStock}`;
  }
  if (event.type === "review_request_scheduled") {
    return `리뷰 요청 예약: ${event.scheduledAt}`;
  }
  return `알림 대기: ${event.payload.title}`;
}

export function serializeOperationEvent(event: OperationEvent) {
  return {
    event_type: event.type,
    payload: event,
    summary: describeOperationEvent(event),
    created_at: new Date().toISOString()
  };
}
