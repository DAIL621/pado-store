import type { Metadata } from "next";
import { ProductCatalog } from "@/components/products/ProductCatalog";
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
          <ProductCatalog products={products} categories={categories} />
        </div>
      </section>
    </div>
  );
}
