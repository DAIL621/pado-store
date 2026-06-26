import Link from "next/link";

export default async function TossPaymentFailPage({
  searchParams
}: {
  searchParams: Promise<{ code?: string; message?: string; orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-wrap">
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">PAYMENT FAILED</span>
          <h1>결제를 완료하지 못했습니다</h1>
          <p>{params.message ?? "Toss Payments 결제 요청이 취소되었거나 실패했습니다."}</p>
        </div>
      </section>

      <section className="shell complete-box payment-result failed">
        <span>{params.code ?? "TOSS_PAYMENT_FAILED"}</span>
        <strong>{params.orderId ?? "주문번호 확인 필요"}</strong>
        <p>카드 정보, 한도, 간편결제 인증 상태를 확인한 뒤 다시 시도해주세요.</p>
        <div className="result-checklist" aria-label="재결제 전 확인 사항">
          <span>장바구니 유지</span>
          <span>결제수단 확인</span>
          <span>다시 결제 가능</span>
        </div>
        <div className="complete-actions">
          <Link href="/cart" className="button outline">장바구니로 돌아가기</Link>
          <Link href="/checkout" className="button teal">다시 결제하기</Link>
        </div>
      </section>
    </div>
  );
}
