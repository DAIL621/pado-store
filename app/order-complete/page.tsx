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
          <span className="eyebrow">ORDER READY</span>
          <h1>주문서 확인이 필요합니다</h1>
          <p>결제가 완료되기 전 화면입니다. 결제는 주문서에서 다시 진행해주세요.</p>
        </div>
      </section>

      <section className="shell complete-box">
        <span>주문번호</span>
        <strong>{params.orderNo ?? "확인 필요"}</strong>
        <p>결제 예정 금액: {formatPrice(amount)}</p>
        <div className="result-checklist" aria-label="결제 전 안내">
          <span>주문서 확인</span>
          <span>Toss 결제 진행</span>
          <span>결제 완료 후 주문 반영</span>
        </div>
        <div className="complete-actions">
          <Link href="/products" className="button outline">상품 더 보기</Link>
          <Link href="/checkout" className="button teal">주문서로 돌아가기</Link>
        </div>
      </section>
    </div>
  );
}
