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
  const regularPrice = option?.regularPrice && option.regularPrice >= unitPrice ? option.regularPrice : undefined;
  const coupangPrice = option?.coupangPrice && option.coupangPrice > unitPrice ? option.coupangPrice : undefined;
  const coupangSavings = coupangPrice ? coupangPrice - unitPrice : 0;
  const discountRate = regularPrice && regularPrice > unitPrice ? Math.round(((regularPrice - unitPrice) / regularPrice) * 100) : 0;
  const total = unitPrice * quantity;
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
      <div className="purchase-head">
        <div>
          <span>예상 결제금액</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>
      {regularPrice && regularPrice > unitPrice && <div className="purchase-price-benefit"><del>정상가 {formatPrice(regularPrice)}</del><b>{discountRate}% 할인</b><strong>판매가 {formatPrice(unitPrice)}</strong></div>}
      {coupangPrice && <div className="purchase-coupang-compare"><span>쿠팡 판매가 {formatPrice(coupangPrice)}</span><strong>자사몰이 {formatPrice(coupangSavings)} 더 저렴해요</strong></div>}
      <div className="purchase-benefits" aria-label="구매 혜택">
        <span>평일 13시 전 당일 출고</span>
        <span>냉장 신선 배송</span>
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
