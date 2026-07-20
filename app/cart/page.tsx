"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartItem, getCartItemKey, useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/data/products";
import { calculateShipping } from "@/lib/order/pricing";
import { getCustomerStockMessage } from "@/lib/products/stock-visibility";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const router = useRouter();
  const { items, selectedItems, selectedKeys, updateQuantity, removeItem, addItem, setItemSelected, selectAllItems, removeSelectedItems } = useCart();
  const [removedItem, setRemovedItem] = useState<CartItem | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [requiredNoticeAccepted, setRequiredNoticeAccepted] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIsLoggedIn(Boolean(data.user));
      setAuthChecked(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsLoggedIn(Boolean(session?.user));
      setAuthChecked(true);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const regularSubtotal = selectedItems.reduce((sum, item) => sum + (item.regularPrice ?? item.unitPrice) * item.quantity, 0);
  const productDiscount = Math.max(0, regularSubtotal - subtotal);
  const coupangSavingsTotal = selectedItems.reduce((sum, item) => {
    const coupangPrice = Number(item.coupangPrice ?? 0);
    return sum + (coupangPrice > item.unitPrice ? (coupangPrice - item.unitPrice) * item.quantity : 0);
  }, 0);
  const shipping = calculateShipping(subtotal);
  const hasFreeShippingBenefit = selectedItems.length > 0 && shipping === 0;
  const unavailableItems = selectedItems.filter((item) => Number.isFinite(Number(item.stock)) && Number(item.stock) <= 0);
  const canCheckout = selectedItems.length > 0 && unavailableItems.length === 0;
  const checkoutEnabled = canCheckout && requiredNoticeAccepted;
  const allSelected = items.length > 0 && selectedItems.length === items.length;

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
          <h1>장바구니</h1>
        </div>
      </section>

      <div className="shell cart-layout">
        <section className="cart-list">
          {!!items.length && <div className="cart-selection-toolbar"><label><input type="checkbox" checked={allSelected} onChange={(event) => selectAllItems(event.target.checked)} /> 전체선택 <b>{selectedItems.length}/{items.length}</b></label><button type="button" disabled={!selectedItems.length} onClick={removeSelectedItems}>선택삭제</button></div>}
          {!!items.length && authChecked && !isLoggedIn && (
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
                <div><span className="section-label">현재 판매 상품</span><h2>산지 상품 둘러보기</h2><p>최신 판매 상태가 반영된 상품목록에서 골라보세요.</p></div>
                <Link href="/products" className="button outline">전체 상품 보기</Link>
              </div>
            </>
          ) : (
            items.map((item) => {
              const stock = Number(item.stock ?? Infinity);
              const hasStockLimit = Number.isFinite(stock);
              const isUnavailable = hasStockLimit && stock <= 0;
              const atStockLimit = hasStockLimit && item.quantity >= stock;
              const regularPrice = item.regularPrice && item.regularPrice > item.unitPrice ? item.regularPrice : null;
              const coupangPrice = item.coupangPrice && item.coupangPrice > item.unitPrice ? item.coupangPrice : null;
              const discountAmount = regularPrice ? (regularPrice - item.unitPrice) * item.quantity : 0;
              const discountRate = regularPrice ? Math.min(100, Math.max(0, Math.round((1 - item.unitPrice / regularPrice) * 100))) : 0;
              const itemSelected = selectedKeys.includes(getCartItemKey(item));
              return (
                <article className={`cart-item ${itemSelected ? "selected" : "unselected"}`} key={`${item.productSlug}-${item.optionId}`}>
                  <label className="cart-item-selector"><input type="checkbox" checked={itemSelected} onChange={(event) => setItemSelected(item.productSlug, item.optionId, event.target.checked)} aria-label={`${item.name} 주문 선택`} /></label>
                  <div className="cart-thumb"><Image src={item.image} alt={item.name} fill sizes="120px" /></div>
                  <div className="cart-item-copy">
                    <span>{item.origin}</span>
                    <Link href={`/products/${item.productSlug}`}><h3>{item.name}</h3></Link>
                    <p>{item.optionLabel}</p>
                    <div className="cart-price-benefit">
                      {regularPrice && <del>정상가 {formatPrice(regularPrice)}</del>}
                      <strong>{discountRate > 0 && <em>{discountRate}% 할인</em>}판매가 {formatPrice(item.unitPrice)}</strong>
                      {discountAmount > 0 && <small>{item.quantity}개 구매 시 총 {formatPrice(discountAmount)} 할인</small>}
                    </div>
                    {item.priceChanged && <small className="cart-price-updated">최신 판매가격으로 갱신되었습니다.</small>}
                    {coupangPrice && <div className="cart-coupang-compare"><span>쿠팡가격 <del>{formatPrice(coupangPrice)}</del></span><strong>PADO 최저가</strong><small>쿠팡보다 <b>{formatPrice((coupangPrice - item.unitPrice) * item.quantity)}</b> 저렴해요!</small></div>}
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
                  <div className="cart-item-subtotal"><span>상품금액</span><strong>{formatPrice(item.unitPrice * item.quantity)}</strong></div>
                </article>
              );
            })
          )}
        </section>

        <aside className="order-summary">
          <h2>결제 예정 금액</h2>
          <div><span>상품 정상가 합계</span><b>{formatPrice(regularSubtotal)}</b></div>
          <div className="summary-discount"><span>상품 할인</span><b>-{formatPrice(productDiscount)}</b></div>
          <div><span>배송비</span><b>{formatPrice(shipping)}</b></div>
          <div className="summary-discount"><span>무료배송 혜택</span><b>{hasFreeShippingBenefit ? "적용" : "-"}</b></div>
          <div className="summary-total"><span>총 결제 금액</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
          {coupangSavingsTotal > 0 && <div className="summary-coupang-saving" role="status"><span>쿠팡보다 총</span><strong>{formatPrice(coupangSavingsTotal)}</strong><b>저렴해요!</b></div>}
          <div className="cart-required-consent">
            <div className="cart-required-notice-copy">
              <strong>신선식품 주문 전 확인해주세요</strong>
              <ul>
                <li>신선식품 특성상 상품 준비 또는 배송이 시작된 이후에는 단순 변심에 의한 취소·교환·반품이 제한될 수 있습니다.</li>
                <li>상품 하자, 오배송 또는 표시·광고 내용과 다른 상품이 배송된 경우에는 고객센터 확인 후 교환 또는 환불을 도와드립니다.</li>
                <li>수령 즉시 상품과 포장 상태를 확인해주세요.</li>
                <li>이상이 있는 경우 수령 직후 상품과 포장 상태를 사진으로 촬영하여 고객센터로 문의해주세요.</li>
              </ul>
            </div>
            <label htmlFor="cart-required-notice" tabIndex={0} onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setRequiredNoticeAccepted((current) => !current);
                setCheckoutNotice("");
              }
              }}>
              <input id="cart-required-notice" type="checkbox" checked={requiredNoticeAccepted} onChange={(event) => { setRequiredNoticeAccepted(event.target.checked); setCheckoutNotice(""); }} />
              <span>신선식품 특성과 취소·교환·반품 안내를 확인했으며 이에 동의합니다.</span>
            </label>
          </div>
          {checkoutNotice && <p id="cart-consent-message" className="cart-consent-message" role="alert">{checkoutNotice}</p>}
          <button
            type="button"
            className={`button teal full ${!checkoutEnabled ? "disabled" : ""}`}
            aria-label={!requiredNoticeAccepted ? "필수 안내사항 동의 후 주문서 작성하기" : undefined}
            aria-describedby={checkoutNotice ? "cart-consent-message" : undefined}
            onClick={() => {
              if (checkoutEnabled) {
                router.push("/checkout");
                return;
              }
              if (!requiredNoticeAccepted) setCheckoutNotice("필수 안내사항에 동의해주세요.");
            }}
          >
            {!items.length ? "상품을 먼저 담아주세요" : unavailableItems.length ? "품절 상품을 삭제해주세요" : "주문서 작성하기"}
          </button>
          <p>평일 오후 1시 이전 주문은 당일 출고됩니다.</p>
        </aside>
      </div>
    </div>
  );
}
