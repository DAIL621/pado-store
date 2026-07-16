export type ProductOptionInput = {
  name: string;
  price: number;
  regular_price: number | null;
  coupang_price: number | null;
  price_delta: number;
  stock: number;
};

export function parseProductOptions(input: unknown, fallback = "", basePrice = 0): ProductOptionInput[] {
  if (Array.isArray(input)) {
    return input
      .map((option) => ({
        name: String(option.name ?? "").trim(),
        price: Number(option.price ?? (basePrice + Number(option.priceDelta ?? option.price_delta ?? 0))),
        regular_price: option.regularPrice === undefined || option.regularPrice === null || String(option.regularPrice).trim() === "" ? null : Number(option.regularPrice),
        coupang_price: option.coupangPrice === undefined || option.coupangPrice === null || String(option.coupangPrice).trim() === "" ? null : Number(option.coupangPrice),
        price_delta: 0,
        stock: Number(option.stock ?? 0)
      }))
      .filter((option) => option.name);
  }

  return String(input ?? fallback)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price = "0", stock = "0"] = line.split("|").map((part) => part.trim());
      return {
        name,
        price: Number(price),
        regular_price: null,
        coupang_price: null,
        price_delta: 0,
        stock: Number(stock)
      };
    });
}

export function hasInvalidProductOption(options: ProductOptionInput[]) {
  return options.some((option) => !option.name || !Number.isFinite(option.price) || option.price <= 0 || (option.regular_price !== null && (!Number.isFinite(option.regular_price) || option.regular_price < option.price)) || (option.coupang_price !== null && (!Number.isFinite(option.coupang_price) || option.coupang_price <= option.price)) || !Number.isFinite(option.stock) || option.stock < 0);
}
