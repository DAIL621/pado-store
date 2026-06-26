"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, Product } from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";

export function ProductPurchase({ product }: { product: Product }) {
  const firstAvailableOption = product.options.find((item) => Number(item.stock ?? 0) > 0) ?? product.options[0];
  const [optionId, setOptionId] = useState(firstAvailableOption?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const router = useRouter();
  const option = product.options.find((item) => item.id === optionId) ?? firstAvailableOption;
  const selectedStock = Number(option?.stock ?? 0);
  const isSoldOut = !option || selectedStock <= 0;
  const unitPrice = option ? product.price + option.priceDelta : product.price;
  const total = unitPrice * quantity;

  const add = () => {
    if (!option || isSoldOut) return false;
    if (quantity > selectedStock) {
      setMessage(`현재 재고는 ${selectedStock}개입니다.`);
      return false;
    }

    addItem({
      productSlug: product.slug,
      name: product.name,
      origin: product.origin,
      image: product.image,
      optionId,
      optionLabel: option.label,
      unitPrice,
      quantity,
      stock: selectedStock
    });
    setAdded(true);
    setMessage("");
    window.setTimeout(() => setAdded(false), 1800);
    return true;
  };

  const buyNow = () => {
    if (add()) router.push("/cart");
  };

  return (
    <div className="purchase-box" id="purchase-box">
      <div className="purchase-head">
        <div>
          <span>구매 옵션</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <small>배송비 4,000원 · 5만원 이상 무료배송</small>
      </div>
      <div className="purchase-benefits" aria-label="구매 혜택">
        <span>평일 13시 전 당일 출고</span>
        <span>산지 냉장배송</span>
      </div>
      <label>옵션 선택</label>
      <select value={optionId} onChange={(event) => { setOptionId(event.target.value); setQuantity(1); setMessage(""); }}>
        {product.options.map((item) => {
          const stock = Number(item.stock ?? 0);
          return (
            <option key={item.id} value={item.id}>
              {item.label} · {formatPrice(product.price + item.priceDelta)} {stock <= 0 ? "· 품절" : `· 재고 ${stock}개`}
            </option>
          );
        })}
      </select>
      {isSoldOut && <p className="soldout-message">현재 선택한 옵션은 품절입니다. 다른 옵션을 선택해주세요.</p>}
      {message && <p className="soldout-message">{message}</p>}
      <div className="quantity-row">
        <span>수량</span>
        <div>
          <button type="button" disabled={isSoldOut} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <b>{quantity}</b>
          <button type="button" disabled={isSoldOut} onClick={() => setQuantity(Math.min(selectedStock, quantity + 1))}>+</button>
        </div>
      </div>
      <div className="total-row"><span>총 상품금액</span><strong>{formatPrice(total)}</strong></div>
      <div className="purchase-actions">
        <button type="button" className="button outline" disabled={isSoldOut} onClick={add}>{added ? "담았습니다" : "장바구니"}</button>
        <button type="button" className="button teal" disabled={isSoldOut} onClick={buyNow}>바로 구매</button>
      </div>
      <small>신선식품 특성상 산지 조업 상황에 따라 출고 일정이 조정될 수 있습니다.</small>
    </div>
  );
}
