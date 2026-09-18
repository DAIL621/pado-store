import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="login-section product-not-found">
      <div className="login-card">
        <span className="eyebrow">PADO STORY</span>
        <h1>현재 판매하지 않는 상품입니다</h1>
        <p>판매 중인 신선한 산지 상품을 확인해 주세요.</p>
        <Link href="/products" className="button teal">상품 보러가기</Link>
        <Link href="/" className="text-link">홈으로</Link>
      </div>
    </section>
  );
}
