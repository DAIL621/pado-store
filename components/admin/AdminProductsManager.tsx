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
type TestFilter = "all" | "production" | "test";

const getTotalStock = (product: AdminProduct) =>
  (product.product_options ?? []).reduce((total, option) => total + (Number(option.stock) || 0), 0);

const getStatus = (product: AdminProduct): ProductStatus => {
  if (!product.is_active) return "hidden";
  return getTotalStock(product) > 0 ? "selling" : "soldout";
};

const getDetailScore = (product: AdminProduct) => {
  const detail = product.detail_json;
  if (!detail) return 0;

  const checks = [
    detail.heroImages?.some((image) => image.url),
    detail.benefits?.some(Boolean),
    detail.journey?.some((step) => step.description || step.image),
    detail.packaging?.some(Boolean),
    detail.recipes?.some((recipe) => recipe.title || recipe.description || recipe.image),
    detail.components?.some(Boolean),
    detail.faq?.some((item) => item.question || item.answer)
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const getDetailScoreLabel = (score: number) => {
  if (score >= 80) return "완성";
  if (score >= 45) return "보강";
  if (score > 0) return "초안";
  return "미입력";
};

const statusLabel: Record<ProductStatus, string> = {
  selling: "판매중",
  soldout: "품절",
  hidden: "숨김"
};

const verificationProductPattern = /(verification|admin-edit|detail-auto|ops-db-test|stock-check|test|테스트|검증)/i;

const isVerificationProduct = (product: AdminProduct) =>
  [product.slug, product.name, product.origin, product.category]
    .filter(Boolean)
    .some((value) => verificationProductPattern.test(String(value)));

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
  const [testFilter, setTestFilter] = useState<TestFilter>("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("상품 목록을 불러오는 중입니다...");
  const [bulkHiding, setBulkHiding] = useState(false);

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
    const base = { all: products.length, selling: 0, soldout: 0, hidden: 0, test: 0, production: 0 };
    products.forEach((product) => {
      base[getStatus(product)] += 1;
      if (isVerificationProduct(product)) {
        base.test += 1;
      } else {
        base.production += 1;
      }
    });
    return base;
  }, [products]);

  const visibleVerificationProducts = useMemo(
    () => products.filter((product) => isVerificationProduct(product) && getStatus(product) !== "hidden"),
    [products]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const status = getStatus(product);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const verificationProduct = isVerificationProduct(product);
      const matchesTestFilter =
        testFilter === "all" || (testFilter === "test" ? verificationProduct : !verificationProduct);
      const matchesKeyword =
        !keyword ||
        [product.name, product.slug, product.origin, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesTestFilter && matchesKeyword;
    });
  }, [products, query, statusFilter, testFilter]);

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

  const hideVerificationProducts = async () => {
    if (!visibleVerificationProducts.length || bulkHiding) return;
    if (!window.confirm(`검증용 상품 ${visibleVerificationProducts.length}개를 숨김 처리할까요? 운영 상품은 제외됩니다.`)) return;

    setBulkHiding(true);
    let failedCount = 0;

    for (const product of visibleVerificationProducts) {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) failedCount += 1;
    }

    setBulkHiding(false);
    setMessage(
      failedCount
        ? `검증 상품 숨김 처리 중 ${failedCount}개가 실패했습니다. 실패 상품은 다시 확인해주세요.`
        : `검증 상품 ${visibleVerificationProducts.length}개를 숨김 처리했습니다.`
    );
    await loadProducts();
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTestFilter("all");
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
      <div className="admin-filter-tabs admin-filter-tabs-secondary">
        {[
          ["all", `전체 보기 ${counts.all}`],
          ["production", `운영상품 ${counts.production}`],
          ["test", `검증상품 ${counts.test}`]
        ].map(([value, label]) => (
          <button type="button" key={value} className={testFilter === value ? "active" : ""} onClick={() => setTestFilter(value as TestFilter)}>
            {label}
          </button>
        ))}
        <button
          type="button"
          className="danger-lite"
          onClick={hideVerificationProducts}
          disabled={!visibleVerificationProducts.length || bulkHiding}
        >
          {bulkHiding ? "검증 상품 숨김 중..." : `검증 상품 숨김 ${visibleVerificationProducts.length}`}
        </button>
      </div>
      <p className="admin-note">{message}</p>

      <div className="admin-panel">
        <div>
          <h2>상품 목록</h2>
          <span className="admin-message">검색 결과 {filtered.length}개</span>
        </div>
        <div className="table-wrap">
          <table className="product-admin-table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>산지</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>상세</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length && (
                <tr>
                  <td colSpan={9} className="admin-empty-filter-cell">
                    <div className="admin-empty-filter">
                      <strong>조건에 맞는 상품이 없습니다.</strong>
                      <span>검색어 또는 상태/검증상품 필터를 조정해보세요.</span>
                      <button type="button" onClick={resetFilters}>필터 초기화</button>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((product) => {
                const status = getStatus(product);
                const detailScore = getDetailScore(product);
                const verificationProduct = isVerificationProduct(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      {verificationProduct && <span className="test-product-badge">검증</span>}
                      <br />
                      <small>{product.slug}</small>
                    </td>
                    <td>{product.origin}</td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.base_price)}</td>
                    <td>{getTotalStock(product).toLocaleString("ko-KR")}개</td>
                    <td>
                      <span className={`detail-score ${detailScore >= 80 ? "complete" : detailScore > 0 ? "draft" : "empty"}`}>
                        {getDetailScoreLabel(detailScore)} {detailScore}%
                      </span>
                    </td>
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
          draftStorageKey={`pado-admin-product-edit-draft-${product.id}`}
          onSubmit={updateProduct}
          onSuccess={onSaved}
        />
      </div>
    </div>
  );
}
