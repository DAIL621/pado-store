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
import { calculateDetailPageQuality, calculateProductCompleteness } from "@/lib/products/quality";

type ProductOption = { id: string; name: string; price?: number | null; regular_price?: number | null; coupang_price?: number | null; price_delta: number; stock: number };

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

type ProductStatus = "selling" | "soldout" | "hidden" | "ended";
type StatusFilter = "all" | ProductStatus;
type TestFilter = "all" | "production" | "test";
type QualityFilter = "all" | "low" | "ready";
type SortMode = "recent" | "quality-low" | "quality-high" | "stock-low" | "price-high";
type BulkAction = "delete" | "hide" | "end_sale" | "recover";

const isDeletedProduct = (product: AdminProduct) =>
  (product.detail_json as Record<string, unknown> | null | undefined)?.operationState === "deleted";

const getTotalStock = (product: AdminProduct) =>
  (product.product_options ?? []).reduce((total, option) => total + (Number(option.stock) || 0), 0);

const getStatus = (product: AdminProduct): ProductStatus => {
  if ((product.detail_json as Record<string, unknown> | null | undefined)?.operationState === "ended") return "ended";
  if (!product.is_active) return "hidden";
  return getTotalStock(product) > 0 ? "selling" : "soldout";
};

const getDetailScore = (product: AdminProduct) => {
  try { return calculateDetailPageQuality(product.detail_json).score; } catch { return 0; }
};

const getCompleteness = (product: AdminProduct) => {
  try {
    return calculateProductCompleteness({
      name: product.name, origin: product.origin, category: product.category, subtitle: product.subtitle,
      description: product.description, slug: product.slug, basePrice: product.base_price, imageUrl: product.image_url,
      isActive: product.is_active, detail: product.detail_json,
      options: (Array.isArray(product.product_options) ? product.product_options : []).map((option) => ({ name: option.name, price: option.price ?? product.base_price + option.price_delta, regularPrice: option.regular_price, stock: option.stock }))
    });
  } catch {
    return null;
  }
};

const statusLabel: Record<ProductStatus, string> = {
  selling: "판매중",
  soldout: "품절",
  hidden: "숨김",
  ended: "판매종료"
};

const verificationProductPattern = /(verification|admin-edit|detail-auto|ops-db-test|stock-check|test|e2e|duplicate|private-detail|private detail|legacy-detail|legacy detail|테스트|검증)/i;

const isVerificationProduct = (product: AdminProduct) =>
  [product.slug, product.name, product.origin, product.category]
    .filter(Boolean)
    .some((value) => verificationProductPattern.test(String(value)) || /(diagnose|debug)/i.test(String(value)));

const toOptionForms = (product: AdminProduct, options?: { resetStock?: boolean }): AdminProductOptionForm[] =>
  (product.product_options?.length ? product.product_options : [{ id: "", name: "기본 옵션", price: product.base_price, price_delta: 0, stock: 0 }]).map((option) => ({
    name: option.name,
    regularPrice: option.regular_price ? String(option.regular_price) : "",
    coupangPrice: option.coupang_price ? String(option.coupang_price) : "",
    price: String(option.price ?? product.base_price + option.price_delta),
    stock: options?.resetStock ? "0" : String(option.stock)
  }));

const createCopySlug = (slug: string) => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0")
  ].join("");
  return `${slug}-copy-${stamp}`;
};

export function AdminProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [testFilter, setTestFilter] = useState<TestFilter>("production");
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [message, setMessage] = useState("상품 목록을 불러오는 중입니다...");
  const [bulkHiding, setBulkHiding] = useState(false);
  const [bulkRecovering, setBulkRecovering] = useState(false);
  const [highlightedProduct, setHighlightedProduct] = useState<{ id?: string; slug?: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkWorking, setBulkWorking] = useState(false);

  const loadProducts = async () => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상품 목록을 불러오지 못했습니다.");
      return;
    }
    setProducts(result.products ?? []);
    setSelectedIds((current) => current.filter((id) => (result.products ?? []).some((product: AdminProduct) => product.id === id && !isDeletedProduct(product))));
    setMessage(`총 ${result.products?.length ?? 0}개 상품을 불러왔습니다.`);
  };

  const copyDetailUrl = async (product: AdminProduct) => {
    const path = `/products/${product.slug}`;
    const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        input.setAttribute("readonly", "true");
        input.style.position = "fixed";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setMessage(`상세페이지 URL을 복사했습니다: ${product.slug}`);
    } catch {
      setMessage(`URL 복사에 실패했습니다. 직접 열기 주소: ${url}`);
    }
  };

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("pado-admin-last-created-product");
      if (raw) setHighlightedProduct(JSON.parse(raw));
    } catch {}
    loadProducts();
  }, []);

  useEffect(() => {
    if (!highlightedProduct || !products.length) return;
    const matched = products.find((product) => product.id === highlightedProduct.id || product.slug === highlightedProduct.slug);
    if (matched) {
      setMessage(`방금 등록한 상품이 목록에 표시되었습니다: ${matched.name} (${matched.slug})`);
      setSortMode("recent");
      setStatusFilter("all");
      setTestFilter(isVerificationProduct(matched) ? "test" : "production");
      setQualityFilter("all");
    }
  }, [highlightedProduct, products]);

  const counts = useMemo(() => {
    const managedProducts = products.filter((product) => !isDeletedProduct(product));
    const base = { all: managedProducts.length, selling: 0, soldout: 0, hidden: 0, ended: 0, test: 0, production: 0 };
    managedProducts.forEach((product) => {
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
    () => products.filter((product) => !isDeletedProduct(product) && isVerificationProduct(product) && getStatus(product) !== "hidden"),
    [products]
  );
  const hiddenVerificationProducts = useMemo(
    () => products.filter((product) => !isDeletedProduct(product) && isVerificationProduct(product) && getStatus(product) === "hidden"),
    [products]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const nextProducts = products.filter((product) => {
      if (isDeletedProduct(product)) return false;
      const status = getStatus(product);
      const detailScore = getDetailScore(product);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const verificationProduct = isVerificationProduct(product);
      const matchesTestFilter =
        testFilter === "all" || (testFilter === "test" ? verificationProduct : !verificationProduct);
      const matchesQuality =
        qualityFilter === "all" ||
        (qualityFilter === "low" ? detailScore < 80 : detailScore >= 80);
      const matchesKeyword =
        !keyword ||
        [product.name, product.slug, product.origin, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      return matchesStatus && matchesTestFilter && matchesQuality && matchesKeyword;
    });

    return [...nextProducts].sort((a, b) => {
      if (sortMode === "quality-low") return getDetailScore(a) - getDetailScore(b);
      if (sortMode === "quality-high") return getDetailScore(b) - getDetailScore(a);
      if (sortMode === "stock-low") return getTotalStock(a) - getTotalStock(b);
      if (sortMode === "price-high") return b.base_price - a.base_price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, qualityFilter, query, sortMode, statusFilter, testFilter]);

  const visibleIds = useMemo(() => filtered.map((product) => product.id), [filtered]);
  const selectedProducts = useMemo(() => products.filter((product) => selectedIds.includes(product.id)), [products, selectedIds]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = (checked: boolean) => setSelectedIds((current) => {
    const visible = new Set(visibleIds);
    return checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visible.has(id));
  });

  const toggleProduct = (id: string, checked: boolean) => setSelectedIds((current) =>
    checked ? (current.includes(id) ? current : [...current, id]) : current.filter((selectedId) => selectedId !== id)
  );

  const runBulkAction = async () => {
    if (!bulkAction || !selectedProducts.length || bulkWorking) return;
    setBulkWorking(true);
    let failed = 0;
    for (const product of selectedProducts) {
      const response = bulkAction === "delete"
        ? await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" })
        : await fetch(`/api/admin/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: bulkAction })
          });
      if (!response.ok) failed += 1;
    }
    const completed = selectedProducts.length - failed;
    const labels: Record<BulkAction, string> = { delete: "삭제", hide: "숨김", end_sale: "판매종료", recover: "판매중" };
    setMessage(failed ? `${labels[bulkAction]} ${completed}개 완료, ${failed}개 실패` : `선택 상품 ${completed}개를 ${labels[bulkAction]} 처리했습니다.`);
    setSelectedIds([]);
    setBulkAction(null);
    setBulkWorking(false);
    await loadProducts();
  };

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

  const endSale = (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품의 판매를 종료할까요? 고객 상품 목록에서는 숨겨지고 관리자에서 복원할 수 있습니다.`)) return;
    updateProductState(product, { action: "end_sale" }, `${product.name} 상품을 판매종료 처리했습니다.`);
  };

  const recover = (product: AdminProduct) => {
    updateProductState(product, { action: "recover" }, `${product.name} 상품을 다시 고객 화면에 노출했습니다.`);
  };

  const hide = async (product: AdminProduct) => {
    if (!window.confirm(`${product.name} 상품을 숨김 처리할까요? DB에서는 삭제하지 않습니다.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide" })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "숨김 처리에 실패했습니다.");
      return;
    }
    setMessage(`${product.name} 상품을 숨김 처리했습니다.`);
    await loadProducts();
  };

  const duplicateProduct = async (product: AdminProduct) => {
    const nextSlug = createCopySlug(product.slug);
    if (!window.confirm(`${product.name} 상품을 복사해 새 상품 초안을 만들까요?\n\n새 URL: ${nextSlug}`)) return;

    setMessage(`${product.name} 상품을 복사하는 중입니다...`);
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${product.name} 복사본`,
        slug: nextSlug,
        origin: product.origin,
        category: product.category,
        subtitle: product.subtitle ?? `${product.name} 복사본`,
        description: product.description ?? "",
        basePrice: product.base_price,
        imageUrl: product.image_url,
        badge: product.badge,
        highlights: (product.highlights ?? []).join(", "),
        detailJson: product.detail_json ?? {},
        options: toOptionForms(product, { resetStock: true })
      })
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "상품 복사에 실패했습니다.");
      return;
    }

    try {
      window.sessionStorage.setItem(
        "pado-admin-last-created-product",
        JSON.stringify({ id: result.productId, slug: result.productSlug })
      );
    } catch {}
    setHighlightedProduct({ id: result.productId, slug: result.productSlug });
    setSortMode("recent");
    setMessage(`상품 복사 완료: ${result.productSlug}`);
    await loadProducts();
  };

  const hideVerificationProducts = async () => {
    if (!visibleVerificationProducts.length || bulkHiding) return;
    if (!window.confirm(`검증용 상품 ${visibleVerificationProducts.length}개를 숨김 처리할까요? 운영 상품은 제외됩니다.`)) return;

    setBulkHiding(true);
    let failedCount = 0;

    for (const product of visibleVerificationProducts) {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hide" })
      });
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

  const recoverVerificationProducts = async () => {
    if (!hiddenVerificationProducts.length || bulkRecovering) return;
    if (!window.confirm(`숨김 처리된 검증 상품 ${hiddenVerificationProducts.length}개를 다시 표시할까요?`)) return;

    setBulkRecovering(true);
    let failed = 0;
    for (const product of hiddenVerificationProducts) {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recover" })
      });
      if (!response.ok) failed += 1;
    }
    setBulkRecovering(false);
    setMessage(
      failed
        ? `검증 상품 ${hiddenVerificationProducts.length - failed}개를 복구했고 ${failed}개는 실패했습니다.`
        : `숨김 검증 상품 ${hiddenVerificationProducts.length}개를 다시 표시했습니다.`
    );
    await loadProducts();
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTestFilter("production");
    setQualityFilter("all");
    setSortMode("recent");
  };

  return (
    <>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명, 산지, 카테고리 검색" />
        <label>
          완성도
          <select value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value as QualityFilter)}>
            <option value="all">전체</option>
            <option value="low">보강 필요</option>
            <option value="ready">운영 준비</option>
          </select>
        </label>
        <label>
          정렬
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
            <option value="recent">최근 등록순</option>
            <option value="quality-low">완성도 낮은순</option>
            <option value="quality-high">완성도 높은순</option>
            <option value="stock-low">재고 적은순</option>
            <option value="price-high">가격 높은순</option>
          </select>
        </label>
        <a className="button teal" href="/admin/new">+ 상품 등록</a>
      </div>
      <div className="admin-filter-tabs">
        {[
          ["all", `전체 ${counts.all}`],
          ["selling", `판매중 ${counts.selling}`],
          ["soldout", `품절 ${counts.soldout}`],
          ["ended", `판매종료 ${counts.ended}`],
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
        <button
          type="button"
          className="outline-lite"
          onClick={recoverVerificationProducts}
          disabled={!hiddenVerificationProducts.length || bulkRecovering}
        >
          {bulkRecovering ? "검증 상품 복구 중..." : `숨김 검증 복구 ${hiddenVerificationProducts.length}`}
        </button>
      </div>
      <p className="admin-note">{message}</p>

      <div className="admin-bulk-toolbar" aria-label="선택 상품 일괄 작업">
        <strong>{selectedIds.length}개 선택됨</strong>
        <div>
          <button type="button" className="danger-lite" disabled={!selectedIds.length || bulkWorking} onClick={() => setBulkAction("delete")}>선택삭제</button>
          <button type="button" disabled={!selectedIds.length || bulkWorking} onClick={() => setBulkAction("hide")}>선택숨김</button>
          <button type="button" disabled={!selectedIds.length || bulkWorking} onClick={() => setBulkAction("end_sale")}>판매종료</button>
          <button type="button" disabled={!selectedIds.length || bulkWorking} onClick={() => setBulkAction("recover")}>판매중</button>
        </div>
      </div>

      <div className="admin-panel">
        <div>
          <h2>상품 목록</h2>
          <span className="admin-message">검색 결과 {filtered.length}개 · {sortMode === "quality-low" ? "상세 보강 우선" : "운영 관리 기준"}</span>
        </div>
        <div className="table-wrap">
          <table className="product-admin-table">
            <thead>
              <tr>
                <th className="admin-select-column"><input type="checkbox" aria-label="현재 목록 전체선택" checked={allVisibleSelected} onChange={(event) => toggleAllVisible(event.target.checked)} /></th>
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
                  <td colSpan={10} className="admin-empty-filter-cell">
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
                const completeness = getCompleteness(product);
                const verificationProduct = isVerificationProduct(product);
                return (
                  <tr key={product.id} className={highlightedProduct && (highlightedProduct.id === product.id || highlightedProduct.slug === product.slug) ? "recently-created" : ""}>
                    <td className="admin-select-column"><input type="checkbox" aria-label={`${product.name} 선택`} checked={selectedIds.includes(product.id)} onChange={(event) => toggleProduct(product.id, event.target.checked)} /></td>
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
                      {completeness ? <>
                        <span className={`detail-score ${completeness.score === 100 ? "complete" : completeness.score > 0 ? "draft" : "empty"}`} title={`상세페이지 품질 ${detailScore}% · 미입력: ${completeness.missing.join(", ") || "없음"}`}>
                          {completeness.score === 100 ? "상품 등록 완료" : `상품 등록 완성도 ${completeness.score}%`}
                        </span>
                        {!!completeness.missing.length && <small className="admin-missing-items">미입력: {completeness.missing.join(", ")}</small>}
                      </> : <span className="detail-score empty">정보 확인 필요</span>}
                    </td>
                    <td><span className={`status ${status}`}>{statusLabel[status]}</span></td>
                    <td>{new Date(product.created_at).toLocaleDateString("ko-KR")}</td>
                    <td className="admin-actions">
                      <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">상세보기</a>
                      <button type="button" onClick={() => copyDetailUrl(product)}>URL 복사</button>
                      <button type="button" onClick={() => duplicateProduct(product)}>복사</button>
                      <button type="button" onClick={() => setEditing(product)}>수정</button>
                      {status === "hidden" || status === "ended" ? (
                        <button type="button" onClick={() => recover(product)}>다시 판매하기</button>
                      ) : (
                        <>
                          <button type="button" onClick={() => makeSoldout(product)} disabled={status === "soldout"}>품절</button>
                          <button type="button" onClick={() => endSale(product)}>판매종료</button>
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

      {bulkAction && (
        <div className="modal-backdrop" role="presentation">
          <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-confirm-title">
            <h2 id="bulk-confirm-title">일괄 작업 확인</h2>
            <p>선택한 {selectedProducts.length}개의 상품을 {bulkAction === "delete" ? "삭제" : bulkAction === "hide" ? "숨김" : bulkAction === "end_sale" ? "판매종료" : "판매중"} 처리하시겠습니까?</p>
            {bulkAction === "delete" && <small>상품은 복구 가능한 Soft Delete로 처리되며 관리자 기본목록에서 제외됩니다.</small>}
            <div>
              <button type="button" onClick={() => setBulkAction(null)} disabled={bulkWorking}>취소</button>
              <button type="button" className={bulkAction === "delete" ? "danger" : "teal"} onClick={runBulkAction} disabled={bulkWorking}>{bulkWorking ? "처리 중..." : bulkAction === "delete" ? "삭제" : "확인"}</button>
            </div>
          </section>
        </div>
      )}

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
          mode="edit"
          productId={product.id}
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
