"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/data/products";

type Props = {
  paymentKey?: string;
  orderId?: string;
  amount?: string;
};

export function TossPaymentResult({ paymentKey, orderId, amount }: Props) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");
  const [message, setMessage] = useState("결제 승인 중입니다...");
  const requested = useRef(false);
  const numericAmount = Number(amount ?? 0);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!paymentKey || !orderId || !numericAmount) {
      setStatus("failed");
      setMessage("결제 승인에 필요한 정보가 부족합니다.");
      return;
    }

    const confirmPayment = async () => {
      try {
        const response = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: numericAmount })
        });
        const result = await response.json();

        if (!response.ok) {
          setStatus("failed");
          setMessage(result.message ?? "결제 승인에 실패했습니다.");
          return;
        }

        clearCart();
        setStatus("success");
        setMessage("결제가 완료되었습니다.");
      } catch {
        setStatus("failed");
        setMessage("결제 승인 요청 중 오류가 발생했습니다.");
      }
    };

    confirmPayment();
  }, [amount, clearCart, numericAmount, orderId, paymentKey]);

  return (
    <section className="shell complete-box">
      <span>{status === "success" ? "PAYMENT COMPLETE" : "PAYMENT CHECK"}</span>
      <strong>{orderId ?? "주문번호 확인 필요"}</strong>
      <p>{message}</p>
      <p>결제 금액: {formatPrice(numericAmount)}</p>
      <div className="complete-actions">
        <Link href="/products" className="button outline">상품 더 보기</Link>
        <Link href="/mypage" className="button teal">주문내역 확인</Link>
      </div>
    </section>
  );
}
