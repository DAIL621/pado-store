import fs from "node:fs";
import assert from "node:assert/strict";

const countHelper = fs.readFileSync("lib/cart/count.ts", "utf8");
const provider = fs.readFileSync("components/cart/CartProvider.tsx", "utf8");
const cart = fs.readFileSync("app/cart/page.tsx", "utf8");
const checkout = fs.readFileSync("app/checkout/page.tsx", "utf8");
const header = fs.readFileSync("components/layout/Header.tsx", "utf8");
const mobile = fs.readFileSync("components/layout/MobileBottomNav.tsx", "utf8");

assert(countHelper.includes("return items.length"), "line item helper must count array entries");
assert(provider.includes("getCartLineItemCount(items)"), "provider must use common line-item counter");
assert(!provider.includes("sum + item.quantity"), "quantity sum badge logic must be removed");
assert(header.includes("{count}") && mobile.includes("{count > 99"), "header and mobile must share provider count");
for (const label of ["쿠팡가격", "PADO 최저가", "할인금액", "판매가", "정상가"]) assert(cart.includes(label), `cart is missing ${label}`);
for (const source of [cart, checkout]) {
  const labels = ["상품 정상가 합계", "상품 할인", "배송비", "무료배송 혜택", "총 결제"];
  let cursor = -1;
  for (const label of labels) { const next = source.indexOf(label); assert(next > cursor, `${label} order is invalid`); cursor = next; }
}
console.log(JSON.stringify({ ok: true, checks: ["line-item-count", "quantity-change-stable", "header", "mobile", "cart-price-details", "cart-summary-order", "checkout-summary-order"] }, null, 2));
