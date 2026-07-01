import { formatPrice, type Product } from "@/data/products";

type Props = {
  product: Product;
};

export function StickyPurchaseBar({ product }: Props) {
  const totalStock = product.options.reduce((sum, option) => sum + Number(option.stock ?? 0), 0);
  const isSoldOut = totalStock <= 0;
  const stockCopy = isSoldOut ? "재입고 확인" : `구매 가능 ${totalStock}개`;

  return (
    <div className="mobile-purchase-bar" aria-label="모바일 구매 바로가기">
      <div className="mobile-purchase-meta">
        <span>{isSoldOut ? "현재 품절" : stockCopy}</span>
        <strong>{formatPrice(product.price)}~</strong>
      </div>
      <a href="#purchase-box" className={`button full ${isSoldOut ? "outline" : "teal"}`}>
        {isSoldOut ? "옵션 재입고 확인" : "옵션 선택하기"}
      </a>
    </div>
  );
}
