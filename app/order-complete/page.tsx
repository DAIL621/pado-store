import Link from "next/link";
import { formatPrice } from "@/data/products";

export default async function OrderCompletePage({
  searchParams
}: {
  searchParams: Promise<{ orderNo?: string; amount?: string }>;
}) {
  const params = await searchParams;
  const amount = Number(params.amount ?? 0);

  return (
    <div className="page-wrap">
      <section className="page-hero compact">
        <div className="shell">
          <span className="eyebrow">ORDER COMPLETE</span>
          <h1>주문이 생성되었습니다</h1>
          <p>아직 결제 완료가 아니라, Toss Payments 결제 연결 전 주문 생성 단계입니다.</p>
        </div>
      </section>

      <section className="shell complete-box">
        <span>주문번호</span>
        <strong>{params.orderNo ?? "확인 필요"}</strong>
        <p>결제 예정 금액: {formatPrice(amount)}</p>
        <div className="complete-actions">
          <Link href="/products" className="button outline">상품 더 보기</Link>
          <button className="button teal" type="button">Toss 결제 연결 예정</button>
        </div>
      </section>
    </div>
  );
}
