import Image from "next/image";
import Link from "next/link";
import { formatPrice, Product } from "@/data/products";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const isSoldOut = totalStock <= 0;

  return (
    <article className={`product-card ${compact ? "compact" : ""}`}>
      <Link href={`/products/${product.slug}`} className="product-image-wrap">
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" className="product-image" />
        {(isSoldOut || product.badge) && <span className={`badge ${isSoldOut ? "soldout-badge" : ""}`}>{isSoldOut ? "품절" : product.badge}</span>}
      </Link>
      <div className="product-copy">
        <span className="origin">{product.origin}</span>
        <Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
        {!compact && <p>{product.subtitle}</p>}
        <div className="product-bottom">
          <strong>{formatPrice(product.price)}~</strong>
          <Link href={`/products/${product.slug}`} className="small-button">상품 보기</Link>
        </div>
      </div>
    </article>
  );
}
