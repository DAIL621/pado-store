export type ProductOptionInput = {
  name: string;
  price_delta: number;
  stock: number;
};

export function parseProductOptions(input: unknown, fallback = ""): ProductOptionInput[] {
  if (Array.isArray(input)) {
    return input
      .map((option) => ({
        name: String(option.name ?? "").trim(),
        price_delta: Number(option.priceDelta ?? option.price_delta ?? 0),
        stock: Number(option.stock ?? 0)
      }))
      .filter((option) => option.name);
  }

  return String(input ?? fallback)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, priceDelta = "0", stock = "0"] = line.split("|").map((part) => part.trim());
      return {
        name,
        price_delta: Number(priceDelta),
        stock: Number(stock)
      };
    });
}

export function hasInvalidProductOption(options: ProductOptionInput[]) {
  return options.some((option) => !option.name || !Number.isFinite(option.price_delta) || !Number.isFinite(option.stock) || option.stock < 0);
}
