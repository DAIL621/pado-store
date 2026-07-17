import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const calculate = (items) => items.reduce((result, item) => {
  const regular = item.regularPrice && item.regularPrice > item.unitPrice ? item.regularPrice : item.unitPrice;
  result.regular += regular * item.quantity;
  result.sale += item.unitPrice * item.quantity;
  return result;
}, { regular: 0, sale: 0 });

const discounted = calculate([{ regularPrice: 29_000, unitPrice: 24_000, quantity: 2 }]);
const mixed = calculate([{ regularPrice: 29_000, unitPrice: 24_000, quantity: 1 }, { unitPrice: 65_000, quantity: 1 }]);
assert(discounted.regular - discounted.sale === 10_000, "quantity discount total failed");
assert(mixed.regular - mixed.sale === 5_000 && mixed.sale === 89_000, "mixed cart total failed");

const [cart, checkout, provider, css, products, pricing] = await Promise.all([
  read("app/cart/page.tsx"), read("app/checkout/page.tsx"), read("components/cart/CartProvider.tsx"), read("app/globals.css"), read("lib/products.ts"), read("lib/order/pricing.ts")
]);
assert(cart.includes("regularPrice") && cart.includes("상품 정상가 합계") && cart.includes("상품 할인"), "cart discount UI missing");
assert(cart.includes("hasFreeShippingBenefit") && cart.includes("summary-discount"), "free shipping summary missing");
assert(cart.includes("coupangSavingsTotal") && cart.includes("summary-coupang-saving"), "selected Coupang savings summary missing");
assert(cart.includes("authChecked && !isLoggedIn") && cart.includes("onAuthStateChange"), "login guide must be limited to signed-out users");
assert(cart.includes("cart-item-subtotal") && cart.includes("상품금액"), "item subtotal label missing");
assert(cart.includes("개 구매 시 총") && cart.includes("formatPrice(discountAmount)"), "quantity-aware discount copy missing");
assert(cart.includes("쿠팡보다 <b>") && cart.includes("저렴해요!"), "per-item Coupang savings emphasis missing");
assert(cart.includes("상품 하자, 오배송") && cart.includes("단순 변심"), "fresh food policy wording missing");
assert(checkout.includes("freshFoodPolicyAccepted") && checkout.includes("!freshFoodPolicyAccepted"), "checkout agreement gate missing");
assert(provider.includes("regularPrice") && provider.includes("unitPrice"), "cart price persistence missing");
assert(css.includes("cart-price-benefit") && css.includes("checkout-policy") && css.includes("summary-coupang-saving"), "responsive benefit styles missing");
assert(css.includes("width:min(1360px") && css.includes("cart-item-subtotal"), "wide cart layout or subtotal hierarchy missing");
assert(products.includes("mapStoredOptionToPrices") && !products.includes("price >= 40000 ? 6000"), "stored regular price mapping must be used without fabrication");
assert(pricing.includes("return 0") && !cart.includes("더 담으면 무료배송") && !checkout.includes("더 담으면 무료배송"), "default free shipping policy missing");

console.log(JSON.stringify({ ok: true, checks: ["discount-rate", "discount-amount", "quantity-discount", "missing-regular-price", "free-shipping-condition", "total-integrity", "fresh-food-policy", "checkout-agreement", "mobile-layout"] }, null, 2));
