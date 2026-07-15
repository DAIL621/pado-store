"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CartItem, useCart } from "@/components/cart/CartProvider";
import { ProductCard } from "@/components/products/ProductCard";
import { formatPrice, products } from "@/data/products";
import { getBestProducts } from "@/lib/products/discovery";
import { calculateFreeShippingProgress, calculateRemainingForFreeShipping, calculateShipping } from "@/lib/order/pricing";
import { getCustomerStockMessage } from "@/lib/products/stock-visibility";

export default function CartPage() {
  const { items, updateQuantity, removeItem, addItem } = useCart();
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = calculateShipping(subtotal);
  const remainingForFreeShipping = calculateRemainingForFreeShipping(subtotal);
  const freeShippingProgress = calculateFreeShippingProgress(subtotal);
  const unavailableItems = items.filter((item) => Number.isFinite(Number(item.stock)) && Number(item.stock) <= 0);
  const canCheckout = items.length > 0 && unavailableItems.length === 0;
  const recommendedProducts = getBestProducts(products, 4);

  const removeWithUndo = (item: CartItem) => {
    setRemovedItem(item);
    removeItem(item.productSlug, item.optionId);
  };

  const undoRemove = () => {
    if (!removedItem) return;
    addItem(removedItem);
    setRemovedItem(null);
  };

  return (
    <div className="page-wrap cart-page">
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">SHOPPING BAG</span>
          <h1>장바구니</h1>
        </div>
      </section>

      <div className="shell cart-layout">
        <section className="cart-list">
          {!!items.length && (
            <div className="cart-login-guide">
              <strong>로그인하면 주문조회와 배송조회가 더 쉬워집니다.</strong>
              <Link href="/login?next=/checkout">카카오로 계속하기</Link>
            </div>
          )}
          {removedItem && (
            <div className="cart-undo-message" role="status">
              <span>{removedItem.name}을 삭제했습니다.</span>
              <button type="button" onClick={undoRemove}>삭제 취소</button>
            </div>
          )}
          {!!unavailableItems.length && (
            <div className="cart-stock-alert" role="status">
              <strong>품절된 상품이 장바구니에 있습니다.</strong>
              <span>품절 상품을 삭제한 뒤 주문을 진행해주세요.</span>
            </div>
          )}
          {items.length === 0 ? (
            <>
              <div className="empty-cart">
                <span aria-hidden="true">CART</span>
                <h2>장바구니가 비어 있습니다</h2>
                <p>오늘 산지에서 도착한 신선한 상품을 만나보세요.</p>
                <Link href="/products" className="button teal">상품 보러 가기</Link>
              </div>
              <div className="cart-empty-recommend">
                <div>
                  <span className="eyebrow">RECOMMEND</span>
                  <h2>처음 담기 좋은 상품</h2>
                  <p>할인율과 재고를 기준으로 먼저 보기 좋은 상품을 모았습니다.</p>
                </div>
                <div className="product-grid featured-grid">
                  {recommendedProducts.map((product) => (
                    <ProductCard key={product.slug} product={product} compact />
                  ))}
                </div>
              </div>
            </>
          ) : (
            items.map((item) => {
              const stock = Number(item.stock ?? Infinity);
              const hasStockLimit = Number.isFinite(stock);
              const isUnavailable = hasStockLimit && stock <= 0;
              const atStockLimit = hasStockLimit && item.quantity >= stock;
              return (
                <article className="cart-item" key={`${item.productSlug}-${item.optionId}`}>
                  <div className="cart-thumb"><Image src={item.image} alt={item.name} fill sizes="120px" /></div>
                  <div className="cart-item-copy">
                    <span>{item.origin}</span>
                    <Link href={`/products/${item.productSlug}`}><h3>{item.name}</h3></Link>
                    <p>{item.optionLabel}</p>
                    {hasStockLimit && getCustomerStockMessage(stock) && <small className={atStockLimit || isUnavailable ? "cart-stock-note limit" : "cart-stock-note"}>{getCustomerStockMessage(stock)}</small>}
                    <div className="cart-controls">
                      <div>
                        <button type="button" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.productSlug, item.optionId, item.quantity - 1)} aria-label={`${item.name} 수량 줄이기`}>−</button>
                        <b aria-live="polite">{item.quantity}</b>
                        <button type="button" disabled={atStockLimit} onClick={() => updateQuantity(item.productSlug, item.optionId, item.quantity + 1)} aria-label={`${item.name} 수량 늘리기`}>+</button>
                      </div>
                      <button type="button" className="remove" onClick={() => removeWithUndo(item)}>삭제</button>
                    </div>
                  </div>
                  <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                </article>
              );
            })
          )}
        </section>

        <aside className="order-summary">
          <h2>결제 예정 금액</h2>
          <div><span>상품 금액</span><b>{formatPrice(subtotal)}</b></div>
          <div><span>배송비</span><b>{shipping === 0 ? "무료" : formatPrice(shipping)}</b></div>
          <div className="free-shipping-meter" aria-label="무료배송 진행률">
            <div><span style={{ width: `${freeShippingProgress}%` }} /></div>
            <p>
              {items.length === 0
                ? "5만원 이상 구매 시 무료배송"
                : remainingForFreeShipping === 0
                  ? "무료배송이 적용됩니다"
                  : `${formatPrice(remainingForFreeShipping)} 더 담으면 무료배송`}
            </p>
          </div>
          <div className="summary-total"><span>총 결제 금액</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
          <Link
            className={`button teal full ${!canCheckout ? "disabled" : ""}`}
            href={canCheckout ? "/checkout" : "/cart"}
            aria-disabled={!canCheckout}
            tabIndex={canCheckout ? undefined : -1}
          >
            {!items.length ? "상품을 먼저 담아주세요" : unavailableItems.length ? "품절 상품을 삭제해주세요" : "주문서 작성하기"}
          </Link>
          <p>평일 오후 1시 이전 주문은 당일 출고됩니다.</p>
        </aside>
      </div>
    </div>
  );
}
