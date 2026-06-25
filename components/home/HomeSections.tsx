import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

const seasons = [
  ["1월", "굴 · 대구 · 방어"], ["2월", "도미 · 꼬막 · 아귀"], ["3월", "주꾸미 · 도다리 · 멍게"],
  ["4월", "참소라 · 키조개 · 도미"], ["5월", "병어 · 갑오징어 · 장어"], ["6월", "참소라 · 장어 · 갈치"],
  ["7월", "민어 · 전복 · 한치"], ["8월", "전복 · 문어 · 민어"], ["9월", "꽃게 · 전어 · 갈치"],
  ["10월", "꽃게 · 대하 · 고등어"], ["11월", "굴 · 방어 · 꼬막"], ["12월", "굴 · 대구 · 방어"]
];

export function HomeSections() {
  const month = new Date().getMonth() + 1;
  return (
    <>
      <section className="section product-section">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow">FROM THE COAST</span><h2>산지의 좋은 것만 골랐습니다</h2><p>실제 판매 연결을 준비한 파도스토리 대표 수산물입니다.</p></div><Link href="/products" className="text-link">대표 상품 모두 보기 →</Link></div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </div>
      </section>

      <section className="section season-section" id="season">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow">SEASONAL CALENDAR</span><h2>지금 가장 맛있는 바다</h2><p>월별 제철 수산물을 한눈에 확인해 보세요.</p></div><Link href="/products" className="button outline">제철 상품 보기</Link></div>
          <div className="season-grid">{seasons.map(([label, names], index) => <div key={label} className={index + 1 === month ? "season-card current" : "season-card"}><span>{label}</span><strong>{names}</strong>{index + 1 === month && <em>지금 제철</em>}</div>)}</div>
        </div>
      </section>

      <section className="section trust-section" id="trust">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow">WHY PADO STORY</span><h2>파도스토리를 선택하는 이유</h2></div></div>
          <div className="trust-grid">
            {[
              ['산지 직송','산지에서 식탁까지 빠르게 배송','/images/story/eel-catch.webp'],
              ['생산자 확인','누가 생산했는지 확인 가능','/images/story/oyster-producer.webp'],
              ['2중 선별','품질 검사 후 출고','/images/products/wando-abalone.webp'],
              ['신선 포장','산소포장 / 냉장배송','/images/products/tongyeong-octopus.webp']
            ].map(([title,copy,image]) => <div className="trust-card" key={title}><div className="trust-card-image"><Image src={image} alt={title} fill sizes="(max-width: 700px) 50vw, 25vw" /></div><div><h3>{title}</h3><p>{copy}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="section producer-section" id="producers">
        <div className="shell">
          <div className="section-heading"><div><span className="eyebrow">PRODUCER STORY</span><h2>바다를 가장 잘 아는 사람들</h2><p>상품 뒤에 있는 산지와 생산자의 이야기를 전합니다.</p></div></div>
          <div className="producer-grid">
            <article className="producer-card"><div className="producer-image"><Image src="/images/story/eel-catch.webp" alt="통영 바다장어 조업 현장" fill sizes="50vw" /></div><div><span>경남 통영</span><h3>통영 바다장어 조업팀</h3><p>통영 앞바다 조업 · 바다장어·아나고회 취급</p><blockquote>“잡는 순간부터 선도는 시작됩니다.”</blockquote></div></article>
            <article className="producer-card"><div className="producer-image"><Image src="/images/products/wando-abalone.webp" alt="완도 활전복" fill sizes="50vw" /></div><div><span>전남 완도</span><h3>완도 활전복 양식장</h3><p>완도 청정해역 양식 · 활전복·전복 밀키트 취급</p><blockquote>“건강한 전복은 깨끗한 바다에서 자랍니다.”</blockquote></div></article>
          </div>
          <div className="center"><Link href="/products" className="button teal">산지 직송 상품 보기</Link></div>
        </div>
      </section>
    </>
  );
}
