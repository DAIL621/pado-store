import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";
import { RecentViewedProducts } from "@/components/products/RecentViewedProducts";
import { buildHomeShelves } from "@/lib/products/discovery";

const seasons = [
  ["1월", "굴 · 대구 · 방어"],
  ["2월", "전복 · 꼬막 · 아귀"],
  ["3월", "주꾸미 · 도다리 · 멍게"],
  ["4월", "참소라 · 갑오징어 · 전어"],
  ["5월", "병어 · 갑오징어 · 민어"],
  ["6월", "참소라 · 장어 · 갈치"],
  ["7월", "민어 · 전복 · 꽃게"],
  ["8월", "전복 · 문어 · 민어"],
  ["9월", "꽃게 · 전어 · 갈치"],
  ["10월", "꽃게 · 대하 · 고등어"],
  ["11월", "굴 · 방어 · 꼬막"],
  ["12월", "굴 · 대구 · 방어"]
];

const liveStats = [
  { label: "오늘 출고 완료", value: "34건", copy: "산지에서 신선 포장 완료" },
  { label: "오늘 구매 고객", value: "18명", copy: "현재 판매 상품 주문 기준" },
  { label: "출고 기준", value: "13:00", copy: "평일 오후 1시 이전 주문 당일 출고" }
];

const timelineSteps = [
  {
    title: "새벽 조업",
    copy: "새벽부터 신선한 수산물을 준비합니다.",
    image: "/images/story/timeline-dawn-fishing.png"
  },
  {
    title: "산지 선별",
    copy: "좋은 상품만 골라 상태를 확인합니다.",
    image: "/images/story/seafood-selection-check.png"
  },
  {
    title: "신선 포장",
    copy: "아이스팩과 냉장 포장으로 신선함을 지킵니다.",
    image: "/images/story/cold-packaging.png"
  },
  {
    title: "당일 출고",
    copy: "오후 1시 이전 주문은 빠르게 출고됩니다.",
    image: "/images/story/timeline-cold-dispatch.png"
  }
];

const trustItems = [
  ["산지 직송", "산지에서 식탁까지 빠르게 배송", "/images/story/eel-catch.webp"],
  ["생산자 확인", "누가 보낸 상품인지 기록", "/images/story/oyster-producer.webp"],
  ["2중 선별", "작업자가 상태 확인 후 출고", "/images/story/seafood-selection-check.png"],
  ["신선 포장", "상품에 맞춘 냉장 · 산소포장", "/images/story/cold-packaging.png"]
];

const reviewHighlights = [
  {
    product: "산지 직송 상품",
    title: "살아있는 상태로 도착해서 선물하기 좋았어요",
    copy: "포장이 꼼꼼했고 크기도 고르게 와서 가족 식사용으로 만족도가 높았습니다.",
    meta: "사진 후기 준비중 · 재구매 의사 높음"
  },
  {
    product: "손질 수산물",
    title: "손질되어 있어 저녁 준비가 정말 빨랐어요",
    copy: "초벌 없이 바로 구워도 비린내가 적고 양념 없이도 담백했습니다.",
    meta: "조리 간편 · 당일 출고"
  },
  {
    product: "제철 수산물",
    title: "제철 느낌이 확실해서 술안주로 좋았습니다",
    copy: "쫄깃한 식감이 살아 있고 배송 상태도 차갑게 잘 유지됐습니다.",
    meta: "제철상품 · 신선 포장"
  }
];

export function HomeSections({ products }: { products: Product[] }) {
  const month = new Date().getMonth() + 1;
  const shelves = buildHomeShelves(products);

  return (
    <>
      <section className="section live-section" aria-label="실시간 출고 정보">
        <div className="shell">
          <div className="live-panel fade-up">
            <div>
              <span className="eyebrow">LIVE TODAY</span>
              <h2>오늘도 산지에서 바로 출고 중</h2>
              <p>실제 연동 전까지는 운영 안내용 데이터로 표시됩니다.</p>
            </div>
            <div className="live-grid">
              {liveStats.map((item) => (
                <article className="live-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section product-section">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">FROM THE COAST</span>
              <h2>전체 상품 둘러보기</h2>
              <p>현재 판매 중인 파도스토리 산지 상품을 한눈에 확인하세요.</p>
            </div>
            <Link href="/products" className="text-link">전체 상품 모두 보기</Link>
          </div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </div>
      </section>

      <section className="section home-shelves-section" aria-label="쇼핑 추천 영역">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">SHOPPING GUIDE</span>
              <h2>고르기 쉽게 모아봤어요</h2>
              <p>처음 방문한 고객도 바로 상품을 비교할 수 있도록 목적별로 다시 묶었습니다.</p>
            </div>
            <Link href="/products" className="text-link">상품 전체 보기</Link>
          </div>
          <div className="home-shelf-list">
            {shelves.map((shelf) => (
              <article className="home-shelf" key={shelf.key}>
                <div className="home-shelf-head">
                  <div>
                    <strong>{shelf.title}</strong>
                    <p>{shelf.description}</p>
                  </div>
                  <Link href={`/products?sort=${shelf.key === "best" ? "discount-high" : "recommended"}`}>더 보기</Link>
                </div>
                <div className="product-grid featured-grid">
                  {shelf.products.map((product) => (
                    <ProductCard key={`${shelf.key}-${product.slug}`} product={product} compact />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <RecentViewedProducts products={products} />

      <section className="section season-section" id="season">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">SEASONAL CALENDAR</span>
              <h2>지금 가장 맛있는 바다</h2>
              <p>월별 제철 수산물을 확인하고 바로 상품을 둘러보세요.</p>
            </div>
            <Link href="/products" className="button outline">제철 상품 보기</Link>
          </div>
          <div className="season-grid fade-up">
            {seasons.map(([label, names], index) => (
              <Link href={`/products?season=${index + 1}`} key={label} className={index + 1 === month ? "season-card current" : "season-card"}>
                <span>{label}{index + 1 === month && <em>지금 제철</em>}</span>
                <strong>{names}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section timeline-section" id="today-sea">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">TODAY AT SEA</span>
              <h2>오늘 바다에서는</h2>
              <p>조업부터 포장까지, 상품이 식탁에 도착하기 전 과정을 짧게 보여드립니다.</p>
            </div>
          </div>
          <div className="timeline-grid fade-up">
            {timelineSteps.map((step, index) => (
              <article className="timeline-card" key={step.title}>
                <div className="timeline-image">
                  <Image src={step.image} alt={step.title} fill sizes="(max-width: 700px) 50vw, 25vw" loading="eager" />
                </div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section trust-section" id="trust">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">WHY PADO STORY</span>
              <h2>파도스토리를 선택하는 이유</h2>
            </div>
          </div>
          <div className="trust-grid fade-up">
            {trustItems.map(([title, copy, image]) => (
              <Link href="/products" className="trust-card" key={title}>
                <div className="trust-card-image"><Image src={image} alt={title} fill sizes="(max-width: 700px) 50vw, 25vw" loading="eager" /></div>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section review-section" id="reviews">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">CUSTOMER VOICE</span>
              <h2>구매 전 확인하는 생생한 반응</h2>
              <p>실제 리뷰 기능 연동 전까지는 운영 준비용 예시로 표시됩니다.</p>
            </div>
            <Link href="/products" className="text-link">후기 많은 상품 보기</Link>
          </div>
          <div className="review-highlight-grid fade-up">
            {reviewHighlights.map((review) => (
              <article className="review-highlight-card" key={review.title}>
                <div className="review-stars" aria-label="별점 5점">★★★★★</div>
                <strong>{review.title}</strong>
                <p>{review.copy}</p>
                <span>{review.product}</span>
                <small>{review.meta}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section producer-section" id="producers">
        <div className="shell">
          <div className="section-heading fade-up">
            <div>
              <span className="eyebrow">PRODUCER STORY</span>
              <h2>경남 통영에서 시작된 신선함</h2>
              <p>새벽 조업과 산지 선별의 현장을 먼저 보여드립니다.</p>
            </div>
          </div>
          <div className="producer-wide-image fade-up">
            <Image src="/images/story/eel-catch.webp" alt="통영 바다 조업 현장" fill sizes="(max-width: 700px) 100vw, 1180px" loading="eager" />
          </div>
          <div className="producer-grid fade-up">
            <article className="producer-card">
              <div className="producer-image"><Image src="/images/story/eel-catch.webp" alt="통영 앞바다 조업 현장" fill sizes="50vw" /></div>
              <div><span>경남 통영</span><h3>통영 앞바다 조업장</h3><p>통영 앞바다 조업과 산지 선별 현장</p><blockquote>좋은 시간부터 신선도는 시작됩니다.</blockquote></div>
            </article>
            <article className="producer-card">
              <div className="producer-image"><Image src="/images/products/wando-abalone.webp" alt="완도 청정해역 양식장" fill sizes="50vw" /></div>
              <div><span>전남 완도</span><h3>완도 청정해역 양식장</h3><p>깨끗한 바다에서 이어지는 산지 양식 이야기</p><blockquote>건강한 수산물은 깨끗한 바다에서 자랍니다.</blockquote></div>
            </article>
          </div>
          <div className="center producer-cta"><Link href="/products" className="button teal">더 많은 산지 보기</Link></div>
        </div>
      </section>
    </>
  );
}
