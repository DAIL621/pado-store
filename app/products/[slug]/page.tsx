import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/products/ProductPurchase";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailTemplate } from "@/components/products/ProductDetailTemplate";
import { StickyPurchaseBar } from "@/components/products/StickyPurchaseBar";
import type { Product } from "@/data/products";
import { getProductBySlug, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pado-story.vercel.app";

function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, siteUrl).toString();
}

function buildSeoDescription(product: Product) {
  const summary = [product.subtitle, product.description, `${product.origin} 산지 기준으로 선별해 신선 포장합니다.`]
    .filter(Boolean)
    .join(" ");
  return summary.length > 155 ? `${summary.slice(0, 152).trim()}...` : summary;
}

function buildProductJsonLd(product: Product) {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const imageUrls = Array.from(new Set([product.image, ...product.detailImages].filter(Boolean))).map(absoluteUrl);
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: buildSeoDescription(product),
    image: imageUrls,
    brand: { "@type": "Brand", name: "파도스토리" },
    category: product.category,
    sku: product.slug,
    areaServed: "KR",
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KRW",
      price: product.price,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "파도스토리" }
    }
  };
}

function buildBreadcrumbJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "전체 상품", item: absoluteUrl("/products") },
      { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/products/${product.slug}`) }
    ]
  };
}

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "상품을 찾을 수 없습니다" };
  }

  const description = buildSeoDescription(product);
  const productPath = `/products/${product.slug}`;
  const title = `${product.name} | ${product.origin} 산지직송 수산물`;

  return {
    title,
    description,
    alternates: {
      canonical: productPath
    },
    openGraph: {
      title: `${title} | 파도스토리`,
      description,
      url: productPath,
      images: [{ url: product.image, width: 1200, height: 630, alt: product.name }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 파도스토리`,
      description,
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
  return (
    <div className="detail-page">
      <JsonLdScript data={buildProductJsonLd(product)} />
      <JsonLdScript data={buildBreadcrumbJsonLd(product)} />

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

      <StickyPurchaseBar product={product} />
    </div>
  );
}
