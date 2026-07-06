import fs from "node:fs";

const files = {
  status: fs.readFileSync("lib/operations/status.ts", "utf8"),
  providers: fs.readFileSync("lib/operations/providers.ts", "utf8"),
  events: fs.readFileSync("lib/operations/events.ts", "utf8"),
  automation: fs.readFileSync("lib/operations/automation.ts", "utf8"),
  orderApi: fs.readFileSync("app/api/admin/orders/[id]/route.ts", "utf8"),
  adminLayout: fs.readFileSync("components/admin/AdminLayout.tsx", "utf8"),
  automationPage: fs.readFileSync("app/admin/automation/page.tsx", "utf8")
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
assert(files.events.includes("serializeOperationEvent"), "operation events should serialize for operation logs");
assert(files.automation.includes("buildOrderStatusAutomation"), "order status automation builder is missing");
assert(files.automation.includes("buildInventoryAutomation"), "inventory automation builder is missing");
assert(files.automation.includes("buildDeliveryTrackingContext"), "delivery tracking context builder is missing");
assert(files.automation.includes("writeOperationLogBestEffort"), "best-effort operation log writer is missing");
assert(files.automation.includes("writeOrderStatusHistoryBestEffort"), "best-effort status history writer is missing");
assert(files.automation.includes("review_request_scheduled"), "delivered orders should schedule review requests");
assert(files.automation.includes("operationAutomationSchemaSql"), "operation automation SQL guide is missing");
assert(files.orderApi.includes("buildOrderStatusAutomation"), "admin order API should return automation effects");
assert(files.orderApi.includes("operationLog"), "admin order API should expose operation log result");
assert(files.adminLayout.includes("/admin/automation"), "admin navigation should expose operation automation page");
assert(files.automationPage.includes("PADO STORY Operation Automation Engine"), "automation admin page hero is missing");
assert(files.automationPage.includes("운영 DB 확장 준비 SQL"), "automation page should expose DB extension SQL");

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
        "operation-event-serialization",
        "status-change-automation",
        "inventory-automation",
        "delivery-tracking-context",
        "best-effort-operation-log",
        "best-effort-status-history",
        "review-request-scheduler",
        "admin-order-api-automation-response",
        "admin-automation-route"
      ]
    },
    null,
    2
  )
);
