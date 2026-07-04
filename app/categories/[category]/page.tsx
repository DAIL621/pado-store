import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/lib/products";
import { CATEGORY_PAGES, getCategoryPage, getProductsForCategoryPage } from "@/lib/products/categories";
import { getBestProducts } from "@/lib/products/discovery";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORY_PAGES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryPage(slug);
  if (!category) return { title: "카테고리를 찾을 수 없습니다 | 파도스토리" };

  return {
    title: `${category.label} | 파도스토리 카테고리`,
    description: category.description,
    alternates: {
      canonical: `/categories/${category.slug}`
    },
    openGraph: {
      title: `${category.label} | 파도스토리`,
      description: category.description,
      url: `/categories/${category.slug}`,
      images: [{ url: "/images/story/hero-conch.webp", width: 1200, height: 630, alt: category.label }]
    }
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = getCategoryPage(slug);
  if (!category) notFound();

  const products = await getProducts();
  const categoryProducts = getProductsForCategoryPage(products, slug);
  const fallbackProducts = getBestProducts(products, 4);
  const categories = ["전체"];

  return (
    <div className="page-wrap category-page">
      <section className="page-hero category-hero">
        <div className="shell">
          <span className="eyebrow">PADO CATEGORY</span>
          <h1>{category.headline}</h1>
          <p>{category.description}</p>
          <div className="category-nav-row" aria-label="카테고리 바로가기">
            {CATEGORY_PAGES.map((item) => (
              <Link key={item.slug} href={`/categories/${item.slug}`} className={item.slug === slug ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          {categoryProducts.length ? (
            <ProductCatalog products={categoryProducts} categories={categories} />
          ) : (
            <div className="category-empty-state">
              <span>COMING SOON</span>
              <h2>{category.label} 상품을 준비하고 있습니다</h2>
              <p>상품이 등록되면 이 카테고리 페이지에 자동으로 노출됩니다. 지금은 파도스토리 추천 상품을 먼저 확인해보세요.</p>
              <div className="product-grid featured-grid">
                {fallbackProducts.map((product) => (
                  <ProductCard key={product.slug} product={product} compact />
                ))}
              </div>
              <Link href="/products" className="button teal">전체 상품 보기</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
