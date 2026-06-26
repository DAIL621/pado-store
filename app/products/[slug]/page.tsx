import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/products/ProductPurchase";
import { ProductCard } from "@/components/products/ProductCard";
import { formatPrice } from "@/data/products";
import { getProductBySlug, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const recommended = (await getProducts())
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  return (
    <div className="detail-page">
      <div className="shell breadcrumb">
        <Link href="/">홈</Link>
        <span>/</span>
        <Link href="/products">전체 상품</Link>
        <span>/</span>
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
            <div className="detail-price-stack">
              <del>{formatPrice(product.normalPrice)}</del>
              <em>{product.discountRate}%</em>
              <strong className="detail-price">{formatPrice(product.price)}~</strong>
            </div>
          </div>
          <ul>
            {product.highlights.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          <div className="detail-info-grid">
            <div>
              <span>배송 안내</span>
              <strong>{product.shippingInfo.title}</strong>
              <p>{product.shippingInfo.body}</p>
            </div>
            <div>
              <span>원산지</span>
              <strong>{product.originInfo.title}</strong>
              <p>{product.originInfo.body}</p>
            </div>
            <div>
              <span>보관방법</span>
              <strong>수령 즉시 냉장 보관</strong>
              <p>가능한 빠르게 섭취하고, 장기 보관 시 상품별 안내에 맞춰 냉동 보관해주세요.</p>
            </div>
          </div>
          <ProductPurchase product={product} />
        </div>
      </section>

      <section className="detail-story">
        <div className="shell narrow">
          <span className="eyebrow">PRODUCT DETAIL</span>
          <h2>{product.name} 상세 설명</h2>
          <p>{product.description}</p>
          <div className="detail-image-strip">
            {product.detailImages.map((image) => (
              <div key={image}>
                <Image src={image} alt={`${product.name} 상세 이미지`} fill sizes="(max-width: 700px) 100vw, 700px" />
              </div>
            ))}
          </div>
          <div className="detail-process">
            <div>
              <b>01</b>
              <strong>산지 확인</strong>
              <span>{product.originInfo.title}</span>
            </div>
            <div>
              <b>02</b>
              <strong>상태 선별</strong>
              <span>크기와 신선도를 확인합니다.</span>
            </div>
            <div>
              <b>03</b>
              <strong>신선 포장</strong>
              <span>{product.shippingInfo.title}</span>
            </div>
            <div>
              <b>04</b>
              <strong>빠른 출고</strong>
              <span>고객의 식탁까지 안전 배송</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section detail-policy-section">
        <div className="shell">
          <div className="detail-policy-grid">
            <article>
              <span>배송안내</span>
              <h3>{product.shippingInfo.title}</h3>
              <p>{product.shippingInfo.body}</p>
            </article>
            <article>
              <span>교환/반품</span>
              <h3>{product.exchangeInfo.title}</h3>
              <p>{product.exchangeInfo.body}</p>
            </article>
            <article>
              <span>생산자 소개</span>
              <h3>{product.producerInfo.title}</h3>
              <p>{product.producerInfo.body}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section recommended-section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RECOMMENDED</span>
              <h2>함께 보면 좋은 상품</h2>
            </div>
            <Link href="/products" className="text-link">전체 상품 보기</Link>
          </div>
          <div className="product-grid">
            {recommended.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-purchase-bar">
        <a href="#purchase-box" className="button teal full">옵션 선택하고 구매하기</a>
      </div>
    </div>
  );
}
