import fs from "node:fs";

const files = {
  status: fs.readFileSync("lib/operations/status.ts", "utf8"),
  providers: fs.readFileSync("lib/operations/providers.ts", "utf8"),
  events: fs.readFileSync("lib/operations/events.ts", "utf8"),
  automation: fs.readFileSync("lib/operations/automation.ts", "utf8"),
  orderApi: fs.readFileSync("app/api/admin/orders/[id]/route.ts", "utf8"),
  orderCreateApi: fs.readFileSync("app/api/orders/route.ts", "utf8"),
  paymentConfirmApi: fs.readFileSync("app/api/payments/toss/confirm/route.ts", "utf8"),
  refundApi: fs.readFileSync("app/api/admin/payments/refund/route.ts", "utf8"),
  tossWebhookApi: fs.readFileSync("app/api/payments/toss/webhook/route.ts", "utf8"),
  adminLayout: fs.readFileSync("components/admin/AdminLayout.tsx", "utf8"),
  automationPage: fs.readFileSync("app/admin/automation/page.tsx", "utf8"),
  migration: fs.readFileSync("supabase/migrations/202607060400_operation_automation.sql", "utf8")
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(files.status.includes("return_requested"), "order status engine must include return flow");
assert(files.status.includes("refunded"), "order status engine must include refund flow");
assert(files.status.includes("delivery_ready"), "order status engine must include delivery-ready flow");
assert(files.providers.includes("NotificationProvider"), "notification provider interface is missing");
assert(files.providers.includes("DeliveryProvider"), "delivery provider interface is missing");
assert(files.providers.includes("PaymentProvider"), "payment provider interface is missing");
assert(files.providers.includes("MarketplaceProvider"), "marketplace provider interface is missing");
assert(files.providers.includes("MockNotificationProvider"), "mock notification provider is missing");
assert(files.providers.includes("HttpNotificationProvider"), "HTTP notification provider is missing");
assert(files.providers.includes("createNotificationProvider"), "notification provider factory is missing");
assert(files.events.includes("serializeOperationEvent"), "operation events should serialize for operation logs");
assert(files.automation.includes("buildOrderStatusAutomation"), "order status automation builder is missing");
assert(files.automation.includes("buildInventoryAutomation"), "inventory automation builder is missing");
assert(files.automation.includes("buildDeliveryTrackingContext"), "delivery tracking context builder is missing");
assert(files.automation.includes("writeOperationLogBestEffort"), "best-effort operation log writer is missing");
assert(files.automation.includes("writeOrderStatusHistoryBestEffort"), "best-effort status history writer is missing");
assert(files.automation.includes("writeNotificationEventsBestEffort"), "notification event writer is missing");
assert(files.automation.includes("writeReviewRequestsBestEffort"), "review request writer is missing");
assert(files.automation.includes("writeInventoryLogsBestEffort"), "inventory log writer is missing");
assert(files.automation.includes("review_request_scheduled"), "delivered orders should schedule review requests");
assert(files.automation.includes("operationAutomationSchemaSql"), "operation automation SQL guide is missing");
assert(files.orderApi.includes("buildOrderStatusAutomation"), "admin order API should return automation effects");
assert(files.orderApi.includes("operationLog"), "admin order API should expose operation log result");
assert(files.orderApi.includes("writeNotificationEventsBestEffort"), "admin order API should persist notification events");
assert(files.orderApi.includes("writeReviewRequestsBestEffort"), "admin order API should persist review requests");
assert(files.orderCreateApi.includes("order_created"), "order create API should write order-created operation logs");
assert(files.paymentConfirmApi.includes("payment_approved"), "payment confirm API should write payment approved logs");
assert(files.paymentConfirmApi.includes("payment_failed"), "payment confirm API should write payment failed logs");
assert(files.paymentConfirmApi.includes("writeInventoryLogsBestEffort"), "payment confirm API should write inventory logs");
assert(files.refundApi.includes("https://api.tosspayments.com/v1/payments/"), "refund API should call Toss cancel endpoint");
assert(files.refundApi.includes("refund_completed"), "refund API should write refund completion logs");
assert(files.tossWebhookApi.includes("toss-webhook"), "Toss webhook route should write provider logs");
assert(files.adminLayout.includes("/admin/automation"), "admin navigation should expose operation automation page");
assert(files.automationPage.includes("PADO STORY Operation Automation Engine"), "automation admin page hero is missing");
assert(files.automationPage.includes("운영 DB 마이그레이션 SQL"), "automation page should expose DB extension SQL");
["operation_logs", "order_status_history", "notification_events", "review_requests", "inventory_logs"].forEach((table) => {
  assert(files.migration.includes(`create table if not exists ${table}`), `migration should create ${table}`);
  assert(files.automationPage.includes(table), `automation page should mention ${table}`);
});
assert(files.migration.includes("enable row level security"), "migration should enable RLS");
assert(files.migration.includes("public.is_admin()"), "migration should include admin RLS policy");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "order-status-flow",
        "return-refund-ready",
        "notification-provider-interface",
        "delivery-provider-interface",
        "payment-provider-interface",
        "marketplace-provider-interface",
        "mock-notification-provider",
        "http-notification-provider",
        "operation-event-serialization",
        "status-change-automation",
        "inventory-automation",
        "delivery-tracking-context",
        "best-effort-operation-log",
        "best-effort-status-history",
        "notification-event-persistence",
        "review-request-persistence",
        "inventory-log-persistence",
        "review-request-scheduler",
        "order-create-operation-log",
        "payment-confirm-operation-log",
        "toss-refund-api",
        "toss-webhook-route",
        "supabase-operation-migration",
        "admin-order-api-automation-response",
        "admin-automation-route"
      ]
    },
    null,
    2
  )
);
