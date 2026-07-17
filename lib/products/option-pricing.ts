type OptionPriceInput = { name: string; price: number; regular_price?: number | null; coupang_price?: number | null };
type StoredOptionLike = { name?: string | null; price?: number | null; regular_price?: number | null; coupang_price?: number | null; price_delta?: number | null };

export type OptionPriceMetadata = { name: string; price: number; regularPrice: number | null; coupangPrice: number | null };

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function mapOptionFormsToStoredPricing(options: OptionPriceInput[]): OptionPriceMetadata[] {
  return options.map((option) => ({
    name: option.name,
    price: option.price,
    regularPrice: option.regular_price ?? null,
    coupangPrice: option.coupang_price ?? null
  }));
}

export function withOptionPriceMetadata(detail: unknown, options: OptionPriceInput[]) {
  return { ...record(detail), optionPricing: mapOptionFormsToStoredPricing(options) };
}

export function readOptionPriceMetadata(detail: unknown): OptionPriceMetadata[] {
  const raw = record(detail).optionPricing;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => record(item)).map((item) => ({
    name: typeof item.name === "string" ? item.name : "",
    price: Number(item.price),
    regularPrice: item.regularPrice === null || item.regularPrice === undefined || item.regularPrice === "" ? null : Number(item.regularPrice),
    coupangPrice: item.coupangPrice === null || item.coupangPrice === undefined || item.coupangPrice === "" ? null : Number(item.coupangPrice)
  })).filter((item) => item.name && Number.isFinite(item.price));
}

export function mapStoredOptionToPrices(option: StoredOptionLike, basePrice: number, detail: unknown, index: number) {
  const metadata = readOptionPriceMetadata(detail);
  const fallback = metadata[index]?.name === option.name ? metadata[index] : metadata.find((item) => item.name === option.name);
  const price = Number(option.price ?? fallback?.price ?? basePrice + Number(option.price_delta ?? 0));
  const regularPriceValue = option.regular_price ?? fallback?.regularPrice ?? null;
  const coupangPriceValue = option.coupang_price ?? fallback?.coupangPrice ?? null;
  return {
    price,
    regularPrice: regularPriceValue === null ? null : Number(regularPriceValue),
    coupangPrice: coupangPriceValue === null ? null : Number(coupangPriceValue)
  };
}
