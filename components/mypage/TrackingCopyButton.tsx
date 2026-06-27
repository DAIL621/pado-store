"use client";

import { useState } from "react";

export function TrackingCopyButton({ trackingNumber }: { trackingNumber: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="tracking-copy-button" onClick={copy} aria-live="polite">
      {copied ? "복사됨" : "송장 복사"}
    </button>
  );
}
