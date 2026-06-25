"use client";

import { FormEvent, useState } from "react";
import Script from "next/script";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import { formatPrice } from "@/data/products";

type TossPayment = {
  requestPayment: (paymentRequest: {
    method: "CARD";
    amount: { currency: "KRW"; value: number };
    orderId: string;
    orderName: string;
    customerName?: string;
    customerMobilePhone?: string;
    successUrl: string;
    failUrl: string;
  }) => Promise<void>;
};

type TossPaymentsInstance = {
  payment: (params: { customerKey: string }) => TossPayment;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

function makeOrderName(items: CartItem[]) {
  if (items.length === 1) return items[0].name;
  return `${items[0].name} 외 ${items.length - 1}건`;
}

function makeCustomerKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `PADO_${crypto.randomUUID().replaceAll("-", "")}`;
  }
  return `PADO_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export default function CheckoutPage() {
  const { items } = useCart();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal >= 50000 || subtotal === 0 ? 0 : 4000;
  const total = subtotal + shipping;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) {
      setMessage("장바구니가 비어 있습니다.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
    if (!clientKey) {
      setMessage("Toss Payments 클라이언트 키가 없습니다.");
      return;
    }
    if (!window.TossPayments) {
      setMessage("Toss Payments SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSaving(true);
    setMessage("주문을 생성하는 중입니다...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          recipientName: formData.get("recipientName"),
          recipientPhone: formData.get("recipientPhone"),
          postcode: formData.get("postcode"),
          address: formData.get("address"),
          addressDetail: formData.get("addressDetail"),
          memo: formData.get("memo")
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "주문 생성에 실패했습니다.");
        setSaving(false);
        return;
      }

      setMessage("Toss Payments 결제창을 여는 중입니다...");
      const origin = window.location.origin;
      const order = result.order;
      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: makeCustomerKey() });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: Number(order.total_amount) },
        orderId: order.order_no,
        orderName: makeOrderName(items),
        customerName: String(formData.get("recipientName") ?? ""),
        customerMobilePhone: String(formData.get("recipientPhone") ?? "").replace(/\D/g, ""),
        successUrl: `${origin}/payments/toss/success`,
        failUrl: `${origin}/payments/toss/fail`
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "결제창 연결에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <Script src="https://js.tosspayments.com/v2/standard" strategy="afterInteractive" />
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">CHECKOUT</span>
          <h1>주문서 작성</h1>
        </div>
      </section>

      <form className="shell checkout-layout" onSubmit={submit}>
        <section className="checkout-form">
          <h2>받는 분 정보</h2>
          <label>이름<input name="recipientName" required placeholder="홍길동" /></label>
          <label>연락처<input name="recipientPhone" required placeholder="010-0000-0000" /></label>
          <label>우편번호<input name="postcode" placeholder="00000" /></label>
          <label>주소<input name="address" required placeholder="배송지 주소" /></label>
          <label>상세주소<input name="addressDetail" placeholder="동/호수 등" /></label>
          <label>배송 메모<textarea name="memo" rows={3} placeholder="부재 시 문 앞에 놓아주세요." /></label>
          {message && <p className="form-message">{message}</p>}
        </section>

        <aside className="order-summary">
          <h2>주문 상품</h2>
          {items.map((item) => (
            <div key={`${item.productSlug}-${item.optionId}`}>
              <span>{item.name} × {item.quantity}</span>
              <b>{formatPrice(item.unitPrice * item.quantity)}</b>
            </div>
          ))}
          <div><span>배송비</span><b>{shipping === 0 ? "무료" : formatPrice(shipping)}</b></div>
          <div className="summary-total"><span>총 결제 금액</span><strong>{formatPrice(total)}</strong></div>
          <button className="button teal full" disabled={saving || !items.length}>{saving ? "처리 중..." : "Toss로 결제하기"}</button>
          <p>Toss Payments 테스트 결제창으로 이동합니다.</p>
        </aside>
      </form>
    </div>
  );
}
