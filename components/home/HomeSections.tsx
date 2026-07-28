import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";

const deliverySteps = [
  { icon: "boat", title: "새벽 조업", copy: "산지의 실제 조업 현장과 입항 상품을 확인합니다." },
  { icon: "search", title: "산지 선별", copy: "주문에 맞는 신선한 상품만 직접 골라냅니다." },
  { icon: "box", title: "신선 포장", copy: "상품 특성에 맞는 포장으로 신선함을 지킵니다." },
  { icon: "truck", title: "당일 출고", copy: "평일 오후 1시 이전 주문은 당일 출고합니다." }
] as const;

function LineIcon({ name }: { name: string }) {
  if (name === "boat") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 20h24l-3 6H8l-4-6ZM10 20v-8h9l4 8M13 12V7h4v5M5 28c2 1 4 1 6 0 2 1 4 1 6 0 2 1 4 1 6 0" /></svg>;
  if (name === "search") return <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="14" cy="14" r="9" /><path d="m21 21 7 7" /></svg>;
  if (name === "box") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 10 11-6 11 6-11 6-11-6Zm0 0v13l11 6 11-6V10M16 16v13M10.5 7 22 13" /></svg>;
  if (name === "truck") return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 7h17v16H3zM20 13h5l4 5v5h-9z" /><circle cx="9" cy="25" r="2.5" /><circle cx="24.5" cy="25" r="2.5" /></svg>;
  if (name === "source") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm-8 4 8 4 8-4M12 11v10" /></svg>;
  if (name === "photo") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m5 18 5-5 3 3 2-2 4 4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM7 9h10M7 13h7" /></svg>;
}

const reviewCards = [
  { title: "구매 인증 후기만 공개합니다.", body: "배송 완료 주문을 기준으로 검증된 후기만 보여드립니다." },
  { title: "실제 상품 경험을 기다리고 있습니다.", body: "등록된 후기가 생기면 상품명과 함께 안내됩니다." },
  { title: "과장된 임시 후기는 만들지 않습니다.", body: "고객의 실제 목소리를 정직하게 전달하겠습니다." }
];

export function HomeSections({ products: _products }: { products: Product[] }) {
  return (
    <>
      <section className="section coast-process" id="trust">
        <div className="shell">
          <header className="section-heading">
            <div>
              <h2>오늘 바다에서는</h2>
              <p>새벽 조업부터 당일 출고까지, 산지의 하루가 끊기지 않도록 이어집니다.</p>
            </div>
          </header>
          <div className="coast-process-grid">
            {deliverySteps.map((step, index) => (
              <article key={step.title}>
                <div className="process-icon"><LineIcon name={step.icon} /></div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section origin-story" id="today-sea">
        <div className="shell">
          <h2 className="origin-mobile-title">산지 이야기</h2>
          <div className="origin-story-grid">
          <div className="origin-story-image">
            <Image src="/images/story/tongyeong-port-ships.webp" alt="대한민국 경상남도 통영항의 실제 어선과 바다 풍경" fill sizes="(max-width: 800px) 100vw, 50vw" />
          </div>
          <div className="origin-story-copy">
            <span className="eyebrow">ORIGIN STORY</span>
            <h2>산지에서 식탁까지<br />신선함을 지키는 과정</h2>
            <ul>
              <li><i><LineIcon name="source" /></i><span><b>실제 산지</b><small>생산자와 조업 현장을 확인합니다.</small></span></li>
              <li><i><LineIcon name="photo" /></i><span><b>실제 상품 사진</b><small>판매 상품은 실제 촬영 이미지를 우선합니다.</small></span></li>
              <li><i><LineIcon name="review" /></i><span><b>실제 구매 후기</b><small>검증되지 않은 후기는 공개하지 않습니다.</small></span></li>
            </ul>
            <Link href="/#today-sea" className="text-link">산지 이야기 더보기 →</Link>
          </div>
          </div>
        </div>
      </section>

      <section className="section storefront-reviews" aria-labelledby="home-review-title">
        <div className="shell">
          <header className="storefront-review-head">
            <div><h2 id="home-review-title">고객님들의 리얼 후기</h2><p>더 많은 후기는 상품 상세페이지에서 확인하세요.</p></div>
            <Link href="/products">전체 후기 보기 <span aria-hidden="true">›</span></Link>
          </header>
          <div className="storefront-review-grid">
            {reviewCards.map((review) => (
              <article key={review.title}>
                <div className="review-stars" aria-label="검증된 후기 준비 중">☆☆☆☆☆</div>
                <strong>{review.title}</strong>
                <p>{review.body}</p>
                <small>파도스토리 · 구매후기 준비 중</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="storefront-benefit-bar" aria-label="파도스토리 구매 혜택">
        <div className="shell">
          <span><i><LineIcon name="truck" /></i><span><b>무료배송</b><small>7만원 이상 구매 시</small></span></span>
          <span><i><LineIcon name="box" /></i><span><b>안심 포장</b><small>신선도 유지 포장</small></span></span>
          <span><i><LineIcon name="source" /></i><span><b>신선 보장</b><small>문제 발생 시 100% 보상</small></span></span>
          <span><i><LineIcon name="review" /></i><span><b>고객센터</b><small>010-3128-7775</small></span></span>
        </div>
      </section>
    </>
  );
}
