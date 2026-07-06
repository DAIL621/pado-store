import type { OperationOrderStatus } from "./status";

export type OperationNotificationChannel = "mock" | "kakao_alimtalk" | "sms" | "email";

export type OperationNotificationEvent =
  | "order.created"
  | "order.pending"
  | "order.paid"
  | "order.preparing"
  | "order.delivery_ready"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  | "order.return_requested"
  | "order.returned"
  | "order.refunded"
  | "review.requested"
  | "stock.low"
  | "stock.soldout";

export type OperationNotificationPayload = {
  event: OperationNotificationEvent;
  orderId?: string;
  orderNo?: string;
  to?: string | null;
  status?: OperationOrderStatus;
  title: string;
  message: string;
  variables?: Record<string, string | number | null>;
};

export type OperationProviderResult = {
  ok: boolean;
  provider: string;
  externalId?: string;
  message: string;
};

export interface NotificationProvider {
  readonly name: string;
  send(payload: OperationNotificationPayload): Promise<OperationProviderResult>;
}

export interface DeliveryProvider {
  readonly name: string;
  buildTrackingUrl(carrier: string, trackingNumber: string): string | null;
}

export interface PaymentProvider {
  readonly name: string;
  refund(orderId: string, amount: number, reason: string): Promise<OperationProviderResult>;
}

export interface MarketplaceProvider {
  readonly name: string;
  syncOrder(orderId: string): Promise<OperationProviderResult>;
  syncInventory(optionId: string, stock: number): Promise<OperationProviderResult>;
}

export class MockNotificationProvider implements NotificationProvider {
  readonly name = "mock-notification";

  async send(payload: OperationNotificationPayload): Promise<OperationProviderResult> {
    return {
      ok: true,
      provider: this.name,
      externalId: `mock-${payload.event}-${Date.now()}`,
      message: `[MOCK] ${payload.title}`
    };
  }
}

export const cjKoreaExpressProvider: DeliveryProvider = {
  name: "cj-korea-express",
  buildTrackingUrl(carrier, trackingNumber) {
    if (!trackingNumber.trim()) return null;
    if (!carrier.includes("CJ") && !carrier.includes("대한통운")) return null;
    return `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(trackingNumber.trim())}`;
  }
};
