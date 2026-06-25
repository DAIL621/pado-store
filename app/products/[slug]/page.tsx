import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/products/ProductPurchase";
import { formatPrice } from "@/data/products";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="detail-page">
      <div className="shell breadcrumb">
        <Link href="/">홈</Link>
        <span>›</span>
        <Link href="/products">전체 상품</Link>
        <span>›</span>
        <b>{product.name}</b>
      </div>

      <section className="shell detail-grid">
        <div className="detail-image">
          <Image src={product.image} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 50vw" />
        </div>
        <div className="detail-copy">
          <span className="origin">{product.origin}</span>
          <h1>{product.name}</h1>
          <p className="detail-subtitle">{product.subtitle}</p>
          <div className="detail-price-wrap">
            {product.badge && <span className="detail-badge">{product.badge}</span>}
            <strong className="detail-price">{formatPrice(product.price)}~</strong>
          </div>
          <ul>
            {product.highlights.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          <div className="detail-info-grid">
            <div>
              <span>배송 안내</span>
              <strong>평일 오후 1시 이전 주문 당일 출고</strong>
              <p>아이스박스와 보냉재로 상품 특성에 맞춰 신선 포장합니다.</p>
            </div>
            <div>
              <span>원산지</span>
              <strong>{product.origin}</strong>
              <p>상품별 산지 기준으로 선별 후 출고합니다.</p>
            </div>
            <div>
              <span>보관방법</span>
              <strong>수령 즉시 냉장 보관</strong>
              <p>가능한 빠르게 섭취하고, 장기 보관 시 손질 후 냉동 보관하세요.</p>
            </div>
          </div>
          <ProductPurchase product={product} />
        </div>
      </section>

      <section className="detail-story">
        <div className="shell narrow">
          <span className="eyebrow">FROM THE COAST</span>
          <h2>{product.origin}에서 시작된 신선함</h2>
          <p>{product.description}</p>
          <div className="detail-process">
            <div>
              <b>01</b>
              <strong>산지 확인</strong>
              <span>조업·양식 현장에서 입고</span>
            </div>
            <div>
              <b>02</b>
              <strong>상태 선별</strong>
              <span>크기와 신선도를 꼼꼼히 확인</span>
            </div>
            <div>
              <b>03</b>
              <strong>신선 포장</strong>
              <span>상품에 맞는 방식으로 안전 포장</span>
            </div>
            <div>
              <b>04</b>
              <strong>빠른 출고</strong>
              <span>고객의 식탁으로 신속 배송</span>
            </div>
          </div>
        </div>
      </section>
      <div className="mobile-purchase-bar">
        <a href="#purchase-box" className="button teal full">옵션 선택하고 구매하기</a>
      </div>
    </div>
  );
}
