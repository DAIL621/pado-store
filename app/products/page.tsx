import type { Metadata } from "next";
import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = { title: "전체 상품 | 파도스토리" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = ["전체", ...Array.from(new Set(products.map((product) => product.category)))];

  return (
    <div className="page-wrap">
      <section className="page-hero">
        <div className="shell">
          <span className="eyebrow">PADO MARKET</span>
          <h1>산지 직송 상품</h1>
          <p>파도스토리가 산지에서 직접 확인하고 선별한 수산물입니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="filter-row">
            <strong>전체 {products.length}개</strong>
            <div>
              {categories.map((label, index) => (
                <button className={index === 0 ? "active" : ""} key={label}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
