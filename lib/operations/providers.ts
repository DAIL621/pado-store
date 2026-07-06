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

export class HttpNotificationProvider implements NotificationProvider {
  readonly name: string;
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly channel: OperationNotificationChannel;

  constructor({
    name,
    endpoint,
    apiKey,
    channel
  }: {
    name: string;
    endpoint: string;
    apiKey?: string;
    channel: OperationNotificationChannel;
  }) {
    this.name = name;
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.channel = channel;
  }

  async send(payload: OperationNotificationPayload): Promise<OperationProviderResult> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({ channel: this.channel, ...payload })
    });
    const result = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      provider: this.name,
      externalId: typeof result.id === "string" ? result.id : undefined,
      message: result.message ?? (response.ok ? "notification sent" : "notification failed")
    };
  }
}

export function createNotificationProvider(): NotificationProvider {
  const provider = process.env.PADO_NOTIFICATION_PROVIDER ?? "mock";
  if (provider === "kakao_alimtalk" && process.env.KAKAO_ALIMTALK_WEBHOOK_URL) {
    return new HttpNotificationProvider({
      name: "kakao-alimtalk",
      endpoint: process.env.KAKAO_ALIMTALK_WEBHOOK_URL,
      apiKey: process.env.KAKAO_ALIMTALK_API_KEY,
      channel: "kakao_alimtalk"
    });
  }
  if (provider === "sms" && process.env.SMS_PROVIDER_WEBHOOK_URL) {
    return new HttpNotificationProvider({
      name: "sms",
      endpoint: process.env.SMS_PROVIDER_WEBHOOK_URL,
      apiKey: process.env.SMS_PROVIDER_API_KEY,
      channel: "sms"
    });
  }
  if (provider === "email" && process.env.EMAIL_PROVIDER_WEBHOOK_URL) {
    return new HttpNotificationProvider({
      name: "email",
      endpoint: process.env.EMAIL_PROVIDER_WEBHOOK_URL,
      apiKey: process.env.EMAIL_PROVIDER_API_KEY,
      channel: "email"
    });
  }
  return new MockNotificationProvider();
}

export const cjKoreaExpressProvider: DeliveryProvider = {
  name: "cj-korea-express",
  buildTrackingUrl(carrier, trackingNumber) {
    if (!trackingNumber.trim()) return null;
    if (!carrier.includes("CJ") && !carrier.includes("대한통운")) return null;
    return `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(trackingNumber.trim())}`;
  }
};
