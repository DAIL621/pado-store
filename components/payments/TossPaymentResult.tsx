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
  const isSuccess = status === "success";

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
    <section className={`shell complete-box payment-result ${status}`}>
      <span>{isSuccess ? "PAYMENT COMPLETE" : "PAYMENT CHECK"}</span>
      <strong>{orderId ?? "주문번호 확인 필요"}</strong>
      <p>{message}</p>
      <p>결제 금액: {formatPrice(numericAmount)}</p>
      <div className="result-checklist" aria-label="주문 처리 안내">
        <span>{isSuccess ? "결제 완료" : "결제 확인 중"}</span>
        <span>마이페이지 반영</span>
        <span>상품 준비 후 출고</span>
      </div>
      <div className="complete-actions">
        <Link href="/products" className="button outline">계속 쇼핑하기</Link>
        <Link href={isSuccess ? "/mypage" : "/checkout"} className="button teal">
          {isSuccess ? "주문내역 확인" : "결제 다시 확인"}
        </Link>
      </div>
    </section>
  );
}
