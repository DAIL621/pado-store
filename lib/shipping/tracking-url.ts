const trackingBuilders: Array<{ matches: (carrier: string) => boolean; build: (trackingNumber: string) => string }> = [
  {
    matches: (carrier) => carrier.includes("CJ") || carrier.includes("대한통운"),
    build: (trackingNumber) => `https://trace.cjlogistics.com/next/tracking.html?wblNo=${encodeURIComponent(trackingNumber)}`
  }
];

export function buildTrackingUrl(carrier: string | null | undefined, trackingNumber: string | null | undefined) {
  const cleanedCarrier = String(carrier ?? "").trim();
  const cleanedTrackingNumber = String(trackingNumber ?? "").trim();
  if (!cleanedCarrier || !cleanedTrackingNumber) return null;
  return trackingBuilders.find((item) => item.matches(cleanedCarrier))?.build(cleanedTrackingNumber) ?? null;
}
