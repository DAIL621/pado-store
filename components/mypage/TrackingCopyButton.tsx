"use client";

import { useState } from "react";

export function TrackingCopyButton({ trackingNumber }: { trackingNumber: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("failed");
      window.setTimeout(() => setStatus("idle"), 1800);
    }
  };

  return (
    <button type="button" className="tracking-copy-button" onClick={copy} aria-live="polite">
      {status === "copied" ? "복사됨" : status === "failed" ? "복사 실패" : "송장 복사"}
    </button>
  );
}
