import { TossPaymentResult } from "@/components/payments/TossPaymentResult";

export default async function TossPaymentSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-wrap">
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">TOSS PAYMENTS</span>
          <h1>결제 승인 확인</h1>
          <p>Toss Payments 결제 결과를 확인하고 주문 상태를 업데이트합니다.</p>
        </div>
      </section>
      <TossPaymentResult paymentKey={params.paymentKey} orderId={params.orderId} amount={params.amount} />
    </div>
  );
}
