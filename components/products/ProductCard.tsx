import Image from "next/image";
import Link from "next/link";
import { formatPrice, Product } from "@/data/products";

function getBadgeClass(label?: string) {
  if (!label) return "";
  if (label === "BEST") return "best-badge";
  if (label.includes("인기")) return "hot-badge";
  if (label.includes("제철") || label.includes("신선")) return "season-badge";
  if (label.includes("추천") || label.includes("산지")) return "recommend-badge";
  return "recommend-badge";
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const isSoldOut = totalStock <= 0;
  const compareAtPrice = product.price + (product.price >= 40000 ? 6000 : 5000);
  const discountRate = Math.round((1 - product.price / compareAtPrice) * 100);
  const badgeLabel = product.badge === "BEST" ? "BEST" : product.badge;

  return (
    <article className={`product-card fade-up ${compact ? "compact" : ""}`}>
      <Link href={`/products/${product.slug}`} className="product-image-wrap" aria-label={`${product.name} 상품 상세 보기`}>
        <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" className="product-image" />
        {(isSoldOut || product.badge) && <span className={`badge ${isSoldOut ? "soldout-badge" : getBadgeClass(badgeLabel)}`}>{isSoldOut ? "품절" : badgeLabel}</span>}
      </Link>
      <div className="product-copy">
        <Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
        <span className="origin">{product.origin}</span>
        {!compact && <p>{product.subtitle}</p>}
        <div className="price-stack">
          <div className="price-meta"><del>{formatPrice(compareAtPrice)}</del><em>{discountRate}%</em></div>
          <strong>{formatPrice(product.price)}~</strong>
        </div>
        <div className="product-bottom">
          <Link href={`/products/${product.slug}`} className="small-button">상품 보기</Link>
        </div>
      </div>
    </article>
  );
}
