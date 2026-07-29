"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, Product } from "@/data/products";
import { useCart } from "@/components/cart/CartProvider";
import { getCustomerStockMessage } from "@/lib/products/stock-visibility";

export function ProductPurchase({ product }: { product: Product }) {
  const firstAvailableOption = product.options.find((item) => Number(item.stock ?? 0) > 0) ?? product.options[0];
  const [optionId, setOptionId] = useState(firstAvailableOption?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const { addItem, items } = useCart();
  const router = useRouter();
  const option = product.options.find((item) => item.id === optionId) ?? firstAvailableOption;
  const selectedStock = Number(option?.stock ?? 0);
  const cartQuantityForOption = items.find((item) => item.productSlug === product.slug && item.optionId === optionId)?.quantity ?? 0;
  const remainingStock = Math.max(0, selectedStock - cartQuantityForOption);
  const isSoldOut = !option || selectedStock <= 0;
  const unitPrice = option ? option.price ?? product.price + option.priceDelta : product.price;
  const regularPrice =
    option?.regularPrice && option.regularPrice >= unitPrice
      ? option.regularPrice
      : unitPrice === product.price && product.normalPrice > unitPrice
        ? product.normalPrice
        : undefined;
  const coupangPrice = option?.coupangPrice && option.coupangPrice > unitPrice ? option.coupangPrice : undefined;
  const coupangSavings = coupangPrice ? coupangPrice - unitPrice : 0;
  const discountRate = regularPrice && regularPrice > unitPrice ? Math.round(((regularPrice - unitPrice) / regularPrice) * 100) : 0;
  const total = unitPrice * quantity;
  const regularTotal = regularPrice ? regularPrice * quantity : undefined;
  const coupangTotal = coupangPrice ? coupangPrice * quantity : undefined;
  const coupangSavingsTotal = coupangSavings * quantity;
  const canAddSelected = !isSoldOut && remainingStock > 0;
  const stockMessage = getCustomerStockMessage(remainingStock);
  const isLowStock = !isSoldOut && remainingStock < 10;
  const canDecrease = canAddSelected && quantity > 1;
  const canIncrease = canAddSelected && quantity < remainingStock;

  useEffect(() => {
    if (canAddSelected && quantity > remainingStock) {
      setQuantity(Math.max(1, remainingStock));
    }
  }, [canAddSelected, quantity, remainingStock]);

  const decreaseQuantity = () => {
    if (!canDecrease) return;
    setQuantity((current) => Math.max(1, current - 1));
    setMessage("");
  };

  const increaseQuantity = () => {
    if (!canIncrease) {
      if (!isSoldOut) setMessage("선택 가능한 최대 수량입니다.");
      return;
    }
    setQuantity((current) => Math.min(selectedStock, current + 1));
    setMessage("");
  };

  const add = () => {
    if (!option || isSoldOut) return false;
    if (!canAddSelected) {
      setMessage("이미 장바구니에 구매 가능한 수량을 모두 담았습니다.");
      return false;
    }
    if (quantity > remainingStock) {
      setMessage(remainingStock < 10 ? `추가로 구매 가능한 수량은 ${remainingStock}개입니다.` : "선택 가능한 최대 수량입니다.");
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
      regularPrice: option.regularPrice && option.regularPrice > unitPrice
        ? option.regularPrice
        : unitPrice === product.price && product.normalPrice > unitPrice
          ? product.normalPrice
          : undefined,
      coupangPrice,
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
    <div className="purchase-box purchase-box-v3" id="purchase-box">
      <div className="purchase-pricing-hero">
        {discountRate > 0 && (
          <div className="purchase-discount-badge" aria-label={`${discountRate}% 할인`}>
            <strong>{discountRate}%</strong>
            <span>할인</span>
          </div>
        )}
        <div className="purchase-pricing-copy">
          {regularTotal && <del>{formatPrice(regularTotal)}</del>}
          <strong>{formatPrice(total)}~</strong>
          {discountRate > 0 && <span>{discountRate}% 할인</span>}
        </div>
      </div>
      <div className="purchase-benefits purchase-benefits-top" aria-label="구매 혜택">
        <span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3 6h11v10H3zM14 9h3l4 4v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
          평일 오후 1시 이전 주문 당일 출고
        </span>
        <span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m12 2 1.3 4.2L17 4l-1 4.3L20.5 8 17 11l4 2-4.5.8L19 18l-4.2-1.7L14 21l-2-3.5L10 21l-.8-4.7L5 18l2.5-4.2L3 13l4-2-3.5-3 4.5.3L7 4l3.7 2.2L12 2Z" />
          </svg>
          냉장 신선 배송
        </span>
      </div>
      <div className="purchase-head">
        <div>
          <span>예상 결제금액</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>
      {regularTotal && <div className="purchase-price-benefit"><del>정상가 {formatPrice(regularTotal)}</del><b>{discountRate}% 할인</b><strong>판매가 {formatPrice(total)}</strong></div>}
      {coupangTotal && (
        <div className="purchase-coupang-compare" aria-live="polite">
          <div>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6 7h12l1 13H5L6 7ZM9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span>쿠팡 평균가<strong>{formatPrice(coupangTotal)}</strong></span>
          </div>
          <div>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M20 13 11 22l-9-9V4h9l9 9ZM7 9h.01" />
            </svg>
            <span>파도스토리에서<strong>{formatPrice(coupangSavingsTotal)}</strong><small>더 저렴합니다</small></span>
          </div>
        </div>
      )}
      <div className="purchase-benefits purchase-benefits-bottom" aria-label="배송 혜택">
        <span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3 6h11v10H3zM14 9h3l4 4v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          </svg>
          평일 13시 전 당일 출고
        </span>
        <span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m12 2 1.3 4.2L17 4l-1 4.3L20.5 8 17 11l4 2-4.5.8L19 18l-4.2-1.7L14 21l-2-3.5L10 21l-.8-4.7L5 18l2.5-4.2L3 13l4-2-3.5-3 4.5.3L7 4l3.7 2.2L12 2Z" />
          </svg>
          냉장 신선 배송
        </span>
      </div>
      <label htmlFor="product-option">옵션 선택</label>
      <select
        id="product-option"
        value={optionId}
        onChange={(event) => {
          setOptionId(event.target.value);
          setQuantity(1);
          setMessage("");
        }}
      >
        {product.options.map((item) => {
          const stock = Number(item.stock ?? 0);
          return (
            <option key={item.id} value={item.id}>
              {item.label} · {formatPrice(item.price ?? product.price + item.priceDelta)} {stock <= 0 ? "· 품절" : stock < 10 ? `· 재고 ${stock}개 남음` : ""}
            </option>
          );
        })}
      </select>
      {option && (isSoldOut || isLowStock || cartQuantityForOption > 0) && (
        <div className={`selected-option-info ${isLowStock ? "low-stock" : ""}`}>
          <strong>
            {isSoldOut
              ? "품절"
              : cartQuantityForOption > 0
                ? remainingStock > 0
                  ? `장바구니 ${cartQuantityForOption}개 · 추가 가능 ${remainingStock}개`
                  : "장바구니에 모두 담김"
                : stockMessage}
          </strong>
        </div>
      )}
      {isSoldOut && <p className="soldout-message" role="status">현재 선택한 옵션은 품절입니다. 다른 옵션을 선택해주세요.</p>}
      {message && <p className="soldout-message" role="status">{message}</p>}
      <div className="quantity-row">
        <span>수량</span>
        <div>
          <button type="button" disabled={!canDecrease} onClick={decreaseQuantity} aria-label={`${product.name} 수량 줄이기`}>-</button>
          <b aria-live="polite">{quantity}</b>
          <button type="button" disabled={!canIncrease} onClick={increaseQuantity} aria-label={`${product.name} 수량 늘리기`}>+</button>
        </div>
      </div>
      <div className="purchase-free-shipping"><p>✓ 파도스토리 무료배송 혜택 적용</p></div>
      <div className="total-row"><span>총 상품금액</span><strong>{formatPrice(total)}</strong></div>
      <div className="purchase-actions">
        <button type="button" className="button outline" disabled={!canAddSelected} onClick={add}>{added ? "장바구니에 담았습니다" : "장바구니"}</button>
        <button type="button" className="button teal" disabled={!canAddSelected} onClick={buyNow}>바로 구매하기</button>
      </div>
      <div className="purchase-assurance" aria-label="구매 전 안내">
        <span>결제 전 장바구니에서 옵션과 수량을 다시 확인할 수 있습니다.</span>
        <span>신선식품 특성상 산지 작업 상황에 따라 출고 일정이 조정될 수 있습니다.</span>
      </div>
    </div>
  );
}
