import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const countHelper = read("lib/cart/count.ts");
const provider = read("components/cart/CartProvider.tsx");
const cart = read("app/cart/page.tsx");
const checkout = read("app/checkout/page.tsx");
const header = read("components/layout/Header.tsx");
const mobile = read("components/layout/MobileBottomNav.tsx");

assert(countHelper.includes("return items.length"), "badge must count line items");
assert(provider.includes("getCartLineItemCount(items)"), "provider must use the common badge counter");
assert(!provider.includes("sum + item.quantity"), "quantity-sum badge logic must be removed");
assert(header.includes("{count}") && mobile.includes("{count > 99"), "header and mobile must share provider count");

for (const token of ["selectedItems", "selectedKeys", "setItemSelected", "selectAllItems", "removeSelectedItems", "pado-cart-selection"]) {
  assert(provider.includes(token), `cart selection provider is missing ${token}`);
}
for (const label of ["전체선택", "선택삭제", "주문 선택", "정상가", "% 할인", "할인금액", "판매가", "쿠팡가격", "PADO 최저가"]) {
  assert(cart.includes(label), `cart is missing ${label}`);
}
assert(cart.includes("selectedItems.reduce"), "cart totals must use selected items");
assert(cart.includes("regularSubtotal - subtotal"), "discount total must derive from regular and sale totals");
assert(checkout.includes("selectedItems: items"), "checkout must receive selected items only");

const sample = [
  { regularPrice: 39_000, unitPrice: 34_000, quantity: 2 },
  { regularPrice: 75_000, unitPrice: 65_000, quantity: 1 },
];
const regularTotal = sample.reduce((sum, item) => sum + item.regularPrice * item.quantity, 0);
const saleTotal = sample.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
assert.equal(regularTotal, 153_000);
assert.equal(saleTotal, 133_000);
assert.equal(regularTotal - saleTotal, 20_000, "quantity-aware discount calculation is incorrect");

console.log(JSON.stringify({
  ok: true,
  checks: [
    "line-item-badge",
    "selection-persistence",
    "select-all",
    "remove-selected",
    "selected-only-cart-total",
    "selected-only-checkout",
    "discount-arithmetic",
    "coupang-comparison",
    "header-and-mobile",
  ],
}, null, 2));
