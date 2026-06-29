"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/products";
import {
  AdminProductBuilder,
  type AdminProductBuilderPayload,
  type AdminProductFormState,
  type AdminProductOptionForm
} from "@/components/admin/AdminProductBuilder";
import type { ProductDetail } from "@/lib/products/detail";

type ProductOption = { id: string; name: string; price_delta: number; stock: number };

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  category: string;
  subtitle: string | null;
  description: string | null;
  base_price: number;
  image_url: string | null;
  badge: string | null;
  highlights: string[] | null;
  detail_json?: ProductDetail | null;
  is_active: boolean;
  created_at: string;
  product_options?: ProductOption[];
};

type ProductStatus = "selling" | "soldout" | "hidden";
type StatusFilter = "all" | ProductStatus;

const getTotalStock = (product: AdminProduct) =>
  (product.product_options ?? []).reduce((total, option) => total + (Number(option.stock) || 0), 0);

const getStatus = (product: AdminProduct): ProductStatus => {
  if (!product.is_active) return "hidden";
  return getTotalStock(product) > 0 ? "selling" : "soldout";
};

const statusLabel: Record<ProductStatus, string> = {
  selling: "판매중",
  soldout: "품절",
  hidden: "숨김"
};

const toOptionForms = (product: AdminProduct): AdminProductOptionForm[] =>
  (product.product_options?.length ? product.product_options : [{ id: "", name: "기본 옵션", price_delta: 0, stock: 0 }]).map((option) => ({
    name: option.name,
    priceDelta: String(option.price_delta),
    stock: String(option.stock)
  }));

export function AdminProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("상품 목록을 불러오는 중입니다...");

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상품 목록을 불러오지 못했습니다.");
      return;
    }
    setProducts(result.products ?? []);
    setMessage(`총 ${result.products?.length ?? 0}개 상품을 불러왔습니다.`);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const counts = useMemo(() => {
    const base = { all: products.length, selling: 0, soldout: 0, hidden: 0 };
    products.forEach((product) => {
      base[getStatus(product)] += 1;
    });
    return base;
  }, [products]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = getStatus(product);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [product.name, product.slug, product.origin, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesKeyword;
    });
  }, [products, query, statusFilter]);

  const updateProductState = async (product: AdminProduct, body: Record<string, unknown>, doneMessage: string) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상태 변경에 실패했습니다.");
      return;
    }
    setMessage(doneMessage);
    await loadProducts();
  };

  const makeSoldout = (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품을 품절 처리할까요? 고객 화면에는 보이지만 구매는 막힙니다.`)) return;
    updateProductState(product, { action: "soldout" }, `${product.name} 상품을 품절 처리했습니다.`);
  };

  const recover = (product: AdminProduct) => {
    updateProductState(product, { action: "recover" }, `${product.name} 상품을 다시 고객 화면에 노출했습니다.`);
  };

  const hide = async (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품을 숨김 처리할까요? DB에서는 삭제하지 않습니다.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "숨김 처리에 실패했습니다.");
      return;
    }
    setMessage(`${product.name} 상품을 숨김 처리했습니다.`);
    await loadProducts();
  };

  return (
    <>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명, 산지, 카테고리 검색" />
        <a className="button teal" href="/admin/new">+ 상품 등록</a>
      </div>
      <div className="admin-filter-tabs">
        {[
          ["all", `전체 ${counts.all}`],
          ["selling", `판매중 ${counts.selling}`],
          ["soldout", `품절 ${counts.soldout}`],
          ["hidden", `숨김 ${counts.hidden}`]
        ].map(([value, label]) => (
          <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value as StatusFilter)}>
            {label}
          </button>
        ))}
      </div>
      <p className="admin-note">{message}</p>

      <div className="admin-panel">
        <div>
          <h2>상품 목록</h2>
          <span className="admin-message">검색 결과 {filtered.length}개</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>상품명</th>
                <th>산지</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = getStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <br />
                      <small>{product.slug}</small>
                    </td>
                    <td>{product.origin}</td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.base_price)}</td>
                    <td>{getTotalStock(product).toLocaleString("ko-KR")}개</td>
                    <td><span className={`status ${status}`}>{statusLabel[status]}</span></td>
                    <td>{new Date(product.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => setEditing(product)}>수정</button>
                      {status === "hidden" ? (
                        <button type="button" onClick={() => recover(product)}>다시 판매하기</button>
                      ) : (
                        <>
                          <button type="button" onClick={() => makeSoldout(product)} disabled={status === "soldout"}>품절</button>
                          <button type="button" onClick={() => hide(product)}>숨김</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductEditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setMessage("상품 정보를 수정했습니다.");
            await loadProducts();
          }}
        />
      )}
    </>
  );
}

function ProductEditModal({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
  const initialForm: AdminProductFormState = {
    name: product.name,
    slug: product.slug,
    origin: product.origin,
    category: product.category,
    subtitle: product.subtitle ?? "",
    description: product.description ?? "",
    basePrice: String(product.base_price),
    imageUrl: product.image_url ?? "",
    badge: product.badge ?? "",
    highlights: (product.highlights ?? []).join(", ")
  };

  const updateProduct = async ({ form, options, detailJson }: AdminProductBuilderPayload) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, options, detailJson })
    });
    const result = await response.json();

    return {
      ok: response.ok,
      message: response.ok ? "상품 정보가 저장되었습니다." : result.message
    };
  };

  return (
    <div className="modal-backdrop">
      <div className="admin-modal">
        <div className="modal-head">
          <h2>상품 수정</h2>
          <button type="button" onClick={onClose}>닫기</button>
        </div>
        <AdminProductBuilder
          title={`${product.name} 수정`}
          initialMessage="상품 정보와 상세페이지 자동 생성 데이터를 수정할 수 있습니다."
          submitLabel="수정 저장"
          savingLabel="저장 중..."
          successMessage="상품 정보가 저장되었습니다."
          initialForm={initialForm}
          initialOptions={toOptionForms(product)}
          initialDetail={product.detail_json}
          onSubmit={updateProduct}
          onSuccess={onSaved}
        />
      </div>
    </div>
  );
}
