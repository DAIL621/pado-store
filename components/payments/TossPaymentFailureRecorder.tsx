"use client";

import { useEffect, useState } from "react";

export function TossPaymentFailureRecorder({
  orderId,
  code
}: {
  orderId?: string;
  code?: string;
}) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "failed">("idle");

  useEffect(() => {
    if (!orderId || status !== "idle") return;
    setStatus("recording");
    fetch("/api/payments/toss/fail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, code })
    })
      .then((response) => setStatus(response.ok ? "recorded" : "failed"))
      .catch(() => setStatus("failed"));
  }, [code, orderId, status]);

  if (!orderId) return null;
  return (
    <p aria-live="polite">
      {status === "recording" && "결제 실패 상태를 확인하고 있습니다."}
      {status === "recorded" && "주문은 결제 대기 상태로 안전하게 보관되었습니다."}
      {status === "failed" && "상태 기록을 확인하지 못했습니다. 주문 내역에서 상태를 확인해 주세요."}
    </p>
  );
}
