import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/products/ProductPurchase";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailTemplate } from "@/components/products/ProductDetailTemplate";
import { formatPrice } from "@/data/products";
import { getProductBySlug, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "상품을 찾을 수 없습니다" };
  }

  return {
    title: product.name,
    description: product.subtitle,
    openGraph: {
      title: `${product.name} | 파도스토리`,
      description: product.subtitle,
      images: [{ url: product.image, width: 1200, height: 630, alt: product.name }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | 파도스토리`,
      description: product.subtitle,
      images: [product.image]
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const recommended = (await getProducts())
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const isSoldOut = totalStock <= 0;

  return (
    <div className="detail-page">
      <div className="shell breadcrumb">
        <Link href="/">홈</Link>
        <span>/</span>
        <Link href="/products">전체 상품</Link>
        <span>/</span>
        <b>{product.name}</b>
      </div>

      <ProductDetailTemplate product={product} purchaseSlot={<ProductPurchase product={product} />} />

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

      <div className="mobile-purchase-bar" aria-label="모바일 구매 바로가기">
        <div className="mobile-purchase-meta">
          <span>{isSoldOut ? "현재 품절" : "판매가"}</span>
          <strong>{formatPrice(product.price)}~</strong>
        </div>
        <a href="#purchase-box" className={`button full ${isSoldOut ? "outline" : "teal"}`}>
          {isSoldOut ? "옵션 재입고 확인" : "옵션 선택하고 구매하기"}
        </a>
      </div>
    </div>
  );
}
