"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/data/products";

const FREE_SHIPPING_THRESHOLD = 50000;

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 4000;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

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
          {items.length === 0 ? (
            <div className="empty-cart">
              <span aria-hidden="true">CART</span>
              <h2>장바구니가 비어 있습니다</h2>
              <p>오늘 산지에서 도착한 신선한 상품을 만나보세요.</p>
              <Link href="/products" className="button teal">상품 보러 가기</Link>
            </div>
          ) : (
            items.map((item) => (
              <article className="cart-item" key={`${item.productSlug}-${item.optionId}`}>
                <div className="cart-thumb"><Image src={item.image} alt={item.name} fill sizes="120px" /></div>
                <div className="cart-item-copy">
                  <span>{item.origin}</span>
                  <Link href={`/products/${item.productSlug}`}><h3>{item.name}</h3></Link>
                  <p>{item.optionLabel}</p>
                  <div className="cart-controls">
                    <div>
                      <button type="button" onClick={() => updateQuantity(item.productSlug, item.optionId, item.quantity - 1)} aria-label="수량 줄이기">−</button>
                      <b>{item.quantity}</b>
                      <button type="button" onClick={() => updateQuantity(item.productSlug, item.optionId, item.quantity + 1)} aria-label="수량 늘리기">+</button>
                    </div>
                    <button type="button" className="remove" onClick={() => removeItem(item.productSlug, item.optionId)}>삭제</button>
                  </div>
                </div>
                <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
              </article>
            ))
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
          <Link className={`button teal full ${!items.length ? "disabled" : ""}`} href={items.length ? "/checkout" : "/cart"}>주문서 작성하기</Link>
          <p>평일 오후 1시 이전 주문은 당일 출고됩니다.</p>
        </aside>
      </div>
    </div>
  );
}
