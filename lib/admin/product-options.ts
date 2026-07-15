export type ProductOptionInput = {
  name: string;
  price: number;
  price_delta: number;
  stock: number;
};

export function parseProductOptions(input: unknown, fallback = "", basePrice = 0): ProductOptionInput[] {
  if (Array.isArray(input)) {
    return input
      .map((option) => ({
        name: String(option.name ?? "").trim(),
        price: Number(option.price ?? (basePrice + Number(option.priceDelta ?? option.price_delta ?? 0))),
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
        price_delta: 0,
        stock: Number(stock)
      };
    });
}

export function hasInvalidProductOption(options: ProductOptionInput[]) {
  return options.some((option) => !option.name || !Number.isFinite(option.price) || option.price <= 0 || !Number.isFinite(option.stock) || option.stock < 0);
}
